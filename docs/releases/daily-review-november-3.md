# Daily Review del 2–3 novembre 2026

Fonte: [Wealth Pillar – Daily Review](https://chatgpt.com/c/6ada63ee-fa9c-83eb-8eb5-bdb886c77905).
Le criticità delle review precedenti risultano già trattate nel backlog. Questo
intervento completa i tre problemi confermati rimasti al 3 novembre e prepara il
collaudo operativo della consegna delle notifiche nella PR #58.

## Cambi degli investimenti

- La valuta dell’investimento indica la valuta della quotazione. Costo d’acquisto e
  imposte sono importi contabili in EUR, come nei calcoli e nei campi importo esistenti.
- `currency_rate` conserva il cambio all’acquisto, espresso in EUR per unità di valuta.
  Il form carica il valore esistente: cambiare soltanto il nome non lo riscrive a 1.
  Creare una posizione USD o cambiare da EUR a USD richiede un cambio esplicito e positivo,
  validato anche sul server. Per EUR si usa 1.
- Valore corrente e storico giornaliero usano invece la serie `USD/EUR` alla data della
  valutazione, includendola nelle letture batch, nel job quotazioni e nel job snapshot.
  L’ultimo cambio valido precedente viene mantenuto durante chiusure di mercato;
  un cambio futuro non viene anticipato. In assenza di prezzo o cambio il totale
  corrente è non disponibile e il job non persiste uno snapshot parziale.
- I costi e gli snapshot già persistiti non vengono convertiti o riscritti tramite
  migrazione. Un vecchio cambio pari a 1 può essere un dato inserito oppure il precedente
  default: non viene interpretato automaticamente. Controllarlo rispetto alla distinta
  d’acquisto se si vuole correggere il costo storico della posizione.
- Il provider resta Twelve Data e non richiede nuove variabili. Occorre accesso alla
  serie forex USD/EUR con la chiave già configurata. Se il piano/provider non la fornisce,
  i valori USD restano esplicitamente incompleti. La convenzione base/controvaluta è
  documentata dal [provider](https://twelvedata.com/docs).

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

1. Applicare con credenziali di migrazione le migrazioni ancora mancanti del journal
   Drizzle, inclusa `0007_bank_notifications.sql` della PR e poi
   `0008_category_reference_guards.sql`, **prima di pubblicare il nuovo codice**.
   Non applicare di nuovo manualmente migrazioni già registrate. La nuova query
   del catalogo richiede la funzione installata dalla migrazione 0008.
2. Pubblicare il codice. Eseguire il job quotazioni e verificare che USD/EUR sia
   disponibile prima di considerare completi i portafogli contenenti posizioni USD.
3. Configurare e collaudare la coda locale iOS seguendo la matrice di consegna.
   Iniziare in modalità di verifica manuale; confrontare con l’estratto conto.

Nessuna operazione di migrazione, backfill o cancellazione viene eseguita in produzione
durante questo intervento. Per tornare al codice precedente, lasciare i trigger di
integrità installati. Un’eventuale rimozione degli stessi richiede prima il rollback
applicativo e la sospensione delle scritture alle categorie e ai loro riferimenti.

## Verifica locale

1.066 test unitari e 99 test PostgreSQL verificati, inclusi i casi di concorrenza,
quotazioni invarianti e snapshot EUR/USD. Il test dei permessi richiede il ruolo
locale `postgres`; sul cluster temporaneo creato con un diverso superutente è stato
eseguito nuovamente dopo aver creato quel ruolo. TypeScript, lint, calendario nei tre
fusi previsti e build di produzione verificati con credenziali sintetiche.
La matrice browser E2E completa e il collaudo fisico iOS non sono dichiarati superati.
