import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const ART = path.resolve("artifacts");
fs.mkdirSync(ART, { recursive: true });

async function shot(page: Page, name: string) {
  const dest = path.join(ART, name);
  await page.screenshot({ path: dest, type: "png" });
  return dest;
}

async function waitPhase(page: Page, phase: string) {
  await page.waitForFunction((p) => window.__TUNE__?.getPhase() === p, phase, { timeout: 20_000 });
}

test("full mouse playthrough + screenshots", async ({ page }) => {
  await page.goto("/?input=mouse&fast=1");
  await page.waitForFunction(() => Boolean(window.__TUNE__));
  await waitPhase(page, "idle");
  await page.waitForSelector('[data-testid="stage"][data-loaded="1"]');
  await page.waitForTimeout(600);
  await shot(page, "01-idle.png");

  await page.locator('[data-testid="stage"]').click({ position: { x: 540, y: 960 } });
  await waitPhase(page, "play");

  const teeth = await page.evaluate(() => window.__TUNE__!.getTeethCentroid());
  const stage = page.locator('[data-testid="stage"]');
  const box = await stage.boundingBox();
  expect(box).toBeTruthy();
  const scale = (box!.width ?? 1080) / 1080;
  const toScreen = (x: number, y: number) => ({
    x: box!.x + x * scale,
    y: box!.y + y * scale,
  });

  const origin = toScreen(teeth.x, teeth.y);
  await page.mouse.move(origin.x, origin.y);
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2;
    const r = teeth.radius * (0.15 + (i % 5) * 0.12);
    const p = toScreen(teeth.x + Math.cos(ang) * r, teeth.y + Math.sin(ang) * r);
    await page.mouse.move(p.x, p.y, { steps: 4 });
  }
  await page.waitForTimeout(300);
  await shot(page, "02-play-midwipe.png");

  await page.evaluate(() => window.__TUNE__!.forceClean());
  await waitPhase(page, "win");
  await page.waitForTimeout(250);
  await shot(page, "03-win-next.png");

  const next = toScreen(540, 1700);
  await page.mouse.move(next.x, next.y);
  await waitPhase(page, "play");
  await page.evaluate(() => window.__TUNE__!.forceClean());
  await waitPhase(page, "win");
  await page.mouse.move(next.x, next.y);
  await waitPhase(page, "play");
  await page.evaluate(() => window.__TUNE__!.forceClean());
  await waitPhase(page, "win");
  await page.mouse.move(next.x, next.y);
  await waitPhase(page, "end");
  await page.waitForTimeout(400);
  await shot(page, "04-end.png");

  const phase = await page.evaluate(() => window.__TUNE__!.getPhase());
  expect(phase).toBe("end");
});

test("mask tool overlays", async ({ page }) => {
  await page.goto("/tools/mask");
  await page.waitForSelector('[data-testid="mask-model1"]', { timeout: 60_000 });
  await page.waitForSelector('[data-testid="mask-model3"] img', { timeout: 60_000 });
  await page.waitForTimeout(500);
  await shot(page, "mask-tool.png");
  const cards = page.locator(".mask-card");
  const n = await cards.count();
  for (let i = 0; i < n; i++) {
    await cards.nth(i).screenshot({ path: path.join(ART, `mask-model${i + 1}.png`) });
  }
});
