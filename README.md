# TUNE TO WHITE — Close Up kiosk

Game lau vết ố răng cho booth event Close Up (agency **LINKED**). Portrait 1080×1920, chạy offline trên mini PC + Chrome kiosk. Webcam + MediaPipe HandLandmarker, luôn có fallback chuột/touch.

Không timer, không điểm. Flow: idle → hướng dẫn 2–3s → lau → **Next** (hover-dwell ~1s) → người mẫu tiếp theo → màn end → tự về idle.

## Chạy local

```bash
npm install
npm run dev          # http://127.0.0.1:43123
```

Build kiosk:

```bash
npm run build
npm start            # http://127.0.0.1:43123
```

Mở `/?input=mouse` nếu không có webcam. Staff panel: `Shift+S` hoặc phím `` ` ``.

Hai UI mode (cùng flow lau, không timer/điểm):

| Mode | URL | Mô tả |
| --- | --- | --- |
| Face (mặc định) | `/` hoặc `/?mode=face` | Người mẫu thật, không đổi |
| Teeth only | `/?mode=teeth` | 3D pearl tooth PNG trên nền spotlight, stain marble code |

Staff panel có dropdown **UI mode**. `gameConfig.defaultMode` trong `src/config/game.config.ts` (mặc định `"face"`).

## Chrome kiosk (mini PC)

1. Cắm webcam lên **đỉnh giữa** màn hình dọc 55–65". Dán vạch **STAND HERE** ~1–1.2 m.
2. Tắt sleep / auto-update Windows. Chrome flag gợi ý:

```bash
chrome.exe --kiosk --kiosk-printing --autoplay-policy=no-user-gesture-required ^
  --use-fake-ui-for-media-stream --allow-running-insecure-content ^
  http://127.0.0.1:43123
```

Linux:

```bash
google-chrome --kiosk --autoplay-policy=no-user-gesture-required \
  http://127.0.0.1:43123
```

App **không** gọi mạng lúc runtime. WASM + model MediaPipe nằm trong `/public/mediapipe` (copy lúc `npm install`). Font Google chỉ tải lúc **build**.

## PLACEHOLDER copy

End-screen lines **"WHITE NOW"** and **"Nụ cười trắng sáng — tức thì."** are **not client-approved**. They live in **one file**, clearly marked:

`src/config/placeholders.config.ts`

Replace that file when the client signs off. Do not hard-code slogan text in overlays. `game.config.ts` re-exports the same values as `slogan.line1 / line2`. Palette/fonts: `src/theme/theme.ts`.

Teeth-only headlines (`KHỬ VÀNG` / `LÀM SÁNG`) are also PLACEHOLDER in that file (`teethHeadlineA` / `teethHeadlineB`). Style-only — not client-approved copy. The Close Up training-doc page used as a look reference is **not** in this repo and must not be shipped.

## Teeth-only assets

Edit **one file**: `src/config/teeth.config.ts`.

| Setting | File | Notes |
| --- | --- | --- |
| `teethAssets.toothWhiteSrc` | `/public/teeth/tooth_white.webp` | 3D pearl tooth, RGBA. Reused on solo/pair/cluster (scaled/rotated). |
| `teethAssets.backgroundSrc` | `/public/teeth/bg_spotlight_temp.webp` | **TEMP** 1080×1920 spotlight plate. When the final bg lands, change this one path to `/teeth/bg_spotlight.png` (or `.webp`). |
| Per-round `whiteSrc` | optional | Full 1080×1920 scene; skips compositing. |

Ivory-marble stain is generated in code and **clipped to the tooth PNG alpha**. Clean % is sampled only where that alpha is opaque. Optional `yellowSrc` still works if a stained render is pixel-aligned.

## Secrets & data — none in this repo

- **No API keys, tokens, passwords, `.env` secrets, or credentials** are stored here.
- No analytics, no remote APIs, no third-party runtime calls.
- Play counters use `localStorage` key `tune-to-white-stats` (anonymous numbers only). **No camera frames, names, or other personal data.**
- Model portraits are AI-generated event assets, not photographs of identifiable real people.

## Thay ảnh người mẫu

1. Bỏ file 9:16 vào `public/models/` (webp/jpg/png). Nên giữ ≤ 1080×1920.
2. Sửa **một file**: `src/config/models.config.ts`.

Mỗi round:

| Field | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `whiteSrc` | có | Ảnh răng trắng |
| `yellowSrc` | không | Overlay răng ố **cùng pixel**. Mặc định **tắt** — stain vẽ bằng code trên mask răng. Model 1 yellow bị lệch, đừng bật. Model 2/3 có file yellow để test; chỉ bật nếu nhìn vào miệng thấy khớp. |
| `teethMaskSrc` | không | PNG trắng = răng. Override auto mask. |
| `polygon` | không | Mảng `[x,y]` 0–1. Override auto mask. |
| `zoom` | không | `{ cx, cy, scale }` — miệng ~55–60% chiều cao frame. `scale` ≤ ~1.6 (ảnh upscale từ 941×1672). |
| `threshold` / `brushSize` | không | Override global |

**Auto mask:** MediaPipe FaceLandmarker (inner lip) + lọc sáng trong miệng. Preview/export: `/tools/mask`.

Placeholder cũ (illustration, không phải người thật) đã được thay bằng 3 round ảnh dự án. Cơ chế config không đổi — drop file + sửa `models.config.ts`.

## Staff

- Reset, mouse mode, threshold, brush, preview camera/FPS
- Đếm lượt `localStorage` key `tune-to-white-stats` — **không** lưu ảnh camera

## Test

```bash
npx playwright install chromium
npm run test:e2e
```

## Không làm

Không deploy Vercel, không public GitHub. Demo chạy local.
