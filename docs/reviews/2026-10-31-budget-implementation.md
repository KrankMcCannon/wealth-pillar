# Budget: implementazione e decisioni di redesign

Base: master dopo la PR #53, `6d46aae`. Sono stati implementati gli interventi B01–B20 dell'audit. Nessuna modifica allo schema o alle regole di calcolo finanziario.

## Redesign integrato

La struttura proposta è consistente con il prodotto: il compito principale è controllare il ciclo corrente, poi capire una busta e infine modificarne la configurazione. La pagina principale mantiene contesto, riepilogo e buste; il dettaglio rimane una route navigabile; le operazioni rimangono nelle sheet esistenti. Palette, tipografia, navigazione e componenti di form sono quelli del progetto.

L'andamento diventa una sezione espandibile prima delle buste: è raggiungibile senza scorrere l'intero elenco e non occupa spazio quando non serve. Lo storico porta ai Rapporti con il membro conservato e la sezione dei periodi già aperta. La lista delle buste dà precedenza agli sforamenti e ai limiti raggiunti; oltre cinque buste offre anche ordinamento per nome. Desktop usa due colonne, mobile una colonna con nome e importi su righe distinte.

Non sono stati introdotti tab aggiuntivi: un solo grafico non costituisce un'attività autonoma e mensili/annuali sono buste confrontabili nello stesso periodo. Non è stata creata una seconda pagina storico, che duplicherebbe i Rapporti già sviluppati. Non è stato trasformato il dettaglio in una modale: categorie e transazioni richiedono spazio, navigazione e un URL condivisibile. Queste scelte riducono destinazioni e cambi di contesto senza nascondere dati necessari.

## Riscontro dei venti interventi

| ID  | Implementazione                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B01 | Membro, periodo corrente e date con anno nella panoramica e nel dettaglio.                                                                                                                              |
| B02 | Etichette Rimanente, Speso e Limite; stato testuale Limite raggiunto o Limite superato.                                                                                                                 |
| B03 | Riepilogo negativo in colore spesa con etichetta di sforamento; disponibilità positiva in colore testo. La classe income è rimossa tramite merge dei token.                                             |
| B04 | Utilizzo delle buste distinto dalle uscite nette; spiegazione espandibile e avviso che nomina le buste con categorie condivise.                                                                         |
| B05 | Nuovo ciclo visibile nel contesto del periodo; correzione della chiusura rimane nel menu secondario.                                                                                                    |
| B06 | Header e gestione del ciclo indipendenti dall'esistenza di buste; stato vuoto con creazione; riepilogo mancante con messaggio e Ricarica.                                                               |
| B07 | Anteprima dinamica di membro e date prima/dopo nel nuovo ciclo; segnalazione della retrodatazione. La correzione mostra vecchia e nuova chiusura e l'impatto sui riepiloghi e sul periodo adiacente.    |
| B08 | Grafico con scala in EUR, selettore giornaliero utilizzabile da tastiera e puntatore, valore annunciato e tabella alternativa. Solo movimenti registrati, senza spacciare giorni futuri per previsione. |
| B09 | Posizioni temporali calcolate sul giorno ISO, senza getDate nel fuso del browser. Le date estreme usano le stesse coordinate dei dati; la tabella espone tutte le date con anno.                        |
| B10 | Conteggio totale separato dalle otto righe di anteprima; giornata troncata marcata esplicitamente con totale completo; link con numero e filtri conservati.                                             |
| B11 | Categorie incluse in sezione espandibile con ricerca, separate dalle categorie con spesa.                                                                                                               |
| B12 | Nomi su più righe, importo su una riga propria su mobile, griglia desktop a due colonne; verifica responsive.                                                                                           |
| B13 | Campo Obiettivo annuo e quota numerica per ciclo aggiornata durante la digitazione, con spiegazione che non è un accantonamento reale.                                                                  |
| B14 | Selettore categorie con nomi delle altre buste e riepilogo delle sovrapposizioni prima di salvare, filtrato per membro e senza includere la busta stessa. Le condivisioni restano consentite.           |
| B15 | Stato testuale delle buste e ordinamento per criticità, poi percentuale e nome; opzione alfabetica per elenchi più lunghi.                                                                              |
| B16 | Nome accessibile del link con busta, residuo e stato; focus e semantica dei link conservati.                                                                                                            |
| B17 | Storico periodi raggiungibile con un link, membro nella query e sezione Rapporti aperta.                                                                                                                |
| B18 | Icona neutra Wallet per la busta; il suo significato non cambia riordinando le categorie. Le icone delle singole categorie restano nel dettaglio.                                                       |
| B19 | Eliminato il doppione del nome nel riepilogo del dettaglio; Modifica accanto al contesto; andamento espandibile vicino al riepilogo.                                                                    |
| B20 | Spazio inferiore di 11 rem più safe area e FAB compatibile con l'inset. Ultime buste e azioni portabili sopra la navigazione fissa.                                                                     |

## Correzioni funzionali emerse durante le prove

Creazione e modifica aggiornavano il negozio client ma potevano lasciare il riepilogo server obsoleto. Le action ora scadono immediatamente i tag delle letture Budget e del riepilogo del gruppo, quindi il form richiede il modello aggiornato. È il comportamento di lettura dopo scrittura previsto da [Next.js updateTag](https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/updateTag.mdx).

La cancellazione dalla pagina del budget poteva rigenerare il dettaglio ormai assente e lasciare aperta la conferma su una pagina in errore. Dopo autorizzazione e cancellazione riuscita, l'action riporta alla pagina Budget dello stesso membro. Il redirect è una destinazione interna fissa, distinta per IT/EN. I chiamanti che eliminano da altri contesti conservano il comportamento esistente.

## Verifica

Suite unitaria completa: 1.006 test superati, inclusi i nuovi test del grafico; tre ulteriori test di regressione delle action superati. TypeScript, lint e build di produzione superati. Nove verifiche Chromium superate, incluse preparazione e pulizia. I test browser Budget verificano contesto e ciclo, storico con membro, anteprima parziale, categorie ricercabili, slider e tabella, quota annuale, categorie sovrapposte, sforamento, pagina senza buste e reflow IT/EN a 320/390/1280 pixel nei temi chiaro/scuro. Ingrandimento simulato al 200% tramite CSS zoom.

Le mutazioni browser riguardano soltanto PostgreSQL locale e un utente Clerk di sviluppo. Nessun salvataggio di dati reali o migrazione in produzione. Le immagini di consegna usano fixture. Restano da verificare screen reader reali, zoom nativo dei diversi browser e contrasto strumentale: i controlli automatici non sono una certificazione WCAG.
