"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import {
  FaGift,
  FaMapMarkerAlt,
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaPinterestP,
  FaHeart,
  FaPlay,
  FaPause,
} from "react-icons/fa";
import CountdownTimer from "./Countdown";
import Form from "./Form";
import WishesList from "./WishesList";
import { config } from "@/lib/config";

type WeddingScreenProps = {
  name?: string;
};

const photos = {
  groom: "/juhi/PMN03281.jpg",
  bride: "/juhi/PMN02833.jpg",
  album: [
    "/juhi/PMN02276.jpg",
    "/juhi/DUC06202.jpg",
    "/juhi/PMN03369.jpg",
    "/juhi/PMN03044.jpg",
    "/juhi/PMN02925_2.jpg",
    "/juhi/PMN03562.jpg",
    "/juhi/DUC06717.jpg",
  ],
  countdownBg: "/juhi/PMN03044.jpg",
  receptionCircle: "/juhi/PMN03369.jpg",
  wishesBg: "/juhi/PMN02925_2.jpg",
  thankyouBg: "/juhi/DUC06717.jpg",
};

const IconButton = ({
  href,
  onClick,
  children,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) => {
  const cls =
    "w-9 h-9 rounded-full bg-sage text-white flex items-center justify-center text-sm hover:bg-sage/85 transition";
  if (href) {
    return (
      <Link href={href} target="_blank" className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
};

const DateBreakdown = ({ date }: { date: Date }) => (
  <div className="flex items-end justify-center gap-3 my-2">
    <div className="border-b border-sage/40 pb-1 px-1">
      <span className="font-quicksand text-xs text-[#6E6E6E]">
        {date.toLocaleDateString("vi-VN", { weekday: "long" })}
      </span>
    </div>
    <span className="font-playfair text-3xl md:text-4xl text-brown font-bold">
      {String(date.getDate()).padStart(2, "0")}/{String(date.getMonth() + 1).padStart(2, "0")}
    </span>
    <div className="border-b border-sage/40 pb-1 px-1">
      <span className="font-quicksand text-xs text-[#6E6E6E]">
        {date.getFullYear()}
      </span>
    </div>
  </div>
);

const PersonCard = ({
  label,
  photo,
  name,
  father,
  mother,
  instagram,
  reverse,
}: {
  label: string;
  photo: string;
  name: string;
  father?: string;
  mother?: string;
  instagram?: string;
  reverse?: boolean;
}) => {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  return (
    <div
      ref={ref}
      className={`fadeInMove ${inView ? "active" : ""} flex flex-col items-center text-center mt-10`}
    >
      <div
        className="w-full max-w-[260px] aspect-[4/5] bg-cover bg-center shadow-md"
        style={{
          backgroundImage: `url(${photo})`,
          borderRadius: reverse ? "9999px 9999px 24px 24px" : "9999px 9999px 24px 24px",
        }}
      />
      <p className="font-quicksand text-sm text-[#6E6E6E] mt-4 uppercase tracking-wide">
        {label}
      </p>
      <h3 className="font-dancing text-4xl text-sage -mt-1">{name}</h3>
      {(father || mother) && (
        <p className="font-vietnam text-sm text-[#6E6E6E] mt-1">
          {father}
          {father && mother && <br />}
          {mother}
        </p>
      )}
      {instagram && (
        <div className="flex gap-2 mt-3">
          <IconButton href={`https://www.instagram.com/${instagram}`}>
            <FaInstagram />
          </IconButton>
        </div>
      )}
    </div>
  );
};

const EventCard = ({
  eyebrow,
  title,
  date,
  place,
  placeDetails,
  lunarDate,
  googleMapsLink,
  tint = "mint",
}: {
  eyebrow?: string;
  title: string;
  date: Date;
  place: string;
  placeDetails: string;
  lunarDate?: string;
  googleMapsLink: string;
  tint?: "mint" | "none";
}) => {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  return (
    <div
      ref={ref}
      className={`fadeInMove ${inView ? "active" : ""} ${
        tint === "mint" ? "bg-mint-bg border border-sage/20" : ""
      } rounded-[32px] px-6 py-8 text-center`}
    >
      {photos.receptionCircle && tint === "mint" && (
        <div
          className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-cover bg-center mx-auto border-4 border-white shadow"
          style={{ backgroundImage: `url(${photos.receptionCircle})` }}
        />
      )}
      {eyebrow && (
        <p className="font-quicksand text-xs uppercase tracking-[3px] text-[#6E6E6E] mt-4">
          {eyebrow}
        </p>
      )}
      <h3 className="font-playfair text-xl md:text-2xl font-semibold text-[#343434] mt-2">
        {title}
      </h3>
      <p className="font-vietnam text-sm text-[#6E6E6E] mt-2">
        {place}
        <br />
        {placeDetails}
      </p>
      <p className="font-vietnam text-sm text-[#343434] mt-3">
        Vào lúc{" "}
        {date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <DateBreakdown date={date} />
      {lunarDate && (
        <p className="font-vietnam italic text-xs text-[#7D7D7D]">{lunarDate}</p>
      )}
      <div className="flex justify-center gap-3 mt-4">
        <IconButton onClick={() => document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" })}>
          <FaGift />
        </IconButton>
        <IconButton href={googleMapsLink}>
          <FaMapMarkerAlt />
        </IconButton>
      </div>
    </div>
  );
};

const WeddingScreen = ({ name }: WeddingScreenProps) => {
  const [fadeClass, setFadeClass] = useState("opacity-0");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setFadeClass("opacity-100"), 300);
    return () => clearTimeout(timer);
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const eventDate = new Date(config.eventDate);
  const holyMatrimonyDate = new Date(config.holyMatrimony.date);
  const [nameLine1, nameLine2] = config.coupleNames.split(" & ");

  const { ref: introRef, inView: introInView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { ref: albumRef, inView: albumInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { ref: countdownRef, inView: countdownInView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { ref: rsvpRef, inView: rsvpInView } = useInView({ threshold: 0.1, triggerOnce: true });
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
        {/* HERO / SAVE THE DATE */}
        <section className="relative px-6 pt-20 pb-10 text-center">
          <div className="mx-auto max-w-sm rounded-t-[110px] rounded-b-3xl border border-sage/25 bg-white/50 backdrop-blur-sm pt-14 pb-8 px-6 relative">
            {name && (
              <p className="font-vietnam text-sm text-[#6E6E6E] mb-2">Kính gửi {name},</p>
            )}
            <p className="font-quicksand text-xs uppercase tracking-[4px] text-[#6E6E6E]">
              Save the Date
            </p>
            <h1 className="font-dancing text-4xl md:text-5xl text-[#232323] leading-tight mt-2">
              {nameLine1}
              <br />
              &amp;
              <br />
              {nameLine2}
            </h1>
            <p className="font-vietnam text-xs text-[#6E6E6E] mt-4">Vào Lúc</p>
            <p className="font-playfair text-xl text-[#343434]">
              {holyMatrimonyDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <DateBreakdown date={holyMatrimonyDate} />
            <h2 className="font-playfair font-bold text-xl uppercase text-[#232323]">
              Lễ Vu Quy
            </h2>
            <p className="font-vietnam text-sm text-[#6E6E6E] mt-1">
              {config.holyMatrimony.place}, {config.holyMatrimony.place_details}
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <IconButton onClick={() => document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" })}>
                <FaGift />
              </IconButton>
              <IconButton href={config.holyMatrimony.googleMapsLink}>
                <FaMapMarkerAlt />
              </IconButton>
            </div>
          </div>
          <div className="absolute -bottom-4 left-0 w-24 md:w-32 aspect-[380/673] pointer-events-none select-none">
            <Image src="/juhi/bottom-left.png" alt="" fill className="object-contain" />
          </div>
        </section>

        {/* GIỚI THIỆU */}
        <section
          ref={introRef}
          className={`fadeInMove ${introInView ? "active" : ""} px-6 pt-6 pb-4`}
        >
          <h2 className="font-dancing text-4xl text-center text-[#343434]">
            Giới Thiệu
          </h2>
          <PersonCard
            label="chú rể"
            photo={photos.groom}
            name={config.groom}
            father={config.groomFather}
            mother={config.groomMother}
            instagram={config.groomInstagram}
          />
          <PersonCard
            label="cô dâu"
            photo={photos.bride}
            name={config.bride}
            father={config.brideFather}
            mother={config.brideMother}
            instagram={config.brideInstagram}
            reverse
          />
        </section>

        {/* ALBUM ẢNH */}
        <section
          ref={albumRef}
          className={`fadeInMove ${albumInView ? "active" : ""} px-6 py-10`}
        >
          <h2 className="font-playfair font-bold text-2xl text-center uppercase text-[#232323] mb-5">
            Album Ảnh
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {photos.album.map((src, i) => (
              <div
                key={src}
                className={`bg-cover bg-center rounded-md ${i % 3 === 0 ? "aspect-[3/4] col-span-1" : "aspect-square"}`}
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
        </section>

        {/* ĐẾM NGƯỢC */}
        <section
          ref={countdownRef}
          className={`fadeInMove ${countdownInView ? "active" : ""} px-6 py-6 text-center`}
        >
          <p className="font-quicksand text-xs uppercase tracking-[3px] text-[#6E6E6E]">
            Cùng Đếm Ngược Thời Gian
          </p>
          <h2 className="font-playfair font-bold text-3xl uppercase text-[#232323] mt-2 mb-5">
            Save The Date
          </h2>
          <div
            className="relative rounded-3xl overflow-hidden bg-cover bg-center min-h-[340px] flex items-end justify-center p-5"
            style={{ backgroundImage: `url(${photos.countdownBg})` }}
          >
            <FaHeart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500/90 text-3xl drop-shadow" />
            <CountdownTimer />
          </div>
        </section>

        {/* TRÂN TRỌNG KÍNH MỜI */}
        {config.weddingReception.enabled && (
          <section className="px-6 py-10 text-center">
            <h2 className="font-playfair font-bold text-2xl leading-snug uppercase text-[#232323] mb-6">
              Trân Trọng
              <br />
              Kính Mời
            </h2>
            <EventCard
              title="Bữa Cơm Thân Mật"
              date={eventDate}
              place={config.weddingReception.place}
              placeDetails={config.weddingReception.place_details}
              lunarDate={config.weddingReception.lunarDate}
              googleMapsLink={config.weddingReception.googleMapsLink}
            />
          </section>
        )}

        {/* GỬI LỜI CHÚC */}
        {config.rsvp.enabled && (
          <section id="rsvp" ref={rsvpRef} className={`fadeInMove ${rsvpInView ? "active" : ""} relative`}>
            <div
              className="bg-cover bg-center py-14 px-6 text-center"
              style={{ backgroundImage: `url(${photos.wishesBg})` }}
            >
              <div className="absolute inset-0 bg-black/35" />
              <h2 className="relative font-playfair font-bold text-2xl text-white">
                Gửi lời chúc đến cặp đôi
              </h2>
            </div>
            <div className="relative -mt-10 mx-6 bg-pink-bg rounded-3xl shadow-lg p-6 pb-8">
              <h3 className="font-playfair text-xl text-center text-[#343434] mb-4">
                Gửi lời chúc
              </h3>
              <Form />
            </div>
            <div className="px-6">
              <WishesList />
            </div>
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
                {config.thankyouDetail}
              </p>
              <h3 className="font-playfair text-lg text-white mt-8">Chia sẻ thiệp</h3>
              <div className="flex justify-center gap-3 mt-3">
                <IconButton href="https://www.facebook.com/sharer/sharer.php">
                  <FaFacebookF />
                </IconButton>
                <IconButton href="https://twitter.com/intent/tweet">
                  <FaTwitter />
                </IconButton>
                <IconButton href="https://www.linkedin.com/sharing/share-offsite/">
                  <FaLinkedinIn />
                </IconButton>
                <IconButton href="https://www.pinterest.com/pin/create/button/">
                  <FaPinterestP />
                </IconButton>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating music toggle */}
      <button
        onClick={toggleMusic}
        className="fixed bottom-5 left-5 z-50 w-12 h-12 rounded-full bg-[#E96D5A] text-white shadow-lg flex items-center justify-center"
        aria-label="Bật/tắt nhạc nền"
      >
        <span className={isPlaying ? "spin-slow" : ""}>
          {isPlaying ? <FaPause /> : <FaPlay className="ml-0.5" />}
        </span>
      </button>
      <audio ref={audioRef} src="/juhi/beautiful-in-white.mp3" loop preload="auto" />
    </div>
  );
};

export default WeddingScreen;
