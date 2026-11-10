"use client";

import { useEffect, useState } from "react";
import { models, type ModelConfig } from "@/config/models.config";
import { loadImage } from "@/lib/assets";
import { createFaceLandmarker, INNER_LIP_INDEXES } from "@/lib/mediapipe";
import { resolveTeethMask, exportMaskPng, type TeethMask } from "@/lib/teethMask";
import { createCanvas } from "@/lib/geom";

type Row = {
  model: ModelConfig;
  auto: TeethMask | null;
  resolved: TeethMask | null;
  overlayUrl: string;
  autoOverlayUrl: string;
  error?: string;
};

export default function MaskTool() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("Đang chạy FaceLandmarker…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Row[] = [];
      for (const model of models) {
        try {
          const white = await loadImage(model.whiteSrc);
          const w = white.naturalWidth;
          const h = white.naturalHeight;
          let auto: TeethMask | null = null;
          try {
            const lm = await createFaceLandmarker();
            const result = lm.detect(white);
            const face = result.faceLandmarks?.[0];
            if (face && face.length > 415) {
              const poly = INNER_LIP_INDEXES.map((i) => ({ x: face[i].x * w, y: face[i].y * h }));
              const { canvas, ctx } = createCanvas(w, h);
              ctx.drawImage(white, 0, 0);
              ctx.beginPath();
              poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
              ctx.closePath();
              ctx.fillStyle = "rgba(0, 196, 179, 0.45)";
              ctx.fill();
              ctx.strokeStyle = "#fff";
              ctx.lineWidth = 4;
              ctx.stroke();
              auto = await resolveTeethMask({ ...model, teethMaskSrc: undefined, polygon: undefined }, white);
              const autoOverlay = composeOverlay(white, auto);
              out.push({
                model,
                auto,
                resolved: await resolveTeethMask(model, white),
                overlayUrl: composeOverlay(white, await resolveTeethMask(model, white)),
                autoOverlayUrl: autoOverlay,
              });
              void canvas;
              continue;
            }
          } catch (e) {
            setStatus(`FaceLandmarker: ${e instanceof Error ? e.message : e}`);
          }
          const resolved = await resolveTeethMask(model, white);
          out.push({
            model,
            auto,
            resolved,
            overlayUrl: composeOverlay(white, resolved),
            autoOverlayUrl: composeOverlay(white, resolved),
            error: auto ? undefined : "FaceLandmarker không thấy mặt — dùng mask PNG / heuristic",
          });
        } catch (e) {
          out.push({
            model,
            auto: null,
            resolved: null,
            overlayUrl: "",
            autoOverlayUrl: "",
            error: e instanceof Error ? e.message : "fail",
          });
        }
        if (cancelled) return;
        setRows([...out]);
      }
      setRows(out);
      setStatus("Xong.");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mask-tool" data-testid="mask-tool">
      <h1>TUNE TO WHITE — teeth mask</h1>
      <p>{status}</p>
      <p>
        Auto = MediaPipe FaceLandmarker inner-lip + brightness refine. Override bằng <code>teethMaskSrc</code>{" "}
        hoặc <code>polygon</code> trong <code>models.config.ts</code>.
      </p>
      <div className="mask-grid">
        {rows.map((row) => (
          <section className="mask-card" key={row.model.id} data-testid={`mask-${row.model.id}`}>
            {row.autoOverlayUrl && (
              <div>
                <div>Auto overlay</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.autoOverlayUrl} alt={`${row.model.id} auto mask`} />
              </div>
            )}
            {row.overlayUrl && (
              <div>
                <div>Resolved (config)</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.overlayUrl} alt={`${row.model.id} resolved mask`} />
              </div>
            )}
            <div className="mask-meta">
              <strong>{row.model.id}</strong> — {row.model.name}
              <br />
              auto: {row.auto ? `${row.auto.source} r=${row.auto.radius.toFixed(0)}` : "—"}
              <br />
              resolved: {row.resolved ? `${row.resolved.source} r=${row.resolved.radius.toFixed(0)}` : "—"}
              <br />
              zoom: {JSON.stringify(row.model.zoom)}
              {row.error && (
                <>
                  <br />
                  {row.error}
                </>
              )}
              <br />
              {row.resolved && (
                <button
                  type="button"
                  onClick={() => download(exportMaskPng(row.resolved!), `${row.model.id}_teeth_mask.png`)}
                >
                  Export mask PNG
                </button>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function composeOverlay(white: HTMLImageElement, mask: TeethMask) {
  const w = white.naturalWidth;
  const h = white.naturalHeight;
  const { canvas, ctx } = createCanvas(w, h);
  ctx.drawImage(white, 0, 0);
  ctx.globalAlpha = 0.55;
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(mask.canvas, 0, 0);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#00c4b3";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(mask.cx, mask.cy, mask.radius, 0, Math.PI * 2);
  ctx.stroke();
  return canvas.toDataURL("image/png");
}

function download(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
}
