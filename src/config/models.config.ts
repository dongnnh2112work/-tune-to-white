/**
 * Model rounds for TUNE TO WHITE.
 *
 * Drop replacement files in /public/models then edit this file — that's it.
 *
 * Per-model fields:
 *   whiteSrc       required — 9:16 portrait with white teeth
 *   yellowSrc      OPTIONAL overlay photo. Default is OFF: stains are
 *                  generated in code over the teeth mask. Only set this
 *                  when the yellow edit is pixel-aligned with whiteSrc
 *                  (model 1 is known to be offset — do not enable).
 *   teethMaskSrc   optional PNG (white = teeth). Overrides auto mask.
 *   polygon        optional normalized 0–1 mouth polygon. Overrides auto.
 *   threshold      optional clean ratio (default gameConfig.play.cleanThreshold)
 *   brushSize      optional brush radius in stage pixels
 *   zoom           { cx, cy, scale } in image-normalized coords.
 *                  Mouth should sit ~55–60% down the source frame.
 *                  Keep scale moderate (≤ ~1.6) — these assets were
 *                  upscaled from 941×1672 and pixelate if zoomed harder.
 *
 * Auto teeth mask (when no teethMaskSrc / polygon): MediaPipe FaceLandmarker
 * inner-lip polygon, refined by brightness inside the mouth. Preview/export
 * at /tools/mask.
 */
export type ModelConfig = {
  id: string;
  name: string;
  whiteSrc: string;
  yellowSrc?: string;
  teethMaskSrc?: string;
  polygon?: [number, number][];
  threshold?: number;
  brushSize?: number;
  zoom?: { cx: number; cy: number; scale: number };
};

export const models: ModelConfig[] = [
  {
    id: "model1",
    name: "Teal smile",
    whiteSrc: "/models/model1_white.webp",
    // yellowSrc omitted — yellow edit is offset from white
    teethMaskSrc: "/models/model1_teeth_mask.png",
    zoom: { cx: 0.56, cy: 0.56, scale: 1.32 },
  },
  {
    id: "model2",
    name: "Red smile",
    whiteSrc: "/models/model2_white.webp",
    // yellowSrc: "/models/model2_yellow.webp" — opt-in; test alignment first
    teethMaskSrc: "/models/model2_teeth_mask.png",
    zoom: { cx: 0.55, cy: 0.542, scale: 1.28 },
  },
  {
    id: "model3",
    name: "Teal ponytail",
    whiteSrc: "/models/model3_white.webp",
    // yellowSrc: "/models/model3_yellow.webp" — opt-in; test alignment first
    teethMaskSrc: "/models/model3_teeth_mask.png",
    zoom: { cx: 0.567, cy: 0.599, scale: 1.3 },
  },
];
