"use client";

import { forwardRef } from "react";
import type { UiMode } from "@/game/types";

export const CursorRing = forwardRef<HTMLDivElement, { visible: boolean; mode?: UiMode }>(
  function CursorRing({ visible, mode = "face" }, ref) {
    const spot = mode === "teeth";
    return (
      <div
        ref={ref}
        className={`cursor-ring ${spot ? "cursor-spot" : ""} ${visible ? "is-on" : ""}`}
        data-testid="cursor-ring"
      >
        {spot ? <span className="cursor-beam" /> : null}
      </div>
    );
  },
);
