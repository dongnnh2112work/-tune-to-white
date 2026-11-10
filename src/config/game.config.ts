export const gameConfig = {
  title: "TUNE TO WHITE",
  brand: "Close Up",
  agency: "LINKED",
  slogan: {
    line1: "WHITE NOW",
    line2: "Nụ cười trắng sáng — tức thì.",
  },
  idlePrompt: "STAND HERE & WAVE",
  idlePromptVi: "ĐỨNG ĐÂY · VẪY TAY",
  guideTitle: "LAU VẾT Ố",
  guideBody: "Đưa tay theo vòng sáng, quét qua răng để làm trắng.",
  nextLabel: "Next",
  timings: {
    handStartMs: 500,
    guideMs: 2600,
    dwellNextMs: 1000,
    endHoldMs: 9000,
    handLostResetMs: 3000,
    autoClearMs: 520,
    shineMs: 900,
  },
  play: {
    cleanThreshold: 0.92,
    brushRadius: 82,
    magnetStrength: 0.14,
    magnetRadius: 170,
    sampleSize: 128,
    wipeSampleHz: 8,
  },
  camera: {
    roi: { left: 0.12, top: 0.18, right: 0.88, bottom: 0.98 },
    mirror: true,
    maxHands: 2,
  },
  cursor: {
    size: 92,
    minCutoff: 1.2,
    beta: 0.02,
    dCutoff: 1.0,
  },
  storageKey: "tune-to-white-stats",
};

export type GameConfig = typeof gameConfig;
