#!/usr/bin/env node
/**
 * Convert placeholder portraits to 1080×1920 PNG and build teeth masks
 * from bright, low-saturation pixels in the mouth band.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public/models");
fs.mkdirSync(outDir, { recursive: true });

const W = 1080;
const H = 1920;

const SOURCES = [
  {
    id: "model1",
    src: "/opt/cursor/artifacts/assets/model1_white.jpg",
    y0: 0.3,
    y1: 0.5,
  },
  {
    id: "model2",
    src: "/opt/cursor/artifacts/assets/model2_white.jpg",
    y0: 0.3,
    y1: 0.5,
  },
  {
    id: "model3",
    src: "/opt/cursor/artifacts/assets/model3_white.jpg",
    y0: 0.45,
    y1: 0.58,
    lumMin: 155,
    satMax: 0.32,
  },
];

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function sat(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

async function processModel({ id, src, y0, y1, lumMin = 188, satMax = 0.22 }) {
  if (!fs.existsSync(src)) {
    console.warn("Missing source", src);
    return null;
  }
  const whitePath = path.join(outDir, `${id}_white.png`);
  await sharp(src)
    .resize(W, H, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toFile(whitePath);

  const { data } = await sharp(whitePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mask = Buffer.alloc(W * H);
  const yStart = Math.floor(H * y0);
  const yEnd = Math.floor(H * y1);
  const xStart = Math.floor(W * 0.22);
  const xEnd = Math.floor(W * 0.78);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const i = (y * W + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const L = lum(r, g, b);
      const S = sat(r, g, b);
      const isTooth = L > lumMin && S < satMax && r > 155 && g > 145 && b > 120 && r - b < 80;
      if (isTooth) mask[y * W + x] = 255;
    }
  }

  // Dilate then erode (close) to fill gaps between teeth.
  const closed = Buffer.from(mask);
  const rad = 2;
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      let hit = 0;
      for (let dy = -rad; dy <= rad && !hit; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          if (mask[yy * W + xx]) {
            hit = 1;
            break;
          }
        }
      }
      closed[y * W + x] = hit ? 255 : 0;
    }
  }
  const eroded = Buffer.alloc(W * H);
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      let keep = 1;
      for (let dy = -1; dy <= 1 && keep; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          if (!closed[yy * W + xx]) {
            keep = 0;
            break;
          }
        }
      }
      eroded[y * W + x] = keep ? 255 : 0;
    }
  }

  // Keep largest blob.
  const seen = new Uint8Array(W * H);
  let best = [];
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const idx = y * W + x;
      if (!eroded[idx] || seen[idx]) continue;
      const stack = [idx];
      const blob = [];
      seen[idx] = 1;
      while (stack.length) {
        const p = stack.pop();
        blob.push(p);
        const px = p % W;
        const py = (p / W) | 0;
        const nbs = [p - 1, p + 1, p - W, p + W];
        for (const n of nbs) {
          if (n < 0 || n >= W * H || seen[n] || !eroded[n]) continue;
          const nx = n % W;
          const ny = (n / W) | 0;
          if (Math.abs(nx - px) + Math.abs(ny - py) !== 1) continue;
          seen[n] = 1;
          stack.push(n);
        }
      }
      if (blob.length > best.length) best = blob;
    }
  }

  const final = Buffer.alloc(W * H * 4);
  let minX = W;
  let minY = H;
  let maxX = 0;
  let maxY = 0;
  for (const p of best) {
    const x = p % W;
    const y = (p / W) | 0;
    const i = p * 4;
    final[i] = 255;
    final[i + 1] = 255;
    final[i + 2] = 255;
    final[i + 3] = 255;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const maskPath = path.join(outDir, `${id}_teeth_mask.png`);
  await sharp(final, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(maskPath);

  const cx = (minX + maxX) / 2 / W;
  const cy = (minY + maxY) / 2 / H;
  const bw = (maxX - minX) / W;
  const bh = (maxY - minY) / H;
  const scale = Math.min(2.35, Math.max(1.55, 0.52 / Math.max(bw, 0.18)));

  console.log(
    `${id}: teeth bbox n=${best.length} x=${minX}-${maxX} y=${minY}-${maxY} zoom={cx:${cx.toFixed(3)}, cy:${cy.toFixed(3)}, scale:${scale.toFixed(2)}}`,
  );
  return { id, minX, minY, maxX, maxY, cx, cy, scale, count: best.length };
}

const results = [];
for (const spec of SOURCES) {
  results.push(await processModel(spec));
}
fs.writeFileSync(path.join(outDir, "_mask_meta.json"), JSON.stringify(results, null, 2));
console.log("Assets ready.");
