"use client";

export function IdleOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      className={`idle-overlay ${visible ? "is-on" : ""}`}
      data-testid="idle-overlay"
      aria-hidden={!visible}
    >
      <img className="idle-logo" src="/brand/logo_closeup.png" alt="Close Up White Now" />
      <div className="idle-title">TUNE TO WHITE</div>
      <div className="idle-sub">Đưa tay lên — lau sạch vết ố</div>
      <div className="idle-cta">
        <div className="idle-pulse" />
        <div className="idle-stand">STAND HERE &amp; WAVE</div>
        <div className="idle-stand-vi">ĐỨNG ĐÂY · VẪY TAY</div>
      </div>
      <div className="floor-mark">
        <span className="chev" />
        <span className="chev" />
        <span className="chev" />
      </div>
    </div>
  );
}
