/** One Euro filter — Casiez, Rousselle, Vogel. Keeps a cursor smooth without lag. */
export class OneEuroFilter {
  private x: number | null = null;
  private dx = 0;
  private t: number | null = null;

  constructor(
    private minCutoff = 1.0,
    private beta = 0.007,
    private dCutoff = 1.0,
  ) {}

  reset() {
    this.x = null;
    this.dx = 0;
    this.t = null;
  }

  filter(value: number, t: number): number {
    if (this.x === null || this.t === null) {
      this.x = value;
      this.t = t;
      return value;
    }
    const dt = Math.max(t - this.t, 1e-4);
    const edx = (value - this.x) / dt;
    const edxHat = this.smooth(this.alpha(dt, this.dCutoff), edx, this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(edxHat);
    const xHat = this.smooth(this.alpha(dt, cutoff), value, this.x);
    this.x = xHat;
    this.dx = edxHat;
    this.t = t;
    return xHat;
  }

  private alpha(dt: number, cutoff: number) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  private smooth(a: number, value: number, prev: number) {
    return a * value + (1 - a) * prev;
  }
}

export class OneEuroPoint {
  private x: OneEuroFilter;
  private y: OneEuroFilter;

  constructor(minCutoff = 1.2, beta = 0.02, dCutoff = 1.0) {
    this.x = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.y = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  reset() {
    this.x.reset();
    this.y.reset();
  }

  filter(x: number, y: number, t: number) {
    return { x: this.x.filter(x, t), y: this.y.filter(y, t) };
  }
}
