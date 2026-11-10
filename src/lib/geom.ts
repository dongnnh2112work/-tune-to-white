export type Vec = { x: number; y: number };

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function dist(a: Vec, b: Vec) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function pointInPolygon(x: number, y: number, poly: Vec[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

export function polygonCentroid(poly: Vec[]) {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  const n = Math.max(1, poly.length);
  return { x: x / n, y: y / n };
}

export function bboxOfMask(data: Uint8ClampedArray, w: number, h: number, channel = 3) {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let count = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + channel];
      if (a > 16) {
        count++;
        sx += x;
        sy += y;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!count) return { minX: 0, minY: 0, maxX: w, maxY: h, cx: w / 2, cy: h / 2, w, h, count: 0 };
  return {
    minX,
    minY,
    maxX,
    maxY,
    cx: sx / count,
    cy: sy / count,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
    count,
  };
}

export function createCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  return { canvas: c, ctx };
}
