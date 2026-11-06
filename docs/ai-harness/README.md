# Harness di Wealth Pillar

`AGENTS.md` contiene i contratti del progetto. Il setup condiviso funziona senza
skill, ruoli, hook o percorsi personali. Versioni e comandi restano nel manifest e
nella CI. Le preferenze personali stanno in `~/.codex`, fuori dal repository.

## Contesto e workflow

- Caricare solo i file e i riferimenti utili alla richiesta. Le skill sono
  procedure facoltative; evitare catene di workflow che ripetono la stessa analisi.
- Il percorso finanziario può usare `wealth-pillar-flow`. I due ruoli in
  `.codex/agents/` servono per deleghe autorizzate; non impongono una pipeline e
  non cambiano modello o permessi.
- `.codex/config.toml` disabilita per nome 34 skill di stack estranei al progetto
  attuale: AWS/Bedrock, Cloudflare e pagamenti BizAway. Il filtro vale anche per
  copie omonime e non disinstalla le skill. Se cambia lo stack, rimuovere la voce
  pertinente o impostare `enabled = true` prima di usarla. Non limita il budget
  del catalogo con un troncamento arbitrario.
- Gli hook SessionStart/Stop e il contatore personale dei prompt sono ritirati.
  Nessuna suite parte a ogni fine turno. I controlli già riusciti si ripetono
  quando cambiano input rilevanti, non dopo ogni messaggio.

## Verifica

Servono le versioni Node/pnpm dichiarate dal progetto, dipendenze installate e
Python 3.11+ per i soli script dell'harness (libreria standard).

```sh
python3 scripts/ai-harness/doctor.py
python3 scripts/ai-harness/test_check.py
python3 scripts/ai-harness/check.py
pnpm run harness:eval
```

`doctor.py` controlla solo i file condivisi e i riferimenti dei ruoli; non legge
la home, non avvia agenti e non prova l'efficacia comportamentale delle istruzioni.
La CI esegue doctor e test dell'orchestratore nel job di selezione.

`check.py` esegue typecheck e lint; `--quick` esplicita questo default.
`harness:eval` è l'unico alias per `check.py --full`: aggiunge le regressioni
finanziarie nei tre fusi già usati dalla CI e la suite unitaria. Il report locale
è `output/ai-harness/quality-gate.json`; errori di avvio dell'ambiente sono distinti
dai controlli falliti. Nessuna modifica a DNS, credenziali o servizi viene applicata.

Usare prima il test mirato alla modifica. Il controllo completo resta esplicito;
non sostituisce build, integration o E2E e non è un motivo per eseguirli contro
produzione. Il workflow CI e il suo check `Quality` restano il merge gate.

## Cosa versionare

| Includere nella PR                                | Tenere locale / non pushare                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `AGENTS.md`, `.agents/skills/wealth-pillar-flow/` | `~/.codex/`, `~/.agents/`, backup e configurazioni personali                   |
| `.codex/config.toml`, `.codex/agents/*.toml`      | Trust degli hook, autenticazione, sessioni, log e endpoint privati             |
| `scripts/ai-harness/`, queste istruzioni          | `output/ai-harness/`, cache Python, report e trascrizioni                      |
| Alias in `package.json`, CI e rimando Copilot     | Inventario dello ZIP, ricevute della migrazione, vecchi report `.antigravity/` |

La allowlist in `.gitignore` espone solo config e ruoli TOML condivisi sotto
`.codex/`. Non copiarvi il config personale. Per la PR usare percorsi espliciti;
controllare `git diff --cached` prima del commit, senza aggiungere l'intera home.

Eliminati dall'albero condiviso: i vecchi hook e relativi test, l'inventario della
migrazione, `scripts/harness-eval.mjs` e il suo unico preload `patch-dns.cjs`.
Il nuovo alias conserva l'accesso al controllo completo senza quel workaround.
I file ritirati sono conservati nel backup privato dell'intervento.

## Intervento personale del 6 novembre 2026

Otto cartelle di skill identiche sono archiviate dalla copia in `~/.agents`;
resta quella in `~/.codex/skills`. Due cloni locali Supabase sono archiviati a
favore del plugin collegato, il cui entrypoint Supabase è aggiornato da 0.1.0 a
0.1.2. I contenuti gestiti da plugin non vengono modificati. Le 18 specializzazioni
restano disponibili: descrizioni più corte e quattro ruoli generali semplificati.
Sette workflow generali non caricano più a catena rubriche e pipeline importate;
i riferimenti di dominio restano disponibili per richieste pertinenti.

Misura statica prima/dopo: istruzioni personali + progetto **7118 → 3493 byte
(50.9% in meno)**; sette workflow **15764 → 4818 byte**.
Sono dimensioni dei file controllati, non token fatturati né una misura della
qualità. L'effetto va verificato su richieste comparabili: correttezza,
regressioni, interventi dell'utente, token e tempo se il client li espone. Non
aggiungere nuova strumentazione o aggiornare memoria senza una necessità concreta.

Il backup privato contiene gli originali, la ricevuta e le istruzioni di
ripristino. Il cambiamento del catalogo e delle istruzioni si vede in una nuova
sessione; non riduce retroattivamente il contesto di quella in corso. Un eventuale
ripristino degli hook richiede la normale revisione di fiducia del client.

Fonti ufficiali verificate il 6 novembre 2026:
[best practice](https://learn.chatgpt.com/guides/best-practices),
[skill e caricamento progressivo](https://learn.chatgpt.com/docs/build-skills),
[filtri skills.config](https://learn.chatgpt.com/docs/config-file/config-reference),
[semantica Stop e trust degli hook](https://learn.chatgpt.com/docs/hooks).
