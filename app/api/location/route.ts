import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Location from "@/lib/models/Location";
import { TRACKING_END, TRACKING_START } from "@/lib/tracking";

export const dynamic = "force-dynamic";

// Khoá bí mật: OwnTracks gửi qua HTTP Basic Auth (mật khẩu), hoặc ?key= trên URL
const isAuthorized = (req: Request) => {
  const secret = process.env.TRACKER_KEY;
  if (!secret) return false;
  if (new URL(req.url).searchParams.get("key") === secret) return true;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = Buffer.from(auth.slice(6), "base64").toString();
    return decoded.slice(decoded.indexOf(":") + 1) === secret;
  }
  return false;
};

// Nhận vị trí từ app OwnTracks (chế độ HTTP)
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const body = await req.json();
    // OwnTracks còn gửi các loại tin khác (status, lwt, transition...), chỉ lưu "location"
    if (body?._type === "location" && typeof body.lat === "number" && typeof body.lon === "number") {
      await connectToDatabase();
      await Location.create({
        lat: body.lat,
        lon: body.lon,
        tst: new Date((body.tst ?? Date.now() / 1000) * 1000),
        vel: body.vel,
        acc: body.acc,
        batt: body.batt,
        tid: body.tid,
      });
    }
    // OwnTracks yêu cầu phản hồi là một mảng JSON
    return NextResponse.json([]);
  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to save location", { status: 500 });
  }
}

// Trả về vị trí mới nhất và lộ trình đã đi cho bản đồ ở trang lịch trình
export async function GET(req: Request) {
  const now = new Date();
  // Có key thì xem được ngoài khung giờ, để thử trước khi xuất phát
  const preview = isAuthorized(req);
  if (!preview && (now < TRACKING_START || now > TRACKING_END)) {
    return NextResponse.json({ active: false, points: [] });
  }
  try {
    await connectToDatabase();
    const from = preview ? new Date(now.getTime() - 24 * 3600 * 1000) : TRACKING_START;
    const points = await Location.find({ tst: { $gte: from, $lte: TRACKING_END } })
      .sort({ tst: 1 })
      .select({ _id: 0, lat: 1, lon: 1, tst: 1, vel: 1, batt: 1 })
      .lean();
    return NextResponse.json({ active: true, points });
  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to load locations", { status: 500 });
  }
}
