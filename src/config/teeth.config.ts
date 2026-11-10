/**
 * Teeth-only rounds (no human face).
 *
 * Shared assets (`teethAssets`):
 *   toothWhiteSrc   3D pearl-white tooth (RGBA). Reused on every round,
 *                   scaled/rotated per `layout`.
 *   backgroundSrc   Portrait 1080×1920 spotlight plate.
 *                   Official: `/teeth/bg_spotlight.webp`. Do not scatter
 *                   the filename across components.
 *
 * Optional per-round drop-in (same slots as models.config):
 *   whiteSrc        full 1080×1920 scene PNG — skips compositing
 *   yellowSrc       optional stained overlay, pixel-aligned with white
 *   teethMaskSrc    PNG (white/alpha = tooth). Default mask = tooth alpha.
 *
 * Stain is always generated in code (ivory marble) and clipped to the
 * tooth alpha, unless yellowSrc is set.
 */
import type { ModelConfig } from "@/config/models.config";

export type ToothLayoutId = "solo" | "pair" | "cluster";

export const teethAssets = {
  toothWhiteSrc: "/teeth/tooth_white.webp",
  /** Official 1080×1920 spotlight plate. */
  backgroundSrc: "/teeth/bg_spotlight.webp",
} as const;

export type ToothRoundConfig = Omit<ModelConfig, "whiteSrc"> & {
  whiteSrc?: string;
  layout: ToothLayoutId;
  stainLook?: "enamel" | "marble";
  particlePalette?: "brand" | "spot";
  magnetRadius?: number;
};

export const teethRounds: ToothRoundConfig[] = [
  {
    id: "tooth-solo",
    name: "Single molar",
    layout: "solo",
    stainLook: "marble",
    particlePalette: "spot",
    brushSize: 118,
    magnetRadius: 280,
    zoom: { cx: 0.5, cy: 0.5, scale: 1 },
  },
  {
    id: "tooth-pair",
    name: "Pair",
    layout: "pair",
    stainLook: "marble",
    particlePalette: "spot",
    brushSize: 102,
    magnetRadius: 320,
    zoom: { cx: 0.5, cy: 0.5, scale: 1 },
  },
  {
    id: "tooth-cluster",
    name: "Cluster",
    layout: "cluster",
    stainLook: "marble",
    particlePalette: "spot",
    brushSize: 96,
    magnetRadius: 340,
    zoom: { cx: 0.5, cy: 0.5, scale: 1 },
  },
];
