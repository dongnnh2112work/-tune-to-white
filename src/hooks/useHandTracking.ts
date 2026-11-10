"use client";

import { useEffect, useRef, useState } from "react";
import { createHandLandmarker } from "@/lib/mediapipe";
import { gameConfig } from "@/config/game.config";
import { STAGE } from "@/theme/theme";
import { OneEuroPoint } from "@/lib/oneEuro";
import type { CursorState } from "@/game/types";

type HandLandmarker = Awaited<ReturnType<typeof createHandLandmarker>>;

export function useHandTracking(enabled: boolean) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const cursorRef = useRef<CursorState>({
    x: STAGE.width / 2,
    y: STAGE.height / 2,
    active: false,
    source: "none",
    confidence: 0,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lostSince = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    let landmarker: HandLandmarker | null = null;
    let raf = 0;
    const filter = new OneEuroPoint(
      gameConfig.cursor.minCutoff,
      gameConfig.cursor.beta,
      gameConfig.cursor.dCutoff,
    );
    let frames = 0;
    let lastFps = performance.now();

    const video = document.createElement("video");
    video.setAttribute("playsinline", "true");
    video.muted = true;
    video.autoplay = true;
    videoRef.current = video;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });
        if (stop) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();
        landmarker = await createHandLandmarker();
        if (stop) return;
        setReady(true);

        const loop = () => {
          if (stop || !landmarker) return;
          raf = requestAnimationFrame(loop);
          if (video.readyState < 2) return;
          const now = performance.now();
          const result = landmarker.detectForVideo(video, now);
          frames++;
          if (now - lastFps > 1000) {
            setFps(frames);
            frames = 0;
            lastFps = now;
          }
          const picked = pickHand(result.landmarks, video.videoWidth, video.videoHeight);
          if (picked) {
            lostSince.current = null;
            const t = now / 1000;
            const sm = filter.filter(picked.x, picked.y, t);
            cursorRef.current = {
              x: sm.x * STAGE.width,
              y: sm.y * STAGE.height,
              active: true,
              source: "hand",
              confidence: picked.score,
            };
          } else {
            if (lostSince.current === null) lostSince.current = now;
            cursorRef.current = { ...cursorRef.current, active: false, confidence: 0 };
          }
        };
        raf = requestAnimationFrame(loop);
      } catch (e) {
        setError(e instanceof Error ? e.message : "camera");
        setReady(false);
      }
    })();

    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      landmarker?.close();
    };
  }, [enabled]);

  return { ready, error, fps, cursorRef, videoRef, lostSince };
}

function pickHand(
  hands: { x: number; y: number; z: number }[][] | undefined,
  vw: number,
  vh: number,
) {
  if (!hands?.length) return null;
  const roi = gameConfig.camera.roi;
  let best: { x: number; y: number; score: number } | null = null;
  for (const lm of hands) {
    if (!lm[9] || !lm[8]) continue;
    const palm = lm[9];
    const px = gameConfig.camera.mirror ? 1 - palm.x : palm.x;
    const py = palm.y;
    if (px < roi.left || px > roi.right || py < roi.top || py > roi.bottom) continue;
    let minX = 1;
    let minY = 1;
    let maxX = 0;
    let maxY = 0;
    for (const p of lm) {
      const x = gameConfig.camera.mirror ? 1 - p.x : p.x;
      if (x < minX) minX = x;
      if (p.y < minY) minY = p.y;
      if (x > maxX) maxX = x;
      if (p.y > maxY) maxY = p.y;
    }
    const area = (maxX - minX) * (maxY - minY) * vw * vh;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const centrality = 1 - Math.hypot(cx - 0.5, cy - 0.55);
    const score = area * (0.65 + 0.35 * centrality);
    if (!best || score > best.score) {
      const tip = lm[8];
      const mid = lm[9];
      const x = gameConfig.camera.mirror ? 1 - (tip.x * 0.7 + mid.x * 0.3) : tip.x * 0.7 + mid.x * 0.3;
      const y = tip.y * 0.7 + mid.y * 0.3;
      best = { x, y, score };
    }
  }
  return best;
}
