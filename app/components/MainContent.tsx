"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import WishesList from "./WishesList";
import WeddingPhotos from "./WeddingPhotos";
import VideoPlayer from "./VideoPlayer";
import { config } from "@/lib/config";

type WeddingScreenProps = {
  name?: string;
};

const photos = {
  thankyouBg: "/juhi/DUC06717.jpg",
};

// Video tải từ Google Drive về server (thư mục videos trong WEDDING_PHOTOS_DIR)
//   intro.mp4:   drive.google.com/file/d/1EQId2kpnmZ51pJgmqBk8VPKIWs4OowZy
//   wedding.mp4: drive.google.com/file/d/16F3ZtP8Fw_oz1n_TJu8HsGQ9dzo8aJfP
const videos = {
  intro: { src: "/wedding-videos/intro.mp4", poster: "/juhi/PMN03044.jpg" },
  wedding: { src: "/wedding-videos/wedding.mp4", poster: "/juhi/DUC06202.jpg" },
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-playfair font-bold text-2xl text-center uppercase text-[#232323] mb-5">
    {children}
  </h2>
);

// Thiệp cảm ơn gửi tới khách đã đến dự lễ cưới
const WeddingScreen = ({ name }: WeddingScreenProps) => {
  const [fadeClass, setFadeClass] = useState("opacity-0");

  useEffect(() => {
    const timer = setTimeout(() => setFadeClass("opacity-100"), 300);
    return () => clearTimeout(timer);
  }, []);

  const eventDate = new Date(config.eventDate);
  const [nameLine1, nameLine2] = config.coupleNames.split(" & ");
  const dateText = [eventDate.getDate(), eventDate.getMonth() + 1]
    .map((n) => String(n).padStart(2, "0"))
    .concat(String(eventDate.getFullYear()))
    .join(".");

  const { ref: introRef, inView: introInView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { ref: albumRef, inView: albumInView } = useInView({ threshold: 0.05, triggerOnce: true });
  const { ref: videoRef, inView: videoInView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { ref: thankRef, inView: thankInView } = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <div className={`relative min-h-dvh bg-pink-bg overflow-x-hidden ${fadeClass} transition-opacity duration-1000`}>
      {/* Decorative corner leaves */}
      <div className="absolute top-0 left-0 w-24 md:w-36 aspect-[152/166] pointer-events-none select-none z-0">
        <Image src="/juhi/leaf-top.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-0 right-0 w-28 md:w-44 aspect-[320/394] pointer-events-none select-none z-0">
        <Image src="/juhi/top-right.png" alt="" fill className="object-contain" />
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* LỜI CẢM ƠN */}
        <section className="relative px-6 pt-20 pb-10 text-center">
          <div className="mx-auto max-w-sm rounded-t-[110px] rounded-b-3xl border border-sage/25 bg-white/50 backdrop-blur-sm pt-14 pb-8 px-6 relative">
            <p className="font-quicksand text-xs uppercase tracking-[4px] text-[#6E6E6E]">
              Lời Cảm Ơn
            </p>
            <h1 className="font-dancing text-4xl md:text-5xl text-[#232323] leading-tight mt-2">
              {nameLine1}
              <br />
              &amp;
              <br />
              {nameLine2}
            </h1>
            <p className="font-playfair text-lg text-brown mt-3">{dateText}</p>
            <p className="font-dancing text-3xl text-sage mt-6">
              Trân trọng cảm ơn{name ? ` ${name}` : ""}
            </p>
            <p className="font-vietnam text-sm text-[#343434] leading-relaxed mt-3">
              Cảm ơn bạn đã dành thời gian đến chung vui trong ngày trọng đại của chúng tôi. Sự hiện
              diện và những lời chúc phúc của mọi người là món quà ý nghĩa nhất, giúp ngày cưới của
              chúng tôi thêm trọn vẹn.
            </p>
          </div>
          <div className="absolute -bottom-4 left-0 w-24 md:w-32 aspect-[380/673] pointer-events-none select-none">
            <Image src="/juhi/bottom-left.png" alt="" fill className="object-contain" />
          </div>
        </section>

        {/* VIDEO GIỚI THIỆU */}
        <section
          ref={introRef}
          className={`fadeInMove ${introInView ? "active" : ""} px-6 pt-6 pb-4`}
        >
          <SectionTitle>Video Giới Thiệu</SectionTitle>
          <VideoPlayer {...videos.intro} title="Video giới thiệu" />
        </section>

        {/* ẢNH LỄ CƯỚI */}
        <section
          ref={albumRef}
          className={`fadeInMove ${albumInView ? "active" : ""} px-6 py-10`}
        >
          <SectionTitle>Ảnh Lễ Cưới</SectionTitle>
          <WeddingPhotos />
        </section>

        {/* VIDEO LỄ CƯỚI */}
        <section
          ref={videoRef}
          className={`fadeInMove ${videoInView ? "active" : ""} px-6 pb-6`}
        >
          <SectionTitle>Video Lễ Cưới</SectionTitle>
          <VideoPlayer {...videos.wedding} title="Video lễ cưới" />
        </section>

        {/* LỜI CHÚC */}
        {config.rsvp.enabled && (
          <section className="px-6">
            <WishesList />
          </section>
        )}

        {/* THANK YOU */}
        <section
          ref={thankRef}
          className={`fadeInMove ${thankInView ? "active" : ""} relative mt-10`}
        >
          <div
            className="bg-cover bg-center py-16 px-6 text-center relative"
            style={{ backgroundImage: `url(${photos.thankyouBg})` }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative">
              <h2 className="font-dancing text-5xl text-white">Thank you!</h2>
              <p className="font-vietnam text-sm text-white/90 mt-4 max-w-xs mx-auto">
                Một lần nữa, xin chân thành cảm ơn tình cảm của mọi người dành cho chúng tôi.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WeddingScreen;
