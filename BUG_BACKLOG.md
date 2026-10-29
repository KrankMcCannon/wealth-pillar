# Wealth Pillar: backlog della Daily Review

Fonte: [review del 23–29 ottobre 2026](chatgpt-conversation://6ada63ee-fa9c-83eb-8eb5-bdb886c77905).
Il backlog originale contiene 21 segnalazioni. Nove sono state corrette nel codice;
ne restano 12 (9 P1 e 3 P2). Le segnalazioni ancora aperte provengono dalla review
statica e vanno riconfermate durante il rispettivo intervento.

## Segnalazioni aperte, in ordine di intervento

| Ordine | Priorità | Segnalazione                                                                             |
| -----: | :------: | ---------------------------------------------------------------------------------------- |
|      1 |    P1    | Doppio conteggio degli snapshot del portafoglio appena creati                            |
|      2 |    P1    | Quotazioni mancanti interpretate come prezzo zero                                        |
|      3 |    P1    | Investimenti esclusi dallo storico dopo tre giorni senza quotazioni                      |
|      4 |    P1    | Preferenze utente salvate senza validazione adeguata                                     |
|      5 |    P1    | Modifica dell'email non sincronizzata con Clerk                                          |
|      6 |    P1    | Mancanza di CI e controlli obbligatori su master                                         |
|      7 |    P1    | Dependabot bloccato da una dipendenza senza hash di integrità                            |
|      8 |    P1    | Budget della Dashboard calcolati su transazioni potenzialmente incomplete                |
|      9 |    P1    | Errori di caricamento della Dashboard trasformati in dati vuoti e memorizzabili in cache |
|     10 |    P2    | Cambio lingua confermato prima del salvataggio effettivo                                 |
|     11 |    P2    | Test E2E che possono passare senza verificare il comportamento previsto                  |
|     12 |    P2    | Mancata invalidazione esplicita della Dashboard dopo modifiche alle ricorrenze           |

## Correzioni già integrate e deployate

Il deploy è stato confermato dall'utente per i commit `04c4936` e `660b36f`.

- P0: autorizzazioni delle operazioni su conti, utenti e transazioni tra gruppi.
- P1: eliminazione conto atomica con riconciliazione dei trasferimenti.
- P1: snapshot storici dei budget senza troncamento a 5.000 movimenti.
- P1: compatibilità di `ON CONFLICT` con l'indice univoco parziale degli import.
- P1: coerenza dei saldi per modifiche e cancellazioni concorrenti.
- P1: hash e prove di preparazione degli import generati e verificati dal server.
- Segnalazione manuale, aggiuntiva alle 21 della review: scroll del selettore categorie.

## Correzioni della sessione corrente, da integrare

- P1: rifiuto della chiusura ripetuta di un periodo, senza sovrascrivere lo storico.
- P1: aggiornamento atomico delle date e degli snapshot dei periodi adiacenti,
  coordinato con le altre mutazioni dei periodi dello stesso utente.
- P1: riepiloghi dei periodi nei Report basati sull'intero intervallo necessario,
  indipendentemente dal filtro del report e dal limite della lista transazioni.

Le allocazioni storiche continuano a usare `budgets_snapshot`; la spesa nei Report
continua a seguire il ledger corrente, come previsto dal comportamento esistente.
Le correzioni non richiedono migrazioni SQL o nuove variabili di ambiente.
