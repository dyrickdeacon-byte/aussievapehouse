import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { getProducts } from "@/lib/catalog";

// Serves product images from catalog/images/ (838MB, git-ignored, scraped
// locally). The supplier's server rate-limits hotlinking, so local serving
// is the reliable path. If a file is missing (e.g. on a fresh deploy before
// the CDN move), fall back to redirecting to the original remote URL.

const IMG_DIR = path.join(process.cwd(), "catalog", "images");

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

let remoteBySlugFile: Map<string, string> | null = null;
function remoteFor(name: string): string | null {
  if (!remoteBySlugFile) {
    remoteBySlugFile = new Map();
    for (const p of getProducts()) {
      for (const im of p.images) {
        remoteBySlugFile.set(path.basename(im.local), im.remote);
      }
    }
  }
  return remoteBySlugFile.get(name) ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  // slug-based filenames only — reject anything path-like
  if (!/^[\w.-]+$/.test(name) || name.includes("..")) {
    return new Response("Bad request", { status: 400 });
  }

  const file = path.join(IMG_DIR, name);
  if (!existsSync(file)) {
    const remote = remoteFor(name);
    if (remote) return Response.redirect(remote, 302);
    return new Response("Not found", { status: 404 });
  }

  const size = statSync(file).size;
  const type = MIME[path.extname(name).toLowerCase()] ?? "application/octet-stream";
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
