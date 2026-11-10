import type { Phase } from "@/game/types";

export type LaunchFlags = {
  mouse: boolean;
  fast: boolean;
  staff: boolean;
  jump: Phase | null;
  model: number;
};

export function readFlags(): LaunchFlags {
  if (typeof window === "undefined") {
    return { mouse: false, fast: false, staff: false, jump: null, model: 0 };
  }
  const q = new URLSearchParams(window.location.search);
  const jumpRaw = q.get("jump");
  const jump = (["idle", "guide", "play", "win", "end"] as Phase[]).includes(jumpRaw as Phase)
    ? (jumpRaw as Phase)
    : null;
  return {
    mouse: q.get("input") === "mouse" || q.has("mouse"),
    fast: q.has("fast"),
    staff: q.has("staff"),
    jump,
    model: Math.max(0, Number(q.get("model") ?? 0) || 0),
  };
}
