"use client";

import { forwardRef } from "react";

export const CursorRing = forwardRef<HTMLDivElement, { visible: boolean }>(
  function CursorRing({ visible }, ref) {
    return <div ref={ref} className={`cursor-ring ${visible ? "is-on" : ""}`} data-testid="cursor-ring" />;
  },
);
