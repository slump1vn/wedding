"use client";

import { useEffect, useState } from "react";
import { FaImages, FaUser, FaTimes, FaCheck } from "react-icons/fa";
import AlbumGrid from "./AlbumGrid";

// Album gốc trên Google Photos (ảnh do thợ ảnh chụp trong lễ ăn hỏi, lễ cưới và đón dâu)
export const GOOGLE_PHOTOS_ALBUM =
  "https://photos.google.com/share/AF1QipOOOJuBBltiHAWZk7srf1Qy3EuYUrJgSVTc4lnFhGhJ0mNpMjbFBXb7St0CC4NghA?key=ZWM1cEljdVBGSm02UGtzNkJGdjkya19KamRndzBB";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export interface FaceGroup {
  id: string;
  name: string;
  role?: string;
  avatar: string;
  count: number;
  photoIndices: number[];
  photos: string[];
}

interface FacesData {
  version: string;
  description?: string;
  totalPhotos: number;
  totalGroups: number;
  groups: FaceGroup[];
}

const WeddingPhotos = () => {
  const [urls, setUrls] = useState<string[]>([]);
  const [people, setPeople] = useState<FaceGroup[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<FaceGroup | null>(null);

  // Tải danh sách tất cả ảnh cưới
  useEffect(() => {
    fetch(`${base}/wedding/photos.json`)
      .then((r) => r.json())
      .then(setUrls)
      .catch(() => {});
  }, []);

  // Tải dữ liệu nhận dạng khuôn mặt từng cá nhân (đã loại trừ Cô dâu & Chú rể)
  useEffect(() => {
    fetch(`${base}/wedding/faces.json`)
      .then((r) => r.json())
      .then((data: FacesData) => {
        if (data && Array.isArray(data.groups)) {
          setPeople(data.groups);
        }
      })
      .catch(() => {});
  }, []);

  if (urls.length === 0) return null;

  // Danh sách toàn bộ 895 ảnh: 001.jpg, 002.jpg, ...
  const allFiles = urls.map((_, i) => `${String(i + 1).padStart(3, "0")}.jpg`);

  // Danh sách ảnh đang hiển thị (toàn bộ hoặc theo người được chọn)
  const currentFiles = selectedPerson ? selectedPerson.photos : allFiles;

  return (
    <div>
      {/* KHỐI NHẬN DIỆN KHUÔN MẶT TỪNG NGƯỜI (AI FACE ID) */}
      {people.length > 0 && (
        <div className="mb-6 rounded-2xl bg-white/75 p-4 border border-sage/25 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage/20 text-sage text-xs">
                <FaUser />
              </span>
              <h3 className="font-playfair text-base font-semibold text-[#232323]">
                Tìm ảnh theo người
              </h3>
            </div>
            <span className="rounded-full bg-sage/15 px-2.5 py-0.5 text-[11px] font-vietnam font-medium text-sage">
              AI Face ID ({people.length} người)
            </span>
          </div>

          <p className="text-xs font-vietnam text-[#6E6E6E] mb-3 px-1">
            Bấm vào ảnh đại diện để xem toàn bộ ảnh có mặt người đó:
          </p>

          {/* Dải avatar từng người cuộn ngang */}
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 scroll-smooth no-scrollbar">
            {/* Nút "Tất cả" */}
            <button
              type="button"
              onClick={() => setSelectedPerson(null)}
              className="group flex flex-col items-center flex-shrink-0 transition-transform active:scale-95"
            >
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all ${
                  selectedPerson === null
                    ? "border-sage bg-sage/20 ring-2 ring-sage/40 ring-offset-2"
                    : "border-sage/40 bg-white/80 hover:border-sage/70"
                }`}
              >
                <FaImages
                  className={`text-lg transition-colors ${
                    selectedPerson === null ? "text-sage" : "text-[#7D7D7D]"
                  }`}
                />
                {selectedPerson === null && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-sage text-white text-[9px]">
                    <FaCheck />
                  </span>
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-vietnam transition-colors ${
                  selectedPerson === null
                    ? "font-semibold text-sage"
                    : "text-[#555555]"
                }`}
              >
                Tất cả
              </span>
              <span className="text-[10px] font-quicksand text-[#888888]">
                {allFiles.length} ảnh
              </span>
            </button>

            {/* Avatar từng cá nhân được AI nhận dạng (đã bỏ dòng chữ khách mời) */}
            {people.map((person) => {
              const isSelected = selectedPerson?.id === person.id;
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() =>
                    setSelectedPerson(isSelected ? null : person)
                  }
                  className="group flex flex-col items-center flex-shrink-0 transition-transform active:scale-95"
                >
                  <div
                    className={`relative h-14 w-14 rounded-full overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-sage ring-2 ring-sage/40 ring-offset-2 scale-105"
                        : "border-white/90 hover:border-sage/50"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${base}${person.avatar}`}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sage text-white text-[9px] z-10 shadow">
                        <FaCheck />
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-1.5 text-[11px] font-quicksand transition-colors ${
                      isSelected
                        ? "font-semibold text-sage"
                        : "text-[#666666]"
                    }`}
                  >
                    {person.count} ảnh
                  </span>
                </button>
              );
            })}
          </div>

          {/* Thanh trạng thái khi đang lọc */}
          {selectedPerson && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-sage/10 px-3 py-2 text-xs font-vietnam text-[#333]">
              <div className="flex items-center gap-1.5">
                <span className="text-sage font-medium">Đang xem:</span>
                <span className="font-semibold text-[#222]">
                  {selectedPerson.count} ảnh của người này
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPerson(null)}
                className="flex items-center gap-1 text-sage hover:text-brown font-medium transition-colors"
              >
                <FaTimes className="text-[11px]" />
                <span>Xem tất cả</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* LƯỚI ẢNH ALBUM */}
      <AlbumGrid
        key={selectedPerson ? selectedPerson.id : "all"}
        photos={currentFiles.map((f) => `${base}/wedding-photos/thumb/${f}`)}
        fullPhotos={currentFiles.map((f) => `${base}/wedding-photos/full/${f}`)}
        pageSize={24}
        cols={3}
      />

      <a
        href={GOOGLE_PHOTOS_ALBUM}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 font-vietnam text-sm text-sage underline transition-opacity hover:opacity-80"
      >
        <FaImages />
        Xem và tải ảnh gốc trên Google Photos
      </a>
    </div>
  );
};

export default WeddingPhotos;
