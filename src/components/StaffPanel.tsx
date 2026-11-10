"use client";

import type { PlayStats, UiMode } from "@/game/types";

export function StaffPanel({
  open,
  mouseMode,
  uiMode,
  threshold,
  brush,
  fps,
  clean,
  phase,
  stats,
  cameraError,
  video,
  showCam,
  onToggleMouse,
  onThreshold,
  onBrush,
  onReset,
  onShowCam,
  onClose,
  onUiMode,
}: {
  open: boolean;
  mouseMode: boolean;
  uiMode: UiMode;
  threshold: number;
  brush: number;
  fps: number;
  clean: number;
  phase: string;
  stats: PlayStats;
  cameraError: string | null;
  video: HTMLVideoElement | null;
  showCam: boolean;
  onToggleMouse: () => void;
  onThreshold: (v: number) => void;
  onBrush: (v: number) => void;
  onReset: () => void;
  onShowCam: () => void;
  onClose: () => void;
  onUiMode: (mode: UiMode) => void;
}) {
  return (
    <aside className={`staff-panel ${open ? "is-on" : ""}`} data-testid="staff-panel">
      <header>
        <strong>Staff</strong>
        <span>Shift+S / `</span>
        <button type="button" onClick={onClose}>
          đóng
        </button>
      </header>
      <div className="staff-row">
        <span>Phase</span>
        <b>{phase}</b>
      </div>
      <div className="staff-row">
        <span>Clean</span>
        <b>{Math.round(clean * 100)}%</b>
      </div>
      <div className="staff-row">
        <span>FPS cam</span>
        <b>{fps || "—"}</b>
      </div>
      <div className="staff-row">
        <span>Plays / win</span>
        <b>
          {stats.plays} / {stats.completes}
        </b>
      </div>
      {cameraError && <p className="staff-warn">Camera: {cameraError} — mouse fallback</p>}
      <label>
        UI mode
        <select
          value={uiMode}
          onChange={(e) => onUiMode(e.target.value as UiMode)}
          data-testid="staff-ui-mode"
        >
          <option value="face">Face (default)</option>
          <option value="teeth">Teeth only</option>
        </select>
      </label>
      <label className="staff-toggle">
        <input type="checkbox" checked={mouseMode} onChange={onToggleMouse} />
        Mouse / touch mode
      </label>
      <label>
        Threshold {threshold.toFixed(2)}
        <input
          type="range"
          min={0.7}
          max={0.99}
          step={0.01}
          value={threshold}
          onChange={(e) => onThreshold(Number(e.target.value))}
        />
      </label>
      <label>
        Brush {brush}px
        <input
          type="range"
          min={40}
          max={140}
          step={2}
          value={brush}
          onChange={(e) => onBrush(Number(e.target.value))}
        />
      </label>
      <label className="staff-toggle">
        <input type="checkbox" checked={showCam} onChange={onShowCam} />
        Camera preview
      </label>
      {showCam && video && <video className="staff-cam" ref={(el) => attach(el, video)} muted playsInline />}
      <button type="button" className="staff-reset" onClick={onReset}>
        Reset → idle
      </button>
      <p className="staff-note">Không lưu ảnh camera. Chỉ đếm lượt localStorage.</p>
    </aside>
  );
}

function attach(el: HTMLVideoElement | null, src: HTMLVideoElement) {
  if (!el || el.srcObject === src.srcObject) return;
  el.srcObject = src.srcObject;
  void el.play().catch(() => undefined);
}
