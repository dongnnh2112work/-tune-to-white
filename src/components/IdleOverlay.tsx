"use client";

import { PLACEHOLDER } from "@/config/placeholders.config";
import type { UiMode } from "@/game/types";

export function IdleOverlay({ visible, mode = "face" }: { visible: boolean; mode?: UiMode }) {
  const teeth = mode === "teeth";
  return (
    <div
      className={`idle-overlay ${visible ? "is-on" : ""} ${teeth ? "teeth-mood" : ""}`}
      data-testid="idle-overlay"
      aria-hidden={!visible}
    >
      <img className="idle-logo" src="/brand/logo_closeup.png" alt="Close Up White Now" />
      {teeth ? (
        <div className="teeth-headline">
          <span>{PLACEHOLDER.teethHeadlineA}</span>
          <span>{PLACEHOLDER.teethHeadlineB}</span>
        </div>
      ) : (
        <div className="idle-title">TUNE TO WHITE</div>
      )}
      {teeth ? null : <div className="idle-sub">Đưa tay lên — lau sạch vết ố</div>}
      <div className="idle-cta">
        <div className="idle-pulse" />
        <div className="idle-stand">STAND HERE &amp; WAVE</div>
        <div className="idle-stand-vi">{teeth ? PLACEHOLDER.teethIdleSub : "ĐỨNG ĐÂY · VẪY TAY"}</div>
      </div>
      <div className="floor-mark">
        <span className="chev" />
        <span className="chev" />
        <span className="chev" />
      </div>
    </div>
  );
}
