// Crea una opinió nova a partir de la plantilla.
//
//   npm run opinio -- panda-spin
//
// Comprova que existeixi la fitxa src/content/jocs/<nom>.md i que no hi hagi
// ja una opinió amb aquest nom. La crea en esborrany, amb la data d'avui.

import { access, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const arrel = new URL('..', import.meta.url);
const nom = (process.argv[2] ?? '').replace(/\.md$/, '').trim();

if (!nom) {
  console.error("Cal dir de quin joc: npm run opinio -- <nom-de-la-fitxa>");
  process.exit(1);
}

const existeix = (u) => access(u).then(() => true, () => false);
const fitxa = new URL(`src/content/jocs/${nom}.md`, arrel);
const desti = new URL(`src/content/opinions/${nom}.md`, arrel);

if (!(await existeix(fitxa))) {
  console.error(`No hi ha cap fitxa src/content/jocs/${nom}.md. El nom ha de ser el de la fitxa del joc.`);
  process.exit(1);
}
if (await existeix(desti)) {
  console.error(`Ja hi ha una opinió per a aquest joc: ${fileURLToPath(desti)}`);
  process.exit(1);
}

const avui = new Date().toISOString().slice(0, 10);
const plantilla = await readFile(new URL('src/content/opinions/_plantilla.md', arrel), 'utf8');
const text = plantilla
  .replace(/^# PLANTILLA[\s\S]*?\n#\n/m, '')
  .replace(/^data: .*$/m, `data: ${avui}`);

await writeFile(desti, text, 'utf8');
console.log(`Creada ${fileURLToPath(desti)} (en esborrany). Omple-la i treu "esborrany: true" per publicar-la.`);
