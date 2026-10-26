# AI Face Clustering Pipeline for Weddingly

Hệ thống AI nhận diện và gom cụm khuôn mặt trong album ảnh cưới, cho phép khách mời lọc ảnh theo từng nhân vật xuất hiện trong ảnh.

---

## 1. Công nghệ sử dụng
- **Face Detection (Phát hiện khuôn mặt)**: OpenCV YuNet (`face_detection_yunet_2023mar.onnx`) - mạng nơ-ron tích chập siêu nhẹ (~336KB), tốc độ cực nhanh, nhận diện chính xác kể cả ảnh góc nghiêng, khoảng cách xa.
- **Face Recognition (Trích xuất đặc trưng)**: OpenCV SFace (`face_recognition_sface_2021dec.onnx`) - trích xuất vector đặc trưng khuôn mặt 128 chiều (`cosine similarity`).
- **Face Clustering (Gom cụm)**: Thuật toán gom cụm Cosine Distance (ngưỡng tương đồng `0.363` theo chuẩn SFace) để nhóm các ảnh có chung một nhân vật.
- **Auto Avatar Generator**: Tự động crop khuôn mặt đại diện với padding 35% cân đối (tỷ lệ 1:1), lưu vào `public/wedding/faces/person_*.jpg`.
- **Output JSON**: Xuất kết quả vào `public/wedding/faces.json`.

---

## 2. Cấu trúc dữ liệu `public/wedding/faces.json`

```json
{
  "version": "1.0",
  "totalPhotos": 895,
  "totalGroups": 6,
  "groups": [
    {
      "id": "person_1",
      "name": "Chú rể",
      "role": "groom",
      "avatar": "/wedding/faces/person_1.jpg",
      "count": 485,
      "photoIndices": [0, 1, 2, 4, ...],
      "photos": ["001.jpg", "002.jpg", "003.jpg", ...]
    }
  ]
}
```

---

## 3. Cách chạy Script AI

### Yêu cầu môi trường
- Python 3.8+
- Các thư viện: `pip install opencv-python numpy pillow requests` (đã có sẵn trong môi trường của dự án)

### Chạy pipeline:
```bash
# Quét thư mục ảnh local và sinh faces.json + ảnh avatar
python scripts/cluster_faces.py --photos_dir /path/to/photos

# Tùy chỉnh số lượng ảnh tối thiểu của một người và số nhóm tối đa:
python scripts/cluster_faces.py --photos_dir ./photos --min_photos 3 --max_groups 15
```

### Tải mô hình thủ công (nếu máy chủ không có internet):
Tải 2 file model sau và đặt vào thư mục `scripts/models/`:
1. `face_detection_yunet_2023mar.onnx`: [Tải từ OpenCV Zoo](https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx)
2. `face_recognition_sface_2021dec.onnx`: [Tải từ OpenCV Zoo](https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx)
