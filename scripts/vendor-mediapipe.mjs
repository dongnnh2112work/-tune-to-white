#!/usr/bin/env node
/**
 * Copy MediaPipe Tasks Vision WASM from node_modules and download
 * hand/face landmarker models into /public so the kiosk runs offline.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wasmSrc = path.join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const wasmDest = path.join(root, "public/mediapipe/wasm");
const modelDest = path.join(root, "public/mediapipe");

fs.mkdirSync(wasmDest, { recursive: true });
fs.mkdirSync(modelDest, { recursive: true });

if (fs.existsSync(wasmSrc)) {
  for (const name of fs.readdirSync(wasmSrc)) {
    fs.copyFileSync(path.join(wasmSrc, name), path.join(wasmDest, name));
  }
  console.log("Copied MediaPipe wasm -> public/mediapipe/wasm");
} else {
  console.warn("Skipping wasm copy: @mediapipe/tasks-vision not installed yet");
}

const MODELS = [
  [
    "hand_landmarker.task",
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
  ],
  [
    "face_landmarker.task",
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
  ],
];

async function ensureModel(name, url) {
  const dest = path.join(modelDest, name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10_000) {
    console.log(`Present ${name} (${fs.statSync(dest).size} bytes)`);
    return;
  }
  console.log(`Downloading ${name} …`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${name}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`Wrote ${name} (${buf.length} bytes)`);
}

await Promise.all(MODELS.map(([name, url]) => ensureModel(name, url)));
console.log("MediaPipe vendor complete.");
