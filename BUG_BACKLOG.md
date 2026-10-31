# Wealth Pillar: backlog della Daily Review

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
