# Wealth Pillar — Wiki (schema Karpathy LLM Wiki)

Questo file è il **contratto** tra repository e vault Obsidian: descrive dove vive la wiki, come è organizzata e come aggiornarla.

## Vault Obsidian

- **Cartella wiki (Markdown)**: `/Users/ivanapiscitelli/Documents/Dev/Colloquio Edo/WikiDev/wealth-pillar/`
- **Apri in Obsidian**: la configurazione `.obsidian` è nella cartella parent **`WikiDev`**. Apri il vault **`WikiDev`**, poi naviga nella cartella **`wealth-pillar`** per l’indice (`index.md`). In alternativa puoi aggiungere `wealth-pillar` come root secondaria o spostare `.obsidian` se preferisci un vault dedicato solo a questo progetto.

## Pattern a tre strati (Karpathy)

1. **Raw sources** — input immutabili esterni (articoli, export, commit). Non si “correggono” per allineare la wiki; si citano e si sintetizza nelle pagine wiki.
2. **Wiki** — Markdown curato dall’LLM/engineering: entità, concetti, flussi, link `[[wikilinks]]`. È lo strato che **compone** nel tempo.
3. **Schema** — questo `WIKI.md` (e convenzioni sotto) definiscono struttura e ownership.

## Convenzioni nel vault

| Elemento                    | Regola                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Lingua**                  | Italiano per le pagine wiki.                                                                                       |
| **Indice**                  | `index.md` — catalogo con link `[[...]]` alle pagine principali.                                                   |
| **Cronologia**              | `log.md` — **append-only**. Ogni voce inizia con `## [YYYY-MM-DD] ingest \| …` o `## [YYYY-MM-DD] commit \| …`.    |
| **Concetti / architettura** | File `.md` nella radice del vault (`architecture.md`, `data-model.md`, …).                                         |
| **Entità dominio**          | Cartella `domain/` — una pagina per entità (User, Budget, …).                                                      |
| **Moduli feature**          | Cartella `features/` — allineata a `src/features/<nome>`.                                                          |
| **Flussi utente**           | Cartella `flows/` — journey prodotto, linguaggio accessibile.                                                      |
| **Link**                    | Preferire `[[wikilinks]]` Obsidian; path del codice come markdown `[path](path)` relativi al repo `wealth-pillar`. |

## Allineamento al codice

- Il codice sorgente di verità è questo repository (`wealth-pillar`).
- Dopo refactor o release, aggiornare le pagine wiki interessate e **appendere una riga** in `log.md`.

## Hook opzionale (non attivo)

Per sincronizzare la wiki dopo i commit, esiste lo skill `commit-wiki-update` e un hook documentato in `.cursor/skills/obsidian-llm-wiki/SKILL.md`. Richiede opt-in esplicito; non è configurato da questo file.
