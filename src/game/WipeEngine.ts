import { STAGE } from "@/theme/theme";
import { gameConfig } from "@/config/game.config";
import type { ModelConfig } from "@/config/models.config";
import type { BakedScene, WipeAsset } from "@/game/wipeAsset";
import { loadImage } from "@/lib/assets";
import { generateStainLayer } from "@/lib/stain";
import { maskFromCanvas, resolveTeethMask, type TeethMask } from "@/lib/teethMask";
import { createCanvas } from "@/lib/geom";
import { ParticleSystem } from "@/lib/particles";

type ImageLike = HTMLImageElement | HTMLCanvasElement;

function srcSize(src: ImageLike) {
  if (src instanceof HTMLCanvasElement) return { w: src.width, h: src.height };
  return { w: src.naturalWidth || src.width, h: src.naturalHeight || src.height };
}

export type ViewTransform = {
  scale: number;
  ox: number;
  oy: number;
};

export class WipeEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  readonly particles = new ParticleSystem();

  private white: ImageLike | null = null;
  private yellow: ImageLike | null = null;
  private drawBase = false;
  private magnetRadius = gameConfig.play.magnetRadius;
  private stain: HTMLCanvasElement | null = null;
  private mask: TeethMask | null = null;
  private erase: HTMLCanvasElement | null = null;
  private eraseCtx: CanvasRenderingContext2D | null = null;
  private sample: HTMLCanvasElement | null = null;
  private sampleCtx: CanvasRenderingContext2D | null = null;
  private view: ViewTransform = { scale: 1, ox: 0, oy: 0 };
  private lastClean = 0;
  private lastSampleAt = 0;
  private autoClearT = 0;
  private shining = 0;
  private brushRadius = gameConfig.play.brushRadius;
  private threshold = gameConfig.play.cleanThreshold;
  private model: WipeAsset | null = null;
  private lastWipeX = 0;
  private lastWipeY = 0;

  constructor(canvas?: HTMLCanvasElement) {
    const made = createCanvas(STAGE.width, STAGE.height);
    this.canvas = made.canvas;
    this.ctx = made.ctx;
    if (canvas) this.attach(canvas);
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
  }

  attach(canvas: HTMLCanvasElement) {
    if (canvas.width !== STAGE.width) canvas.width = STAGE.width;
    if (canvas.height !== STAGE.height) canvas.height = STAGE.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
  }

  get clean() {
    return this.lastClean;
  }
  get teeth() {
    return this.mask;
  }
  get transform() {
    return this.view;
  }
  get currentModel() {
    return this.model;
  }

  setBrush(radius: number) {
    this.brushRadius = radius;
  }
  setThreshold(t: number) {
    this.threshold = t;
  }

  imageToStage(ix: number, iy: number) {
    return { x: ix * this.view.scale + this.view.ox, y: iy * this.view.scale + this.view.oy };
  }

  stageToImage(sx: number, sy: number) {
    return { x: (sx - this.view.ox) / this.view.scale, y: (sy - this.view.oy) / this.view.scale };
  }

  teethCentroidStage() {
    if (!this.mask) return { x: STAGE.width / 2, y: STAGE.height * 0.42, radius: 80 };
    const p = this.imageToStage(this.mask.cx, this.mask.cy);
    return { x: p.x, y: p.y, radius: this.mask.radius * this.view.scale };
  }

  magnetize(sx: number, sy: number) {
    const c = this.teethCentroidStage();
    const dx = c.x - sx;
    const dy = c.y - sy;
    const d = Math.hypot(dx, dy);
    const r = this.magnetRadius;
    if (d < r && d > 1) {
      const k = gameConfig.play.magnetStrength * (1 - d / r);
      return { x: sx + dx * k, y: sy + dy * k };
    }
    return { x: sx, y: sy };
  }

  async load(model: WipeAsset, baked?: BakedScene) {
    this.model = model;
    this.particles.setPalette(model.particlePalette ?? "brand");
    this.drawBase = Boolean(baked) && !model.whiteSrc;
    if (baked) {
      this.white = baked.white;
      this.yellow = baked.yellow ?? null;
      this.mask = maskFromCanvas(baked.mask);
    } else {
      if (!model.whiteSrc) throw new Error(`Missing whiteSrc for ${model.id}`);
      this.white = await loadImage(model.whiteSrc);
      this.yellow = model.yellowSrc ? await loadImage(model.yellowSrc).catch(() => null) : null;
      this.mask = await resolveTeethMask(model as ModelConfig, this.white as HTMLImageElement);
    }
    this.stain = generateStainLayer(this.white, this.mask.canvas, this.yellow, model.stainLook ?? "enamel");
    const { w, h } = srcSize(this.white);
    const { canvas, ctx } = createCanvas(w, h);
    this.erase = canvas;
    this.eraseCtx = ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ss = gameConfig.play.sampleSize;
    const sample = createCanvas(ss, ss);
    this.sample = sample.canvas;
    this.sampleCtx = sample.ctx;
    this.lastClean = 0;
    this.autoClearT = 0;
    this.shining = 0;
    this.particles.clear();
    this.computeView(model);
    this.brushRadius = model.brushSize ?? gameConfig.play.brushRadius;
    this.threshold = model.threshold ?? gameConfig.play.cleanThreshold;
    this.magnetRadius = model.magnetRadius ?? gameConfig.play.magnetRadius;
  }

  private computeView(model: WipeAsset) {
    if (!this.white || !this.mask) return;
    const { w, h } = srcSize(this.white);
    const z = model.zoom;
    const cx = z?.cx ?? this.mask.cx / w;
    const cy = z?.cy ?? this.mask.cy / h;
    const scale = z?.scale ?? Math.min(1.55, Math.max(1.15, (0.42 * STAGE.width) / Math.max(40, this.mask.radius * 2)));
    this.view = {
      scale,
      ox: STAGE.width / 2 - cx * w * scale,
      oy: STAGE.height / 2 - cy * h * scale,
    };
  }

  resetErase() {
    this.eraseCtx?.clearRect(0, 0, this.erase!.width, this.erase!.height);
    this.lastClean = 0;
    this.autoClearT = 0;
    this.shining = 0;
  }

  stamp(stageX: number, stageY: number) {
    if (!this.eraseCtx || !this.erase || !this.mask) return false;
    const img = this.stageToImage(stageX, stageY);
    const r = this.brushRadius / this.view.scale;
    const g = this.eraseCtx.createRadialGradient(img.x, img.y, 0, img.x, img.y, r);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.55, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    this.eraseCtx.globalCompositeOperation = "lighter";
    this.eraseCtx.fillStyle = g;
    this.eraseCtx.beginPath();
    this.eraseCtx.arc(img.x, img.y, r, 0, Math.PI * 2);
    this.eraseCtx.fill();
    this.lastWipeX = stageX;
    this.lastWipeY = stageY;
    return true;
  }

  sampleClean(now: number) {
    if (!this.erase || !this.mask || !this.sampleCtx || !this.sample) return this.lastClean;
    const interval = 1000 / gameConfig.play.wipeSampleHz;
    if (now - this.lastSampleAt < interval) return this.lastClean;
    this.lastSampleAt = now;
    const ss = this.sample.width;
    this.sampleCtx.clearRect(0, 0, ss, ss);
    this.sampleCtx.drawImage(this.mask.canvas, 0, 0, ss, ss);
    const mask = this.sampleCtx.getImageData(0, 0, ss, ss);
    this.sampleCtx.clearRect(0, 0, ss, ss);
    this.sampleCtx.drawImage(this.erase, 0, 0, ss, ss);
    const erase = this.sampleCtx.getImageData(0, 0, ss, ss);
    let total = 0;
    let clean = 0;
    for (let i = 0; i < mask.data.length; i += 4) {
      if (mask.data[i + 3] < 40) continue;
      total++;
      if (erase.data[i] > 110 || erase.data[i + 3] > 110) clean++;
    }
    this.lastClean = total ? clean / total : 0;
    return this.lastClean;
  }

  get thresholdValue() {
    return this.threshold;
  }

  beginAutoClear() {
    if (this.autoClearT <= 0) this.autoClearT = 0.001;
  }

  get autoClearing() {
    return this.autoClearT > 0 && this.autoClearT < 1;
  }

  get done() {
    return this.lastClean >= this.threshold || this.autoClearT >= 1;
  }

  update(dt: number, now: number) {
    this.particles.update(dt, STAGE.height);
    if (this.autoClearT > 0 && this.autoClearT < 1 && this.eraseCtx && this.erase && this.mask) {
      this.autoClearT = Math.min(1, this.autoClearT + dt / (gameConfig.timings.autoClearMs / 1000));
      const r = this.mask.radius * (0.4 + this.autoClearT * 3.2);
      const g = this.eraseCtx.createRadialGradient(this.mask.cx, this.mask.cy, 0, this.mask.cx, this.mask.cy, r);
      g.addColorStop(0, `rgba(255,255,255,${0.35 + this.autoClearT * 0.65})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      this.eraseCtx.globalCompositeOperation = "lighter";
      this.eraseCtx.fillStyle = g;
      this.eraseCtx.beginPath();
      this.eraseCtx.arc(this.mask.cx, this.mask.cy, r, 0, Math.PI * 2);
      this.eraseCtx.fill();
      if (this.autoClearT >= 1) {
        this.eraseCtx.globalCompositeOperation = "source-over";
        this.eraseCtx.fillStyle = "#fff";
        this.eraseCtx.drawImage(this.mask.canvas, 0, 0);
        this.lastClean = 1;
        this.shining = 0.001;
        const s = this.imageToStage(this.mask.cx, this.mask.cy);
        this.particles.spawnBurst(s.x, s.y);
      }
    }
    if (this.shining > 0) {
      this.shining = Math.min(1, this.shining + dt / (gameConfig.timings.shineMs / 1000));
    }
    this.sampleClean(now);
  }

  draw() {
    const ctx = this.ctx;
    const { width: W, height: H } = STAGE;
    ctx.clearRect(0, 0, W, H);
    if (!this.white || !this.stain || !this.erase || !this.mask) {
      return;
    }
    ctx.save();
    ctx.translate(this.view.ox, this.view.oy);
    ctx.scale(this.view.scale, this.view.scale);
    if (this.drawBase) ctx.drawImage(this.white, 0, 0);
    const { canvas: tmp, ctx: tx } = this.ensureTmp();
    tx.clearRect(0, 0, tmp.width, tmp.height);
    tx.globalCompositeOperation = "source-over";
    tx.drawImage(this.stain, 0, 0);
    tx.globalCompositeOperation = "destination-out";
    tx.drawImage(this.erase, 0, 0);
    tx.globalCompositeOperation = "source-over";
    ctx.drawImage(tmp, 0, 0);

    if (this.shining > 0) {
      const t = this.shining;
      const band = this.mask.cy - this.mask.radius + t * this.mask.radius * 3;
      const grad = ctx.createLinearGradient(0, band - 40, 0, band + 40);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.5, `rgba(255,255,255,${0.55 * (1 - Math.abs(t - 0.5) * 2)})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = grad;
      ctx.fillRect(this.mask.cx - this.mask.radius * 2, band - 50, this.mask.radius * 4, 100);
      ctx.restore();
    }
    ctx.restore();

    this.particles.draw(ctx);
  }

  private tmp: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null;
  private ensureTmp() {
    if (!this.white) throw new Error("no white");
    const { w, h } = srcSize(this.white);
    if (!this.tmp || this.tmp.canvas.width !== w) this.tmp = createCanvas(w, h);
    return this.tmp;
  }

  forceClean() {
    if (!this.eraseCtx || !this.mask) return;
    this.eraseCtx.globalCompositeOperation = "source-over";
    this.eraseCtx.fillStyle = "#fff";
    this.eraseCtx.drawImage(this.mask.canvas, 0, 0);
    this.lastClean = 1;
    this.autoClearT = 1;
    this.shining = 0.001;
    const s = this.imageToStage(this.mask.cx, this.mask.cy);
    this.particles.spawnBurst(s.x, s.y);
  }

  /** Wipe the left `fraction` of the teeth bbox — used for mid-wipe captures. */
  partialWipe(fraction = 0.45) {
    if (!this.eraseCtx || !this.erase || !this.mask) return;
    const { canvas: mc, ctx: mx } = this.ensureTmp();
    mx.clearRect(0, 0, mc.width, mc.height);
    mx.drawImage(this.mask.canvas, 0, 0);
    const data = mx.getImageData(0, 0, mc.width, mc.height);
    let minX = mc.width;
    let maxX = 0;
    for (let x = 0; x < mc.width; x++) {
      for (let y = 0; y < mc.height; y++) {
        if (data.data[(y * mc.width + x) * 4 + 3] > 40) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          break;
        }
      }
    }
    const cut = minX + (maxX - minX) * Math.max(0, Math.min(1, fraction));
    mx.clearRect(0, 0, mc.width, mc.height);
    mx.drawImage(this.mask.canvas, 0, 0);
    mx.globalCompositeOperation = "destination-in";
    mx.fillStyle = "#fff";
    mx.fillRect(0, 0, cut, mc.height);
    mx.globalCompositeOperation = "source-over";
    this.eraseCtx.globalCompositeOperation = "source-over";
    this.eraseCtx.clearRect(0, 0, this.erase.width, this.erase.height);
    this.eraseCtx.drawImage(mc, 0, 0);
    this.lastClean = fraction;
  }
}
