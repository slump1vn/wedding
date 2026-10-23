import { readFile } from "fs/promises";
import path from "path";

// Phục vụ ảnh lễ cưới đã tải về server (thư mục gắn vào container tại PHOTOS_DIR)
const PHOTOS_DIR = process.env.PHOTOS_DIR || "/photos";
const SIZES = new Set(["thumb", "full"]);

export async function GET(_req: Request, { params }: { params: { size: string; file: string } }) {
  const { size, file } = params;
  if (!SIZES.has(size) || !/^\d{3}\.jpg$/.test(file)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const data = await readFile(path.join(PHOTOS_DIR, size, file));
    return new Response(data, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
