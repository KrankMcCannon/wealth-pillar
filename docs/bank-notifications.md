# Importazione notifiche bancarie

L’integrazione usa l’automazione iOS già verificata dall’utente. Non richiede
servizi a pagamento o un’app nativa. Il primo parser supporta Revolut in EUR,
con i messaggi `Hai speso` / `Hai ricevuto` e `You spent` / `You received`.
Emoji iniziali e importi italiani/inglesi sono gestiti. Credem e Trade Republic
rimangono da verificare finché i loro formati non saranno documentati.

## Attivazione

1. Applicare `src/server/db/drizzle/0007_bank_notifications.sql` attraverso il
   journal Drizzle (`pnpm db:migrate` con credenziali di migrazione, non quelle
   runtime). La migrazione aggiunge tre tabelle; non modifica i movimenti esistenti.
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
`eventId` è opzionale: usarlo solo se la sorgente offre un identificativo stabile
per la stessa notifica. Non generare un UUID diverso per ogni ritentativo.

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

Comandi Rapidi non garantisce da solo una coda di consegna persistente. Se si
vuole recuperare anche le notifiche ricevute offline, mantenere l’azione Note
esistente come copia locale e reinviare quelle senza risposta 200/201. Il server
è idempotente anche se il primo invio è riuscito ma la risposta è andata persa.

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
