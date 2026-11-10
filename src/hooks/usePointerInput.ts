"use client";

import { useEffect, useRef } from "react";
import { STAGE } from "@/theme/theme";
import type { CursorState } from "@/game/types";

export function usePointerInput(target: HTMLElement | null, enabled: boolean) {
  const cursorRef = useRef<CursorState>({
    x: STAGE.width / 2,
    y: STAGE.height * 0.55,
    active: false,
    source: "none",
    confidence: 0,
  });
  const downRef = useRef(false);

  useEffect(() => {
    if (!target || !enabled) return;

    const toStage = (e: PointerEvent) => {
      const r = target.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * STAGE.width;
      const y = ((e.clientY - r.top) / r.height) * STAGE.height;
      return { x, y };
    };

    const onMove = (e: PointerEvent) => {
      const p = toStage(e);
      cursorRef.current = {
        x: p.x,
        y: p.y,
        active: true,
        source: "pointer",
        confidence: 1,
      };
    };
    const onDown = (e: PointerEvent) => {
      downRef.current = true;
      onMove(e);
      target.setPointerCapture?.(e.pointerId);
    };
    const onUp = () => {
      downRef.current = false;
    };
    const onLeave = () => {
      cursorRef.current = { ...cursorRef.current, active: false };
    };

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerdown", onDown);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointerleave", onLeave);
    return () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerdown", onDown);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointerleave", onLeave);
    };
  }, [target, enabled]);

  return { cursorRef, downRef };
}
