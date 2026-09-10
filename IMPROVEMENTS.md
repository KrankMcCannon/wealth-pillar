# IMPROVEMENTS

## Summary

P0 4 / P1 5 / P2 6 / P3 3. Whole app in `STRUCTURE.md`. 10 Sep 2026. Palette, type, and IA stay as in `DESIGN.md` (linen + pine).

## P0 — blocks use or a11y

| ID | Surface | Issue | Consistent fix (stay on DESIGN.md) |
|---|---|---|---|
| F1 | Home `UserSelector` | Chips are `min-h-8` (32px). Floor is 44px. | `min-h-11`, same selected ring |
| F2 | Accounts / ledger `PeopleChips` | Same 32px chips, duplicate of F1 | Share the people-chip primitive; 44px |
| F3 | Transactions / reports filter chips | `h-7` (28px) | `chipBase` → `min-h-11` |
| F4 | Home section “view all” | Overrides to `min-h-8` | Drop the override; keep `viewAllLink` at 44px |

## P1 — inconsistency with DESIGN.md / STRUCTURE.md

| ID | Surface | Drift | Fix |
|---|---|---|---|
| D1 | Home, accounts, people chips | Avatars use `text-primary` (pine as decoration) | Ink on muted well; pine only on selection ring / commit |
| D2 | Home budget rows | Leftover amount uses `type="income"` (green) though it is not inflow | `balance` (ink) when remaining ≥ 0; `expense` when over |
| D3 | Home, accounts | Glossary: “Set aside” / “Messo da parte”; “Account” vs **Conto** | Reserve / Riserva; Conto / Accounts on visible titles |
| D4 | `DESIGN.md` | Don’ts still say “desaturate terracotta” | Match current pine system |
| D5 | Bottom nav (it) | “Investimenti” truncates to “Investime…” | Allow two-line labels; don’t invent a new tab |

## P2 — density, controls, copy

| ID | Surface | Issue | Fix |
|---|---|---|---|
| C1 | Home / lists | Uppercase + tracking eyebrows (industrial) | Sentence-case meta, normal tracking |
| C2 | Home | “Tutte le ricorrenze” / “Tutte le transazioni” fight the spendable | Shorter verb+object (“Vedi ricorrenze”) |
| C3 | Home recent empty | No next step | Keep the ledger link when empty |
| C4 | Home | Four peer “view all”s; spendable should stay the primary | Quieter links already muted; don’t add a fifth CTA |
| C5 | People filter | `UserSelector` and `PeopleChips` are two controls for the same choice | One chip anatomy |
| C6 | Accounts copy | Title case “Bank Accounts” / “Conti Bancari” | “Accounts” / “Conti” |

## P3 — polish

| ID | Surface | Issue | Fix |
|---|---|---|---|
| P1 | `globals.css` | `.liquid-glass` utility unused by the system | Leave unless a surface still calls it |
| P2 | Header icon hover | `hover:bg-primary/10` | `hover:bg-accent` (wash, not brand) |
| P3 | Bottom nav IT | “Home” is a loanword | Keep; understood |
