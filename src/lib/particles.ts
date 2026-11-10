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

export class ParticleSystem {
  particles: Particle[] = [];

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
        r: stain ? 210 + Math.random() * 40 : 255,
        g: stain ? 150 + Math.random() * 50 : 255,
        b: stain ? 40 + Math.random() * 40 : 250,
      });
    }
  }

  spawnBurst(x: number, y: number) {
    for (let i = 0; i < 48; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 260;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        life: 0,
        max: 0.55 + Math.random() * 0.4,
        size: 2 + Math.random() * 5,
        kind: Math.random() > 0.4 ? "sparkle" : "stain",
        r: 255,
        g: Math.random() > 0.5 ? 255 : 210,
        b: Math.random() > 0.5 ? 255 : 90,
      });
    }
  }

  spawnFall(w: number, h: number, dt: number) {
    const rate = 28 * dt;
    const n = rate + (Math.random() < rate % 1 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: -10,
        vx: (Math.random() - 0.5) * 24,
        vy: 70 + Math.random() * 90,
        life: 0,
        max: 6 + Math.random() * 4,
        size: 2 + Math.random() * 4,
        kind: "fall",
        r: Math.random() > 0.5 ? 180 : 255,
        g: Math.random() > 0.5 ? 255 : 230,
        b: Math.random() > 0.4 ? 230 : 110,
      });
    }
  }

  update(dt: number, h = 1920) {
    const g = this.particles;
    let w = 0;
    for (let i = 0; i < g.length; i++) {
      const p = g[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === "fall") p.vy += 18 * dt;
      else p.vy += 90 * dt;
      if (p.life < p.max && p.y < h + 20) g[w++] = p;
    }
    g.length = w;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      const t = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = `rgb(${p.r | 0},${p.g | 0},${p.b | 0})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + t * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clear() {
    this.particles.length = 0;
  }
}
