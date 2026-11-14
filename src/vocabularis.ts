import { parse } from 'yaml';
import mecaniquesRaw from '../dades/mecaniques.yml?raw';
import temesRaw from '../dades/temes.yml?raw';
import tipusRaw from '../dades/tipus.yml?raw';

export type Terme = { id: string; etiqueta: string };

function carrega(raw: string, nom: string): Terme[] {
  const llista = parse(raw) as Terme[];
  const vistos = new Set<string>();
  for (const t of llista) {
    if (!t?.id || !t?.etiqueta) {
      throw new Error(`Vocabulari ${nom}: hi ha un terme sense id o sense etiqueta.`);
    }
    if (vistos.has(t.id)) {
      throw new Error(`Vocabulari ${nom}: l'id "${t.id}" està repetit.`);
    }
    vistos.add(t.id);
  }
  return llista;
}

export const MECANIQUES = carrega(mecaniquesRaw, 'mecaniques');
export const TEMES = carrega(temesRaw, 'temes');
export const TIPUS = carrega(tipusRaw, 'tipus');

export const IDS = {
  mecaniques: new Set(MECANIQUES.map((t) => t.id)),
  temes: new Set(TEMES.map((t) => t.id)),
  tipus: new Set(TIPUS.map((t) => t.id)),
};

const ETIQUETES = new Map<string, string>(
  [...MECANIQUES, ...TEMES, ...TIPUS].map((t) => [t.id, t.etiqueta]),
);

/** Etiqueta llegible d'un id de vocabulari. Si no hi és, torna l'id. */
export function etiqueta(id: string): string {
  return ETIQUETES.get(id) ?? id;
}

export const MOTIUS: Terme[] = [
  { id: 'autoria', etiqueta: 'Autoria catalana' },
  { id: 'edicio', etiqueta: 'Edició en català' },
  { id: 'manual', etiqueta: 'Manual en català' },
];

export const DEPENDENCIA: Terme[] = [
  { id: 'cap', etiqueta: 'Cap' },
  { id: 'baixa', etiqueta: 'Baixa' },
  { id: 'mitjana', etiqueta: 'Mitjana' },
  { id: 'alta', etiqueta: 'Alta' },
  { id: 'total', etiqueta: 'Total' },
];

export const ESTATS: Terme[] = [
  { id: 'disponible', etiqueta: 'Disponible' },
  { id: 'descatalogat', etiqueta: 'Descatalogat' },
  { id: 'anunciat', etiqueta: 'Anunciat' },
  { id: 'desconegut', etiqueta: 'Per comprovar' },
];
