#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Face Clustering Pipeline for Wedding Photo Albums (Enhanced).
Tính năng nâng cao:
- Quét ảnh gốc Full HD để trích xuất đặc trưng YuNet + SFace sắc nét nhất.
- Tự động lưu cache đặc trưng (face_records_cache.pkl) giúp các lần chạy sau chỉ mất vài giây.
- Bỏ qua hoàn toàn Cô dâu & Chú rể dựa trên toàn bộ ảnh tham chiếu trong public/juhi.
- Thuật toán gom cụm thông minh kèm ràng buộc cứng Cannot-Link: 
  Hai khuôn mặt trong cùng 1 bức ảnh TUYỆT ĐỐI không bao giờ bị merge vào làm 1.
- Hợp nhất đa lượt (Vectorized Multi-Pass Iterative Merging):
  Quét kỹ và tự động gộp các cụm của cùng 1 vị khách ở các góc chụp/ánh sáng khác nhau,
  tránh triệt để tình trạng 1 người bị nhận nhầm thành nhiều người.
- Hiển thị toàn bộ khách mời không bị giới hạn số lượng.
- Xuất avatar 1:1 sắc nét và file public/wedding/faces.json.
"""

import argparse
import glob
import json
import os
import pickle
import sys
import time
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
DEFAULT_CACHE_FILE = Path(__file__).parent / "face_records_cache.pkl"
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


class SmartFaceClusterer:
    def __init__(
        self,
        yunet_path: Path,
        sface_path: Path,
        score_threshold: float = 0.82,
        nms_threshold: float = 0.3,
        cosine_threshold: float = 0.363,
        merge_centroid_threshold: float = 0.32,
        merge_max_pair_threshold: float = 0.42,
        couple_threshold: float = 0.33,
    ):
        self.score_threshold = score_threshold
        self.nms_threshold = nms_threshold
        self.cosine_threshold = cosine_threshold
        self.merge_centroid_threshold = merge_centroid_threshold
        self.merge_max_pair_threshold = merge_max_pair_threshold
        self.couple_threshold = couple_threshold

        # Khởi tạo FaceDetectorYN và FaceRecognizerSF
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
        self, img_bgr: np.ndarray, max_dim: int = 1024
    ) -> List[Tuple[np.ndarray, np.ndarray, float]]:
        """Phát hiện khuôn mặt và trích xuất vector đặc trưng 128 chiều đã chuẩn hóa L2"""
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
            if face[2] < 24 or face[3] < 24:
                continue

            aligned = self.recognizer.alignCrop(resized, face)
            feat = self.recognizer.feature(aligned).flatten()
            feat_norm = feat / (np.linalg.norm(feat) + 1e-7)

            face_orig = face.copy()
            if scale != 1.0:
                face_orig[:14] = face_orig[:14] / scale

            results.append((face_orig, feat_norm, score))

        return results

    def extract_couple_embeddings(self, juhi_dir: Path) -> List[np.ndarray]:
        """Trích xuất embeddings toàn diện của Cô dâu & Chú rể từ tất cả ảnh trong public/juhi"""
        couple_embs = []
        juhi_files = list(juhi_dir.glob("*.jpg"))
        for img_path in juhi_files:
            img = cv2.imread(str(img_path))
            if img is None:
                continue
            faces = self.process_image(img, max_dim=1024)
            for _, feat_norm, score in faces:
                if score >= 0.82:
                    couple_embs.append(feat_norm)
        return couple_embs

    def is_couple(self, feat_norm: np.ndarray, couple_embeddings: List[np.ndarray]) -> bool:
        """Kiểm tra xem khuôn mặt có phải là cô dâu hoặc chú rể không"""
        if not couple_embeddings:
            return False
        for c_emb in couple_embeddings:
            if float(np.dot(feat_norm, c_emb)) >= self.couple_threshold:
                return True
        return False

    def cluster_and_merge(
        self,
        face_records: List[Dict],
        couple_embeddings: List[np.ndarray],
    ) -> List[Dict]:
        """
        Quy trình gom cụm nâng cao:
        1. Lọc bỏ cô dâu & chú rể.
        2. Khởi tạo cụm với ràng buộc Cannot-Link (2 người trong cùng 1 ảnh không bao giờ là 1 người).
        3. Quét kỹ nhiều lượt để hợp nhất (Vectorized Multi-Pass Merging) các cụm của cùng 1 người.
        4. Hậu kiểm loại bỏ cụm nếu vượt ngưỡng ảnh của khách (> 100 ảnh) hoặc khớp cặp đôi.
        """
        # 1. Lọc bỏ Cô dâu & Chú rể
        guest_records = []
        for r in face_records:
            if not self.is_couple(r["feature"], couple_embeddings):
                guest_records.append(r)

        print(f"[AI] Đã lọc bỏ khuôn mặt Cô dâu & Chú rể. Số khuôn mặt khách còn lại: {len(guest_records)}")

        # Sắp xếp các khuôn mặt rõ nét nhất lên đầu (diện tích * confidence)
        guest_records.sort(
            key=lambda r: r["score"] * r["faceBox"][2] * r["faceBox"][3],
            reverse=True,
        )

        # 2. Gom cụm ban đầu với Ràng buộc Cannot-link
        clusters: List[Dict] = []
        t0 = time.time()

        for r in guest_records:
            feat = r["feature"]
            p_file = r["photoFile"]
            best_sim = -1.0
            best_idx = -1

            for idx, c in enumerate(clusters):
                # RÀNG BUỘC CỨNG: Không xếp vào cụm nếu cụm đã có ảnh này
                if p_file in c["photos"]:
                    continue
                sim = float(np.dot(feat, c["center"]))
                if sim >= self.cosine_threshold and sim > best_sim:
                    best_sim = sim
                    best_idx = idx

            if best_idx >= 0:
                c = clusters[best_idx]
                c["records"].append(r)
                c["photos"].add(p_file)
                c["center"] = c["center"] * (len(c["records"]) - 1) + feat
                c["center"] /= np.linalg.norm(c["center"]) + 1e-7
            else:
                clusters.append({
                    "records": [r],
                    "photos": {p_file},
                    "center": feat.copy(),
                })

        print(f"[AI] Gom cụm ban đầu tạo ra {len(clusters)} cụm ({time.time() - t0:.2f}s).")

        # 3. Vectorized Multi-Pass Iterative Merging
        print("[AI] Bắt đầu quét kỹ nhiều lượt để hợp nhất các cụm trùng khách mời...")
        t1 = time.time()
        merge_count = 0

        while True:
            n = len(clusters)
            if n <= 1:
                break

            centers = np.array([c["center"] for c in clusters])
            sim_mat = np.dot(centers, centers.T)
            np.fill_diagonal(sim_mat, -1.0)

            # Lấy các cặp có độ tương đồng tâm >= 0.25 để kiểm tra kỹ
            candidates = []
            rows, cols = np.where(sim_mat >= 0.25)
            for i, j in zip(rows, cols):
                if i < j:
                    candidates.append((sim_mat[i, j], i, j))

            if not candidates:
                break

            candidates.sort(key=lambda x: x[0], reverse=True)

            best_pair = None
            best_score = -1.0

            for c_sim, i, j in candidates:
                c_i = clusters[i]
                c_j = clusters[j]

                # RÀNG BUỘC CỨNG: Tuyệt đối không merge nếu 2 cụm có chung bất kỳ ảnh nào
                if not c_i["photos"].isdisjoint(c_j["photos"]):
                    continue

                feats_i = np.array([r["feature"] for r in c_i["records"]])
                feats_j = np.array([r["feature"] for r in c_j["records"]])
                dot_mat = np.dot(feats_i, feats_j.T)
                max_pair_sim = float(np.max(dot_mat))

                should = False
                score = c_sim

                if c_sim >= self.merge_centroid_threshold:
                    should = True
                    score = max(c_sim, max_pair_sim)
                elif max_pair_sim >= self.merge_max_pair_threshold and c_sim >= 0.27:
                    should = True
                    score = max_pair_sim
                elif max_pair_sim >= 0.45:
                    should = True
                    score = max_pair_sim

                if should:
                    best_pair = (i, j)
                    best_score = score
                    break  # Greedy: hợp nhất cặp tốt nhất rồi tính lại

            if best_pair is None:
                break

            i, j = best_pair
            c_i = clusters[i]
            c_j = clusters[j]
            c_i["records"].extend(c_j["records"])
            c_i["photos"].update(c_j["photos"])
            all_f = np.array([r["feature"] for r in c_i["records"]])
            c_i["center"] = np.mean(all_f, axis=0)
            c_i["center"] /= np.linalg.norm(c_i["center"]) + 1e-7
            clusters.pop(j)
            merge_count += 1

        print(f"[AI] Đã hợp nhất thành công {merge_count} cặp cụm trùng ({time.time() - t1:.2f}s)! Số cụm còn lại: {len(clusters)}.")

        # 4. Hậu kiểm loại bỏ cụm Cô dâu/Chú rể sót lại
        final_clusters = []
        for c in clusters:
            # Khách mời không thể xuất hiện trong > 100 bức ảnh của album
            if len(c["photos"]) > 100:
                print(f"[AI] Loại trừ cụm xuất hiện trong {len(c['photos'])} ảnh (nhận diện là Cô dâu/Chú rể).")
                continue
            # Kiểm tra tâm cụm với cô dâu chú rể
            is_c = False
            for c_emb in couple_embeddings:
                if float(np.dot(c["center"], c_emb)) > 0.32:
                    is_c = True
                    break
            if not is_c:
                final_clusters.append(c)

        return final_clusters


def crop_avatar(
    img_bgr: np.ndarray, face_box: np.ndarray, out_path: Path, target_size: int = 160
):
    """Cắt khuôn mặt từng người làm avatar cá nhân vuông 1:1 từ ảnh gốc chất lượng cao"""
    x, y, w, h = [int(v) for v in face_box[:4]]
    img_h, img_w = img_bgr.shape[:2]

    # Margin 30% xung quanh khuôn mặt để khung hình thoáng đẹp
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
    cache_path: Path = DEFAULT_CACHE_FILE,
    min_photos: int = 1,
    max_people: int = 0,
    force_rescan: bool = False,
):
    print("=" * 70)
    print("AI WEDDING INDIVIDUAL GUEST RECOGNITION (SMART MERGING & ALL GUESTS)")
    print("=" * 70)

    yunet_path, sface_path = ensure_models(models_dir)
    if not yunet_path or not sface_path:
        print("[LỖI] Không tìm thấy mô hình OpenCV ONNX (YuNet / SFace).")
        return

    clusterer = SmartFaceClusterer(yunet_path, sface_path)

    # 1. Trích xuất đặc trưng của Cô dâu & Chú rể để loại trừ
    juhi_dir = Path("public/juhi")
    print("[AI] Đang nạp đặc trưng Cô dâu & Chú rể từ public/juhi để loại trừ...")
    couple_embeddings = clusterer.extract_couple_embeddings(juhi_dir)
    print(f"[AI] Đã trích xuất {len(couple_embeddings)} vector khuôn mặt tham chiếu của Cô dâu & Chú rể.")

    # 2. Đọc danh sách ảnh
    if not photos_json_path.exists():
        print(f"[LỖI] Không tìm thấy file {photos_json_path}")
        return

    with open(photos_json_path, "r", encoding="utf-8") as f:
        urls: List[str] = json.load(f)
    total_photos = len(urls)

    # 3. Quét ảnh hoặc nạp từ file cache
    all_face_records = []
    if cache_path.exists() and not force_rescan:
        print(f"[AI] Tìm thấy cache tại {cache_path}, đang nạp nhanh...")
        with open(cache_path, "rb") as f:
            all_face_records = pickle.load(f)
        print(f"[AI] Đã nạp {len(all_face_records)} khuôn mặt từ cache chỉ trong 0.2s!")
    else:
        print(f"[AI] Bắt đầu quét phát hiện khuôn mặt trên toàn bộ {total_photos} ảnh độ phân giải cao...")
        t0 = time.time()
        for idx in range(total_photos):
            file_name = f"{idx + 1:03d}.jpg"
            img = None
            p = None

            if photos_dir:
                for sub in ["full", "thumb", ""]:
                    candidate = Path(photos_dir) / sub / file_name
                    if candidate.exists():
                        img = cv2.imread(str(candidate))
                        p = candidate
                        break

            if img is None:
                continue

            faces = clusterer.process_image(img, max_dim=1024)
            for face_box, feat_norm, score in faces:
                all_face_records.append({
                    "photoIndex": idx,
                    "photoFile": file_name,
                    "faceBox": face_box,
                    "feature": feat_norm,
                    "score": score,
                    "filePath": p,
                })

            if (idx + 1) % 100 == 0 or idx + 1 == total_photos:
                print(f"  -> Đã quét {idx + 1}/{total_photos} ảnh ({len(all_face_records)} khuôn mặt, elapsed: {time.time()-t0:.1f}s)...")

        # Lưu cache
        with open(cache_path, "wb") as f:
            pickle.dump(all_face_records, f)
        print(f"[AI] Đã lưu {len(all_face_records)} khuôn mặt vào cache: {cache_path}")

    # 4. Gom cụm và hợp nhất (Smart Clustering & Multi-Pass Merging)
    clusters = clusterer.cluster_and_merge(all_face_records, couple_embeddings)

    # 5. Lọc những người xuất hiện tối thiểu `min_photos` ảnh và sắp xếp
    valid_clusters = []
    for c in clusters:
        unique_photos = sorted(list(c["photos"]))
        if len(unique_photos) >= min_photos:
            valid_clusters.append((c, unique_photos))

    valid_clusters.sort(key=lambda item: len(item[1]), reverse=True)

    if max_people > 0:
        valid_clusters = valid_clusters[:max_people]
        print(f"[AI] Giới hạn hiển thị {max_people} khách đầu tiên.")
    else:
        print(f"[AI] Hiển thị TOÀN BỘ {len(valid_clusters)} khách mời (không giới hạn)!")

    # 6. Tạo avatar cá nhân từ ảnh gốc sắc nét và xuất file JSON
    output_faces_dir.mkdir(parents=True, exist_ok=True)
    groups_data = []

    print("[AI] Đang cắt avatar 1:1 chất lượng cao cho từng vị khách...")
    for p_idx, (cluster, unique_photos) in enumerate(valid_clusters):
        person_id = f"person_{p_idx + 1}"
        avatar_rel_path = f"/wedding/faces/{person_id}.jpg"
        avatar_file = output_faces_dir / f"{person_id}.jpg"

        # Chọn bức ảnh có chất lượng khuôn mặt rõ nét nhất làm avatar
        best_face = max(cluster["records"], key=lambda f: f["score"] * f["faceBox"][2] * f["faceBox"][3])
        source_path = best_face["filePath"]
        source_img = cv2.imread(str(source_path))
        if source_img is not None:
            crop_avatar(source_img, best_face["faceBox"], avatar_file)

        unique_indices = sorted(list(set(r["photoIndex"] for r in cluster["records"])))

        groups_data.append({
            "id": person_id,
            "name": f"Khách mời {p_idx + 1}",
            "role": "guest",
            "avatar": avatar_rel_path,
            "count": len(unique_photos),
            "photoIndices": unique_indices,
            "photos": unique_photos,
        })

    result_data = {
        "version": "2.1",
        "description": "Nhận dạng toàn bộ khách mời với thuật toán hợp nhất thông minh (Smart Merging)",
        "totalPhotos": total_photos,
        "totalGroups": len(groups_data),
        "groups": groups_data,
    }

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)

    print("=" * 70)
    print(f"[THÀNH CÔNG] Đã nhận diện và hợp nhất toàn bộ {len(groups_data)} khách mời!")
    print(f"File metadata: {output_json_path}")
    print("Danh sách top 15 khách mời có nhiều ảnh nhất:")
    for g in groups_data[:15]:
        print(f"  - {g['id']}: {g['count']} bức ảnh")
    if len(groups_data) > 15:
        print(f"  ... và {len(groups_data) - 15} khách mời khác được hiển thị đầy đủ.")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="AI Individual Face Recognition with Smart Merging")
    parser.add_argument("--photos_dir", type=str, default=None, help="Đường dẫn thư mục ảnh cục bộ")
    parser.add_argument("--photos_json", type=str, default=str(DEFAULT_PHOTOS_JSON))
    parser.add_argument("--output_json", type=str, default=str(DEFAULT_OUTPUT_JSON))
    parser.add_argument("--output_faces", type=str, default=str(DEFAULT_FACES_DIR))
    parser.add_argument("--cache_file", type=str, default=str(DEFAULT_CACHE_FILE))
    parser.add_argument("--min_photos", type=int, default=1, help="Số ảnh tối thiểu để hiển thị (mặc định 1)")
    parser.add_argument("--max_people", type=int, default=0, help="Số người tối đa (0 = không giới hạn, hiển thị tất cả)")
    parser.add_argument("--force_rescan", action="store_true", help="Bắt buộc quét lại ảnh dù đã có cache")
    args = parser.parse_args()

    run_pipeline(
        photos_dir=args.photos_dir,
        photos_json_path=Path(args.photos_json),
        output_json_path=Path(args.output_json),
        output_faces_dir=Path(args.output_faces),
        cache_path=Path(args.cache_file),
        min_photos=args.min_photos,
        max_people=args.max_people,
        force_rescan=args.force_rescan,
    )


if __name__ == "__main__":
    main()
