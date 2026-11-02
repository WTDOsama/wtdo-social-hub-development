/**
 * توليد أيقونات PWA من شعار SVG الأصلي باستخدام sharp.
 * التشغيل: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const logo = readFileSync(join(outDir, "logo.svg"));

async function render(size, file) {
  await sharp(logo, { density: 300 }).resize(size, size).png().toFile(join(outDir, file));
  console.log(`✓ ${file} (${size}×${size})`);
}

await render(192, "icon-192.png");
await render(512, "icon-512.png");
await render(180, "apple-touch-icon.png");

/* أيقونة maskable: شعار ضمن المنطقة الآمنة فوق خلفية كاملة */
const inner = Math.round(512 * 0.72);
const offset = Math.round((512 - inner) / 2);
const innerPng = await sharp(logo, { density: 300 }).resize(inner, inner).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#101817" },
})
  .composite([{ input: innerPng, top: offset, left: offset }])
  .png()
  .toFile(join(outDir, "maskable-512.png"));
console.log("✓ maskable-512.png (512×512, safe zone)");
console.log("تم توليد جميع الأيقونات بنجاح");