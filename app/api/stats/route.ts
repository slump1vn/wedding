import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Wish from "@/lib/models/Wish";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    const groups: { _id: string; responses: number; guests: number }[] =
      await Wish.aggregate([
        {
          $group: {
            _id: "$attendance",
            responses: { $sum: 1 },
            guests: { $sum: "$guests" },
          },
        },
      ]);

    const pick = (key: string) => {
      const g = groups.find((x) => x._id === key);
      return { responses: g?.responses ?? 0, guests: g?.guests ?? 0 };
    };

    const attending = pick("Tham dự");
    const declined = pick("Không tham dự");

    return NextResponse.json({
      totalResponses: attending.responses + declined.responses,
      attending,
      declined,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { message: "Error fetching stats" },
      { status: 500 }
    );
  }
}
