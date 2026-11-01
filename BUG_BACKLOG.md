# Wealth Pillar: backlog della Daily Review

## Review del 1 novembre 2026: correzioni pronte per il rilascio

Fonti lette: [Daily Review](https://chatgpt.com/c/6ada63ee-fa9c-83eb-8eb5-bdb886c77905)
e [review generale](https://chatgpt.com/c/6ac55d6f-ffa4-83eb-bb65-7cd5230c8cb9),
confrontate con `master` al commit `5ce837c`. Le sezioni successive documentano gli
interventi precedenti.

- Budget: gruppo derivato dalla sessione, utenti verificati con la policy finanziaria
  condivisa, letture e mutazioni SQL vincolate a gruppo e ownership. Le normali
  operazioni non possono trasferire il budget a un altro gruppo.
- Ricorrenze: verifica del gruppo di utenti e conto, inclusi i conti condivisi;
  protezione di lettura, modifica, eliminazione e cambio stato. Il dettaglio non
  espone il conto di un altro gruppo. In caso di riassegnazione scadono anche le
  cache dei precedenti utenti.
- Frequenze: dominio condiviso tra tipi e validazione del form/server. La migrazione
  Drizzle `0005_recurring_frequencies.sql` allinea PostgreSQL a `once`, `weekly`,
  `biweekly`, `monthly`, `yearly`. L'ispezione in sola lettura del database reale ha
  confermato il vecchio vincolo e l'assenza di righe `daily`/`quarterly`.
- Investimenti: creazione, modifica ed eliminazione invalidano atomicamente gli
  snapshot dal primo giorno interessato. Lo storico ricalcola i punti disponibili
  dalle posizioni correnti e conserva quelli precedenti non interessati. La lettura
  non scrive nuovi snapshot; quotazioni mancanti non diventano totali parziali.
- Date: giorno contabile esplicito in `Europe/Rome` per filtri, query, ricorrenze,
  storico, Rapporti e link al ledger. Confronti per giorni di calendario, inclusi
  mezzanotte, Capodanno, ora legale e 29 febbraio.
- Cache: scadenza immediata dei dati finanziari prima della risposta della mutazione,
  compatibile sia con Server Actions sia con i webhook Clerk;
  chiavi delle singole transazioni comprensive di gruppo e utente, filtri per tipo
  distinti anche nella cache per utente. Eliminata l'invalidazione duplicata dei budget.
- Letture complete: scansioni SQL a blocchi di 1.000 righe, con cursore che conserva
  i microsecondi PostgreSQL, per Home/Budget e snapshot dei periodi. Nessun troncamento
  dei totali. I calcoli esistenti mantengono in memoria le righe del periodo; ulteriori
  aggregazioni SQL restano un'evoluzione per volumi superiori.
- Saldi ottimistici: create/update/delete restituiscono i saldi autorevoli dei conti
  interessati, letti nella stessa transazione contabile; il client li applica al commit.
- Interfaccia: “Nuovo ciclo” nel menu del periodo, usando lo stesso menu Radix e i
  token esistenti. Verifiche responsive in italiano/inglese, tema chiaro/scuro e zoom.

Verifica locale finale: 1.021 test unitari, 56 test PostgreSQL, 71 test di calendario
per ciascuno dei tre fusi, 20 test del planner CI, TypeScript, ESLint, formattazione,
build di produzione e 6 test Playwright (4 scenari più setup e teardown) superati.
Il flusso browser registra una spesa, ricarica il ledger e verifica subito Budget,
Home e Conti. Le schermate Budget sono state verificate a 320/390/1280 px in
italiano/inglese, con temi chiaro/scuro e zoom.

La migrazione delle frequenze è verificata su PostgreSQL locale, inclusi errori
forzati e rollback. Il rilascio applica solo questa migrazione tramite Supabase;
il journal Drizzle di produzione era vuoto durante il preflight. Timeout, verifica
dei dati e rollback protetto sono descritti nel
[runbook di rilascio](docs/releases/recurring-frequency-migration.md).
L'esito dell'applicazione in produzione è riportato nella PR di rilascio.
Nessuna nuova variabile di produzione è richiesta.

La riconciliazione assistita dei giroconti importati, l'automatismo dopo l'accredito
stipendio e un nuovo motore di esecuzione delle ricorrenze sono proposte funzionali
per una successiva iterazione. Le ricorrenze restano previsioni distinte dai movimenti
registrati, come già implementato su `master`. Gli E2E usano la sessione Clerk di
sviluppo e il database locale dedicato; la CI include ora anche i test del calendario
con processo UTC, Europe/Rome e America/Los_Angeles.

Fonte: [review del 23–29 ottobre 2026](chatgpt-conversation://6ada63ee-fa9c-83eb-8eb5-bdb886c77905).
Il backlog originale contiene 21 segnalazioni, tutte corrette nel codice o nella
configurazione. La segnalazione UI manuale aggiuntiva è anch’essa corretta.

## Segnalazioni aperte

Nessuna delle 21 segnalazioni originali rimane aperta.

## Daily Review del 30 ottobre 2026 — correzioni nella PR #49

- Database: audit del progetto reale, revoca degli accessi client a schema pubblico,
  tabelle, viste, sequenze e RPC privilegiate; policy `true` rimossa. Migrazione
  `0009_server_only_data_access.sql` applicata e verificata su Supabase. I ruoli
  backend `pool_user` e `service_role` conservano i privilegi necessari.
  [Dettagli e limiti dell'audit](src/server/db/ACCESS_CONTROL.md).
- Saldi: ricalcolo in una transazione READ COMMITTED con lock della riga conto prima
  della lettura del ledger. Il lock coordina gli aggiornamenti incrementali già
  presenti; cache invalidate dopo il commit. Test PostgreSQL con interleaving
  forzati per entrate, spese, trasferimenti, modifiche e cancellazioni.
- CI React: eliminati gli aggiornamenti sincroni negli effetti di ricerca titoli,
  filtri e ledger; caricamenti derivati dalla richiesta corrente, reset coerenti
  con la query e risposte obsolete ignorate. L'eccezione TanStack Virtual resta
  limitata alla chiamata non compatibile con la memoizzazione del React Compiler.

Le correzioni applicative richiedono il merge e deploy della PR #49. Non sono
necessarie nuove variabili di ambiente; la migrazione DB è idempotente.

## Correzioni già integrate e deployate

Il deploy è stato confermato dall'utente per i commit `04c4936` e `660b36f`.

- P0: autorizzazioni delle operazioni su conti, utenti e transazioni tra gruppi.
- P1: eliminazione conto atomica con riconciliazione dei trasferimenti.
- P1: snapshot storici dei budget senza troncamento a 5.000 movimenti.
- P1: compatibilità di `ON CONFLICT` con l'indice univoco parziale degli import.
- P1: coerenza dei saldi per modifiche e cancellazioni concorrenti.
- P1: hash e prove di preparazione degli import generati e verificati dal server.
- Segnalazione manuale, aggiuntiva alle 21 della review: scroll del selettore categorie.

## Correzioni integrate in `cea24a3` (push confermato)

- P1: rifiuto della chiusura ripetuta di un periodo, senza sovrascrivere lo storico.
- P1: aggiornamento atomico delle date e degli snapshot dei periodi adiacenti,
  coordinato con le altre mutazioni dei periodi dello stesso utente.
- P1: riepiloghi dei periodi nei Report basati sull'intero intervallo necessario,
  indipendentemente dal filtro del report e dal limite della lista transazioni.

Le allocazioni storiche continuano a usare `budgets_snapshot`; la spesa nei Report
continua a seguire il ledger corrente, come previsto dal comportamento esistente.
Le correzioni non richiedono migrazioni SQL o nuove variabili di ambiente.

## Correzioni integrate in `c4a824b` (PR #35)

- P1: eliminato il doppio conteggio degli snapshot di portafoglio dopo la persistenza.
- P1: cambio email con verifica OTP, promozione a primaria in Clerk e salvataggio
  locale del profilo verificato. I webhook leggono l’identità corrente per evitare
  che eventi obsoleti ripristinino il vecchio indirizzo.
- P1: CI con lint, typecheck, test unitari, PostgreSQL e build senza segreti reali;
  protezione di master con PR e check Quality obbligatori, inclusi gli amministratori.
- P1: integrità SHA-512 del tarball SheetJS e aggiornamenti Dependabot settimanali.
- P1: Dashboard e pagina Budget condividono la lettura completa dei periodi attivi,
  senza dipendere dalla lista limitata dell’attività recente.

## Correzioni integrate nella PR #44

- P1: quotazioni assenti espresse come valori non disponibili, senza perdite fittizie
  o costi d’acquisto presentati come valore corrente; rendimenti aggregati non disponibili
  finché manca una quotazione. Data del prezzo visibile sulle posizioni.
- P1: ultimo prezzo noto mantenuto anche oltre tre giorni, inclusi prezzi precedenti
  all’acquisto; nessun prezzo futuro o totale parziale usato per nuovi snapshot.
- P1: unico aggiornamento delle preferenze, con whitelist, tipi, valori e timezone
  validati prima della persistenza; ownership e timestamp non modificabili dal client.
- P1: la Dashboard propaga errori di tutte le dipendenze, evitando risposte vuote
  memorizzabili come riepiloghi finanziari validi.
- CI: progetti unitari Node e DOM isolati, job paralleli, cache incrementali e un
  unico check `Quality` che richiede il successo di tutti i controlli.

Le correzioni non richiedono migrazioni SQL o nuove variabili di produzione.
Gli snapshot storici già presenti restano conservati; non viene riscritto il database
in produzione. Workflow e protezione sono descritti in [.github/CI.md](.github/CI.md).

## Correzioni della PR corrente

- P2: cambio lingua confermato e applicato solo dopo la risposta positiva del server;
  in caso di errore la modale resta aperta e la lingua corrente non cambia.
- P2: E2E con sessione Clerk reale, fixture PostgreSQL locali, controlli obbligatori e
  verifica della persistenza dopo reload. Eliminati mock di autenticazione non validi,
  attese fisse, test esterni d’esempio e skip condizionati alla presenza della UI.
- P2: cache aggregata Dashboard collegata alle ricorrenze; le mutazioni scadono
  immediatamente i tag, anche quando non è possibile risolvere il gruppo.
- CI: selezione dei file di test tramite dipendenze Vitest e intervallo Git; fallback
  completo per cambiamenti globali, eliminazioni e avvio manuale. Cache separate per
  contenuto e runtime, con riepiloghi di hit e dimensione. Quality verifica anche
  gli skip previsti e rifiuta fallimenti, annullamenti e skip inattesi.

Nessuna migrazione o nuova variabile è richiesta in produzione. Le variabili E2E
sono solo locali: [istruzioni](tests/README.md).

## Review UX/UI del 30 ottobre 2026

- Parser decimale unico per importi e quote; invio con Invio e incolla IT/EN coerenti,
  senza troncamenti o reinterpretazioni silenziose dei formati ambigui.
- Form conservati fino alla conferma server, con rollback ottimistico, errore inline
  annunciato e chiusura bloccata durante il salvataggio.
- Conferma eliminazione conto esplicita sulla cancellazione dei movimenti, dei
  trasferimenti e sulla rettifica degli altri saldi. Nessuna archiviazione DB introdotta.
- Obiettivi annuali definiti come quota di 1/12 per periodo, esplicitata nel form;
  importo per periodo coerente in progresso e allocazione. Non sono plafond annuali.
- Riepilogo “Utilizzo delle buste” distinto dalla spesa netta deduplicata del grafico,
  con spiegazione visibile delle categorie condivise; regole storiche delle buste conservate.
- Filtri Report ripristinati dalle props della navigazione; date invertite segnalate
  vicino al campo e pulsante Mostra disabilitato.
- Filtri conto server/client comprensivi dei trasferimenti ricevuti.
- EUR dichiarata come valuta contabile; rimossa la scelta di valute non supportate.
- Eliminazione inserimenti investimento dalla modifica, conferma nominativa e
  DELETE atomico vincolato all’utente autenticato; cache aggiornate dopo il successo.

Non sono richieste migrazioni o nuove variabili di ambiente.

## Report e flussi: correzioni del 31 ottobre 2026

- Riepiloghi dei periodi budget caricati solo aprendo Approfondimenti, tramite
  azione autenticata con gruppo ricavato dalla sessione e periodi limitati al membro.
  Errori locali al pannello e Riprova lasciano disponibile il rapporto principale.
- Date del ledger elaborate una volta e movimenti indicizzati per intervallo;
  il filtro temporale dei budget non viene ripetuto per ogni busta. Snapshot storici,
  categorie sovrapposte e quota annuale di 1/12 mantengono le regole esistenti.
- Selezione temporale ottimistica, stato Aggiornamento annunciato e periodo dei
  dati precedenti esplicito durante l'attesa. Navigazione senza salto dello scroll.
- Confronto custom con lo stesso numero di giorni di calendario, inclusi cambi
  dell'ora legale; anni mobili contigui senza giorno condiviso. Date invalide
  rifiutate invece di essere reinterpretate come il mese corrente.
- Intervallo effettivo del server condiviso da riepiloghi, categorie e Riserva,
  compreso Quest'anno quando segue il periodo budget iniziato a dicembre.
- Calendari vuoti aperti sul mese corrente; data finale proposta sul mese iniziale.
  Date custom visibili sul filtro e intervalli corrente/confronto sempre esplicitati.
- Anno scorso e Mese scorso disponibili nel selettore esteso, senza aggiungere
  nuovi chip alla barra principale. Tutte le categorie espandibili con link ai movimenti.
- Gli errori dei Movimenti e dei metadati vengono propagati alla pagina di errore,
  con Riprova che rinnova i dati; nessuna risposta vuota di successo viene creata
  per nascondere un errore nella cache.

Confronto locale sullo stesso dataset sintetico: 5.000 movimenti, 12 periodi,
5 budget, circa 6.418 ms prima e 276 ms dopo, con risultati identici.
La misura riguarda il calcolo, non la latenza di produzione o i Core Web Vitals.
Nessuna migrazione o nuova variabile di produzione è richiesta.
