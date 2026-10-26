"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaChevronLeft, FaChevronRight, FaDownload, FaTimes } from "react-icons/fa";

type AlbumGridProps = {
  photos: string[];
  // Ảnh độ phân giải cao để xem toàn màn hình (mặc định dùng chính `photos`)
  fullPhotos?: string[];
  // Số ảnh hiện mỗi lần, có nút "Xem thêm" (mặc định hiện tất cả)
  pageSize?: number;
  cols?: 2 | 3;
};

// Lưu ảnh về máy: trên điện thoại mở bảng chia sẻ (iPhone: "Lưu hình ảnh" vào app Ảnh),
// trình duyệt không hỗ trợ chia sẻ file thì tải file về như bình thường
const loadBlob = (src: string) => fetch(src).then((r) => r.blob());

const savePhoto = async (blob: Blob, name: string) => {
  const file = new File([blob], name, { type: blob.type || "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
    } catch {
      // người dùng đóng bảng chia sẻ
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Lưới ảnh album; bấm vào ảnh để xem toàn màn hình, vuốt hoặc dùng phím mũi tên để chuyển ảnh
const AlbumGrid = ({ photos, fullPhotos, pageSize, cols = 2 }: AlbumGridProps) => {
  const [index, setIndex] = useState<number | null>(null);
  const [shown, setShown] = useState(pageSize ?? photos.length);
  const [saving, setSaving] = useState(false);

  // Reset số lượng ảnh hiển thị khi danh sách ảnh thay đổi (khi filter nhân vật)
  useEffect(() => {
    setShown(pageSize ?? photos.length);
    setIndex(null);
  }, [photos, pageSize]);

  // Ảnh đang xem được tải sẵn để bấm "Lưu ảnh" mở bảng chia sẻ ngay (Safari yêu cầu gọi
  // share() ngay sau thao tác bấm, không được chờ tải ảnh)
  const prefetched = useRef<{ src: string; blob: Promise<Blob> } | null>(null);
  const current = index === null ? null : (fullPhotos ?? photos)[index];

  useEffect(() => {
    if (!current) return;
    const blob = loadBlob(current);
    blob.catch(() => {});
    prefetched.current = { src: current, blob };
  }, [current]);
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

  if (photos.length === 0) {
    return (
      <div className="py-12 text-center text-[#7D7D7D] font-vietnam text-sm bg-sage/5 rounded-2xl border border-dashed border-sage/30">
        Không tìm thấy bức ảnh nào phù hợp.
      </div>
    );
  }

  return (
    <>
      <div className={`grid ${cols === 3 ? "grid-cols-3 gap-1.5" : "grid-cols-2 gap-2"}`}>
        {photos.slice(0, shown).map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Xem ảnh ${i + 1}`}
            className="rounded-md aspect-[3/4] overflow-hidden bg-sage/10 cursor-zoom-in transition-transform duration-200 active:scale-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
      {shown < photos.length && pageSize && (
        <button
          type="button"
          onClick={() => setShown((n) => Math.min(n + pageSize, photos.length))}
          className="mt-4 w-full rounded-2xl border border-sage/50 bg-sage/15 px-4 py-3 font-vietnam text-sm text-[#232323] transition-colors hover:bg-sage/25"
        >
          Xem thêm ảnh ({photos.length - shown} ảnh nữa)
        </button>
      )}

      {/* Render ra body để không bị giới hạn bởi transform của khối cha */}
      {index !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
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
              src={current ?? undefined}
              referrerPolicy="no-referrer"
              alt={`Ảnh ${index + 1}`}
              className="max-h-full max-w-full object-contain select-none"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              disabled={saving}
              onClick={(e) => {
                e.stopPropagation();
                if (!current) return;
                const blob =
                  prefetched.current?.src === current ? prefetched.current.blob : loadBlob(current);
                setSaving(true);
                const rawName = current.split("/").pop()?.split("?")[0];
                const saveName = rawName && /^\d{3}\.jpg$/.test(rawName)
                  ? `anh-cuoi-${rawName}`
                  : `anh-cuoi-${String(index + 1).padStart(3, "0")}.jpg`;
                blob
                  .then((b) => savePhoto(b, saveName))
                  .catch(() => window.open(current, "_blank"))
                  .finally(() => setSaving(false));
              }}
              className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-2 font-vietnam text-sm text-white disabled:opacity-60 hover:bg-white/30 transition-colors"
            >
              <FaDownload />
              {saving ? "Đang tải..." : "Lưu ảnh"}
            </button>
            <button
              type="button"
              onClick={close}
              aria-label="Đóng"
              className="absolute top-4 right-4 p-3 text-white/90 text-2xl hover:text-white transition-colors"
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white/80 text-2xl hover:text-white transition-colors"
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white/80 text-2xl hover:text-white transition-colors"
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
