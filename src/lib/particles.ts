type Kind = "stain" | "sparkle" | "fall";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  kind: Kind;
  r: number;
  g: number;
  b: number;
};

const BRAND_PALETTE: [number, number, number][] = [
  [225, 6, 0],
  [255, 72, 58],
  [0, 196, 179],
  [46, 230, 214],
  [168, 246, 232],
  [246, 211, 107],
  [255, 255, 255],
];

const SPOT_PALETTE: [number, number, number][] = [
  [90, 170, 255],
  [140, 200, 255],
  [180, 110, 255],
  [210, 160, 255],
  [255, 255, 255],
  [0, 196, 179],
  [225, 6, 0],
];

export type ParticlePalette = "brand" | "spot";

export class ParticleSystem {
  particles: Particle[] = [];
  palette: ParticlePalette = "brand";

  setPalette(p: ParticlePalette) {
    this.palette = p;
  }

  private pick() {
    const table = this.palette === "spot" ? SPOT_PALETTE : BRAND_PALETTE;
    return table[(Math.random() * table.length) | 0];
  }

  spawnWipe(x: number, y: number, n = 7) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 140;
      const stain = Math.random() > 0.35;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 30,
        life: 0,
        max: 0.35 + Math.random() * 0.35,
        size: stain ? 3 + Math.random() * 5 : 2 + Math.random() * 3,
        kind: stain ? "stain" : "sparkle",
        r: stain ? (this.palette === "spot" ? 200 : 176) + Math.random() * 28 : this.palette === "spot" ? 160 : 255,
        g: stain ? (this.palette === "spot" ? 170 : 138) + Math.random() * 28 : this.palette === "spot" ? 190 : 255,
        b: stain ? (this.palette === "spot" ? 90 : 70) + Math.random() * 30 : 250,
      });
    }
  }

  spawnBurst(x: number, y: number) {
    for (let i = 0; i < 48; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 260;
      const [r, g, b] = this.pick();
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        life: 0,
        max: 0.55 + Math.random() * 0.4,
        size: 2 + Math.random() * 5,
        kind: "sparkle",
        r,
        g,
        b,
      });
    }
  }

  /** Fill the whole frame so the end screen is never empty at the top only. */
  seedFall(w: number, h: number, count = 240) {
    for (let i = 0; i < count; i++) {
      this.pushFall(Math.random() * w, Math.random() * h);
    }
  }

  spawnFall(w: number, h: number, dt: number) {
    const rate = 56 * dt;
    const n = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      this.pushFall(Math.random() * w, -12 - Math.random() * 40);
    }
  }

  private pushFall(x: number, y: number) {
    const [r, g, b] = this.pick();
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 36,
      vy: 90 + Math.random() * 140,
      life: 0,
      max: 24,
      size: 2.2 + Math.random() * 5.5,
      kind: "fall",
      r,
      g,
      b,
    });
  }

  update(dt: number, h = 1920) {
    const g = this.particles;
    let w = 0;
    for (let i = 0; i < g.length; i++) {
      const p = g[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === "fall") p.vy += 22 * dt;
      else p.vy += 90 * dt;
      const alive = p.kind === "fall" ? p.y < h + 24 : p.life < p.max && p.y < h + 20;
      if (alive) g[w++] = p;
    }
    g.length = w;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      const t = p.kind === "fall" ? 0.82 : Math.max(0, 1 - p.life / p.max);
      ctx.globalAlpha = t;
      ctx.fillStyle = `rgb(${p.r | 0},${p.g | 0},${p.b | 0})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.7 + t * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clear() {
    this.particles.length = 0;
  }
}
