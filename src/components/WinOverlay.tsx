"use client";

export function WinOverlay({
  visible,
  dwell,
  label,
}: {
  visible: boolean;
  dwell: number;
  label: string;
}) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - dwell);
  return (
    <div className={`win-overlay ${visible ? "is-on" : ""}`} data-testid="win-overlay">
      <button className="next-btn" data-testid="next-btn" type="button">
        <svg className="next-ring" width="112" height="112" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />
          <circle
            cx="56"
            cy="56"
            r={r}
            fill="none"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dash}
            transform="rotate(-90 56 56)"
          />
        </svg>
        <span>{label}</span>
      </button>
    </div>
  );
}
