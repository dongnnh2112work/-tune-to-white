import { INNER_LIP_INDEXES, createFaceLandmarker } from "@/lib/mediapipe";
import { bboxOfMask, createCanvas } from "@/lib/geom";
import type { ModelConfig } from "@/config/models.config";

export type TeethMask = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  cx: number;
  cy: number;
  radius: number;
  source: "png" | "polygon" | "face" | "heuristic" | "procedural";
};

const cache = new Map<string, TeethMask>();

let faceLandmarkerPromise: ReturnType<typeof createFaceLandmarker> | null = null;

function faceLm() {
  if (!faceLandmarkerPromise) faceLandmarkerPromise = createFaceLandmarker();
  return faceLandmarkerPromise;
}

export function clearMaskCache() {
  cache.clear();
}

export async function resolveTeethMask(
  model: ModelConfig,
  white: HTMLImageElement,
): Promise<TeethMask> {
  const key = `${model.id}:${white.src}:${model.teethMaskSrc ?? ""}:${model.polygon ? "p" : ""}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const w = white.naturalWidth || white.width;
  const h = white.naturalHeight || white.height;

  if (model.teethMaskSrc) {
    try {
      const img = await load(model.teethMaskSrc);
      const built = fromImage(img, w, h, "png");
      if (built.radius > 8) {
        cache.set(key, built);
        return built;
      }
    } catch {
      /* fall through */
    }
  }

  if (model.polygon && model.polygon.length >= 3) {
    const built = fromPolygon(
      model.polygon.map(([x, y]) => ({ x: x * w, y: y * h })),
      w,
      h,
      white,
      "polygon",
    );
    cache.set(key, built);
    return built;
  }

  try {
    const lm = await faceLm();
    const result = lm.detect(white);
    const face = result.faceLandmarks?.[0];
    if (face && face.length > 415) {
      const poly = INNER_LIP_INDEXES.map((i) => ({
        x: face[i].x * w,
        y: face[i].y * h,
      }));
      const built = fromPolygon(poly, w, h, white, "face");
      if (built.radius > 8) {
        cache.set(key, built);
        return built;
      }
    }
  } catch {
    /* illustrations or missing wasm — heuristic next */
  }

  const built = heuristicTeeth(white, w, h);
  cache.set(key, built);
  return built;
}

function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

function fromImage(img: HTMLImageElement, w: number, h: number, source: TeethMask["source"]): TeethMask {
  const { canvas, ctx } = createCanvas(w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  // Treat any bright pixel as mask.
  for (let i = 0; i < data.data.length; i += 4) {
    const a = Math.max(data.data[i], data.data[i + 1], data.data[i + 2], data.data[i + 3]);
    data.data[i] = data.data[i + 1] = data.data[i + 2] = 255;
    data.data[i + 3] = a > 24 ? 255 : 0;
  }
  ctx.putImageData(data, 0, 0);
  return finish(canvas, data.data, w, h, source);
}

function fromPolygon(
  poly: { x: number; y: number }[],
  w: number,
  h: number,
  white: HTMLImageElement,
  source: TeethMask["source"],
): TeethMask {
  const { canvas, ctx } = createCanvas(w, h);
  ctx.beginPath();
  poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();

  const polyData = ctx.getImageData(0, 0, w, h);
  const { canvas: srcC, ctx: srcX } = createCanvas(w, h);
  srcX.drawImage(white, 0, 0, w, h);
  const src = srcX.getImageData(0, 0, w, h);

  const lums: number[] = [];
  for (let i = 0; i < polyData.data.length; i += 4) {
    if (polyData.data[i + 3] < 16) continue;
    const r = src.data[i];
    const g = src.data[i + 1];
    const b = src.data[i + 2];
    lums.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }
  lums.sort((a, b) => a - b);
  const cut = lums.length ? lums[Math.floor(lums.length * 0.42)] : 160;

  for (let i = 0; i < polyData.data.length; i += 4) {
    if (polyData.data[i + 3] < 16) continue;
    const r = src.data[i];
    const g = src.data[i + 1];
    const b = src.data[i + 2];
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const S = max ? (max - min) / max : 0;
    const keep = L >= cut && S < 0.45;
    polyData.data[i + 3] = keep ? 255 : 0;
  }
  ctx.putImageData(polyData, 0, 0);
  return finish(canvas, polyData.data, w, h, source);
}

function heuristicTeeth(white: HTMLImageElement, w: number, h: number): TeethMask {
  const { canvas, ctx } = createCanvas(w, h);
  ctx.drawImage(white, 0, 0, w, h);
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const y0 = Math.floor(h * 0.28);
  const y1 = Math.floor(h * 0.62);
  const x0 = Math.floor(w * 0.2);
  const x1 = Math.floor(w * 0.8);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      const r = src.data[i];
      const g = src.data[i + 1];
      const b = src.data[i + 2];
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const S = max ? (max - min) / max : 0;
      if (L > 170 && S < 0.28 && r > 150 && g > 140) {
        out.data[i] = out.data[i + 1] = out.data[i + 2] = 255;
        out.data[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(out, 0, 0);
  return finish(canvas, out.data, w, h, "heuristic");
}

function finish(
  canvas: HTMLCanvasElement,
  data: Uint8ClampedArray,
  w: number,
  h: number,
  source: TeethMask["source"],
): TeethMask {
  const box = bboxOfMask(data, w, h, 3);
  const radius = Math.max(box.w, box.h) * 0.55;
  return {
    canvas,
    width: w,
    height: h,
    cx: box.cx,
    cy: box.cy,
    radius: Math.max(24, radius),
    source,
  };
}

export function maskFromCanvas(canvas: HTMLCanvasElement, source: TeethMask["source"] = "procedural"): TeethMask {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return finish(canvas, data.data, canvas.width, canvas.height, source);
}

export function exportMaskPng(mask: TeethMask) {
  return mask.canvas.toDataURL("image/png");
}

export function polygonFromLandmarks(
  landmarks: { x: number; y: number }[],
  indexes = INNER_LIP_INDEXES,
) {
  return indexes.map((i) => [landmarks[i].x, landmarks[i].y] as [number, number]);
}

/** Used by mask tool overlay. */
export function drawPolygonOverlay(
  ctx: CanvasRenderingContext2D,
  poly: { x: number; y: number }[],
  color = "rgba(0,196,179,0.45)",
) {
  if (poly.length < 3) return;
  ctx.beginPath();
  poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

