// Genera VERIFICACIONS-PENDENTS.md a partir del camp `verificar` de les fitxes.
//
//   npm run verificacions
//
// El camp `verificar` no es publica mai: no surt ni a la pàgina del joc ni al
// catàleg. Aquest fitxer tampoc, perquè Astro només publica src/pages/ i
// public/. És la llista de feina per contrastar amb les editorials.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const arrel = new URL('..', import.meta.url);
const dirFitxes = new URL('src/content/jocs/', arrel);
const sortida = new URL('VERIFICACIONS-PENDENTS.md', arrel);

const noms = (await readdir(dirFitxes)).filter((n) => n.endsWith('.md')).sort();

const fitxes = [];
for (const nom of noms) {
  const text = await readFile(new URL(nom, dirFitxes), 'utf8');
  const tall = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!tall) {
    console.warn(`Avís: ${nom} no té capçalera YAML; l'ometo.`);
    continue;
  }
  const d = parse(tall[1]) ?? {};
  const punts = d.verificar ?? [];
  if (punts.length === 0) continue;
  fitxes.push({
    id: nom.replace(/\.md$/, ''),
    titol: d.titol ?? nom,
    esborrany: d.esborrany === true,
    punts,
  });
}

const avui = new Date().toLocaleDateString('ca-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const total = fitxes.reduce((n, f) => n + f.punts.length, 0);

const linies = [
  '# Verificacions pendents',
  '',
  '**Fitxer generat. No l\'editis a mà.** Surt del camp `verificar` de cada',
  'fitxa; per canviar-hi res, canvia la fitxa i torna a executar',
  '`npm run verificacions`.',
  '',
  `*Generat el ${avui} — ${total} punt${total === 1 ? '' : 's'} en ` +
    `${fitxes.length} fitx${fitxes.length === 1 ? 'a' : 'es'}.*`,
  '',
  'Aquestes notes **no es publiquen**: ni a la pàgina del joc ni al catàleg.',
  'Quan un punt quedi comprovat, treu-lo del `verificar:` de la fitxa.',
  '',
];

if (fitxes.length === 0) {
  linies.push('Cap fitxa amb dades pendents de verificar.', '');
} else {
  for (const f of fitxes) {
    linies.push(
      `## ${f.titol}${f.esborrany ? ' *(esborrany, no publicada)*' : ''}`,
      '',
      `\`src/content/jocs/${f.id}.md\` — <https://correjocs.cat/jocs/${f.id}/>`,
      '',
      ...f.punts.map((p) => `- [ ] ${p}`),
      '',
    );
  }
}

await writeFile(sortida, linies.join('\n'), 'utf8');
console.log(
  `${fileURLToPath(sortida)}: ${total} punts en ${fitxes.length} fitxes.`,
);
