# Importazione notifiche bancarie

L’integrazione usa l’automazione iOS già verificata dall’utente. Non richiede
servizi a pagamento o un’app nativa. Il primo parser supporta Revolut in EUR,
con i messaggi `Hai speso` / `Hai ricevuto` e `You spent` / `You received`.
Emoji iniziali e importi italiani/inglesi sono gestiti. Credem e Trade Republic
rimangono da verificare finché i loro formati non saranno documentati.

## Attivazione

1. Applicare le due migrazioni seguendo la [procedura limitata alla PR #58](releases/apply-pr58-migrations.md).
   Il journal Drizzle del progetto è vuoto: non usare il migratore generale finché
   la sua cronologia non è stata allineata. La migrazione bancaria aggiunge tre
   tabelle; non modifica i movimenti esistenti.
2. Pubblicare il codice.
3. In **Impostazioni → Importa dalle notifiche**, scegliere il proprio conto
   Revolut EUR, un nome del dispositivo e una categoria predefinita.
4. Iniziare con verifica manuale. L’opzione di importazione automatica può essere
   scelta alla creazione di un collegamento. Un collegamento può essere revocato
   e ricreato per modificarla. L’utente deriva dalla sessione; un amministratore
   non crea token a nome di un altro membro.
5. Copiare il token mostrato una volta e inserirlo nell’automazione personale.
   Il token non viene messo negli URL, negli analytics o nei log del server.

## Comandi Rapidi

Nel trigger Revolut già funzionante, usare **Ottieni contenuto dell’URL**:

- URL: `https://<dominio-app>/api/integrations/bank-notifications`
- Metodo: POST
- Intestazioni: `Content-Type: application/json` e `Authorization: Bearer <token>`
- Corpo richiesta: JSON

```json
{
  "provider": "revolut",
  "title": "[variabile Titolo della Notifica]",
  "body": "[variabile Corpo della Notifica]",
  "occurredAt": "[variabile Data originale, formato ISO 8601 con fuso orario]"
}
```

Le parentesi sono indicazioni: inserire le variabili dinamiche, non il testo
letterale. Un timestamp valido è `2026-11-01T20:45:00+01:00`. La data di
registrazione usa il calendario Europe/Rome. L’orario originale viene conservato
nel messaggio ricevuto. Non usare “Data attuale” a ogni nuovo tentativo.
`eventId` resta opzionale per i client esistenti. Nella coda persistente descritta
sotto va generato una sola volta alla ricezione e salvato insieme al messaggio.
Non generare un UUID diverso per ogni ritentativo.

Esempio reale verificato:

```text
Titolo: Pizzeria Rosticceria N
Corpo:
🍽️ Hai speso 17 €
Saldo di EUR: 1.722,83 €
```

Questo produce un’uscita di 17,00 €, con conto e utente del collegamento. Il saldo
comunicato resta un dato di riscontro: non sovrascrive il saldo dell’app.

### Esiti e ritentativi

- **201**: ricevuta e salvata; `status` è `imported` o `pending`.
- **200**: stesso evento già ricevuto. Nessun doppio addebito.
- **400 / 413 / 415**: correggere campi, dimensione (massimo 16 KiB) o Content-Type.
- **401 / 403**: token revocato/non valido o accesso al conto rimosso. Ricreare il
  collegamento dopo avere verificato il proprio gruppo.
- **429**: attendere almeno `Retry-After` (60 secondi).
- **503** o errore di rete: conservare il messaggio e riprovare con gli stessi dati.

### Coda persistente sul dispositivo

Questa è un’importazione delle notifiche catturate, non una sincronizzazione bancaria
completa. Il server non può recuperare notifiche che iOS non ha consegnato al trigger.
Confrontare periodicamente il ledger con un estratto conto, anche in modalità automatica.

Configurare due comandi distinti sul proprio iPhone. La ricetta è una configurazione
da costruire e verificare sul dispositivo, non un comando già installato dall’app.
Usare una cartella **Sul mio iPhone**, disponibile offline, selezionata una volta
nell’azione File; non affidare il salvataggio iniziale a iCloud Drive. Creare
`Wealth Pillar/Da inviare` e `Wealth Pillar/Consegnate`. Il token sta solo nel comando
di invio, mai nel file JSON. I file contengono dati finanziari personali.

**Comando «Conserva notifica Wealth Pillar»**, chiamato dal trigger esistente:

1. Acquisire titolo, corpo e data originale una sola volta.
2. Se la sorgente ha un identificativo stabile, usare quello; altrimenti creare
   un UUID con «Genera UUID» una sola volta per questa ricezione.
3. Costruire un Dizionario con `provider`, `eventId`, `title`, `body`, `occurredAt`.
   Formattare la data ISO 8601 con fuso e convertire il dizionario in testo JSON.
4. Dare al testo il nome `<eventId>.json` e usare «Salva file» in `Da inviare`,
   senza chiedere la destinazione e senza sovrascrivere un file esistente.
   Se il salvataggio fallisce, interrompere e segnalare l’errore: non inviare prima.
5. Solo dopo il salvataggio, eseguire «Invia coda Wealth Pillar». Conservare anche
   l’azione Note già usata come copia durante il collaudo.

**Comando «Invia coda Wealth Pillar»**, eseguibile anche dalla schermata Home:

1. Ottenere i file di `Da inviare` (senza sottocartelle), filtrare `.json` e
   usare «Ripeti con ogni elemento». Ogni notifica ha il proprio file; non usare
   un unico elenco JSON condiviso che due automazioni potrebbero sovrascrivere.
2. Leggere il file come Dizionario e conservarne `eventId`. Non rigenerare data,
   identificativo o testo; inviare esattamente i campi salvati all’endpoint POST.
3. Leggere la risposta come Dizionario. La consegna è confermata soltanto se
   contiene un `id` non vuoto, `eventId` uguale a quello inviato, `status` tra
   `pending`/`imported`/`ignored` e nessun `error`. Questo vale anche per i duplicati.
4. Solo in quel caso spostare **quel file** in `Consegnate`. Non cancellare file
   dalla coda per una risposta vuota, non JSON o contenente un errore.
5. Su 429 interrompere la scansione e riprovare dopo almeno 60 secondi. Su
   401/403 conservare i file e correggere il collegamento. Su 400/413/415 conservare
   il file per correggerlo manualmente. Su 503 o errore di rete, fermarsi lasciando
   tutti i file non confermati in `Da inviare`.

Un errore di rete può interrompere automaticamente Comandi Rapidi prima del ramo
«Se»: il salvataggio precedente rende comunque recuperabile il messaggio. Eseguire
nuovamente il comando di invio dopo il ripristino della rete o il riavvio. È possibile
collegarlo a un’automazione personale a orario; autorizzazioni ed esecuzione a schermo
bloccato devono essere collaudate sulla versione iOS effettivamente usata. La cartella
`Da inviare` è anche l’indicatore visibile degli invii ancora da recuperare.

### Collaudo di consegna prima del rilascio

| Scenario                   | Risultato richiesto                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| Invio riuscito             | File in Consegnate, un evento server, saldo modificato una volta soltanto in modalità automatica |
| Modalità manuale           | Risposta pending, saldo invariato fino alla conferma nella coda dell’app                         |
| Offline prima del POST     | File in Da inviare; ripristino rete e rilancio consegnano lo stesso JSON                         |
| Timeout dopo il commit     | Ripetere il JSON salvato: stesso id, duplicate=true, nessun secondo movimento                    |
| Riavvio prima del reinvio  | File ancora leggibile localmente, data/eventId identici al primo tentativo                       |
| Invii simultanei/duplicati | Un solo movimento e una sola variazione del saldo                                                |
| Revoca del token           | Errore 401, file conservato; dopo nuovo token il reinvio è possibile                             |
| Risposta vuota, HTML o 503 | Nessun file spostato in Consegnate                                                               |

Test automatici server coprono persistenza, ritentativi, concorrenza, revisione e
revoca. Il collaudo iPhone offline/riavvio e il confronto con un estratto conto reale
anonimizzato restano un requisito operativo: non sono sostituibili con test Node.
I passaggi usano i blocchi Dizionario e Ripeti con ogni elemento descritti nella
[guida Apple](https://support.apple.com/guide/shortcuts/use-repeat-actions-apdc11deb2c1/ios).

## Regole di affidabilità

- Ogni richiesta verifica token, gruppo attuale dell’utente, conto e appartenenza.
- I token casuali da 256 bit vengono salvati solo come SHA-256. Massimo 10
  dispositivi attivi per utente e 60 richieste al minuto per dispositivo.
- Lock PostgreSQL e vincolo univoco proteggono anche invii simultanei da due
  dispositivi sullo stesso conto. Evento, transazione e saldo sono atomici.
- Data mancante/futura, valuta non EUR, testo sconosciuto, rimborsi, storni e
  operazioni non confermate rimangono in verifica senza modificare i saldi.
- Un movimento già presente con stessa data, importo e direzione è un possibile
  duplicato: richiede conferma. Non è possibile riconciliare con certezza tutti
  gli estratti conto usando soltanto il testo di una notifica.
- La categoria viene da correzioni esplicite dello stesso utente/esercente,
  regole deterministiche disponibili nel gruppo o dalla categoria predefinita.
  Le correzioni effettuate sia nella coda sia nell’editor transazioni vengono
  ricordate. Non vengono create categorie inventate.
- La coda espone fino a 50 elementi e dà precedenza a quelli da verificare.
  Elaborarli libera spazio ai successivi. Nessuna notifica viene cancellata.
- Le tabelle hanno RLS e nessun accesso per i ruoli client; seguono il modello
  server-only esistente di Wealth Pillar. Il client non può impostare user/group/account.

## Estendere ad altre banche

Aggiungere esempi anonimizzati con titolo, corpo, data e risultato atteso in
`src/lib/bank-notifications/parser.test.ts`, poi un parser esplicito nello stesso
modulo (se cresce, separarlo per provider). Mantenere il contratto `ParseResult`:
formati incerti restituiscono un motivo di verifica. Autenticazione, coda,
idempotenza, categorie e registrazione atomica restano condivise.
