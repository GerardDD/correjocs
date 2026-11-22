import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { IDS } from './vocabularis';

const persona = z.object({
  nom: z.string(),
  // "catala" vol dir dels Països Catalans (vegeu les regles d'admissió).
  catala: z.boolean().default(false),
});

const manual = z.object({
  url: z.string().url(),
  tipus: z.enum(['oficial', 'comunitat', 'botiga']),
  format: z.enum(['pdf', 'web', 'video']),
  autoria: z.string().optional(),
  comprovat: z.coerce.date(),
});

const edicioCatalana = z.object({
  editorial: z.string(),
  any: z.number().int().optional(),
  isbn_ean: z.string().optional(),
  multillengua: z.boolean().default(false),
});

const estat = z.enum(['disponible', 'descatalogat', 'anunciat', 'desconegut']);

/** Comprova que tots els ids siguin del vocabulari controlat. */
const delVocabulari = (conjunt: Set<string>, nom: string) =>
  z.array(z.string()).default([]).superRefine((valors, ctx) => {
    for (const v of valors) {
      if (!conjunt.has(v)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${v}" no és del vocabulari ${nom}. Afegeix-lo a dades/${nom}.yml o corregeix la fitxa.`,
        });
      }
    }
  });

const jocs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/jocs' }),
  schema: z
    .object({
      titol: z.string(),
      titol_original: z.string().optional(),
      altres_titols: z.array(z.string()).default([]),

      motius: z.array(z.enum(['autoria', 'edicio', 'manual'])).min(1),

      autors: z.array(persona).min(1),
      illustradors: z.array(persona).default([]),

      editorial_original: z.string().optional(),
      any_original: z.number().int().optional(),
      edicio_catalana: edicioCatalana.optional(),

      expansions: z
        .array(
          z.object({
            titol: z.string(),
            any: z.number().int().optional(),
            edicio_catalana: edicioCatalana.optional(),
            manuals: z.array(manual).default([]),
            estat: estat.optional(),
          }),
        )
        .default([]),

      manuals: z.array(manual).default([]),

      jugadors_min: z.number().int().min(1),
      jugadors_max: z.number().int().min(1),
      jugadors_millor: z.array(z.number().int()).default([]),
      durada_min: z.number().int().optional(),
      durada_max: z.number().int().optional(),
      edat_min: z.number().int().optional(),
      complexitat: z.number().min(1).max(5).optional(),
      dependencia_idioma: z.enum(['cap', 'baixa', 'mitjana', 'alta', 'total']),

      mecaniques: delVocabulari(IDS.mecaniques, 'mecaniques'),
      temes: delVocabulari(IDS.temes, 'temes'),
      tipus: delVocabulari(IDS.tipus, 'tipus'),

      estat: estat,
      estat_comprovat: z.coerce.date().optional(),
      botigues: z
        .array(z.object({ nom: z.string(), url: z.string().url() }))
        .default([]),

      web_oficial: z.string().url().optional(),
      imatge: z
        .object({
          fitxer: z.string(),
          autoria: z.string(),
          llicencia: z.string(),
          font: z.string().url().optional(),
        })
        .optional(),

      resum: z.string().max(220),

      bgg: z
        .object({
          id: z.number().int(),
          nota: z.number().optional(),
          pes: z.number().optional(),
          rang: z.number().int().optional(),
        })
        .optional(),

      revisat: z.coerce.date(),
      esborrany: z.boolean().default(false),

      // Dades d'aquesta fitxa que encara s'han de comprovar amb l'editorial.
      // NO es publica mai: no surt a la pàgina del joc ni al catàleg. Serveix
      // per generar VERIFICACIONS-PENDENTS.md amb `npm run verificacions`.
      verificar: z.array(z.string()).default([]),
    })
    .refine((d) => d.jugadors_max >= d.jugadors_min, {
      message: 'jugadors_max ha de ser més gran o igual que jugadors_min',
      path: ['jugadors_max'],
    })
    .refine(
      (d) =>
        !d.motius.includes('edicio') ||
        !!d.edicio_catalana ||
        d.expansions.some((e) => !!e.edicio_catalana),
      {
        message:
          "motiu 'edicio': cal una edicio_catalana al joc base o en alguna expansió",
        path: ['edicio_catalana'],
      },
    )
    .refine(
      (d) =>
        !d.motius.includes('manual') ||
        d.manuals.length > 0 ||
        d.expansions.some((e) => e.manuals.length > 0),
      {
        message:
          "motiu 'manual': cal almenys un manual al joc base o en alguna expansió",
        path: ['manuals'],
      },
    )
    .refine(
      (d) =>
        !d.motius.includes('autoria') ||
        d.autors.some((a) => a.catala) ||
        d.illustradors.some((i) => i.catala),
      {
        message:
          "motiu 'autoria': cal almenys una persona dels Països Catalans",
        path: ['autors'],
      },
    ),
});

// ---------------------------------------------------------------------------
// Opinions personals
//
// Un fitxer per joc a src/content/opinions/, amb EL MATEIX NOM que la fitxa:
// l'opinió de src/content/jocs/panda-spin.md és src/content/opinions/panda-spin.md.
// Van a part de les fitxes perquè les fitxes són dades que es poden verificar i
// una opinió no: així no es barregen mai. Si una opinió no té fitxa, la
// compilació falla (ho comprova src/opinions.ts).
//
// Els fitxers que comencen per "_" (com _plantilla.md) no es carreguen.
// Per crear-ne una: npm run opinio -- <nom-de-la-fitxa>
// ---------------------------------------------------------------------------

const opinions = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/opinions' }),
  schema: z
    .object({
      // Quan l'has escrita i, si la tornes a tocar de veritat, quan.
      data: z.coerce.date(),
      actualitzada: z.coerce.date().optional(),

      // Qui la signa. Per defecte, el titular del web.
      autoria: z.string().default('MrBr.'),

      // Una frase que resumeixi l'opinió, opcional. Si hi és, surt a la fitxa
      // i a la llista d'opinions. La compilació falla si s'hi deixa el text de
      // la plantilla, perquè no es torni a publicar per error.
      veredicte: z
        .string()
        .max(160)
        .refine((v) => !v.startsWith('Una frase que resumeixi'), {
          message: "El veredicte encara és el text de la plantilla: escriu-ne un o esborra la línia.",
        })
        .optional(),

      // Nota opcional d'1 a 5 (admet mitges: 3.5). Si no la poses, no surt.
      nota: z
        .number()
        .min(1)
        .max(5)
        .multipleOf(0.5)
        .optional(),

      // Context que dona credibilitat a l'opinió. Tot opcional.
      partides: z.number().int().min(1).optional(),
      jugadors_provats: z.array(z.number().int().min(1)).default([]),
      // Per a qui el recomanaries, en una frase: "famílies amb criatures de 8 anys".
      ideal_per: z.string().optional(),

      a_favor: z.array(z.string()).default([]),
      en_contra: z.array(z.string()).default([]),

      // Mentre hi treballes: no es publica enlloc.
      esborrany: z.boolean().default(false),
    })
    .refine((d) => !d.actualitzada || d.actualitzada >= d.data, {
      message: "'actualitzada' no pot ser anterior a 'data'",
      path: ['actualitzada'],
    }),
});

export const collections = { jocs, opinions };
