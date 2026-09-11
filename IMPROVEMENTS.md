# IMPROVEMENTS

## Summary

P0 2 / P1 4 / P2 5 / P3 2. Scope: **Riserva vs budget period** (Reports list, period detail, Reports hero savings row). 11 Sep 2026. Palette, type, and IA chrome stay as in `DESIGN.md`. This pass does not re-audit the whole app.

Period screens currently do two jobs (budget leftover **and** reserve unwind). That split is the defect. The consistent fix is one job per surface: periods stay budget-only; reserve movement is a Reports look-back of spendable↔reserve transfers, not a reconstructed stock on each period row.

## P0 — blocks use or a11y

| ID | Surface | Issue | Consistent fix (stay on DESIGN.md) |
|---|---|---|---|
| S1 | Period list `/reports` (`BudgetPeriodSection`) and period detail `/reports/periods/[periodId]` | Each period shows **Riserva** signed delta plus start→end unwind next to **Budget** leftover. Two jobs on one row. Unwind from live `account.balance` + personal/household saves disagrees with the leftover figure and with the Risparmi envelope. | Remove reserve calculation and the Riserva metric from every period row and from period-detail “Totali del periodo”. Period job stays: leftover vs snapshot (`STRUCTURE.md`: “Read one closed period against its budget snapshot”). |
| S2 | Period detail + Reports hero | Same spendable→reserve transfer is **Riserva** on the period, **Messo da parte** on the reports window, and **spent** on a Risparmi envelope. Three names, two time bases (budget period vs report chips). | One term from `PRODUCT.md`: **Riserva** / **Reserve**. One time base: the reports window (chips), never the budget-period grid. |

## P1 — inconsistency with DESIGN.md / STRUCTURE.md

| ID | Surface | Drift | Fix |
|---|---|---|---|
| S3 | Reports `/reports` | Hero already has a one-row “Messo da parte” net for the selected window. Period list repeats a different reserve number per budget month. Duplicate look-back. | Drop period-list Riserva. Promote the hero savings row into a **Riserva** module on Reports: net for the window + list of in/out moves. Keep Reports as the look-back tab (`Rapporto`). Do not add a sixth primary tab. |
| S4 | Period detail snapshot table | Compare row **Riserva** stored vs live is the unwind/snapshot of a job we are removing. | Remove that compare row. Keep **Spesa** stored vs live if the period still snapshots spend. |
| S5 | Home `/home` | Home **Riserva** is the **stock** on reserve accounts (drill-in to Accounts). Period **Riserva** was a reconstructed **flow**. Same glossary word, different job. | Leave home stock as-is (home job is spendable). Flow lives only on Reports. |
| S6 | Nested route | A full savings ledger is a destination (bookmark, back, own title). Cramming a long list onto Reports next to ranking + accounts + periods exceeds the 5–7 region cap. | Prefer `/reports/savings` (Reports tab stays current) **or** a Reports section with one “Vedi movimenti” link into `/transactions` prefiltered to spendable↔reserve transfers. Smallest surface that finishes the job; no new nav item. |

## P2 — density, controls, copy

| ID | Surface | Issue | Fix |
|---|---|---|---|
| S7 | Dedicated Riserva report | Users need to see **which** transfers moved money in/out of reserve, not a period start→end story. | List rows: existing `PlainListRow` / ledger anatomy — date, description, account → account, signed amount (`income` in / `expense` out). Only rows with a spendable↔reserve transfer (same classifier as today’s savings delta). Not income/expense, not spendable↔spendable. |
| S8 | Dedicated Riserva report | Whose money / which dates. | Reuse Reports **time chips** + `UserSelector`. Do not bind the list to budget `start_date`/`end_date`. |
| S9 | Dedicated Riserva report | Empty, loading, truncated. | Empty: one sentence + link to add a transfer. Truncated: same incomplete notice as Reports. No unwind, no pin-oldest-at-zero. |
| S10 | Copy | IT “Messo da parte” / EN “Set aside” vs glossary **Riserva** / **Reserve**. Envelope **Risparmi** stays an envelope name, not the look-back title. | Section title **Riserva**. Meta: versamenti · prelievi (keep the existing pair, under the glossary title). Buttons: verb + object (“Vedi movimenti”). |
| S11 | Period leftover vs Risparmi envelope | After S1, a categorized transfer can still fill a **Risparmi** envelope. That is budget, not the period Riserva metric. | Leave envelope math on `/budgets` and period **Budget del periodo**. Do not reintroduce reserve start/end on the period header to “explain” the envelope. |

## P3 — polish

| ID | Surface | Issue | Fix |
|---|---|---|---|
| S12 | Period row | After removing Riserva, the snapshot grid is one metric (Budget leftover). | Single column or stacked leftover only; keep `PeriodMetric` chrome, don’t invent a new card. |
| S13 | Reports hero | If the dedicated module lists the same net, the hero one-row savings duplicate is noise. | Either move net+list into the Riserva module and drop the hero row, or keep a one-line net in the hero that links into that module — not both full summaries. |

## Out of this pass

- Whole-app 44px chip P0s from 10 Sep (Home `UserSelector`, filter chips).
- New palette, type, or a sixth tab.
- Recreating reserve stock on Home/Accounts (those stay balance, not flow).
