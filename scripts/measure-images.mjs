// Measures pixel dimensions of every downloaded catalog image and writes
// catalog/image-meta.json: { "<filename>": [width, height] }.
// The storefront uses this to feature only high-resolution listings and to
// avoid rendering images above their native size.
//
// Usage: node scripts/measure-images.mjs

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const IMG_DIR = path.resolve("catalog", "images");

function dims(buf) {
  // PNG
  if (buf.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") {
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  }
  // JPEG — scan for SOF marker
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
    return null;
  }
  // WebP
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
  return null;
}

const meta = {};
let failed = 0;
for (const file of readdirSync(IMG_DIR)) {
  const d = dims(readFileSync(path.join(IMG_DIR, file)));
  if (d) meta[file] = d;
  else failed++;
}
writeFileSync(path.resolve("catalog", "image-meta.json"), JSON.stringify(meta));
console.log(`Measured ${Object.keys(meta).length} images (${failed} unreadable).`);
