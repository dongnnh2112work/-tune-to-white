"use client";

import { useEffect, useRef } from "react";
import { PLACEHOLDER } from "@/config/placeholders.config";
import { STAGE } from "@/theme/theme";
import { ParticleSystem } from "@/lib/particles";

export function EndScreen({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ps = new ParticleSystem();
    ps.seedFall(STAGE.width, STAGE.height, 280);
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ps.spawnFall(STAGE.width, STAGE.height, dt);
      ps.update(dt, STAGE.height);
      ctx.clearRect(0, 0, STAGE.width, STAGE.height);
      ps.draw(ctx);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  return (
    <div className={`end-screen ${visible ? "is-on" : ""}`} data-testid="end-screen">
      <canvas ref={ref} width={STAGE.width} height={STAGE.height} className="end-particles" />
      <div className="end-content">
        <img src="/brand/logo_closeup.png" alt="Close Up White Now" />
        <p className="end-line1">{PLACEHOLDER.endSloganLine1}</p>
        <p className="end-line2">{PLACEHOLDER.endSloganLine2}</p>
      </div>
    </div>
  );
}
