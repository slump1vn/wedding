"use client";

import type { SyntheticEvent } from "react";

// Khi một video bắt đầu phát thì dừng các video khác trên trang
const pauseOthers = (e: SyntheticEvent<HTMLVideoElement>) => {
  document.querySelectorAll("video").forEach((v) => {
    if (v !== e.currentTarget && !v.paused) v.pause();
  });
};

// Video tải về server; người xem tự bấm phát
const VideoPlayer = ({ src, poster, title }: { src: string; poster?: string; title: string }) => (
  <video
    src={src}
    poster={poster}
    title={title}
    controls
    playsInline
    preload="metadata"
    onPlay={pauseOthers}
    className="aspect-video w-full rounded-2xl bg-black shadow-md"
  />
);

export default VideoPlayer;
