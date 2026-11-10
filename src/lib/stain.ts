import { fbm } from "@/lib/noise";
import { bboxOfMask, clamp, createCanvas, lerp } from "@/lib/geom";

/**
 * Realistic plaque over the teeth mask: yellow-ivory → tan, slightly
 * translucent so enamel texture shows, darker near the gum line and
 * interdental gaps. Intentionally not cartoon orange.
 */
export function generateStainLayer(
  white: HTMLImageElement,
  mask: HTMLCanvasElement,
  yellowSrc?: HTMLImageElement | null,
) {
  const w = white.naturalWidth || white.width;
  const h = white.naturalHeight || white.height;
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
      const gap = Math.pow(1 - local, 1.15);

      const amount = clamp(0.34 + blotch * 0.38 + gum * 0.34 + gap * 0.28 + grout * 0.55 + mottling, 0.22, 0.9);
      const brown = clamp(gum * 0.72 + gap * 0.5 + grout * 0.7 + lateral * 0.25 + blotch * 0.18, 0, 1);

      const mulR = lerp(0.97, 0.68, brown);
      const mulG = lerp(0.9, 0.52, brown);
      const mulB = lerp(0.64, 0.28, brown);

      const tr = img.data[i];
      const tg = img.data[i + 1];
      const tb = img.data[i + 2];
      const k = 0.42 + amount * 0.4;
      img.data[i] = Math.round(tr * (1 - k) + tr * mulR * k + grain * 8);
      img.data[i + 1] = Math.round(tg * (1 - k) + tg * mulG * k + grain * 4);
      img.data[i + 2] = Math.round(tb * (1 - k) + tb * mulB * k);
      img.data[i + 3] = Math.round(Math.min(255, ma * (0.48 + amount * 0.4)));
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
