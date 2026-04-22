// =============================================================
// fix-mojibake.mjs — reemplaza secuencias UTF-8 mal codificadas
//   por sus caracteres correctos.
//   Ejemplo: "Ã­" -> "í", "â€”" -> "—", "Â·" -> "·"
//
// Uso: node scripts/fix-mojibake.mjs <rutaArchivo>
// =============================================================
import fs from "node:fs";
import path from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/fix-mojibake.mjs <file>");
  process.exit(1);
}
const full = path.resolve(file);
let content = fs.readFileSync(full, "utf8");

// ORDEN: patrones más largos primero, para no destruir subcadenas.
const replacements = [
  // Comillas tipográficas
  ["â€œ", "\u201C"],
  ["â€\u009D", "\u201D"],
  ["â€™", "\u2019"],
  ["â€˜", "\u2018"],
  // Guiones
  ["â€”", "—"],
  ["â€“", "–"],
  // Operadores / símbolos
  ["â‰ˆ", "≈"],
  ["âˆ’", "−"],  // minus sign (U+2212)
  ["âˆ'", "−"],
  ["âˆ−", "−"],
  ["â†'", "→"],
  ["Ã—", "×"],   // multiplication sign (U+00D7)
  // Signos
  ["Â·", "·"],
  ["Â¿", "¿"],
  ["Â¡", "¡"],
  ["Â°", "°"],
  // Vocales con tilde minúsculas
  ["Ã¡", "á"],
  ["Ã©", "é"],
  ["Ã­", "í"],
  ["Ã³", "ó"],
  ["Ãº", "ú"],
  ["Ã±", "ñ"],
  ["Ã¼", "ü"],
  // Vocales con tilde mayúsculas
  ["Ã\u0081", "Á"],
  ["Ã‰", "É"],
  ["Ã\u008D", "Í"],
  ["Ã“", "Ó"],
  ["Ãš", "Ú"],
  ["Ã‘", "Ñ"],
  // Cualquier Â huérfano residual (al final)
  ["Â", ""],
];

let totalChanges = 0;
for (const [from, to] of replacements) {
  const before = content;
  content = content.split(from).join(to);
  const diff = (before.length - content.length) / (from.length - to.length || 1);
  if (before !== content) {
    totalChanges += Math.abs(diff);
  }
}

fs.writeFileSync(full, content, "utf8");
console.log(
  `OK: ${path.relative(process.cwd(), full)} — ${totalChanges} reemplazos`
);
