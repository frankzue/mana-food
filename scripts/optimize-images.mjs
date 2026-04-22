#!/usr/bin/env node
/**
 * Optimiza las PNG de /public/productos/ generando variantes WebP a 900px
 * y reemplaza los originales. Preserva transparencia (alpha).
 *
 * Uso:   node scripts/optimize-images.mjs
 *        node scripts/optimize-images.mjs --dry-run
 *        node scripts/optimize-images.mjs --keep-png
 */

import { readdir, stat, rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PRODUCTOS_DIR = path.resolve("public", "productos");
const MAX_DIMENSION = 900;
const WEBP_QUALITY = 82;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const KEEP_PNG = args.has("--keep-png");

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function optimizeOne(file) {
  const fullPath = path.join(PRODUCTOS_DIR, file);
  const { size: originalSize } = await stat(fullPath);
  const input = await readFile(fullPath);

  const pipeline = sharp(input, { failOn: "none" }).resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });

  const webpBuffer = await pipeline
    .webp({ quality: WEBP_QUALITY, alphaQuality: 92, effort: 5 })
    .toBuffer();

  const webpPath = path.join(
    PRODUCTOS_DIR,
    file.replace(/\.png$/i, ".webp")
  );

  if (!DRY_RUN) {
    await writeFile(webpPath, webpBuffer);
    if (!KEEP_PNG) await rm(fullPath);
  }

  const ratio = ((1 - webpBuffer.length / originalSize) * 100).toFixed(1);
  return {
    file,
    originalSize,
    newSize: webpBuffer.length,
    ratio: Number(ratio),
    newName: path.basename(webpPath),
  };
}

async function main() {
  const all = await readdir(PRODUCTOS_DIR);
  const pngs = all.filter((f) => f.toLowerCase().endsWith(".png"));

  if (pngs.length === 0) {
    console.log("No PNGs found in", PRODUCTOS_DIR);
    return;
  }

  console.log(
    `${DRY_RUN ? "[DRY RUN] " : ""}Optimizando ${pngs.length} PNG → WebP (máx ${MAX_DIMENSION}px, q=${WEBP_QUALITY})…\n`
  );

  const results = [];
  for (const f of pngs) {
    try {
      const r = await optimizeOne(f);
      results.push(r);
      console.log(
        `✓ ${r.file.padEnd(32)} ${fmtKB(r.originalSize).padStart(10)} → ${fmtKB(
          r.newSize
        ).padStart(10)}  (-${r.ratio}%)`
      );
    } catch (err) {
      console.error(`✗ ${f}: ${err.message}`);
    }
  }

  const totalBefore = results.reduce((s, r) => s + r.originalSize, 0);
  const totalAfter = results.reduce((s, r) => s + r.newSize, 0);
  const overallRatio = ((1 - totalAfter / totalBefore) * 100).toFixed(1);

  console.log(
    `\nTotal: ${fmtKB(totalBefore)} → ${fmtKB(totalAfter)}  (-${overallRatio}%)`
  );
  if (!DRY_RUN && !KEEP_PNG) {
    console.log(
      "\nPNGs originales eliminados. Actualiza las rutas en lib/mock-data.ts a .webp si aún no lo hiciste."
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
