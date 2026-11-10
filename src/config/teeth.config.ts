/**
 * Teeth-only rounds (no human face).
 *
 * Default: procedural glossy 3D tooth icons (SVG path + canvas shaders:
 * marble veining, spec highlights, blue/purple rim light) on a dark
 * fabric background. No photos of people. No training-doc crops.
 *
 * Drop a 3D-rendered tooth later — same slot pattern as models.config:
 *   whiteSrc       9:16 pearl-white tooth PNG (transparent or matching bg)
 *   yellowSrc      OPTIONAL stained PNG, must be pixel-aligned with white
 *   teethMaskSrc   PNG (white = tooth). If omitted with whiteSrc, auto-mask
 *                  from alpha / brightness.
 *   zoom           { cx, cy, scale } — use { cx: 0.5, cy: 0.5, scale: 1 }
 *                  when the PNG is already 1080×1920.
 *
 * If whiteSrc is set, `layout` is ignored and the PNG is used instead of
 * the procedural scene.
 */
import type { ModelConfig } from "@/config/models.config";

export type ToothLayoutId = "solo" | "pair" | "cluster";

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
