"use client";

import { useEffect, useState } from "react";
import { FaImages } from "react-icons/fa";
import AlbumGrid from "./AlbumGrid";

// Album gốc trên Google Photos (ảnh do thợ ảnh chụp trong lễ ăn hỏi, lễ cưới và đón dâu)
export const GOOGLE_PHOTOS_ALBUM =
  "https://photos.google.com/share/AF1QipOOOJuBBltiHAWZk7srf1Qy3EuYUrJgSVTc4lnFhGhJ0mNpMjbFBXb7St0CC4NghA?key=ZWM1cEljdVBGSm02UGtzNkJGdjkya19KamRndzBB";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Ảnh lễ cưới: danh sách link Google Photos nằm ở public/wedding/photos.json,
// ảnh đã được tải về server và phục vụ qua /wedding-photos/{thumb,full}/NNN.jpg
const WeddingPhotos = () => {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${base}/wedding/photos.json`)
      .then((r) => r.json())
      .then(setUrls)
      .catch(() => {});
  }, []);

  if (urls.length === 0) return null;
  // Ảnh đã tải về server, đặt tên theo thứ tự trong photos.json: 001.jpg, 002.jpg, ...
  const files = urls.map((_, i) => `${String(i + 1).padStart(3, "0")}.jpg`);

  return (
    <div className="mt-8">
      <h3 className="font-playfair font-bold text-xl text-center text-[#232323] mb-4">
        Ảnh Lễ Cưới
      </h3>
      <AlbumGrid
        photos={files.map((f) => `${base}/wedding-photos/thumb/${f}`)}
        fullPhotos={files.map((f) => `${base}/wedding-photos/full/${f}`)}
        pageSize={24}
        cols={3}
      />
      <a
        href={GOOGLE_PHOTOS_ALBUM}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-2 font-vietnam text-sm text-sage underline"
      >
        <FaImages />
        Xem và tải ảnh gốc trên Google Photos
      </a>
    </div>
  );
};

export default WeddingPhotos;
