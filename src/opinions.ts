import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type Opinio = CollectionEntry<'opinions'>;
export type Joc = CollectionEntry<'jocs'>;

let memoria: Promise<Map<string, Opinio>> | null = null;

/**
 * Opinions publicables, indexades pel nom de la fitxa del joc.
 *
 * Fa fallar la compilació si una opinió no té fitxa de joc amb el mateix nom:
 * val més un error aquí que una opinió que no surt enlloc sense que ningú se
 * n'adoni. Les opinions en esborrany, i les de jocs en esborrany, no es
 * publiquen.
 */
export function opinionsPerJoc(): Promise<Map<string, Opinio>> {
  memoria ??= carrega();
  return memoria;
}

async function carrega(): Promise<Map<string, Opinio>> {
  const [opinions, jocs] = await Promise.all([
    getCollection('opinions'),
    getCollection('jocs'),
  ]);
  const perId = new Map(jocs.map((j) => [j.id, j]));

  const orfes = opinions.filter((o) => !perId.has(o.id)).map((o) => o.id);
  if (orfes.length) {
    throw new Error(
      `Hi ha opinions sense fitxa de joc: ${orfes.map((o) => `src/content/opinions/${o}.md`).join(', ')}. ` +
        `El nom del fitxer de l'opinió ha de ser el mateix que el de la fitxa a src/content/jocs/.`,
    );
  }

  return new Map(
    opinions
      .filter((o) => !o.data.esborrany && !perId.get(o.id)!.data.esborrany)
      .map((o) => [o.id, o]),
  );
}

/** "3,5 sobre 5" */
export const notaText = (n: number) =>
  `${String(n).replace('.', ',')} sobre 5`;

