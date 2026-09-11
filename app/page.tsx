"use client";

import { useEffect, useState } from "react";
import ScreenStart from "./components/ScreenStart";
import MainContent from "./components/MainContent";

export default function Home() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 7000);

    return () => clearTimeout(contentTimer);
  }, []);

  return (
    <div className="h-dvh">
      <ScreenStart />
      {showContent && <MainContent />} {/* Tampilkan MainContent */}
    </div>
  );
}
