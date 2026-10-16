// Cấu hình theo dõi vị trí xe đoàn nhà trai

// Ngoài khoảng này bản đồ công khai không hiện vị trí (tránh lộ vị trí trước/sau chuyến đi)
export const TRACKING_START = new Date("2026-10-17T05:00:00+07:00");
export const TRACKING_END = new Date("2026-10-18T13:00:00+07:00");

// Link "Chia sẻ vị trí" của Google Maps, dùng làm phương án dự phòng. Để trống thì ẩn nút.
export const GOOGLE_LIVE_LOCATION_LINK = "";

// Các điểm dừng có toạ độ (lấy từ link Google Maps trong lịch trình), theo thứ tự thời gian
export const stops = [
  { name: "180 Đình Thôn", at: "2026-10-17T07:45:00+07:00", lat: 21.0188951, lon: 105.7718052 },
  { name: "Nhà hàng Lê Vân", at: "2026-10-17T11:30:00+07:00", lat: 21.0210862, lon: 106.8120265 },
  { name: "Khách sạn Lê Vân", at: "2026-10-17T12:00:00+07:00", lat: 21.0234087, lon: 106.810401 },
  { name: "Nhà cô dâu", at: "2026-10-17T13:00:00+07:00", lat: 21.0271952, lon: 106.7979696 },
  { name: "Khách sạn Lê Vân", at: "2026-10-17T15:30:00+07:00", lat: 21.0234087, lon: 106.810401 },
  { name: "Nhà cô dâu", at: "2026-10-18T06:10:00+07:00", lat: 21.0271952, lon: 106.7979696 },
  { name: "180 Đình Thôn", at: "2026-10-18T10:30:00+07:00", lat: 21.0188951, lon: 105.7718052 },
];
