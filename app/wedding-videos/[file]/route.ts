import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

// Phục vụ video lễ cưới đã tải về server, hỗ trợ Range để tua và để Safari/iPhone phát được
const VIDEOS_DIR = path.join(process.env.PHOTOS_DIR || "/photos", "videos");
const FILES = new Set(["intro.mp4", "wedding.mp4"]);

const stream = (file: string, start: number, end: number) =>
  Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;

export async function GET(req: Request, { params }: { params: { file: string } }) {
  if (!FILES.has(params.file)) {
    return new Response("Not found", { status: 404 });
  }
  const file = path.join(VIDEOS_DIR, params.file);
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers = {
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400",
  };

  const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (!match) {
    return new Response(stream(file, 0, size - 1), {
      headers: { ...headers, "Content-Length": String(size) },
    });
  }

  // "bytes=a-b", "bytes=a-" hoặc "bytes=-n" (n byte cuối)
  let start = match[1] ? Number(match[1]) : size - Number(match[2]);
  let end = match[1] && match[2] ? Number(match[2]) : size - 1;
  start = Math.max(0, start);
  end = Math.min(end, size - 1);
  if (start > end || (!match[1] && !match[2])) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }

  return new Response(stream(file, start, end), {
    status: 206,
    headers: {
      ...headers,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
    },
  });
}
