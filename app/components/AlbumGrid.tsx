"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

type AlbumGridProps = {
  photos: string[];
};

// Lưới ảnh album; bấm vào ảnh để xem toàn màn hình, vuốt hoặc dùng phím mũi tên để chuyển ảnh
const AlbumGrid = ({ photos }: AlbumGridProps) => {
  const [index, setIndex] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  // Phím tắt và khoá cuộn trang khi đang xem ảnh
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, close, step]);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Xem ảnh ${i + 1}`}
            className="bg-cover bg-center rounded-md aspect-[3/4] cursor-zoom-in"
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>

      {/* Render ra body để không bị giới hạn bởi transform của khối cha */}
      {index !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
            onClick={close}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[index]}
              alt={`Ảnh ${index + 1}`}
              className="max-h-full max-w-full object-contain select-none"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={close}
              aria-label="Đóng"
              className="absolute top-4 right-4 p-3 text-white/90 text-2xl"
            >
              <FaTimes />
            </button>
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  aria-label="Ảnh trước"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white/80 text-2xl"
                >
                  <FaChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  aria-label="Ảnh sau"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white/80 text-2xl"
                >
                  <FaChevronRight />
                </button>
                <p className="absolute bottom-4 left-0 right-0 text-center font-quicksand text-sm text-white/80">
                  {index + 1} / {photos.length}
                </p>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

export default AlbumGrid;
