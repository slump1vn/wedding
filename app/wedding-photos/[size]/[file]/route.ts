import { readFile } from "fs/promises";
import path from "path";

// Phục vụ ảnh lễ cưới đã tải về server (thư mục gắn vào container tại PHOTOS_DIR)
const PHOTOS_DIR = process.env.PHOTOS_DIR || "/photos";
const SIZES = new Set(["thumb", "full"]);

let cachedUrls: string[] | null = null;

async function getPhotoUrls(): Promise<string[]> {
  if (cachedUrls) return cachedUrls;
  try {
    const jsonPath = path.join(process.cwd(), "public", "wedding", "photos.json");
    const content = await readFile(jsonPath, "utf-8");
    cachedUrls = JSON.parse(content);
    return cachedUrls || [];
  } catch {
    return [];
  }
}

export async function GET(_req: Request, { params }: { params: { size: string; file: string } }) {
  const { size, file } = params;
  if (!SIZES.has(size) || !/^\d{3}\.jpg$/.test(file)) {
    return new Response("Not found", { status: 404 });
  }

  // 1. Thử đọc ảnh từ thư mục cục bộ (khi đã mount thư mục PHOTOS_DIR)
  try {
    const data = await readFile(path.join(PHOTOS_DIR, size, file));
    return new Response(data, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // 2. Fallback: Nếu ảnh chưa được tải về server (ví dụ môi trường dev),
    // chuyển hướng về Google Photos CDN tương ứng để ảnh luôn hiển thị đầy đủ
    try {
      const index = parseInt(file.slice(0, 3), 10) - 1;
      const urls = await getPhotoUrls();
      const googleUrl = urls[index];

      if (googleUrl) {
        const targetUrl =
          size === "thumb" ? `${googleUrl}=w400-h533-c` : `${googleUrl}=w2048-h2048`;
        return Response.redirect(targetUrl, 307);
      }
    } catch {
      // Bỏ qua lỗi fallback
    }

    return new Response("Not found", { status: 404 });
  }
}
