import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Schedule from "../components/Schedule";
import LiveTracker from "../components/LiveTracker";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: `Lịch trình cưới – ${config.coupleNames}`,
  description: `Lịch trình và phân công đám cưới ${config.coupleNames}`,
};

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Trang chỉ có lịch trình và phân công, để mọi người mở nhanh trên điện thoại khi theo dõi
export default function SchedulePage() {
  return (
    <div className="relative min-h-dvh bg-pink-bg overflow-x-hidden">
      <div className="absolute top-0 left-0 w-20 md:w-32 aspect-[152/166] pointer-events-none select-none z-0">
        <Image src={`${base}/juhi/leaf-top.png`} alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-0 right-0 w-24 md:w-40 aspect-[320/394] pointer-events-none select-none z-0">
        <Image src={`${base}/juhi/top-right.png`} alt="" fill className="object-contain" />
      </div>

      <div className="max-w-md mx-auto relative z-10">
        <header className="px-6 pt-16 pb-2 text-center">
          <p className="font-quicksand text-xs uppercase tracking-[4px] text-[#6E6E6E]">
            Đám cưới
          </p>
          <h1 className="font-dancing text-4xl text-[#232323] leading-tight mt-1">
            {config.coupleNames}
          </h1>
        </header>

        <LiveTracker />

        <Schedule />

        <p className="px-6 pb-10 text-center font-vietnam text-xs text-[#6E6E6E]">
          <Link href="/" className="text-sage underline">
            Xem thiệp cưới
          </Link>
        </p>
      </div>
    </div>
  );
}
