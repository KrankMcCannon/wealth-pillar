# Valute e cambi automatici

In Impostazioni → Valuta è possibile scegliere EUR, USD, GBP o CHF. La preferenza
viene salvata sul profilo e applicata a Home, Conti, Transazioni, Ricorrenti,
Budget, Rapporti, Investimenti, grafici, anteprime di importazione e notifiche bancarie.
Il cambio della valuta non modifica i movimenti o i saldi memorizzati.

## Fonte gratuita

Il servizio [Frankfurter v2](https://frankfurter.dev/) fornisce tassi giornalieri
correnti e storici, senza chiave API o abbonamento. L’app usa il feed aggregato
pubblico, con cache HTTP di un’ora e timeout di cinque secondi. Le richieste inviano
soltanto codici delle valute e date, mai importi, utenti o dati bancari.

Non sono presenti tassi fissi nel codice applicativo. Il rapporto EUR/EUR = 1 è
l’identità della valuta contabile, non un’approssimazione del cambio di un’altra valuta.
Tassi nulli, non positivi, non numerici, con data impossibile o successiva alla
richiesta non vengono utilizzati. Le quotazioni azionarie restano su Twelve Data;
i cambi forex non richiedono più la sua chiave o il suo piano.

## Visualizzazione e inserimento

La contabilità continua a essere in EUR. Tutti gli importi visibili vengono convertiti
con lo stesso tasso giornaliero della valuta scelta, così totali, residui e righe
rimangono confrontabili. I dati storici vengono mostrati come controvalori al cambio
di visualizzazione, non come ricostruzioni del saldo in un conto bancario estero.
Data, fonte e rapporto di cambio sono visibili nelle preferenze.

I campi monetari indicano la valuta scelta. Per un nuovo importo o una modifica,
il valore digitato viene convertito in EUR e arrotondato ai centesimi prima della
registrazione, attraverso il componente comune a transazioni, ricorrenti, budget
e costi degli investimenti. Un’apertura/salvataggio o un blur senza modifica
conserva l’importo EUR originale anche quando il controvalore visibile è arrotondato.
Quote possedute, percentuali e anni non vengono convertiti.

La preferenza viene applicata soltanto dopo la conferma del salvataggio sul server.
In caso di errore, la modale resta aperta e la valuta precedente resta attiva.

Se il servizio non risponde, si può usare l’ultima quotazione giornaliera conservata
dal job, mantenendone la data reale. Se manca anche quella, un messaggio esplicito
segnala che la visualizzazione e i campi restano in EUR. Non viene assunto il cambio
1:1 né cambiato soltanto il simbolo monetario.

## Investimenti e storico

La valuta dello strumento è distinta dalla valuta di visualizzazione. Si possono
registrare strumenti in EUR, USD, GBP e CHF. Alla creazione o al cambio di valuta/data
di acquisto, il server recupera automaticamente il cambio storico verso EUR da
Frankfurter e lo salva in `currency_rate`. Un cambio inviato dal client non sostituisce
il dato del provider. Modifiche non correlate preservano il cambio storico esistente.

Se il cambio storico richiesto non è disponibile, il salvataggio viene rifiutato con
un errore recuperabile, conservando il form. Nessun tasso viene inventato.
I costi già esistenti non vengono reinterpretati o convertiti retroattivamente.

Il valore corrente e gli snapshot giornalieri usano invece la serie di cambio alla
data della valutazione. Il job quotidiano aggiorna i cambi necessari agli strumenti
e le serie EUR/USD, EUR/GBP ed EUR/CHF per la visualizzazione e il recupero durante
un’interruzione del servizio. Il benchmark viene convertito dalla valuta del catalogo
in EUR prima di applicare la valuta di visualizzazione; strumenti senza valuta nota
o senza cambio necessario non vengono etichettati come EUR per supposizione.

## Compatibilità e verifiche

Non occorrono nuove dipendenze, variabili d’ambiente o migrazioni per questa estensione.
Restano necessarie le migrazioni già presenti nella PR #58, incluse quelle per notifiche
e riferimenti delle categorie. I parser bancari continuano ad acquisire soltanto i
formati EUR già supportati: scegliere USD per la visualizzazione non abilita conti
bancari nativi in USD o nuovi formati di notifica.

Test automatici coprono cambi correnti/storici, risposte invalide e indisponibilità,
conversione visibile e inversa, conservazione dei centesimi, scelta valuta confermata
solo dopo il salvataggio e persistenza delle quattro preferenze supportate. Endpoint
Frankfurter reali verificati per cambi correnti, una data storica di fine settimana
e una serie giornaliera. La suite finanziaria PostgreSQL e la build restano verificate.

## Perché esiste minimatch

[Minimatch](https://github.com/isaacs/minimatch) seleziona percorsi usando pattern come
`src/**/*.ts`. È una dipendenza degli strumenti di sviluppo (per esempio ESLint),
non del servizio valutario. La compatibilità locale della PR conserva l’interfaccia
attesa dai vecchi utilizzatori mentre usa il motore aggiornato. Non serve per la
conversione degli importi e questa estensione non aggiunge dipendenze monetarie.

Verifica locale finale: 1.085 test unitari (suite completa più il caso aggiuntivo
di formattazione compatta), 99 test PostgreSQL, TypeScript, lint e build di
produzione. La matrice browser E2E completa non è dichiarata verificata.
