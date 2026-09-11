"use client";

import { config } from "@/lib/config";
import { useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";

const ScreenStart = () => {
  const [showScreenStart, setShowScreenStart] = useState(true);
  const [fadeClass, setFadeClass] = useState("opacity-100");

  useEffect(() => {
    const fadeInTimer = setTimeout(() => {
      setFadeClass("opacity-100");
    }, 100); 

    
    const fadeOutTimer = setTimeout(() => {
      setFadeClass("opacity-0");
    }, 6000); 

    const removeScreenStart = setTimeout(() => {
      setShowScreenStart(false);
    }, 7000);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(removeScreenStart);
    };
  }, []);

  if (!showScreenStart) {
    return null;
  }

  return (
    <div
      className={` text-white flex flex-col justify-center items-center min-h-screen text-center px-6 transition-opacity duration-1000 ${fadeClass}`}
    >
      <TypeAnimation
        sequence={[
          "LỄ CƯỚI CỦA",
          2000,
          config.coupleNames.toUpperCase(),
          1000,
        ]}
        wrapper="span"
        speed={20}
        style={{
          display: "inline-block",
        }}
        className="font-legan text-xl sm:text-3xl md:text-4xl"
        repeat={0} // Animasi terus diulang
      />
    </div>
  );
};

export default ScreenStart;
