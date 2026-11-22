# correjocs.cat

Catàleg de jocs de taula que es poden jugar en català: fets per autors dels
Països Catalans, editats en català, o amb manual en català encara que la caixa
no ho sigui.

Web estàtica feta amb [Astro](https://astro.build). Sense base de dades i sense
PHP, perquè l'allotjament del domini (Microplà de cdmon) no en té.

## Posar-ho en marxa

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/
npm run preview  # serveix dist/ per comprovar-ho
```

Cal Node 20 o superior.

## Com s'hi afegeix un joc

Un fitxer Markdown nou a `src/content/jocs/`. **El nom del fitxer és la URL**
(`catan.md` → `/jocs/catan/`), així que un cop publicat no s'ha de canviar mai.

L'esquema és a `src/content.config.ts` i està documentat al projecte
(*Esquema de la fitxa de joc*). Les regles que fa complir:

- Cal almenys un motiu d'inclusió: `autoria`, `edicio` o `manual`.
- Si el motiu és `edicio`, cal `edicio_catalana` al joc base o en una expansió.
- Si el motiu és `manual`, cal almenys un manual.
- Si el motiu és `autoria`, cal almenys una persona amb `catala: true`.
- Les mecàniques, els temes i els tipus han de ser ids dels vocabularis.

**Si una fitxa incompleix res d'això, `npm run build` falla i no es publica.**
És volgut: val més un error aquí que una fitxa que menteix al web.

Les expansions no tenen fitxa pròpia: van dins la fitxa del joc base.

## Dades pendents de verificar

El cos de la fitxa és text publicat: no s'hi posen avisos interns. El que
encara s'ha de contrastar amb l'editorial va al camp `verificar` de la
capçalera, una llista de punts:

```yaml
verificar:
  - "Any de l'edició catalana."
  - "Si l'expansió es ven en català a dia d'avui."
```

**Aquest camp no es publica mai**: no surt a la pàgina del joc, ni al catàleg,
ni al HTML. Serveix per generar la llista de feina:

```bash
npm run verificacions   # escriu VERIFICACIONS-PENDENTS.md
```

`VERIFICACIONS-PENDENTS.md` és un fitxer generat i tampoc es publica (Astro
només publica `src/pages/` i `public/`). No s'edita a mà: quan un punt queda
comprovat, es treu del `verificar:` de la fitxa i es torna a generar.

## Opinions personals

Les opinions van **a part de les fitxes**, a `src/content/opinions/`. La fitxa
diu què és el joc (dades verificables); l'opinió diu què en pensem. Així no es
barregen mai.

**Un fitxer per joc, amb el mateix nom que la fitxa**: l'opinió de
`src/content/jocs/panda-spin.md` és `src/content/opinions/panda-spin.md`.

Per crear-ne una:

```bash
npm run opinio -- panda-spin
```

Crea el fitxer a partir de `_plantilla.md`, amb la data d'avui i **en
esborrany**. L'omples, treus `esborrany: true` i, quan arribi a `main`, es
publica. També es pot fer des del web de GitHub copiant la plantilla.

```yaml
---
data: 2026-11-22
veredicte: "Una frase que resumeixi què en penses."   # obligatori, màx. 160
nota: 4                      # opcional, d'1 a 5, admet mitges
partides: 6                  # opcional
jugadors_provats: [2, 4]     # opcional
ideal_per: "famílies amb criatures a partir de 8 anys"   # opcional
a_favor: ["…"]               # opcional
en_contra: ["…"]             # opcional
# actualitzada: 2027-01-10   # si la reescrius
# autoria: "MrBr."           # per defecte
---

El text, en Markdown. Tot el que hi escriguis es publica.
```

On surt:

- **A la fitxa del joc**, en un bloc propi al final, marcat com a opinió
  personal (`/jocs/<nom>/#opinio`).
- **Al catàleg**, amb l'etiqueta *Amb opinió* i un filtre *Només jocs amb
  opinió* (`?opinio=si`). El filtre només apareix quan n'hi ha almenys una.
- **A `/opinions/`**, de la més recent a la més antiga.

Regles que fa complir la compilació:

- Si una opinió no té fitxa de joc amb el mateix nom, **la compilació falla**.
- Una opinió en esborrany, o d'un joc en esborrany, no surt enlloc.
- Els fitxers que comencen per `_` no es carreguen mai.

## Vocabularis

A `dades/mecaniques.yml`, `dades/temes.yml` i `dades/tipus.yml`. Cada terme té
un `id` i una `etiqueta`.

**L'`id` no s'ha de canviar mai** un cop s'ha fet servir: forma part de les URLs
dels filtres. L'etiqueta sí que es pot retocar quan vulguis.

Afegir-hi termes ha de ser una decisió, no un accident d'escriptura: si les
mecàniques es multipliquen amb variants de la mateixa cosa, els filtres deixen
de servir per a res.

## Desplegament

`.github/workflows/desplega.yml` compila i puja `dist/` a `/web` del servidor
cada cop que es fa push a `main`.

Cal donar d'alta dos secrets a GitHub (*Settings → Secrets and variables →
Actions → New repository secret*):

| Secret | Valor |
|---|---|
| `FTP_USUARI` | l'usuari d'FTP del panell de cdmon |
| `FTP_CONTRASENYA` | la seva contrasenya |

Es posen directament a GitHub i no han de passar per enlloc més. Al panell de
cdmon es poden consultar i canviar a *Gestió de l'allotjament → Gestors de
fitxers → FTP*, i també s'hi pot crear un usuari secundari limitat a `/web`,
que és més prudent que fer servir el principal.

El pla actual no té sFTP (cdmon el reserva als plans Senior o superiors) ni
accés per SSH, per això el desplegament va per FTP.

## Pendent abans de difondre el web

- [ ] Omplir `src/pages/avis-legal.astro`: hi ha dades entre claudàtors.
- [ ] Revisar o esborrar les fitxes de prova de `src/content/jocs/`. **`azul.md`
      porta un enllaç de manual inventat que apunta a `example.org`.**
- [ ] Crear la bústia de contacte al panell de cdmon.
- [ ] Decidir la política d'imatges. L'esquema exigeix `llicencia` a cada
      imatge, així que no se'n pot publicar cap sense dir-ne la procedència.

## Coses a saber

- **Els filtres es fan al navegador.** Totes les fitxes es generen al HTML i el
  JavaScript n'amaga les que no encaixen. Això vol dir que el web funciona sense
  JavaScript (es veuen tots els jocs) i que els cercadors ho indexen tot. Quan
  el catàleg passi d'un parell de milers de fitxes caldrà repensar-ho.
- **Els filtres actius queden a la URL**, així que una cerca es pot compartir i
  enllaçar.
- **La transferència del pla és d'1 GB al mes.** Per això no hi ha tipografies
  externes ni biblioteques de JavaScript. Si algun dia hi ha imatges, convé
  servir-les des de fora de cdmon.
- **Res de BoardGameGeek.** El bloc `bgg` de l'esquema només desa l'id per poder
  enllaçar-hi. La llicència de la seva API és només per a usos no comercials i
  el model econòmic del projecte encara no està decidit.
