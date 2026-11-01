# Dipendenze e advisory risolti

- GHSA-gcqx-w48m-w2h4 (`deepmerge`): rimosso `shadcn` dalle devDependencies.
  Il generatore non viene importato dall’app; i componenti già generati restano
  nel repository. L’advisory non dispone di una versione corretta.
- GHSA-g3hv-75wg-m249 (`minimatch`): tutti i percorsi usano il motore 11.0.1 o
  successivo. I consumer moderni usano direttamente il pacchetto aggiornato.
  ESLint 9 e alcuni plugin richiedono ancora l’API CommonJS callable: il piccolo
  adattatore locale `tools/minimatch-compat` espone quella forma usando sempre
  il motore aggiornato. `eslint-plugin-import` usa `makeRe` soltanto tramite
  `.test()`, implementato nello stesso adattatore senza compilatore precedente.

`pnpm audit` verifica il grafo effettivo. L’adattatore è coperto da un test delle
API usate e dall’esecuzione dell’intero lint. Rimuoverlo quando tutti i consumer
saranno migrati all’API moderna. Non reintrodurre minimatch 3 per aggirare problemi
di compatibilità, né dismissare gli alert senza rimuovere i pacchetti vulnerabili.
