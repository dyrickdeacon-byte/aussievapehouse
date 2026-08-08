// Product image uploads from the admin dashboard.
//  - Supabase Storage bucket "product-images" when configured (Vercel).
//  - public/uploads/ locally, so dev works with no cloud setup.
// Returns a public URL the storefront can render directly.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BUCKET = "product-images";

const useSupabase = () =>
  !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

export async function uploadProductImage(file: File): Promise<string> {
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) throw new Error(`Unsupported image type: ${file.type || "unknown"}`);
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Image too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB)`);
  }

  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (useSupabase()) {
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { error } = await db.storage
      .from(BUCKET)
      .upload(name, bytes, { contentType: file.type, upsert: false });
    if (error) {
      throw new Error(
        `Upload failed: ${error.message} — is the public "${BUCKET}" bucket created in Supabase Storage?`
      );
    }
    return db.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), bytes);
  return `/uploads/${name}`;
}

// Rough dimensions so custom products play by the same quality rules as
// the scraped catalog (hero needs >=700px). PNG/JPEG/WebP headers only.
export function imageDimensions(buf: Buffer): [number, number] {
  if (buf.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") {
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 8) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  if (
    buf.subarray(0, 4).toString() === "RIFF" &&
    buf.subarray(8, 12).toString() === "WEBP"
  ) {
    const t = buf.subarray(12, 16).toString();
    if (t === "VP8 ") return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
    if (t === "VP8L") {
      const n = buf.readUInt32LE(21);
      return [(n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1];
    }
    if (t === "VP8X") return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  }
  return [1000, 1000]; // unknown — assume usable
}
