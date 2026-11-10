/**
 * PLACEHOLDER COPY — NOT CLIENT-APPROVED.
 *
 * These strings are stand-ins for the event kiosk. They are not approved
 * Close Up / Unilever / LINKED copy. Replace this file (and only this file)
 * when the client signs off on in-game text.
 *
 * Do not scatter replacements across components.
 */
export const PLACEHOLDER = {
  /** End-screen lockup. Product name — not approved as in-game copy. */
  endSloganLine1: "WHITE NOW",
  /** End-screen tagline (Vietnamese). Placeholder only. */
  endSloganLine2: "Nụ cười trắng sáng — tức thì.",
  /**
   * Teeth-only mode headlines (style: bold white + blue outline).
   * Wording is PLACEHOLDER — inspired by training-doc layout, not approved copy.
   */
  teethHeadlineA: "KHỬ VÀNG",
  teethHeadlineB: "LÀM SÁNG",
  teethIdleSub: "Lau sạch vết ố trên răng",
  teethGuideTitle: "LAU VẾT Ố",
  teethGuideBody: "Đưa ánh sáng theo vệt, quét hết lớp ố trên răng.",
} as const;

export type PlaceholderCopy = typeof PLACEHOLDER;
