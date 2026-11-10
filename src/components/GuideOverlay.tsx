"use client";

export function GuideOverlay({ visible }: { visible: boolean }) {
  return (
    <div className={`guide-overlay ${visible ? "is-on" : ""}`} data-testid="guide-overlay">
      <div className="guide-card">
        <div className="guide-hand" aria-hidden>
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
            <circle cx="44" cy="44" r="30" stroke="currentColor" strokeWidth="3" opacity="0.35" />
            <circle className="guide-ring" cx="44" cy="44" r="18" stroke="currentColor" strokeWidth="3" />
            <path
              d="M36 48c2-10 6-22 10-22 3 0 4 8 4 16v14c0 6 8 6 8 0V40c0-4 6-4 6 2v18c4 0 8 2 8 8 0 10-8 18-22 18-12 0-22-6-22-18V52c0-6 6-6 8 0v8"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="guide-title">LAU VẾT Ố</div>
        <div className="guide-body">Đưa tay theo vòng sáng, quét qua răng để làm trắng.</div>
      </div>
    </div>
  );
}
