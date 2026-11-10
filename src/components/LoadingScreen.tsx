"use client";

export function LoadingScreen({ visible, label }: { visible: boolean; label: string }) {
  return (
    <div className={`loading-screen ${visible ? "is-on" : ""}`} data-testid="loading-screen">
      <img src="/brand/logo_closeup.png" alt="Close Up" />
      <div className="loading-title">TUNE TO WHITE</div>
      <div className="loading-bar">
        <span />
      </div>
      <div className="loading-label">{label}</div>
    </div>
  );
}
