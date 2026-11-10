import { fbm } from "@/lib/noise";
import { bboxOfMask, clamp, createCanvas, lerp } from "@/lib/geom";
import type { StainLook } from "@/game/wipeAsset";

type ImageLike = HTMLImageElement | HTMLCanvasElement;

function srcSize(src: ImageLike) {
  if (src instanceof HTMLCanvasElement) return { w: src.width, h: src.height };
  return { w: src.naturalWidth || src.width, h: src.naturalHeight || src.height };
}

/**
 * Plaque over the teeth mask, baked at full intensity.
 * Draw-time `stainStrength` (0–1) fades this layer live.
 *  - enamel: yellow-ivory → tan on real teeth (not cartoon orange)
 *  - marble: beige/ivory-yellow with dark veins, kiosk-visible from 2–3 m
 */
export function generateStainLayer(
  white: ImageLike,
  mask: HTMLCanvasElement,
  yellowSrc?: ImageLike | null,
  look: StainLook = "enamel",
) {
  const { w, h } = srcSize(white);
  const { canvas, ctx } = createCanvas(w, h);

  if (yellowSrc) {
    ctx.drawImage(yellowSrc, 0, 0, w, h);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mask, 0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    return canvas;
  }

  ctx.clearRect(0, 0, w, h);
  const { canvas: mc, ctx: mx } = createCanvas(w, h);
  mx.drawImage(mask, 0, 0, w, h);
  const maskData = mx.getImageData(0, 0, w, h);
  ctx.drawImage(white, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const box = bboxOfMask(maskData.data, w, h);
  const spanY = Math.max(1, box.maxY - box.minY);
  const spanX = Math.max(1, box.maxX - box.minX);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const ma = maskData.data[i + 3];
      if (ma < 12) {
        img.data[i + 3] = 0;
        continue;
      }

      const gy = clamp((y - box.minY) / spanY, 0, 1);
      const gum = Math.pow(1 - gy, 1.45);
      const edgeX = Math.min((x - box.minX) / spanX, (box.maxX - x) / spanX);
      const lateral = Math.pow(1 - clamp(edgeX * 3.2, 0, 1), 1.6);
      const blotch = Math.max(0, fbm(x * 0.026, y * 0.04, 5) * 1.2 - 0.16);
      const mottling = (fbm(x * 0.11 + 17, y * 0.14, 4) - 0.48) * 0.5;
      const grain = (fbm(x * 0.28, y * 0.22, 2) - 0.5) * 0.18;
      const grout = Math.max(0, fbm(x * 0.31, y * 0.028, 3) - 0.58);

      const tr = img.data[i];
      const tg = img.data[i + 1];
      const tb = img.data[i + 2];

      if (look === "marble") {
        const n1 = fbm(x * 0.014, y * 0.022, 5);
        const n2 = fbm(x * 0.04 + 9, y * 0.07, 4);
        const ridge = 1 - Math.abs(n1 - 0.5) * 2;
        const vein = Math.pow(clamp(ridge * 1.35 - 0.22 + n2 * 0.18, 0, 1), 1.25);
        const blot = clamp(blotch * 0.7 + mottling * 0.35, 0, 1);
        const ivoryR = 238,
          ivoryG = 214,
          ivoryB = 148;
        const tanR = 204,
          tanG = 168,
          tanB = 92;
        const veinR = 168,
          veinG = 128,
          veinB = 58;
        const tMix = clamp(blot * 0.45 + vein * 0.55, 0, 1);
        const sR = lerp(ivoryR, lerp(tanR, veinR, vein), tMix);
        const sG = lerp(ivoryG, lerp(tanG, veinG, vein), tMix);
        const sB = lerp(ivoryB, lerp(tanB, veinB, vein), tMix);
        const k = 0.78 + vein * 0.16 + blot * 0.06;
        img.data[i] = Math.round(tr * (1 - k) + sR * k + grain * 6);
        img.data[i + 1] = Math.round(tg * (1 - k) + sG * k + grain * 4);
        img.data[i + 2] = Math.round(tb * (1 - k) + sB * k);
        img.data[i + 3] = Math.round(Math.min(255, ma * (0.9 + vein * 0.08)));
        continue;
      }

      let gap = 0;
      let cover = 0;
      let samples = 0;
      for (let dy = -6; dy <= 6; dy += 3) {
        for (let dx = -6; dx <= 6; dx += 3) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          cover += maskData.data[(yy * w + xx) * 4 + 3];
          samples++;
        }
      }
      const local = samples ? cover / (samples * 255) : 0;
      gap = Math.pow(1 - local, 1.15);

      const amount = clamp(0.42 + blotch * 0.4 + gum * 0.32 + gap * 0.28 + grout * 0.5 + mottling, 0.32, 0.95);
      const brown = clamp(gum * 0.65 + gap * 0.45 + grout * 0.65 + lateral * 0.22 + blotch * 0.2, 0, 1);
      const mulR = lerp(0.96, 0.74, brown);
      const mulG = lerp(0.9, 0.66, brown);
      const mulB = lerp(0.62, 0.32, brown);
      const k = 0.52 + amount * 0.38;
      img.data[i] = Math.round(tr * (1 - k) + tr * mulR * k + grain * 8);
      img.data[i + 1] = Math.round(tg * (1 - k) + tg * mulG * k + grain * 4);
      img.data[i + 2] = Math.round(tb * (1 - k) + tb * mulB * k);
      img.data[i + 3] = Math.round(Math.min(255, ma * (0.62 + amount * 0.34)));
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}
