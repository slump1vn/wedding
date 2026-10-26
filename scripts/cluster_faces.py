#!/usr/bin/env python3
"""
AI Face Clustering Pipeline for Wedding Photo Albums.

Sử dụng mô hình Deep Learning của OpenCV Zoo:
- YuNet (Face Detection): Phát hiện khuôn mặt nhanh và chính xác.
- SFace (Face Recognition): Trích xuất vector đặc trưng 128 chiều (cosine similarity).
- Clustering: Gom cụm khuôn mặt tương đồng thành từng nhóm nhân vật.
- Avatar Generator: Tự động crop chân dung đại diện cho mỗi nhân vật.
- Output: Xuất ra public/wedding/faces.json và thư mục ảnh public/wedding/faces/
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
        score_threshold: float = 0.85,
        nms_threshold: float = 0.3,
        cosine_threshold: float = 0.363,  # Ngưỡng chuẩn của SFace (0.363 cho cosine similarity)
    ):
        self.score_threshold = score_threshold
        self.nms_threshold = nms_threshold
        self.cosine_threshold = cosine_threshold

        # Khởi tạo FaceDetectorYN và FaceRecognizerSF
        self.detector = cv2.FaceDetectorYN_create(
            str(yunet_path),
            "",
            (320, 320),
            score_threshold=score_threshold,
            nms_threshold=nms_threshold,
            top_k=5000,
        )
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
            # face format: [x, y, w, h, x_re, y_re, x_le, y_le, x_nt, y_nt, x_rcm, y_rcm, x_lcm, y_lcm, score]
            score = float(face[-1])
            aligned_face = self.recognizer.alignCrop(resized, face)
            feature = self.recognizer.feature(aligned_face)

            # Quy đổi tọa độ về kích thước gốc nếu ảnh bị resize
            if scale != 1.0:
                face_orig = face.copy()
                face_orig[:14] = face_orig[:14] / scale
            else:
                face_orig = face.copy()

            results.append((face_orig, feature.flatten(), score))

        return results

    def cluster_faces(
        self,
        face_records: List[Dict],
    ) -> List[List[Dict]]:
        """
        Gom cụm các vector khuôn mặt dựa trên Cosine Distance.
        face_records: Danh sách dict gồm: photo_id, face_box, feature, score
        """
        if not face_records:
            return []

        clusters: List[List[Dict]] = []
        cluster_centers: List[np.ndarray] = []

        for record in face_records:
            feat = record["feature"]
            feat_norm = feat / (np.linalg.norm(feat) + 1e-7)

            best_match_idx = -1
            best_similarity = -1.0

            for idx, center in enumerate(cluster_centers):
                # Cosine similarity
                sim = float(np.dot(feat_norm, center))
                # SFace: match score > 0.363 nghĩa là cùng một người
                if sim > self.cosine_threshold and sim > best_similarity:
                    best_similarity = sim
                    best_match_idx = idx

            if best_match_idx >= 0:
                clusters[best_match_idx].append(record)
                # Cập nhật center vector (moving average)
                cluster_centers[best_match_idx] = (
                    cluster_centers[best_match_idx] * len(clusters[best_match_idx]) + feat_norm
                )
                cluster_centers[best_match_idx] /= np.linalg.norm(cluster_centers[best_match_idx]) + 1e-7
            else:
                clusters.append([record])
                cluster_centers.append(feat_norm)

        return clusters


def crop_avatar(
    img_bgr: np.ndarray, face_box: np.ndarray, out_path: Path, target_size: int = 160
):
    """Cắt khuôn mặt với khoảng viền cân đối và lưu làm avatar vuông 1:1"""
    x, y, w, h = [int(v) for v in face_box[:4]]
    img_h, img_w = img_bgr.shape[:2]

    # Thêm margin 35% xung quanh khuôn mặt để khung hình cân đối
    pad_x = int(w * 0.35)
    pad_y = int(h * 0.35)

    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(img_w, x + w + pad_x)
    y2 = min(img_h, y + h + pad_y)

    crop = img_bgr[y1:y2, x1:x2]
    if crop.size == 0:
        return

    # Resize về hình vuông chuẩn
    crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(crop_rgb)
    # Fit into square with aspect ratio preservation
    pil_img = pil_img.resize((target_size, target_size), Image.Resampling.LANCZOS)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    pil_img.save(str(out_path), quality=95)


def run_pipeline(
    photos_dir: Optional[str] = None,
    photos_json_path: Path = DEFAULT_PHOTOS_JSON,
    output_json_path: Path = DEFAULT_OUTPUT_JSON,
    output_faces_dir: Path = DEFAULT_FACES_DIR,
    models_dir: Path = DEFAULT_MODELS_DIR,
    min_photos: int = 3,
    max_groups: int = 20,
):
    print("=" * 60)
    print("AI WEDDING PHOTO FACE RECOGNITION & CLUSTERING PIPELINE")
    print("=" * 60)

    # 1. Đảm bảo mô hình AI
    yunet_path, sface_path = ensure_models(models_dir)
    if not yunet_path or not sface_path:
        print("[LỖI] Không tìm thấy mô hình OpenCV ONNX (YuNet / SFace).")
        print(f"Vui lòng đặt các file sau vào thư mục '{models_dir}':")
        print("  - face_detection_yunet_2023mar.onnx")
        print("  - face_recognition_sface_2021dec.onnx")
        return

    clusterer = FaceClusterer(yunet_path, sface_path)

    # 2. Đọc danh sách ảnh
    if not photos_json_path.exists():
        print(f"[LỖI] Không tìm thấy file {photos_json_path}")
        return

    with open(photos_json_path, "r", encoding="utf-8") as f:
        urls: List[str] = json.load(f)

    total_photos = len(urls)
    print(f"[INFO] Tổng số ảnh trong album: {total_photos}")

    # 3. Quét ảnh và trích xuất khuôn mặt
    all_face_records = []
    output_faces_dir.mkdir(parents=True, exist_ok=True)

    print("[AI] Bắt đầu quét và phát hiện khuôn mặt...")
    for idx, url in enumerate(urls):
        file_name = f"{idx + 1:03d}.jpg"
        img = None

        # Ưu tiên đọc từ thư mục local
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
                    "img": img,  # Giữ tạm để crop avatar đại diện
                }
            )

        if (idx + 1) % 50 == 0:
            print(f"  -> Đã quét {idx + 1}/{total_photos} ảnh...")

    print(f"[AI] Tổng số khuôn mặt phát hiện được: {len(all_face_records)}")

    # 4. Gom cụm khuôn mặt
    clusters = clusterer.cluster_faces(all_face_records)
    print(f"[AI] Số nhóm khuôn mặt ban đầu: {len(clusters)}")

    # 5. Lọc bỏ các nhóm quá ít ảnh & sắp xếp theo số lượng ảnh giảm dần
    valid_clusters = [c for c in clusters if len(c) >= min_photos]
    valid_clusters.sort(key=lambda c: len(c), reverse=True)
    valid_clusters = valid_clusters[:max_groups]

    print(f"[AI] Số nhóm hợp lệ (xuất hiện >= {min_photos} ảnh): {len(valid_clusters)}")

    # 6. Tạo avatar và cấu trúc dữ liệu JSON
    groups_data = []
    for g_idx, cluster in enumerate(valid_clusters):
        person_id = f"person_{g_idx + 1}"
        avatar_rel_path = f"/wedding/faces/{person_id}.jpg"
        avatar_file = output_faces_dir / f"{person_id}.jpg"

        # Chọn bức ảnh có độ tin cậy và kích thước khuôn mặt lớn nhất làm avatar
        best_face = max(cluster, key=lambda f: f["score"] * f["faceBox"][2])
        if "img" in best_face and best_face["img"] is not None:
            crop_avatar(best_face["img"], best_face["faceBox"], avatar_file)

        # Lấy danh sách ảnh độc nhất có mặt nhân vật này
        unique_photos = sorted(list(set(f["photoFile"] for f in cluster)))
        unique_indices = sorted(list(set(f["photoIndex"] for f in cluster)))

        # Đặt nhãn hiển thị mặc định
        if g_idx == 0:
            name = "Chú rể"
            role = "groom"
        elif g_idx == 1:
            name = "Cô dâu"
            role = "bride"
        elif g_idx == 2:
            name = "Cặp đôi"
            role = "couple"
        else:
            name = f"Nhân vật {g_idx + 1}"
            role = "guest"

        groups_data.append(
            {
                "id": person_id,
                "name": name,
                "role": role,
                "avatar": avatar_rel_path,
                "count": len(unique_photos),
                "photoIndices": unique_indices,
                "photos": unique_photos,
            }
        )

    # 7. Lưu file JSON
    result_data = {
        "version": "1.0",
        "totalPhotos": total_photos,
        "totalGroups": len(groups_data),
        "groups": groups_data,
    }

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)

    print(f"[THÀNH CÔNG] Đã lưu kết quả gom cụm vào: {output_json_path}")


def main():
    parser = argparse.ArgumentParser(description="AI Face Clustering for Wedding Photos")
    parser.add_argument("--photos_dir", type=str, default=None, help="Đường dẫn thư mục ảnh cục bộ")
    parser.add_argument("--photos_json", type=str, default=str(DEFAULT_PHOTOS_JSON))
    parser.add_argument("--output_json", type=str, default=str(DEFAULT_OUTPUT_JSON))
    parser.add_argument("--output_faces", type=str, default=str(DEFAULT_FACES_DIR))
    parser.add_argument("--min_photos", type=int, default=3, help="Số ảnh tối thiểu để tạo 1 nhóm")
    parser.add_argument("--max_groups", type=int, default=20, help="Số nhóm tối đa")
    args = parser.parse_args()

    run_pipeline(
        photos_dir=args.photos_dir,
        photos_json_path=Path(args.photos_json),
        output_json_path=Path(args.output_json),
        output_faces_dir=Path(args.output_faces),
        min_photos=args.min_photos,
        max_groups=args.max_groups,
    )


if __name__ == "__main__":
    main()
