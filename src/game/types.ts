export type Phase = "boot" | "idle" | "guide" | "play" | "win" | "end";

export type Point = { x: number; y: number };

export type CursorState = {
  x: number;
  y: number;
  active: boolean;
  source: "hand" | "pointer" | "none";
  confidence: number;
};

export type PlayStats = {
  plays: number;
  completes: number;
  lastPlayed: string | null;
};

export type DebugApi = {
  getPhase: () => Phase;
  jump: (phase: Phase, modelIndex?: number) => void;
  getTeethCentroid: () => { x: number; y: number; radius: number };
  getClean: () => number;
  forceClean: () => void;
  setMouse: (on: boolean) => void;
  getModelIndex: () => number;
};
