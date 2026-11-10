import type { ModelConfig } from "@/config/models.config";
import type { ToothRoundConfig } from "@/config/teeth.config";

export type StainLook = "enamel" | "marble";
export type ParticlePalette = "brand" | "spot";

export type WipeAsset = Omit<ModelConfig, "whiteSrc"> & {
  whiteSrc?: string;
  stainLook?: StainLook;
  particlePalette?: ParticlePalette;
  magnetRadius?: number;
  layout?: ToothRoundConfig["layout"];
};

export type BakedScene = {
  white: HTMLCanvasElement;
  mask: HTMLCanvasElement;
  yellow?: HTMLCanvasElement | HTMLImageElement | null;
};
