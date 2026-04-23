/**
 * Genera iconos PWA con fondo negro a partir de public/logo.png.
 * Quita píxeles casi blancos (fondo del logo) para que el rojo/amarillo resalte.
 *
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const logoPath = path.join(root, "public", "logo.png");
const outDir = path.join(root, "public", "icons");

const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };

/** Píxeles más claros que esto pasan a transparente (solo fondo blanco). */
const WHITE_CUTOFF = 248;

async function logoWithoutWhiteBg() {
  const base = sharp(logoPath).ensureAlpha();
  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8ClampedArray(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (r >= WHITE_CUTOFF && g >= WHITE_CUTOFF && b >= WHITE_CUTOFF) {
      pixels[i + 3] = 0;
    }
  }
  return sharp(Buffer.from(pixels), {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  }).png();
}

async function writeIcon(size, innerRatio, filename) {
  const inner = Math.round(size * innerRatio);
  const cut = await logoWithoutWhiteBg();
  const resized = await cut
    .resize(inner, inner, { fit: "inside", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const left = Math.max(0, Math.round((size - (meta.width ?? 0)) / 2));
  const top = Math.max(0, Math.round((size - (meta.height ?? 0)) / 2));

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BLACK,
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(path.join(outDir, filename));
}

async function main() {
  if (!fs.existsSync(logoPath)) {
    console.error("No existe", logoPath);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  // innerRatio: deja margen negro para iconos maskable / recortes del sistema
  await writeIcon(180, 0.72, "pwa-180.png");
  await writeIcon(192, 0.72, "pwa-192.png");
  await writeIcon(512, 0.72, "pwa-512.png");

  console.log("OK → public/icons/pwa-{180,192,512}.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
