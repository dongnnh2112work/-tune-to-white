import { fbm } from "@/lib/noise";
import { bboxOfMask, clamp, createCanvas, lerp } from "@/lib/geom";
import type { StainLook } from "@/game/wipeAsset";

type ImageLike = HTMLImageElement | HTMLCanvasElement;

function srcSize(src: ImageLike) {
  if (src instanceof HTMLCanvasElement) return { w: src.width, h: src.height };
  return { w: src.naturalWidth || src.width, h: src.naturalHeight || src.height };
}

/**
 * Plaque over the teeth mask.
 *  - enamel: yellow-ivory → tan on real teeth (face mode)
 *  - marble: beige/ivory veining on glossy tooth icons (teeth-only mode)
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
      const gum = look === "marble" ? 0.15 + (1 - gy) * 0.2 : Math.pow(1 - gy, 1.45);
      const edgeX = Math.min((x - box.minX) / spanX, (box.maxX - x) / spanX);
      const lateral = Math.pow(1 - clamp(edgeX * 3.2, 0, 1), 1.6);

      const blotch = Math.max(0, fbm(x * 0.026, y * 0.04, 5) * 1.2 - 0.16);
      const mottling = (fbm(x * 0.11 + 17, y * 0.14, 4) - 0.48) * 0.5;
      const grain = (fbm(x * 0.28, y * 0.22, 2) - 0.5) * 0.18;
      const grout = Math.max(0, fbm(x * 0.31, y * 0.028, 3) - 0.58);
      const marbleVein = look === "marble" ? Math.abs(fbm(x * 0.018, y * 0.03, 5) - 0.5) * 2 : 0;

      let gap = 0;
      if (look !== "marble") {
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
      }

      const amount = clamp(
        look === "marble"
          ? 0.55 + blotch * 0.28 + marbleVein * 0.4 + grout * 0.2 + mottling
          : 0.34 + blotch * 0.38 + gum * 0.34 + gap * 0.28 + grout * 0.55 + mottling,
        look === "marble" ? 0.42 : 0.22,
        0.94,
      );
      const brown = clamp(
        look === "marble"
          ? 0.22 + marbleVein * 0.55 + blotch * 0.2
          : gum * 0.72 + gap * 0.5 + grout * 0.7 + lateral * 0.25 + blotch * 0.18,
        0,
        1,
      );

      const mulR = lerp(look === "marble" ? 0.98 : 0.97, look === "marble" ? 0.78 : 0.68, brown);
      const mulG = lerp(look === "marble" ? 0.92 : 0.9, look === "marble" ? 0.7 : 0.52, brown);
      const mulB = lerp(look === "marble" ? 0.7 : 0.64, look === "marble" ? 0.42 : 0.28, brown);

      const tr = img.data[i];
      const tg = img.data[i + 1];
      const tb = img.data[i + 2];
      const k = look === "marble" ? 0.48 + amount * 0.22 : 0.42 + amount * 0.4;
      img.data[i] = Math.round(tr * (1 - k) + tr * mulR * k + grain * 8);
      img.data[i + 1] = Math.round(tg * (1 - k) + tg * mulG * k + grain * 4);
      img.data[i + 2] = Math.round(tb * (1 - k) + tb * mulB * k);
      img.data[i + 3] = Math.round(Math.min(255, ma * (look === "marble" ? 0.55 + amount * 0.28 : 0.48 + amount * 0.4)));
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
