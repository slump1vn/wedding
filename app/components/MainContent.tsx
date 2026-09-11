"use client";

import { useState, useEffect, useRef } from "react";
import { IoIosArrowUp } from "react-icons/io";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import CountdownTimer from "./Countdown";
import Form from "./Form";
import WishesList from "./WishesList";
import { config } from "@/lib/config";

type WeddingScreenProps = {
  name?: string;
};

const WeddingScreen = ({ name }: WeddingScreenProps) => {
  const [fadeClass, setFadeClass] = useState("opacity-0");
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef(null);

  // Untuk fade-in pertama kali
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeClass("opacity-100");
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && audioRef.current) {
      // Play music when "Open" is clicked
      (audioRef.current as HTMLAudioElement).play();
    }
  };

  const { ref: mainRef, inView: isMainInView } = useInView({
    threshold: 0.5,
  });

  const { ref: main2Ref, inView: isMain2InView } = useInView({
    threshold: 0.5,
  });

  const { ref: slide5Ref, inView: isSlide5InView } = useInView({
    threshold: 0.5,
  });
  const { ref: slide6Ref, inView: isSlide6InView } = useInView({
    threshold: 0.5,
  });
  const { ref: slide7Ref, inView: isSlide7InView } = useInView({
    threshold: 0.5,
  });
  const { ref: slide8Ref, inView: isSlide8InView } = useInView({
    threshold: 0.5,
  });
  const { ref: slide9Ref, inView: isSlide9InView } = useInView({
    threshold: 0.5,
  });
  const { ref: slide10Ref, inView: isSlide10InView } = useInView({
    threshold: 0.5,
  });
  const { ref: endRef, inView: isEndInView } = useInView({
    threshold: 0.5,
  });
  const { ref: infoRef, inView: isInfoInView } = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    const video = document.querySelector("iframe");
    if (video) {
      if (isSlide8InView) {
        video.src += "&autoplay=1"; // Mulai video
      } else {
        video.src = video.src.replace("&autoplay=1", ""); // Hentikan video
      }
    }
  }, [isSlide8InView]);

  return (
    <div
      className={`wedding-screen h-dvh w-screen flex flex-col md:flex-row ${fadeClass} transition-opacity duration-1000`}
    >
      {/* Gambar sisi kiri Wide Untuk Komputer */}
      <div
        className="md:flex justify-center hidden items-end pb-12 w-2/3 h-1/2 md:h-full"
        style={{
          backgroundImage: `url(/foto_1_samping.jpg)`, //refer to base 1st photo
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className={`bottom-10 left-20 font-ovo text-2xl text-white tracking-[5px] uppercase`}
        >
          {config.coupleNames}
        </div>
      </div>

      {/* Konten teks sisi kanan bisa scroll untuk pc */}
      <div className=" md:w-1/3 h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth">
        <div
          id="backgroundWedding"
          className=" snap-start  w-full h-dvh flex items-center justify-center "
        >
          <div className="text-center p-5 flex flex-col h-full py-20">
            <div className="gap-y-2 md:gap-y-4 flex flex-col">
              {name && (
                <h5
                  className={`text-lg font-legan text-white uppercase tracking-wide fadeMain2 ${isMain2InView ? "active" : ""
                    } `}
                >
                  Kính gửi {name},
                </h5>
              )}
              <h5
                className={`text-lg font-legan text-white uppercase tracking-wide fadeMain2 ${isMain2InView ? "active" : ""
                  } `}
                ref={main2Ref}
              >
                Lễ Cưới Của
              </h5>
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl font-ovo t text-white uppercase fadeMain ${isMainInView ? "active" : ""
                  } `}
                ref={mainRef}
              >
                {config.coupleNames}
              </h1>
              <h5
                className={`text-lg  font-legan text-white uppercase tracking-wide  fadeMain2 ${isMain2InView ? "active" : ""
                  } `}
                ref={main2Ref}
              >
                {new Date(config.eventDate).toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h5>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              {!isOpen && (
                <>
                  <p className="text-2xl uppercase font-xs tracking-widest text-white mb-6">
                    {name ? `Kính gửi ${name},` : "Chào Mừng"}
                  </p>
                  <button
                    className="btn-glow animate-bounce px-12 py-5 uppercase text-xl font-medium tracking-wide border-2 border-white backdrop-blur-md bg-white/30 hover:bg-white/50 text-black transition rounded-full"
                    onClick={handleOpen}
                  >
                    Mở Thiệp Mời
                  </button>
                </>
              )}
            </div>

            <div>
              {isOpen && (
                <IoIosArrowUp
                  stroke="4"
                  className="mx-auto animate-upDown text-white"
                />
              )}
            </div>
          </div>
        </div>
        {isOpen && (
          <>
            {/* Slide 5 */}
            <div
              className="snap-start  text-white h-dvh flex flex-col items-center px-12 "
              style={{
                backgroundImage: `url(/slide_5.jpg)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={slide5Ref}
                className={` ${isSlide5InView ? "active" : ""
                  }  fadeInMove flex items-center flex-col pt-32 `}
              >
                <h3 className="uppercase font-legan text-base tracking-wide mt-5 mb-2">
                  lưu lại ngày cưới
                </h3>
                <h1 className="text-2xl sm:text-4xl text-center text-white  font-ovo uppercase">
                  {new Date(config.eventDate).toLocaleDateString("vi-VN", {
                    weekday: "long",
                  })} <br />  {new Date(config.eventDate).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h1>
                {config.holyMatrimony.enabled && (
                  <div className="mt-5 mx-auto flex flex-col items-center bg-black/55 rounded-xl p-4 backdrop-blur-sm">
                    <h3 className="uppercase font-ovo text-lg text-center mb-2">
                      Lễ Ăn Hỏi <br /> {config.holyMatrimony.time}
                    </h3>
                    <p className="text-lg text-center  font-legan text-white">
                      {config.holyMatrimony.place} <br /> {config.holyMatrimony.place_details}
                    </p>
                    <Link
                      href={config.holyMatrimony.googleMapsLink}
                      target="_blank"
                      className="cursor-pointer hover:text-white/20 text-lg rounded-full flex items-center gap-x-2 text-center font-legan mt-5 bg-[#808080] w-fit px-5 py-3 text-white"
                    >
                      Google Maps
                    </Link>
                  </div>
                )}

                {config.weddingReception.enabled && (
                  <div className="mt-5 mx-auto flex  flex-col items-center bg-black/55 rounded-xl p-4 backdrop-blur-sm">
                    <h3 className="uppercase font-ovo text-lg text-center mb-2">
                      Tiệc Cưới <br /> {config.weddingReception.time}
                    </h3>
                    <p className="text-lg text-center  font-legan text-white">
                      {config.weddingReception.place} <br /> {config.weddingReception.place_details}
                    </p>
                    <Link
                      href={config.weddingReception.googleMapsLink}
                      target="_blank"
                      className="cursor-pointer hover:text-white/20 text-lg rounded-full flex items-center gap-x-2 text-center font-legan mt-5 bg-[#808080] w-fit px-5 py-3 text-white"
                    >
                      Google Maps
                    </Link>
                  </div>
                )}
              </div>
            </div>
            {/* Slide 6 */}
            <div
              className="snap-start  text-white h-dvh flex flex-col items-center justify-end pb-16 px-12 "
              style={{
                backgroundImage: `url(/slide_6.jpg)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={slide6Ref}
                className={` ${isSlide6InView ? "active" : ""
                  }  fadeInMove flex items-center flex-col`}
              >
                <h1 className="text-3xl sm:text-4xl text-center text-white  font-ovo">
                  SẮP ĐẾN NGÀY VUI CỦA CHÚNG TÔI
                </h1>
                {/* Countdown Timer */}
                <CountdownTimer />
              </div>
            </div>
            {/* Slide 7 */}
            {config.livestreaming.enabled && (
              <div
                className="snap-start  text-white h-dvh flex flex-col justify-between pt-16 pb-32 px-12 "
                style={{
                  backgroundImage: `url(/foto_1_samping.jpg)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <h1
                  ref={slide7Ref}
                  className={`text-4xl text-white  font-ovo fadeInMoveSlow ${isSlide7InView ? "active" : ""
                    }`}
                >
                  THAM GIA SỰ KIỆN PHÁT TRỰC TIẾP CÙNG CHÚNG TÔI
                </h1>

                <div
                  className={`mt-5 mx-auto flex flex-col fadeInMove ${isSlide7InView ? "active" : ""
                    }`}
                  ref={slide7Ref}
                >
                  <h3 className="uppercase font-ovo text-lg mt-5 mb-2">
                    {new Date(config.eventDate).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    <br /> {config.livestreaming.time}
                  </h3>
                  <p className="text-lg font-legan text-white">
                    {config.livestreaming.detail}
                  </p>
                  <Link
                    href={config.livestreaming.link}
                    target="_blank"
                    className="cursor-pointer hover:text-white/20 text-lg rounded-full flex items-center gap-x-2 text-center font-legan mt-5 bg-[#3B3B3B] w-fit px-6 py-3 text-white"
                  >
                    Xem Trực Tiếp
                  </Link>
                </div>
              </div>)}
            {/* SLIDE 8 */}
            {config.prewedding.enabled && (
              <div
                className="snap-start text-white h-dvh flex flex-col justify-center pt-16 pb-16 px-8 "
                style={{
                  backgroundImage: `url(/slide_8.jpg)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div
                  ref={slide8Ref}
                  className={`${isSlide8InView ? "active" : ""} fadeInMove `}
                >
                  <h1 className="text-4xl text-white  font-ovo text-center uppercase">
                    Câu Chuyện Prewedding Của Chúng Tôi
                  </h1>
                  <div
                    className="mt-10 mx-auto w-full max-w-2xl relative"
                    style={{ paddingBottom: "56.25%", height: 0 }}
                  >
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${config.prewedding.link}?autoplay=1&mute=1&loop=1`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    ></iframe>
                  </div>

                  <div className="-mt-12 w-72 transform skew-x-6 drop-shadow">
                    <p className="text-4xl font-thesignature text-white/80 ">
                      {config.prewedding.detail}
                    </p>
                  </div>
                </div>
              </div>)}

            {/* SLIDE 9 */}
            {config.rsvp.enabled && (
            <div
              className="snap-start text-white h-dvh flex flex-col justify-center pt-16 pb-16 px-8"
              style={{
                backgroundImage: `url(/slide_9.jpg)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={slide9Ref}
                className={`${isSlide9InView ? "active" : ""} fadeInMove`}
              >
                <h1 className="text-3xl sm:text-5xl text-white font-ovo text-center uppercase mb-1">
                  XÁC NHẬN THAM DỰ & LỜI CHÚC
                </h1>
                <p className="text-lg font-legan text-white/80 text-center">
                {config.rsvp.detail}
                </p>

                <Form />
              </div>
            </div>
            )}

            {/* SLIDE 10 */}
            <div
              className="snap-start text-white h-dvh flex flex-col justify-center pt-16 pb-16 px-8"
              style={{
                backgroundImage: `url(/slide_9.jpg)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={slide10Ref}
                className={`${isSlide10InView ? "active" : ""} fadeInMove`}
              >
                <h1 className="text-5xl text-white font-ovo text-center uppercase">
                  Lời Chúc
                </h1>
                <WishesList />
              </div>
            </div>

            {/* SLIDE AKHIR */}
            <div
              className="snap-start text-white h-dvh flex flex-col justify-end pt-16 pb-16 px-12 "
              style={{
                backgroundImage: `url(/slide_7.jpg)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={endRef}
                className={` ${isEndInView ? "active" : ""} fadeInMove `}
              >
                <h1 className="text-3xl sm:text-5xl text-white  font-ovo text-center uppercase">
                  {config.thankyou}
                </h1>

                <div className="mt-5 mx-auto flex flex-col ">
                  <p className="text-lg font-legan text-white text-center">
                    {config.thankyouDetail}
                  </p>
                  <p className="text-lg rounded-full text-center font-ovo mt-5 px-6 py-2 text-white uppercase">
                    {config.coupleNames}
                  </p>
                </div>
              </div>
            </div>

            {/* SLIDE THÔNG TIN NGÀY GIỜ */}
            <div className="snap-start text-white h-dvh flex flex-col justify-center pt-16 pb-10 px-8 bg-[#0a0a0a]">
              <div
                ref={infoRef}
                className={`${isInfoInView ? "active" : ""} fadeInMove flex-1 flex flex-col justify-center`}
              >
                <h1 className="text-4xl text-white font-ovo text-center uppercase mb-6">
                  Thông Tin Ngày Giờ
                </h1>

                <div className="flex flex-col gap-y-4">
                  {config.holyMatrimony.enabled && (
                    <div className="border border-white/20 rounded-lg p-5 flex flex-col items-center text-center">
                      <h3 className="uppercase font-ovo text-xl mb-2">
                        Lễ Ăn Hỏi
                      </h3>
                      <p className="text-lg font-legan text-white/80">
                        {config.holyMatrimony.time}
                      </p>
                      <p className="text-lg font-legan text-white/80 mt-2">
                        {config.holyMatrimony.place} <br /> {config.holyMatrimony.place_details}
                      </p>
                      <Link
                        href={config.holyMatrimony.googleMapsLink}
                        target="_blank"
                        className="cursor-pointer hover:text-white/20 text-lg rounded-full flex items-center gap-x-2 text-center font-legan mt-4 bg-[#808080] w-fit px-5 py-3 text-white"
                      >
                        Google Maps
                      </Link>
                    </div>
                  )}

                  {config.weddingReception.enabled && (
                    <div className="border border-white/20 rounded-lg p-5 flex flex-col items-center text-center">
                      <h3 className="uppercase font-ovo text-xl mb-2">
                        Tiệc Cưới
                      </h3>
                      <p className="text-lg font-legan text-white/80">
                        {config.weddingReception.time}
                      </p>
                      <p className="text-lg font-legan text-white/80 mt-2">
                        {config.weddingReception.place} <br /> {config.weddingReception.place_details}
                      </p>
                      <Link
                        href={config.weddingReception.googleMapsLink}
                        target="_blank"
                        className="cursor-pointer hover:text-white/20 text-lg rounded-full flex items-center gap-x-2 text-center font-legan mt-4 bg-[#808080] w-fit px-5 py-3 text-white"
                      >
                        Google Maps
                      </Link>
                    </div>
                  )}

                  {config.livestreaming.enabled && (
                    <div className="border border-white/20 rounded-lg p-5 flex flex-col items-center text-center">
                      <h3 className="uppercase font-ovo text-xl mb-2">
                        Trực Tiếp
                      </h3>
                      <p className="text-lg font-legan text-white/80">
                        {new Date(config.eventDate).toLocaleDateString("vi-VN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                        <br /> {config.livestreaming.time}
                      </p>
                      <Link
                        href={config.livestreaming.link}
                        target="_blank"
                        className="cursor-pointer hover:text-white/20 text-lg rounded-full flex items-center gap-x-2 text-center font-legan mt-4 bg-[#3B3B3B] w-fit px-5 py-3 text-white"
                      >
                        Xem Trực Tiếp
                      </Link>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
      {/* Audio Element */}
      <audio ref={audioRef} src="/music/wedding_song.mp3" preload="auto" />
    </div>
  );
};

export default WeddingScreen;
