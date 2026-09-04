# Antigravity Agent Rules: Self-Improving Loop (Wealth-Pillar)

Queste regole governano il comportamento dell'agente all'interno del progetto Wealth-Pillar, implementando un ciclo di auto-miglioramento continuo e una memoria persistente cross-chat.

---

## 0. Persistent LLM Wiki Memory Protocol (MANDATORIO)

- **Vault Location**: `/Users/ivanapiscitelli/Documents/Dev/Colloquio Edo/WikiDev/wealth-pillar/`
- **Contratto**: Allineato allo schema descritto in `WIKI.md`.

### A. All'inizio di OGNI nuova chat/sessione:
1. **NON scansionare l'intera codebase da zero.**
2. Leggi immediatamente `WikiDev/wealth-pillar/index.md` e la sezione recente di `WikiDev/wealth-pillar/log.md`.
3. Se l'utente chiede modifiche a un dominio, feature o flusso specifico, leggi la pagina wiki dedicata in `domain/`, `features/` o `flows/` utilizzando i `[[wikilinks]]`.

### B. Durante il flusso di lavoro (Commit, Bug, Feature, Decisioni):
1. **Dopo ogni Commit**: Assicurati che il log in `WikiDev/wealth-pillar/log.md` sia aggiornato (tramite il Git Hook o la skill `cursor-commit-wiki-update`).
2. **Alla scoperta / risoluzione di un Bug**: Registra la causa radice, il fix e i file impattati in `WikiDev/wealth-pillar/critical-points.md` o in una scheda in `concepts/`, ed appendi la voce nel log.
3. **Alla definizione di un Flusso / Nuova Feature**: Crea/aggiorna la scheda corrispondente in `features/` o `flows/` ed aggiorna `index.md`.
4. **Fine Sessione**: Esegui `cursor-update-wiki-from-context` per consolidare il sapere acquisito.

---

## 1. Ciclo a 5 Livelli (Execution, Evaluation, Reflection, Memory, Optimization)

### Execution Layer
- Ricevi la richiesta ed esegui le modifiche al codice.
- Mantieni il contesto compatto applicando l'Agentic Context Engineering (ACE).

### Evaluation Layer
- **Mandatario**: Esegui `pnpm harness:eval` prima di dichiarare qualsiasi attività completata.
- Non fare affidamento su valutazioni soggettive; l'esito deve essere binario (Pass/Fail).

### Reflection Layer
- In caso di fallimento, analizza `.antigravity/eval_report.json`.
- Identifica la causa radice, formula un'ipotesi correttiva e ripeti.

### Memory Layer
- Al termine di una sessione in cui è stato risolto un problema non banale, aggiorna `.antigravity/memory.md` e la wiki Obsidian `/Users/ivanapiscitelli/Documents/Dev/Colloquio Edo/WikiDev/wealth-pillar/self-improving-loop-memory.md`.

### Optimization Layer
- Riduci l'uso di token: delega le scansioni estese di codice a sotto-agenti di ricerca isolati (`research`).
- Utilizza modelli veloci per linting e test, e riserva modelli complessi (Opus/Max Mode) solo per refactoring ad alta complessità.

---

## 2. Definizione dei Verification Checkpoints

- Ogni modifica del codice deve essere registrata e validata in un file `verification_checkpoint.md` nella cartella degli artefatti dell'agente.
- Il file `verification_checkpoint.md` deve includere:
  1. I file modificati.
  2. L'esito di `pnpm harness:eval` (inclusi gli output dei test superati/falliti).
  3. L'analisi degli errori se si sono verificati fallimenti intermedi.
