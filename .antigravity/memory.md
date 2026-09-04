# Self-Improving Loop Persistent Memory (Wealth-Pillar)

Questo file funge da livello di memoria a lungo termine persistente per l'agente. Tutte le lezioni apprese, le correzioni di bug ricorrenti, le regole di configurazione scoperte e i vincoli architetturali devono essere documentati qui per evitare il ripetersi di errori.

---

## Log delle Correzioni e Lezioni Apprese

*Nessuna anomalia registrata al momento.*

---

## Vincoli di Configurazione e Ambiente del Progetto

- **Package Manager**: `pnpm` (non utilizzare `npm` o `yarn`).
- **Framework**: Next.js (App Router).
- **Database**: Drizzle ORM con PostgreSQL.
- **Testing**: Vitest per unit/integration, Playwright per E2E.
- **Type Checking**: `tsc --noEmit`.
- **Linter**: ESLint.
- **Obsidian Wiki**: `/Users/ivanapiscitelli/Documents/Dev/Colloquio Edo/WikiDev/wealth-pillar`.

---

## Linee Guida di Auto-Miglioramento ed Economia Token (ACE/MCE)

1. **Routing dei Modelli**:
   - Fase di Investigazione: Modelli veloci (Gemini Flash).
   - Fase di Ristrutturazione Complessa: Max Mode.
2. **Context Compaction**: Sintetizzare l'output di tool e logs in elenchi compatti prima di inviarli al modello principale.
3. **Sotto-Agenti**: Utilizzare sempre sotto-agenti (`research`) per esplorare file ed evitare la saturazione della finestra di contesto del thread principale.
