"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { models } from "@/config/models.config";
import { gameConfig } from "@/config/game.config";
import { STAGE } from "@/theme/theme";
import { WipeEngine } from "@/game/WipeEngine";
import { readFlags } from "@/game/flags";
import type { CursorState, Phase, PlayStats } from "@/game/types";
import { useHandTracking } from "@/hooks/useHandTracking";
import { usePointerInput } from "@/hooks/usePointerInput";
import { bumpComplete, bumpPlay, readStats } from "@/lib/playLog";
import { IdleOverlay } from "@/components/IdleOverlay";
import { GuideOverlay } from "@/components/GuideOverlay";
import { WinOverlay } from "@/components/WinOverlay";
import { EndScreen } from "@/components/EndScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StaffPanel } from "@/components/StaffPanel";
import { CursorRing } from "@/components/CursorRing";

const NEXT = { x: 390, y: 1648, w: 300, h: 120 };

export default function KioskGame() {
  const flags = useRef(readFlags());
  const engineRef = useRef<WipeEngine | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorEl = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef(1);
  const phaseRef = useRef<Phase>("boot");
  const modelIndexRef = useRef(0);
  const dwellRef = useRef(0);
  const handHoldRef = useRef(0);
  const handLostRef = useRef(0);
  const lastStamp = useRef({ x: -999, y: -999 });
  const lastTs = useRef(0);
  const statsRef = useRef<PlayStats>(readStats());
  const thresholdRef = useRef(gameConfig.play.cleanThreshold);
  const brushRef = useRef(gameConfig.play.brushRadius);
  const mouseModeRef = useRef(false);
  const cleanUiRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("boot");
  const [bootLabel, setBootLabel] = useState("Đang tải…");
  const [modelIndex, setModelIndex] = useState(0);
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const [mouseMode, setMouseMode] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [showCam, setShowCam] = useState(false);
  const [dwell, setDwell] = useState(0);
  const [stats, setStats] = useState<PlayStats>(statsRef.current);
  const [threshold, setThreshold] = useState(gameConfig.play.cleanThreshold);
  const [brush, setBrush] = useState(gameConfig.play.brushRadius);
  const [cleanUi, setCleanUi] = useState(0);
  const [photoSrc, setPhotoSrc] = useState<string>(models[0].whiteSrc);
  const [photoXform, setPhotoXform] = useState("translate(0px, 0px) scale(1)");

  const [wantCamera, setWantCamera] = useState(false);
  const hands = useHandTracking(wantCamera);
  const pointer = usePointerInput(stageEl, true);

  useEffect(() => {
    mouseModeRef.current = mouseMode;
  }, [mouseMode]);
  useEffect(() => {
    if (hands.error && !mouseModeRef.current) {
      setMouseMode(true);
      mouseModeRef.current = true;
    }
  }, [hands.error]);

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const fit = useCallback(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    if (!host || !stage) return;
    const s = Math.min(host.clientWidth / STAGE.width, host.clientHeight / STAGE.height);
    scaleRef.current = s;
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }, []);

  useEffect(() => {
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);

  const loadModel = useCallback(
    async (index: number, nextPhase: Phase) => {
      const engine = engineRef.current;
      if (!engine) return;
      const i = ((index % models.length) + models.length) % models.length;
      setBootLabel(`Đang tải ${models[i].name}…`);
      await engine.load(models[i]);
      engine.draw();
      engine.setBrush(brushRef.current);
      engine.setThreshold(thresholdRef.current);
      modelIndexRef.current = i;
      setModelIndex(i);
      setPhotoSrc(models[i].whiteSrc);
      const t = engine.transform;
      setPhotoXform(`translate(${t.ox}px, ${t.oy}px) scale(${t.scale})`);
      setPhaseBoth(nextPhase);
    },
    [setPhaseBoth],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!engineRef.current) engineRef.current = new WipeEngine(canvas);
    else engineRef.current.attach(canvas);
    const engine = engineRef.current;

    let cancelled = false;
    (async () => {
      try {
        const f = readFlags();
        flags.current = f;
        mouseModeRef.current = f.mouse;
        setMouseMode(f.mouse);
        setWantCamera(!f.mouse);
        if (f.staff) setStaffOpen(true);
        await loadModel(f.model, f.jump ?? "idle");
        if (cancelled) return;
        if (f.jump === "win") engine.forceClean();
        if (stageRef.current) stageRef.current.dataset.loaded = "1";
      } catch (e) {
        setBootLabel(e instanceof Error ? e.message : "Lỗi tải");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetToIdle = useCallback(async () => {
    dwellRef.current = 0;
    handHoldRef.current = 0;
    handLostRef.current = 0;
    await loadModel(0, "idle");
  }, [loadModel]);

  const startPlay = useCallback(() => {
    const s = bumpPlay();
    statsRef.current = s;
    setStats(s);
    dwellRef.current = 0;
    handHoldRef.current = 0;
    setPhaseBoth("guide");
  }, [setPhaseBoth]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Backquote" || (e.shiftKey && e.code === "KeyS")) {
        e.preventDefault();
        setStaffOpen((v) => !v);
      }
      if (e.code === "Escape") setStaffOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pickCursor = useCallback((): CursorState => {
    if (mouseModeRef.current) return pointer.cursorRef.current;
    const hand = hands.cursorRef.current;
    if (hand.active) return hand;
    if (pointer.cursorRef.current.active) return pointer.cursorRef.current;
    return hand;
  }, [hands.cursorRef, pointer.cursorRef]);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const engine = engineRef.current;
      if (!engine) return;
      const dt = lastTs.current ? Math.min(0.05, (now - lastTs.current) / 1000) : 0.016;
      lastTs.current = now;
      const mul = flags.current.fast ? 3 : 1;
      const p = phaseRef.current;
      const cursor = pickCursor();

      if (cursorEl.current) {
        cursorEl.current.style.transform = `translate(${cursor.x}px, ${cursor.y}px) translate(-50%, -50%)`;
        cursorEl.current.classList.toggle("is-on", p !== "boot" && p !== "end" && cursor.active);
      }

      if (p === "idle") {
        if (cursor.active) {
          handHoldRef.current += dt * 1000 * mul;
          if (handHoldRef.current >= gameConfig.timings.handStartMs) startPlay();
        } else {
          handHoldRef.current = 0;
        }
      }

      if (p === "guide") {
        handHoldRef.current += dt * 1000 * mul;
        if (handHoldRef.current >= gameConfig.timings.guideMs) {
          handHoldRef.current = 0;
          engine.resetErase();
          setPhaseBoth("play");
        }
      }

      if (p === "play" && cursor.active) {
        const mag = engine.magnetize(cursor.x, cursor.y);
        engine.stamp(mag.x, mag.y);
        const dx = mag.x - lastStamp.current.x;
        const dy = mag.y - lastStamp.current.y;
        if (dx * dx + dy * dy > 36) {
          engine.particles.spawnWipe(mag.x, mag.y, 6);
          lastStamp.current = mag;
        }
        const clean = engine.sampleClean(now);
        if (clean >= engine.thresholdValue && !engine.autoClearing && engine.clean < 1) {
          engine.beginAutoClear();
        }
      }

      engine.update(dt, now);

      if (p === "play" && engine.done && engine.clean >= 0.99) {
        setPhaseBoth("win");
        dwellRef.current = 0;
      }

      if (p === "win") {
        const over =
          cursor.active &&
          cursor.x >= NEXT.x &&
          cursor.x <= NEXT.x + NEXT.w &&
          cursor.y >= NEXT.y &&
          cursor.y <= NEXT.y + NEXT.h;
        if (over) {
          dwellRef.current = Math.min(1, dwellRef.current + (dt * 1000 * mul) / gameConfig.timings.dwellNextMs);
        } else {
          dwellRef.current = 0;
        }
        if (Math.abs(dwellRef.current - cleanUiRef.current) > 0.02) {
          cleanUiRef.current = dwellRef.current;
          setDwell(dwellRef.current);
        }
        if (dwellRef.current >= 1) {
          dwellRef.current = 0;
          setDwell(0);
          const next = modelIndexRef.current + 1;
          if (next >= models.length) {
            const s = bumpComplete();
            statsRef.current = s;
            setStats(s);
            setPhaseBoth("end");
            handLostRef.current = 0;
            handHoldRef.current = 0;
          } else {
            void loadModel(next, "play");
          }
        }
      }

      if (p === "end") {
        handHoldRef.current += dt * 1000;
        if (!cursor.active) {
          handLostRef.current += dt * 1000;
        } else {
          handLostRef.current = 0;
        }
        const hold = flags.current.fast ? gameConfig.timings.endHoldMs / 3 : gameConfig.timings.endHoldMs;
        if (handHoldRef.current >= hold || handLostRef.current >= gameConfig.timings.handLostResetMs) {
          void resetToIdle();
        }
      }

      const cl = engine.clean;
      if (Math.abs(cl - cleanUiRef.current) > 0.03 && p === "play") {
        cleanUiRef.current = cl;
        setCleanUi(cl);
      }
      engine.draw();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [loadModel, pickCursor, resetToIdle, setPhaseBoth, startPlay]);

  useEffect(() => {
    window.__TUNE__ = {
      getPhase: () => phaseRef.current,
      getModelIndex: () => modelIndexRef.current,
      getClean: () => engineRef.current?.clean ?? 0,
      getTeethCentroid: () => engineRef.current?.teethCentroidStage() ?? { x: 540, y: 960, radius: 80 },
      forceClean: () => {
        engineRef.current?.forceClean();
        setPhaseBoth("win");
      },
      partialWipe: (fraction) => {
        engineRef.current?.partialWipe(fraction);
        engineRef.current?.draw();
      },
      setMouse: (on) => {
        mouseModeRef.current = on;
        setMouseMode(on);
      },
      jump: (next, idx) => {
        if (typeof idx === "number") {
          void loadModel(idx, next);
          return;
        }
        if (next === "win") engineRef.current?.forceClean();
        if (next === "idle") void resetToIdle();
        else setPhaseBoth(next);
      },
    };
    return () => {
      delete window.__TUNE__;
    };
  }, [loadModel, resetToIdle, setPhaseBoth]);

  const onStagePointer = (e: React.PointerEvent) => {
    if (phaseRef.current === "idle") {
      e.preventDefault();
      startPlay();
    }
  };

  return (
    <div className="kiosk-shell" ref={hostRef} data-testid="kiosk-shell">
      <div
        className="stage"
        ref={(el) => {
          stageRef.current = el;
          setStageEl(el);
        }}
        onPointerDown={onStagePointer}
        data-testid="stage"
        data-phase={phase}
        data-model={modelIndex}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="model-photo"
          src={photoSrc}
          alt=""
          draggable={false}
          style={{ transform: photoXform }}
          onError={() => {
            if (stageRef.current) stageRef.current.dataset.imgError = "1";
          }}
          onLoad={() => {
            if (stageRef.current) stageRef.current.dataset.imgOk = "1";
          }}
        />
        <canvas ref={canvasRef} className="game-canvas" data-testid="game-canvas" />
        <IdleOverlay visible={phase === "idle"} />
        <GuideOverlay visible={phase === "guide"} />
        <WinOverlay visible={phase === "win"} dwell={dwell} label={gameConfig.nextLabel} />
        <EndScreen visible={phase === "end"} />
        <LoadingScreen visible={phase === "boot"} label={bootLabel} />
        <CursorRing ref={cursorEl} visible={phase !== "boot" && phase !== "end"} />
      </div>
      <StaffPanel
        open={staffOpen}
        mouseMode={mouseMode}
        threshold={threshold}
        brush={brush}
        fps={hands.fps}
        clean={cleanUi}
        phase={phase}
        stats={stats}
        cameraError={hands.error}
        video={hands.videoRef.current}
        showCam={showCam}
        onToggleMouse={() => {
          const next = !mouseModeRef.current;
          mouseModeRef.current = next;
          setMouseMode(next);
          setWantCamera(!next);
        }}
        onThreshold={(v) => {
          thresholdRef.current = v;
          setThreshold(v);
          engineRef.current?.setThreshold(v);
        }}
        onBrush={(v) => {
          brushRef.current = v;
          setBrush(v);
          engineRef.current?.setBrush(v);
        }}
        onReset={() => void resetToIdle()}
        onShowCam={() => setShowCam((s) => !s)}
        onClose={() => setStaffOpen(false)}
      />
    </div>
  );
}
