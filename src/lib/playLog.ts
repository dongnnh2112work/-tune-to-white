import { gameConfig } from "@/config/game.config";
import type { PlayStats } from "@/game/types";

const empty: PlayStats = { plays: 0, completes: 0, lastPlayed: null };

export function readStats(): PlayStats {
  if (typeof window === "undefined") return { ...empty };
  try {
    const raw = localStorage.getItem(gameConfig.storageKey);
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as PlayStats;
    return {
      plays: Number(parsed.plays) || 0,
      completes: Number(parsed.completes) || 0,
      lastPlayed: parsed.lastPlayed ?? null,
    };
  } catch {
    return { ...empty };
  }
}

export function bumpPlay() {
  const s = readStats();
  s.plays += 1;
  s.lastPlayed = new Date().toISOString();
  localStorage.setItem(gameConfig.storageKey, JSON.stringify(s));
  return s;
}

export function bumpComplete() {
  const s = readStats();
  s.completes += 1;
  s.lastPlayed = new Date().toISOString();
  localStorage.setItem(gameConfig.storageKey, JSON.stringify(s));
  return s;
}
