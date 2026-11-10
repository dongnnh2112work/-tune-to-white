import type { DebugApi } from "@/game/types";

declare global {
  interface Window {
    __TUNE__?: DebugApi;
  }
}

export {};
