import { STAGE } from "@/theme/theme";
import { createCanvas } from "@/lib/geom";
import { fbm } from "@/lib/noise";
import type { ToothLayoutId } from "@/config/teeth.config";

export type ToothSprite = {
  x: number;
  y: number;
  size: number;
  rotate: number;
};

const LAYOUTS: Record<ToothLayoutId, ToothSprite[]> = {
  solo: [{ x: 540, y: 1024, size: 252, rotate: -4 }],
  pair: [
    { x: 390, y: 1008, size: 188, rotate: -10 },
    { x: 700, y: 1092, size: 188, rotate: 12 },
  ],
  cluster: [
    { x: 540, y: 920, size: 176, rotate: -2 },
    { x: 368, y: 1168, size: 148, rotate: -15 },
    { x: 728, y: 1152, size: 148, rotate: 13 },
  ],
};

/** Shield-like molar icon: flatter crown, waist, two distinct roots. */
export function traceTooth(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.moveTo(cx, cy - s * 1.1);
  ctx.bezierCurveTo(cx - s * 0.5, cy - s * 1.2, cx - s * 0.98, cy - s * 0.92, cx - s * 1.02, cy - s * 0.38);
  ctx.bezierCurveTo(cx - s * 1.05, cy + s * 0.02, cx - s * 0.82, cy + s * 0.18, cx - s * 0.72, cy + s * 0.36);
  ctx.bezierCurveTo(cx - s * 0.78, cy + s * 0.72, cx - s * 0.7, cy + s * 1.08, cx - s * 0.42, cy + s * 1.22);
  ctx.bezierCurveTo(cx - s * 0.22, cy + s * 1.32, cx - s * 0.1, cy + s * 1.14, cx - s * 0.08, cy + s * 0.92);
  ctx.bezierCurveTo(cx - s * 0.04, cy + s * 0.72, cx + s * 0.04, cy + s * 0.72, cx + s * 0.08, cy + s * 0.92);
  ctx.bezierCurveTo(cx + s * 0.1, cy + s * 1.14, cx + s * 0.22, cy + s * 1.32, cx + s * 0.42, cy + s * 1.22);
  ctx.bezierCurveTo(cx + s * 0.7, cy + s * 1.08, cx + s * 0.78, cy + s * 0.72, cx + s * 0.72, cy + s * 0.36);
  ctx.bezierCurveTo(cx + s * 0.82, cy + s * 0.18, cx + s * 1.05, cy + s * 0.02, cx + s * 1.02, cy - s * 0.38);
  ctx.bezierCurveTo(cx + s * 0.98, cy - s * 0.92, cx + s * 0.5, cy - s * 1.2, cx, cy - s * 1.1);
  ctx.closePath();
}

function fabricTile() {
  const { canvas, ctx } = createCanvas(192, 192);
  const img = ctx.createImageData(192, 192);
  for (let y = 0; y < 192; y++) {
    for (let x = 0; x < 192; x++) {
      const n = fbm(x * 0.07, y * 0.07, 4);
      const weave = 0.5 + 0.5 * Math.sin(x * 0.85) * Math.sin(y * 0.85);
      const v = 16 + n * 20 + weave * 8;
      const i = (y * 192 + x) * 4;
      img.data[i] = v + 2;
      img.data[i + 1] = v;
      img.data[i + 2] = v + 12;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function paintBackdrop(ctx: CanvasRenderingContext2D) {
  const { width: W, height: H } = STAGE;
  ctx.fillStyle = "#0b0b12";
  ctx.fillRect(0, 0, W, H);
  const tile = fabricTile();
  const pat = ctx.createPattern(tile, "repeat");
  if (pat) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  const dim = ctx.createRadialGradient(W / 2, H * 0.48, 80, W / 2, H * 0.5, H * 0.72);
  dim.addColorStop(0, "rgba(8,8,14,0)");
  dim.addColorStop(1, "rgba(4,4,8,0.72)");
  ctx.fillStyle = dim;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const blue = ctx.createRadialGradient(160, 420, 40, 200, 520, 780);
  blue.addColorStop(0, "rgba(110, 190, 255, 0.55)");
  blue.addColorStop(0.35, "rgba(50, 120, 255, 0.22)");
  blue.addColorStop(1, "rgba(20, 40, 80, 0)");
  ctx.fillStyle = blue;
  ctx.fillRect(0, 0, W, H);

  const purple = ctx.createRadialGradient(940, 500, 40, 900, 620, 760);
  purple.addColorStop(0, "rgba(190, 110, 255, 0.5)");
  purple.addColorStop(0.38, "rgba(130, 50, 220, 0.2)");
  purple.addColorStop(1, "rgba(40, 10, 70, 0)");
  ctx.fillStyle = purple;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Close Up brand hairline — red + teal, does not copy training art
  const bar = ctx.createLinearGradient(0, 0, W, 0);
  bar.addColorStop(0, "#00C4B3");
  bar.addColorStop(0.5, "#E10600");
  bar.addColorStop(1, "#2EE6D6");
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, W, 8);
}

function drawContactShadow(ctx: CanvasRenderingContext2D, t: ToothSprite) {
  ctx.save();
  ctx.translate(t.x, t.y + t.size * 0.55);
  ctx.rotate((t.rotate * Math.PI) / 180);
  ctx.scale(1, 0.32);
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, t.size * 0.95);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, t.size * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function fillPearl(ctx: CanvasRenderingContext2D, t: ToothSprite) {
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate((t.rotate * Math.PI) / 180);
  ctx.beginPath();
  traceTooth(ctx, 0, 0, t.size);
  ctx.clip();

  const body = ctx.createLinearGradient(0, -t.size * 1.2, 0, t.size * 1.25);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.22, "#f4f1ea");
  body.addColorStop(0.55, "#ebe6dc");
  body.addColorStop(0.82, "#d9d3c8");
  body.addColorStop(1, "#c9c2b6");
  ctx.fillStyle = body;
  ctx.fillRect(-t.size * 1.4, -t.size * 1.4, t.size * 2.8, t.size * 2.8);

  const { canvas: vein, ctx: vx } = createCanvas(Math.ceil(t.size * 2.6), Math.ceil(t.size * 2.8));
  const vw = vein.width;
  const vh = vein.height;
  const data = vx.createImageData(vw, vh);
  for (let y = 0; y < vh; y++) {
    for (let x = 0; x < vw; x++) {
      const n = fbm(x * 0.035 + t.x * 0.01, y * 0.05 + t.y * 0.01, 4);
      const v = Math.abs(n - 0.5) * 2;
      const a = v > 0.62 ? (v - 0.62) * 90 : 8 + n * 12;
      const i = (y * vw + x) * 4;
      data.data[i] = 210;
      data.data[i + 1] = 205;
      data.data[i + 2] = 198;
      data.data[i + 3] = a;
    }
  }
  vx.putImageData(data, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.28;
  ctx.drawImage(vein, -vw / 2, -vh / 2);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  const occ = ctx.createLinearGradient(0, t.size * 0.15, 0, t.size * 1.2);
  occ.addColorStop(0, "rgba(90,80,70,0)");
  occ.addColorStop(1, "rgba(70,60,52,0.28)");
  ctx.fillStyle = occ;
  ctx.fillRect(-t.size * 1.4, 0, t.size * 2.8, t.size * 1.4);

  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "rgba(120,110,100,0.16)";
  ctx.lineWidth = Math.max(2, t.size * 0.02);
  ctx.beginPath();
  ctx.moveTo(0, -t.size * 0.15);
  ctx.quadraticCurveTo(-t.size * 0.02, t.size * 0.35, 0, t.size * 0.7);
  ctx.stroke();
  ctx.globalCompositeOperation = "screen";
  const spec = ctx.createRadialGradient(-t.size * 0.28, -t.size * 0.55, 4, -t.size * 0.18, -t.size * 0.4, t.size * 0.7);
  spec.addColorStop(0, "rgba(255,255,255,0.95)");
  spec.addColorStop(0.25, "rgba(210,230,255,0.45)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spec;
  ctx.beginPath();
  ctx.ellipse(-t.size * 0.2, -t.size * 0.52, t.size * 0.32, t.size * 0.22, -0.35, 0, Math.PI * 2);
  ctx.fill();
  const spec2 = ctx.createRadialGradient(t.size * 0.22, -t.size * 0.15, 2, t.size * 0.18, -t.size * 0.05, t.size * 0.35);
  spec2.addColorStop(0, "rgba(230,210,255,0.35)");
  spec2.addColorStop(1, "rgba(230,210,255,0)");
  ctx.fillStyle = spec2;
  ctx.beginPath();
  ctx.ellipse(t.size * 0.22, -t.size * 0.12, t.size * 0.18, t.size * 0.14, 0.4, 0, Math.PI * 2);
  ctx.fill();

  const rimL = ctx.createLinearGradient(-t.size, 0, 0, 0);
  rimL.addColorStop(0, "rgba(90,180,255,0.55)");
  rimL.addColorStop(1, "rgba(90,180,255,0)");
  ctx.fillStyle = rimL;
  ctx.fillRect(-t.size * 1.2, -t.size * 1.3, t.size * 0.7, t.size * 2.6);

  const rimR = ctx.createLinearGradient(t.size, 0, 0, 0);
  rimR.addColorStop(0, "rgba(190,110,255,0.48)");
  rimR.addColorStop(1, "rgba(190,110,255,0)");
  ctx.fillStyle = rimR;
  ctx.fillRect(t.size * 0.5, -t.size * 1.3, t.size * 0.7, t.size * 2.6);

  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate((t.rotate * Math.PI) / 180);
  ctx.beginPath();
  traceTooth(ctx, 0, 0, t.size);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = Math.max(2, t.size * 0.018);
  ctx.stroke();
  ctx.restore();
}

function drawMask(ctx: CanvasRenderingContext2D, t: ToothSprite) {
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate((t.rotate * Math.PI) / 180);
  ctx.beginPath();
  traceTooth(ctx, 0, 0, t.size);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
}

export function renderToothScene(layout: ToothLayoutId) {
  const { canvas, ctx } = createCanvas(STAGE.width, STAGE.height);
  const { canvas: mask, ctx: mx } = createCanvas(STAGE.width, STAGE.height);
  paintBackdrop(ctx);
  const sprites = LAYOUTS[layout];
  for (const t of sprites) drawContactShadow(ctx, t);
  for (const t of sprites) {
    fillPearl(ctx, t);
    drawMask(mx, t);
  }
  return { white: canvas, mask };
}
