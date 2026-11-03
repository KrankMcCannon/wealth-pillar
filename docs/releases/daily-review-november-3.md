# Daily Review del 2–3 novembre 2026

Fonte: [Wealth Pillar – Daily Review](https://chatgpt.com/c/6ada63ee-fa9c-83eb-8eb5-bdb886c77905).
Le criticità delle review precedenti risultano già trattate nel backlog. Questo
intervento completa i tre problemi confermati rimasti al 3 novembre e prepara il
collaudo operativo della consegna delle notifiche nella PR #58.

## Cambi degli investimenti e valuta dell’app

L’estensione successiva richiesta dall’utente è documentata in
[Valute e cambi automatici](../currencies.md). Frankfurter gratuito fornisce i cambi
correnti e storici senza chiave. La valuta scelta nelle impostazioni (EUR, USD,
GBP, CHF) si applica a tutta l’interfaccia e ai campi importo; la contabilità resta EUR.
Il cambio all’acquisto è recuperato automaticamente dal server e viene preservato
nelle modifiche non correlate. Nessuna conversione usa un cambio estero fisso.

## Riferimenti delle categorie

La cancellazione server controlla transazioni, budget, ricorrenze (anche inattive),
snapshot storici dei budget e della spesa, dispositivi bancari, notifiche e regole
esercenti. La stessa query alimenta gli indicatori «In uso» del catalogo, limitata
al gruppo richiesto. La cancellazione effettiva legge senza cache.

La migrazione `0008_category_reference_guards.sql` aggiunge funzioni e trigger,
senza modificare le righe esistenti. Le nuove associazioni o le modifiche delle
chiavi prendono un lock condiviso sulla categoria; la cancellazione ne prende uno
esclusivo e verifica nuovamente l’utilizzo. Sono coperti entrambi gli ordini
concorrenti, compreso un DELETE SQL diretto. Anche una nuova associazione che
arriva dopo la cancellazione viene rifiutata. Il cascade del gruppo resta possibile.
Le funzioni sono disponibili soltanto ai ruoli backend già utilizzati dal progetto.

La correzione immediata richiesta dalla review è il blocco della cancellazione.
Le categorie utilizzate rimangono modificabili e leggibili; non si introduce qui
il successivo ciclo di archiviazione proposto come evoluzione del prodotto.

## Freschezza delle quotazioni

Script, percorso runtime e repository validano date e prezzi: nessuna cache viene
scritta per una risposta vuota, date impossibili/future o prezzi non numerici e non
positivi. Le quotazioni valide vengono fuse con lo storico. Una serie già presente
senza nuovi valori non rinnova `last_updated`.

`last_updated` rappresenta l’ultimo aggiornamento del contenuto della cache. La data
mostrata nell’app viene invece ricavata dall’ultima quotazione valida di ogni serie;
per il portafoglio si usa la più vecchia tra le serie richieste, incluso il cambio.
Non viene inventata la data odierna per una risposta del provider senza data.

## Notifiche iOS

L’endpoint restituisce anche l’`eventId` del client, soltanto dopo l’acquisizione
confermata, così l’automazione può spostare il file corrispondente fuori dalla coda.
I client precedenti restano compatibili: `eventId` è opzionale e la deduplicazione
per contenuto continua a funzionare.

La [ricetta Comandi Rapidi](../bank-notifications.md#coda-persistente-sul-dispositivo)
conserva un file locale per notifica prima del POST, mantiene data e identificativo
originali e descrive il reinvio dopo errori, offline e riavvio. È una configurazione
da realizzare sul dispositivo dell’utente: questa PR non installa o modifica comandi
sull’iPhone. La verifica fisica di offline, riavvio, schermo bloccato e riconciliazione
con un estratto conto anonimizzato rimane un criterio prima del rilascio automatico.

## Rilascio

1. Seguire la [procedura specifica per le due migrazioni](apply-pr58-migrations.md).
   La verifica del 3 novembre conferma che il journal Drizzle è vuoto: il migratore
   generale non va usato finché le migrazioni storiche non sono state allineate.
   Lo script preparato applica soltanto 0007 e 0008 in una transazione, prima del codice.
2. Pubblicare il codice. Eseguire il job quotazioni e verificare che USD/EUR sia
   disponibile da Frankfurter prima di considerare completi i portafogli contenenti posizioni USD.
3. Configurare e collaudare la coda locale iOS seguendo la matrice di consegna.
   Iniziare in modalità di verifica manuale; confrontare con l’estratto conto.

Nessuna operazione di migrazione, backfill o cancellazione viene eseguita in produzione
durante questo intervento. Per tornare al codice precedente, lasciare i trigger di
integrità installati. Un’eventuale rimozione degli stessi richiede prima il rollback
applicativo e la sospensione delle scritture alle categorie e ai loro riferimenti.

## Verifica locale

1.091 test unitari e 102 test PostgreSQL verificati, inclusi i casi di concorrenza,
quotazioni invarianti e snapshot EUR/USD. Il test dei permessi richiede il ruolo
locale `postgres`; sul cluster temporaneo creato con un diverso superutente è stato
eseguito nuovamente dopo aver creato quel ruolo. TypeScript, lint, calendario nei tre
fusi previsti e build di produzione verificati con credenziali sintetiche.
La matrice browser E2E completa e il collaudo fisico iOS non sono dichiarati superati.
