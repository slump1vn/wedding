#!/usr/bin/env python3
"""
AI Face Clustering Pipeline for Wedding Photo Albums.
Yêu cầu:
- Nhận diện TỪNG CÁ NHÂN (mỗi người 1 avatar riêng, không gộp theo nhóm).
- BỎ QUA cô dâu và chú rể (chỉ nhận diện khách mời, người thân, bạn bè).
- Tự động crop avatar 1:1 khuôn mặt của từng người.
- Xuất dữ liệu ra public/wedding/faces.json và thư mục public/wedding/faces/
"""

import argparse
import json
import os
import sys
import urllib.request
from pathlib import Path
from typing import List, Dict, Tuple, Optional

import cv2
import numpy as np
from PIL import Image

# URLs tải model chính thức từ OpenCV Zoo
YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

DEFAULT_MODELS_DIR = Path(__file__).parent / "models"
DEFAULT_PHOTOS_JSON = Path("public/wedding/photos.json")
DEFAULT_OUTPUT_JSON = Path("public/wedding/faces.json")
DEFAULT_FACES_DIR = Path("public/wedding/faces")


def download_model(url: str, dest_path: Path):
    """Tự động tải model ONNX nếu chưa có trong thư mục models/"""
    if dest_path.exists() and dest_path.stat().st_size > 10000:
        return
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"[AI] Đang tải mô hình từ: {url}")
    try:
        urllib.request.urlretrieve(url, str(dest_path))
        print(f"[AI] Đã lưu model: {dest_path}")
    except Exception as e:
        print(f"[AI CẢNH BÁO] Không thể tải {dest_path.name} tự động: {e}")
        print(f"      Vui lòng tải thủ công và đặt vào: {dest_path.parent}")


def ensure_models(models_dir: Path) -> Tuple[Optional[Path], Optional[Path]]:
    """Đảm bảo có file mô hình YuNet và SFace"""
    yunet_path = models_dir / "face_detection_yunet_2023mar.onnx"
    sface_path = models_dir / "face_recognition_sface_2021dec.onnx"

    if not yunet_path.exists():
        download_model(YUNET_URL, yunet_path)
    if not sface_path.exists():
        download_model(SFACE_URL, sface_path)

    return (
        yunet_path if yunet_path.exists() else None,
        sface_path if sface_path.exists() else None,
    )


class FaceClusterer:
    def __init__(
        self,
        yunet_path: Path,
        sface_path: Path,
        score_threshold: float = 0.82,
        nms_threshold: float = 0.3,
        cosine_threshold: float = 0.363,  # Ngưỡng cosine chuẩn của SFace (0.363)
    ):
        self.score_threshold = score_threshold
        self.nms_threshold = nms_threshold
        self.cosine_threshold = cosine_threshold

        # Khởi tạo FaceDetectorYN và FaceRecognizerSF (hỗ trợ cả OpenCV 4 và 5)
        if hasattr(cv2, "FaceDetectorYN") and hasattr(cv2.FaceDetectorYN, "create"):
            self.detector = cv2.FaceDetectorYN.create(
                str(yunet_path),
                "",
                (320, 320),
                score_threshold=score_threshold,
                nms_threshold=nms_threshold,
                top_k=5000,
            )
        else:
            self.detector = cv2.FaceDetectorYN_create(
                str(yunet_path),
                "",
                (320, 320),
                score_threshold=score_threshold,
                nms_threshold=nms_threshold,
                top_k=5000,
            )

        if hasattr(cv2, "FaceRecognizerSF") and hasattr(cv2.FaceRecognizerSF, "create"):
            self.recognizer = cv2.FaceRecognizerSF.create(str(sface_path), "")
        else:
            self.recognizer = cv2.FaceRecognizerSF_create(str(sface_path), "")

    def process_image(
        self, img_bgr: np.ndarray, max_dim: int = 800
    ) -> List[Tuple[np.ndarray, np.ndarray, float]]:
        """
        Phát hiện khuôn mặt và trích xuất vector đặc trưng 128 chiều.
        Returns: Danh sách các tuple (face_box, embedding_vector, confidence_score)
        """
        h, w = img_bgr.shape[:2]
        scale = 1.0
        if max(h, w) > max_dim:
            scale = max_dim / float(max(h, w))
            resized = cv2.resize(img_bgr, (int(w * scale), int(h * scale)))
        else:
            resized = img_bgr

        rh, rw = resized.shape[:2]
        self.detector.setInputSize((rw, rh))
        _, faces = self.detector.detect(resized)

        if faces is None or len(faces) == 0:
            return []

        results = []
        for face in faces:
            score = float(face[-1])
            # Bỏ qua khuôn mặt quá mờ hoặc quá nhỏ (< 20px)
            if face[2] < 20 or face[3] < 20:
                continue

            aligned_face = self.recognizer.alignCrop(resized, face)
            feature = self.recognizer.feature(aligned_face)

            if scale != 1.0:
                face_orig = face.copy()
                face_orig[:14] = face_orig[:14] / scale
            else:
                face_orig = face.copy()

            results.append((face_orig, feature.flatten(), score))

        return results

    def extract_couple_embeddings(self, reference_images: List[Path]) -> List[np.ndarray]:
        """Trích xuất embeddings của cô dâu và chú rể từ ảnh mẫu cận mặt để loại trừ"""
        couple_embeddings = []
        for img_path in reference_images:
            if not img_path.exists():
                continue
            img = cv2.imread(str(img_path))
            if img is None:
                continue
            faces = self.process_image(img, max_dim=1024)
            for _, feat, score in faces:
                if score >= 0.85:
                    feat_norm = feat / (np.linalg.norm(feat) + 1e-7)
                    couple_embeddings.append(feat_norm)
        return couple_embeddings

    def is_couple(self, feature: np.ndarray, couple_embeddings: List[np.ndarray]) -> bool:
        """Kiểm tra một khuôn mặt có phải là cô dâu hoặc chú rể hay không"""
        if not couple_embeddings:
            return False
        feat_norm = feature / (np.linalg.norm(feature) + 1e-7)
        for c_emb in couple_embeddings:
            sim = float(np.dot(feat_norm, c_emb))
            if sim > self.cosine_threshold:
                return True
        return False

    def cluster_faces(
        self,
        face_records: List[Dict],
        couple_embeddings: List[np.ndarray],
        max_photos_per_guest: int = 150,
    ) -> List[List[Dict]]:
        """
        Gom cụm khuôn mặt từng cá nhân riêng biệt.
        Tự động BỎ QUA cô dâu chú rể.
        """
        if not face_records:
            return []

        clusters: List[List[Dict]] = []
        cluster_centers: List[np.ndarray] = []

        for record in face_records:
            feat = record["feature"]
            feat_norm = feat / (np.linalg.norm(feat) + 1e-7)

            # 1. Bỏ qua nếu trùng khuôn mặt cô dâu hoặc chú rể
            if self.is_couple(feat_norm, couple_embeddings):
                continue

            best_match_idx = -1
            best_similarity = -1.0

            for idx, center in enumerate(cluster_centers):
                sim = float(np.dot(feat_norm, center))
                if sim > self.cosine_threshold and sim > best_similarity:
                    best_similarity = sim
                    best_match_idx = idx

            if best_match_idx >= 0:
                clusters[best_match_idx].append(record)
                cluster_centers[best_match_idx] = (
                    cluster_centers[best_match_idx] * len(clusters[best_match_idx]) + feat_norm
                )
                cluster_centers[best_match_idx] /= np.linalg.norm(cluster_centers[best_match_idx]) + 1e-7
            else:
                clusters.append([record])
                cluster_centers.append(feat_norm)

        # 2. Lọc bỏ các cluster xuất hiện bất thường (ví dụ > 150 ảnh thì chắc chắn là cô dâu/chú rể)
        filtered_clusters = []
        for c in clusters:
            unique_photos = set(r["photoFile"] for r in c)
            if len(unique_photos) < max_photos_per_guest:
                filtered_clusters.append(c)
            else:
                print(f"[AI] Bỏ qua cluster xuất hiện trong {len(unique_photos)} ảnh (nhận diện là Cô dâu/Chú rể).")

        return filtered_clusters


def crop_avatar(
    img_bgr: np.ndarray, face_box: np.ndarray, out_path: Path, target_size: int = 160
):
    """Cắt khuôn mặt từng người làm avatar cá nhân vuông 1:1"""
    x, y, w, h = [int(v) for v in face_box[:4]]
    img_h, img_w = img_bgr.shape[:2]

    # Margin 30% xung quanh khuôn mặt
    pad_x = int(w * 0.30)
    pad_y = int(h * 0.30)

    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(img_w, x + w + pad_x)
    y2 = min(img_h, y + h + pad_y)

    crop = img_bgr[y1:y2, x1:x2]
    if crop.size == 0:
        return

    crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(crop_rgb)
    pil_img = pil_img.resize((target_size, target_size), Image.Resampling.LANCZOS)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    pil_img.save(str(out_path), quality=95)


def run_pipeline(
    photos_dir: Optional[str] = None,
    photos_json_path: Path = DEFAULT_PHOTOS_JSON,
    output_json_path: Path = DEFAULT_OUTPUT_JSON,
    output_faces_dir: Path = DEFAULT_FACES_DIR,
    models_dir: Path = DEFAULT_MODELS_DIR,
    min_photos: int = 2,
    max_people: int = 30,
):
    print("=" * 65)
    print("AI WEDDING INDIVIDUAL GUEST FACE RECOGNITION (EXCLUDING COUPLE)")
    print("=" * 65)

    yunet_path, sface_path = ensure_models(models_dir)
    if not yunet_path or not sface_path:
        print("[LỖI] Không tìm thấy mô hình OpenCV ONNX (YuNet / SFace).")
        return

    clusterer = FaceClusterer(yunet_path, sface_path)

    # 1. Trích xuất đặc trưng của Cô dâu & Chú rể để loại trừ
    juhi_dir = Path("public/juhi")
    couple_reference_images = [
        juhi_dir / "DUC06717.jpg",
        juhi_dir / "DUC06202.jpg",
        juhi_dir / "PMN03044.jpg",
    ]
    print("[AI] Đang học nhận dạng khuôn mặt Cô dâu & Chú rể để loại trừ...")
    couple_embeddings = clusterer.extract_couple_embeddings(couple_reference_images)
    print(f"[AI] Đã trích xuất {len(couple_embeddings)} vector khuôn mặt tham chiếu của Cô dâu & Chú rể.")

    # 2. Đọc danh sách ảnh
    if not photos_json_path.exists():
        print(f"[LỖI] Không tìm thấy file {photos_json_path}")
        return

    with open(photos_json_path, "r", encoding="utf-8") as f:
        urls: List[str] = json.load(f)

    total_photos = len(urls)
    print(f"[INFO] Tổng số ảnh trong album: {total_photos}")

    # 3. Quét toàn bộ ảnh và phát hiện khuôn mặt
    all_face_records = []
    print("[AI] Bắt đầu quét phát hiện khuôn mặt từng người trong album...")

    for idx in range(total_photos):
        file_name = f"{idx + 1:03d}.jpg"
        img = None

        if photos_dir:
            for sub in ["thumb", "full", ""]:
                candidate = Path(photos_dir) / sub / file_name
                if candidate.exists():
                    img = cv2.imread(str(candidate))
                    break

        if img is None:
            continue

        faces = clusterer.process_image(img)
        for face_box, feature, score in faces:
            all_face_records.append(
                {
                    "photoIndex": idx,
                    "photoFile": file_name,
                    "faceBox": face_box,
                    "feature": feature,
                    "score": score,
                    "filePath": candidate,
                }
            )

        if (idx + 1) % 100 == 0 or idx + 1 == total_photos:
            print(f"  -> Đã quét {idx + 1}/{total_photos} ảnh (tìm thấy {len(all_face_records)} khuôn mặt)...")

    print(f"[AI] Hoàn thành quét. Tổng số khuôn mặt phát hiện được: {len(all_face_records)}")

    # 4. Gom cụm từng cá nhân (đã loại trừ Cô dâu & Chú rể)
    print("[AI] Tiến hành gom cụm nhận diện từng người một...")
    clusters = clusterer.cluster_faces(all_face_records, couple_embeddings)
    print(f"[AI] Số cá nhân phát hiện được sau khi bỏ cô dâu chú rể: {len(clusters)}")

    # 5. Lọc những người xuất hiện tối thiểu `min_photos` ảnh và sắp xếp theo số ảnh
    valid_clusters = []
    for c in clusters:
        unique_photos = sorted(list(set(r["photoFile"] for r in c)))
        if len(unique_photos) >= min_photos:
            valid_clusters.append((c, unique_photos))

    valid_clusters.sort(key=lambda item: len(item[1]), reverse=True)
    valid_clusters = valid_clusters[:max_people]

    print(f"[AI] Số cá nhân xuất hiện từ {min_photos} ảnh trở lên: {len(valid_clusters)}")

    # 6. Tạo avatar cá nhân và xuất JSON
    output_faces_dir.mkdir(parents=True, exist_ok=True)
    groups_data = []

    for p_idx, (cluster, unique_photos) in enumerate(valid_clusters):
        person_id = f"person_{p_idx + 1}"
        avatar_rel_path = f"/wedding/faces/{person_id}.jpg"
        avatar_file = output_faces_dir / f"{person_id}.jpg"

        # Chọn bức ảnh có độ tin cậy và khuôn mặt rõ nhất làm avatar
        best_face = max(cluster, key=lambda f: f["score"] * f["faceBox"][2] * f["faceBox"][3])
        source_img = cv2.imread(str(best_face["filePath"]))
        if source_img is not None:
            crop_avatar(source_img, best_face["faceBox"], avatar_file)

        unique_indices = sorted(list(set(r["photoIndex"] for r in cluster)))

        groups_data.append(
            {
                "id": person_id,
                "name": f"Khách mời {p_idx + 1}",
                "role": "guest",
                "avatar": avatar_rel_path,
                "count": len(unique_photos),
                "photoIndices": unique_indices,
                "photos": unique_photos,
            }
        )

    result_data = {
        "version": "2.0",
        "description": "Nhận dạng từng người một (đã loại trừ Cô dâu & Chú rể)",
        "totalPhotos": total_photos,
        "totalGroups": len(groups_data),
        "groups": groups_data,
    }

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)

    print("=" * 65)
    print(f"[THÀNH CÔNG] Đã nhận diện được {len(groups_data)} cá nhân riêng biệt!")
    print(f"File metadata: {output_json_path}")
    print("Danh sách cá nhân nhận diện được:")
    for g in groups_data[:10]:
        print(f"  - {g['name']} ({g['id']}): {g['count']} bức ảnh")
    if len(groups_data) > 10:
        print(f"  ... và {len(groups_data) - 10} người khác.")
    print("=" * 65)


def main():
    parser = argparse.ArgumentParser(description="AI Individual Face Recognition for Wedding Photos")
    parser.add_argument("--photos_dir", type=str, default=None, help="Đường dẫn thư mục ảnh cục bộ")
    parser.add_argument("--photos_json", type=str, default=str(DEFAULT_PHOTOS_JSON))
    parser.add_argument("--output_json", type=str, default=str(DEFAULT_OUTPUT_JSON))
    parser.add_argument("--output_faces", type=str, default=str(DEFAULT_FACES_DIR))
    parser.add_argument("--min_photos", type=int, default=2, help="Số ảnh tối thiểu để nhận dạng 1 người")
    parser.add_argument("--max_people", type=int, default=35, help="Số lượng người tối đa hiển thị")
    args = parser.parse_args()

    run_pipeline(
        photos_dir=args.photos_dir,
        photos_json_path=Path(args.photos_json),
        output_json_path=Path(args.output_json),
        output_faces_dir=Path(args.output_faces),
        min_photos=args.min_photos,
        max_people=args.max_people,
    )


if __name__ == "__main__":
    main()
