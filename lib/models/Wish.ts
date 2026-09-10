import mongoose, { Schema, models } from "mongoose";

const wishSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    attendance: {
      type: String,
      required: true,
      enum: ["Tham dự", "Không tham dự"],
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Wish = models.Wish || mongoose.model("Wish", wishSchema);
export default Wish;
