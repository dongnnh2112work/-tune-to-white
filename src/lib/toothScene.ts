import { STAGE } from "@/theme/theme";
import { createCanvas } from "@/lib/geom";
import { loadImage } from "@/lib/assets";
import { teethAssets, type ToothLayoutId } from "@/config/teeth.config";

export type ToothSprite = {
  x: number;
  y: number;
  /** Drawn width of the 1024×1024 tooth PNG, in stage pixels. */
  size: number;
  rotate: number;
};

const LAYOUTS: Record<ToothLayoutId, ToothSprite[]> = {
  solo: [{ x: 540, y: 1040, size: 920, rotate: -3 }],
  pair: [
    { x: 355, y: 980, size: 520, rotate: -11 },
    { x: 740, y: 1095, size: 520, rotate: 13 },
  ],
  cluster: [
    { x: 540, y: 900, size: 480, rotate: -2 },
    { x: 355, y: 1188, size: 390, rotate: -16 },
    { x: 740, y: 1172, size: 390, rotate: 14 },
  ],
};

let toothImg: HTMLImageElement | null = null;
let bgImg: HTMLImageElement | null = null;

async function assets() {
  if (!toothImg) toothImg = await loadImage(teethAssets.toothWhiteSrc);
  if (!bgImg) bgImg = await loadImage(teethAssets.backgroundSrc);
  return { tooth: toothImg, bg: bgImg };
}

function drawSprite(ctx: CanvasRenderingContext2D, img: HTMLImageElement, t: ToothSprite) {
  const w = t.size;
  const h = w * ((img.naturalHeight || img.height) / (img.naturalWidth || img.width || 1));
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate((t.rotate * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawShadow(ctx: CanvasRenderingContext2D, t: ToothSprite) {
  ctx.save();
  ctx.translate(t.x, t.y + t.size * 0.18);
  ctx.rotate((t.rotate * Math.PI) / 180);
  ctx.scale(1, 0.38);
  const r = t.size * 0.34;
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
  g.addColorStop(0, "rgba(0,0,0,0.45)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Alpha-only mask: white RGB, tooth PNG alpha. Stain/clean % stay inside it. */
function bakeAlphaMask(src: HTMLCanvasElement) {
  const { canvas, ctx } = createCanvas(src.width, src.height);
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, src.width, src.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    d[i] = 255;
    d[i + 1] = 255;
    d[i + 2] = 255;
    d[i + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export async function renderToothScene(layout: ToothLayoutId) {
  const { tooth, bg } = await assets();
  const { canvas, ctx } = createCanvas(STAGE.width, STAGE.height);
  const { canvas: layer, ctx: lx } = createCanvas(STAGE.width, STAGE.height);
  ctx.drawImage(bg, 0, 0, STAGE.width, STAGE.height);
  const sprites = LAYOUTS[layout];
  for (const t of sprites) drawShadow(ctx, t);
  for (const t of sprites) {
    drawSprite(ctx, tooth, t);
    drawSprite(lx, tooth, t);
  }
  return { white: canvas, mask: bakeAlphaMask(layer) };
}
