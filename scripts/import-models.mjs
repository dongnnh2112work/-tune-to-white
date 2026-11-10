#!/usr/bin/env node
/**
 * Convert incoming 1080×1920 PNG portraits in /uploads to public/models WebP.
 * Usage: node scripts/import-models.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const uploads = path.join(root, "uploads");
const out = path.join(root, "public/models");
fs.mkdirSync(out, { recursive: true });

const names = ["model1_white", "model1_yellow", "model2_white", "model2_yellow", "model3_white", "model3_yellow"];
const files = fs.readdirSync(uploads);

for (const name of names) {
  const hit = files.find((f) => f.startsWith(name) && f.endsWith(".png"));
  if (!hit) {
    console.warn("skip", name);
    continue;
  }
  const dest = path.join(out, `${name}.webp`);
  await sharp(path.join(uploads, hit)).webp({ quality: 90, effort: 5 }).toFile(dest);
  console.log(name, "->", dest, fs.statSync(dest).size);
}
