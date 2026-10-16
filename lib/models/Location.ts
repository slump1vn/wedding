import mongoose, { Schema, models } from "mongoose";

// Một điểm vị trí của xe, gửi lên từ app OwnTracks trên điện thoại
const locationSchema = new Schema({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  tst: { type: Date, required: true, index: true }, // thời điểm điện thoại ghi nhận vị trí
  vel: Number, // km/h
  acc: Number, // độ chính xác (m)
  batt: Number, // % pin
  tid: String, // tracker id trong OwnTracks
});

export const Location = models.Location || mongoose.model("Location", locationSchema);
export default Location;
