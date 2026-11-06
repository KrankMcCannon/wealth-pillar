# Setup Codex di Wealth Pillar

`AGENTS.md` contiene i contratti condivisi. Modelli, credenziali, permessi, MCP e
preferenze personali rimangono nella home. Manifest, runner e CI determinano
versioni e comandi. Il progetto non richiede hook o pipeline di agenti.

## Memoria e cache delle decisioni

La memoria nativa Codex è abilitata nel setup personale (`features.memories`,
`memories.generate_memories`, `memories.use_memories`). La generazione è gestita
dal client e non garantisce che una decisione sia disponibile immediatamente.
Non modificare gli indici generati o i database interni: per aggiornamenti
esplicitamente richiesti seguire il meccanismo di note indicato dal runtime.

Per Wealth Pillar esiste anche una cache locale immediata, autorizzata dall'utente,
in `output/ai-harness/knowledge/entries.json`, esclusa da Git. Funziona senza API,
servizi, dipendenze Python aggiuntive o scritture nella home. Non viene caricata
integralmente a ogni messaggio: cercare prima solo i termini pertinenti.

```sh
python3 scripts/ai-harness/knowledge.py find currency
python3 scripts/ai-harness/knowledge.py put currency-inputs --kind decision --claim 'Transazioni, serie ricorrenti e budget mantengono input e payload EUR; gli investimenti hanno un contratto FX separato.' --source docs/currencies.md --source src/components/form/modal-fields/modal-amount-field.tsx
python3 scripts/ai-harness/knowledge.py forget currency-inputs
```

Ogni voce ha ID stabile, tipo (`decision`, `preference`, `pitfall`), affermazione
breve, data UTC e hash SHA-256 dei file citati. `put` sostituisce lo stesso ID;
le scritture sono serializzate e il file viene sostituito atomicamente. `find`
restituisce al massimo otto risultati e segnala `stale` se una fonte cambia o
scompare. `current` significa soltanto che le fonti sono invariate: non dimostra
che l'affermazione sia corretta o completa. Il controllo non rileva cambiamenti
in file non citati; includere le dipendenze rilevanti e leggere il codice prima
di modificarlo. Una copia della cache in un altro checkout non è accettata.

Memorizzare decisioni riutilizzabili, correzioni dell'utente e trappole verificate
che risparmiano un'indagine futura. Non memorizzare ipotesi, cronache di turno,
segreti, dati finanziari o stato di produzione. I tipi di file privati più comuni
e le fonti esterne al repository vengono rifiutati, ma il testo della nota va
comunque controllato. Non salvare l'esito di una vecchia suite come prova attuale.
Preferenze e regole durevoli condivise appartengono ad AGENTS.md; la cache serve
da indice delle evidenze. Correggere o eliminare le note superate, senza duplicarle.
La cache è ricostruibile; cancellare gli output può rimuoverla.

## Regole di ingegneria, skill e ruoli

Le salvaguardie comuni si applicano tramite AGENTS.md anche quando nessuna skill
viene invocata. [engineering.md](engineering.md) contiene i controlli concreti per
causa originaria, riuso, layer, dipendenze circolari, pattern, contratti d'errore,
stato/atomicità, autorizzazioni, costo operativo, resilienza e self-review.
Il riferimento finanziario di `wealth-pillar-flow` collega gli invarianti al codice.
Queste regole non introducono un analizzatore statico delle dipendenze e non
promettono l'assenza di errori sulla sola base di typecheck/lint.

I workflow generali utili restano disponibili; quelli adattati al progetto leggono
il riferimento di ingegneria direttamente. Usare un workflow primario adatto alla
richiesta, rispettando un nome scelto esplicitamente dall'utente. Non invocare
`wealth-pillar-flow` come secondo workflow solo per acquisire i contratti di dominio.

| Workflow | Scopo |
| --- | --- |
| `bug-flow`, `feature-flow`, `refactor-flow` | Correzione alla causa, nuove funzionalità e refactor con invarianti espliciti. |
| `review-pr`, `pr-description` | Review con verifica dei falsi positivi e riproduzione; descrizioni basate sul diff effettivo. |
| `architecture-plan`, `solution-loop` | Piano o confronto di alternative per una scelta concreta, senza pipeline obbligatorie. |
| `investigate-codebase`, `generate-tests` | Ownership, chiamanti, riuso e verifiche significative con i runner reali. |
| `ponytail`, `ponytail-review` | Scala di riuso/semplicità e review della complessità superflua. |
| `cleanup-dead-code`, `simplify-code` | Rimozione di codice realmente obsoleto e semplificazione conservativa. |
| `project-flow` | Contratti tra repository verificati o confini runtime collegati. |
| `wealth-pillar-flow` | Tracciamento del dominio tra UI, azioni, use case, repository e stato client. |

Sono conservate le policy d'invocazione originali: Ponytail, la sua review,
cleanup, simplify, solution-loop, review-pr e pr-description erano esplicite e
restano richiamabili per nome, per esempio `$ponytail` o `$review-pr`.
Le regole di base sul riuso e la semplicità rimangono comunque in AGENTS.md.
I livelli Ponytail sono disponibili senza derogare a funzionalità richieste,
validazione, accessibilità, sicurezza e test nei framework del progetto.

La correzione del setup ha recuperato sei skill dall'archivio e riattivato i sette
workflow generali precedentemente esclusi; `pr-description` è stata arricchita.
I 14 workflow personali hanno ora istruzioni coerenti con questi contratti.
La pulizia resta limitata agli stack e ai workflow estranei: 57 nomi rimangono
esclusi nei config personale e di progetto. AWS/Cloudflare e dettagli BizAway
non vengono reintrodotti. Nessun limite arbitrario ai token del catalogo.
Per cambiare stack aggiornare il filtro pertinente.

I due ruoli Wealth Pillar servono per deleghe autorizzate e mantengono modello e
permessi della sessione; restano quattro ruoli generali nel setup personale.
Modelli, MCP, plugin, permessi e memoria nativa non sono cambiati da questo
ripristino. I plugin per documenti/PDF restano gestiti dai rispettivi plugin.

Gli originali e le ricevute rimangono nei backup privati: l'intervento iniziale e
il ripristino di ingegneria hanno backup separati. Le istruzioni di ripristino
richiedono di preservare eventuali modifiche successive. Dopo una variazione dei
filtri, riavviare Codex e aprire una nuova sessione per aggiornare il catalogo.

Osservazione storica sul client `0.167.0-alpha.3.2`: `config/read` leggeva le
esclusioni del progetto, ma `skills/list` continuava a segnare attivi sette nomi
esclusi soltanto lì. Le corrispondenti esclusioni personali erano rispettate.
Il ripristino rimuove i filtri sui workflow generali da entrambi i config; dopo
aggiornamenti del client verificare il catalogo effettivo. Il catalogo dei plugin
collegati dalla chat può contenere altre skill rispetto alla lettura locale.

## Verifica e versionamento

```sh
python3 scripts/ai-harness/doctor.py
python3 scripts/ai-harness/test_check.py
python3 scripts/ai-harness/test_knowledge.py
python3 scripts/ai-harness/check.py
pnpm run harness:eval
```

`doctor.py` verifica TOML, selettori portabili e riferimenti condivisi, senza leggere
la home o avviare agenti. I test della cache provano persistenza, sostituzione,
invalidazione e isolamento. La CI esegue doctor e i test Python nel job di selezione.
Questi controlli non provano l'efficacia comportamentale delle istruzioni: valutarla
su richieste reali, osservando errori, ripetizioni e correzioni necessarie.

`check.py` esegue typecheck e lint. L'alias esplicito `harness:eval` aggiunge la suite
unitaria e i controlli finanziari nei tre fusi della CI. Il report rimane in
`output/ai-harness/quality-gate.json`; gli errori d'ambiente sono distinti dai test
falliti. Build, integration ed E2E restano controlli separati. Non eseguire test
contro produzione; il check CI `Quality` resta il merge gate. Ripetere un controllo
riuscito solo se cambiano input rilevanti.

Versionare istruzioni, skill e relativi riferimenti, config/ruoli condivisi,
script e test dell'harness. Tenere fuori da Git cache, backup, report, home,
autenticazione e sessioni. L'allowlist `.codex/` espone solo config e ruoli TOML.

Documentazione ufficiale consultata il 6 novembre 2026:
[selettori e scoperta delle skill](https://learn.chatgpt.com/docs/build-skills),
[configurazione e memoria](https://learn.chatgpt.com/docs/config-file/config-reference).
