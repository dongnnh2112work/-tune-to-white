import { fbm } from "@/lib/noise";
import { createCanvas } from "@/lib/geom";

/** Paint a yellow-brown blotchy stain only where the teeth mask is opaque. */
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

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const ma = maskData.data[i + 3];
      if (ma < 12) {
        img.data[i + 3] = 0;
        continue;
      }
      const n = fbm(x * 0.035, y * 0.055, 5);
      const n2 = fbm(x * 0.09 + 20, y * 0.11, 3);
      const blotch = Math.max(0, n * 1.15 - 0.22);
      const edge = Math.max(0, n2 - 0.4);
      const amount = Math.min(1, 0.55 + blotch * 0.85 + edge * 0.4);
      const r = img.data[i];
      const g = img.data[i + 1];
      const b = img.data[i + 2];
      const stainR = 196;
      const stainG = 132;
      const stainB = 28;
      img.data[i] = Math.round(r * (1 - amount * 0.35) + stainR * amount);
      img.data[i + 1] = Math.round(g * (1 - amount * 0.55) + stainG * amount * 0.55);
      img.data[i + 2] = Math.round(b * (1 - amount * 0.82) + stainB * amount * 0.25);
      img.data[i + 3] = Math.round(Math.min(255, ma * (0.62 + blotch * 0.4)));
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
