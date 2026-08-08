// Detects the tiled "ozvapeshops.com" watermark overlay.
//
// The mark is light-grey text repeated on a regular horizontal grid across
// the whole frame, including the top/bottom strips where product art rarely
// reaches. Clean manufacturer images have either pure-white or solidly
// coloured strips there. So: scan the top and bottom bands for mid-grey,
// near-neutral pixels that differ from the band's dominant colour, and
// confirm the hits repeat at a consistent horizontal period.
//
// Usage: node scripts/watermark-detect.mjs <file>...   (prints score per file)

import sharp from "sharp";

export async function watermarkScore(input) {
  const img = sharp(input).removeAlpha();
  const meta = await img.metadata();
  const W = Math.min(meta.width ?? 0, 900);
  const { data, info } = await img
    .resize({ width: W })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const bandH = Math.max(8, Math.round(h * 0.09));

  // Two independent bands (top and bottom). A tiled watermark paints the
  // same glyph row in both; product art / textures do not.
  const profile = (y0, y1) => {
    const cols = new Float64Array(w);
    const lums = [];
    let ink = 0;
    let seen = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 3;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        seen++;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        // true grey ink: near-zero chroma, and lighter-grey than product art
        if (max - min <= 8 && min >= 190 && max <= 243) {
          cols[x] += 1;
          ink++;
          lums.push((r + g + b) / 3);
        }
      }
    }
    return { cols, inkRatio: ink / Math.max(1, seen), lums };
  };

  const top = profile(0, bandH);
  const bot = profile(h - bandH, h);
  const inkRatio = (top.inkRatio + bot.inkRatio) / 2;
  if (inkRatio < 0.004) return { score: 0, inkRatio, period: 0, peak: 0 };

  // Watermark ink is a single flat grey — luminance spread stays tight.
  const lums = [...top.lums, ...bot.lums];
  const lm = lums.reduce((a, b) => a + b, 0) / lums.length;
  const lsd = Math.sqrt(lums.reduce((a, v) => a + (v - lm) ** 2, 0) / lums.length);
  if (lsd > 13) return { score: 0, inkRatio, period: 0, peak: 0, lsd };

  const autocorr = (cols) => {
    const mean = cols.reduce((a, b) => a + b, 0) / w;
    const c = Array.from(cols, (v) => v - mean);
    const denom = c.reduce((a, v) => a + v * v, 0) || 1;
    let peak = 0, lag0 = 0;
    for (let lag = Math.round(w * 0.06); lag <= Math.round(w * 0.55); lag++) {
      let s = 0;
      for (let x = 0; x + lag < w; x++) s += c[x] * c[x + lag];
      const norm = s / denom;
      if (norm > peak) { peak = norm; lag0 = lag; }
    }
    return { peak, lag: lag0 };
  };

  const a = autocorr(top.cols);
  const b = autocorr(bot.cols);
  // Both bands must repeat, at (near) the same period
  const sameperiod =
    a.lag && b.lag && Math.abs(a.lag - b.lag) / Math.max(a.lag, b.lag) < 0.12;
  const peak = Math.min(a.peak, b.peak);
  if (!sameperiod || peak <= 0) {
    return { score: 0, inkRatio, period: a.lag, peak, lsd };
  }

  const score = Math.min(1, inkRatio * 12) * peak;
  return { score, inkRatio, period: a.lag, peak, lsd };
}

export const WATERMARK_THRESHOLD = 0.12;

if (process.argv[2]) {
  for (const f of process.argv.slice(2)) {
    try {
      const r = await watermarkScore(f);
      console.log(
        `${r.score >= WATERMARK_THRESHOLD ? "WATERMARK" : "clean    "} ` +
          `score=${r.score.toFixed(3)} ink=${(r.inkRatio * 100).toFixed(2)}% ` +
          `peak=${(r.peak ?? 0).toFixed(2)} period=${r.period}  ${f.split(/[\\/]/).pop()}`
      );
    } catch (e) {
      console.log(`ERROR ${f}: ${e.message}`);
    }
  }
}
