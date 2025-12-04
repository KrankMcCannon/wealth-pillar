# Style System Guide

Il file `src/styles/system.ts` è l'unico punto di verità per i token e i pattern di stile.

## Principi
- Niente classi inline duplicate per pattern comuni (card, button, header, tab, badge, skeleton, modal/drawer, input).
- Tutti i componenti condivisi devono leggere le classi da `system.ts`.
- I feature-specific possono estendere i pattern, non ridefinirli da zero.

## Pattern disponibili
- `tokens`: colori, layout, effetti.
- `buttonStyles` + `getButtonClasses`: varianti (default, secondary, outline, ghost, destructive, cancel) e size (default, sm, lg, icon).
- `cardStyles`: container/header/title/description/content/footer/action.
- `inputStyles`: stile base input.
- `skeletonStyles`: base + tonalità primary.
- `modalStyles`: content/footer.
- `drawerStyles`: content/header/footer.
- `tabStyles`: list/trigger/content.
- `badgeStyles`: varianti badge.

## Regole d'uso
- Nei componenti UI importare dal sistema: es. `import { cardStyles } from '@/styles/system';`.
- Per nuovi pattern, aggiungere in `system.ts` e usarli, evitando className hardcodate.
- Per override di dominio, estendere le classi del sistema (template literal) invece di ricopiarle.

## Migrazioni in corso
- Primitivi base (Button, Card, Input, Badge, Tabs, Dialog/Drawer, Skeleton) sono già collegati.
- Da migrare: feature components che hanno classi inline ripetitive; usare i pattern condivisi.

## Checklist PR
- Nessuna classe inline per pattern comuni se già esiste nel sistema.
- Se aggiungi un nuovo pattern, documentalo qui e in `system.ts`.
- Lint e controllo visivo su pagine chiave dopo aggiornamenti dei token.
