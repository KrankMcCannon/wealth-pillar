# PRODUCT

## Users

Italian-first B2C households — couples, families, and small groups sharing money. They are not professional investors. They open the app on a phone, usually in a short window: after a purchase, before a transfer, on Sunday with the bills. English is a complete peer locale for travelers and expats, never a leftover. Default currency EUR, default timezone Europe/Rome.

## Purpose

Give a household one calm place to know **what they can spend**, then keep budgets, the ledger, accounts, and a retail portfolio in the same truth.

## Tone

**Warm operator.** Household warmth in the materials; operator calm in the chrome. Direct, precise, and human. Shoulders drop when the spendable number is on screen.

What it is not: cute, gamified, bank-formal, luxury-wealth, or neon fintech. No performance of certainty on forecasts. No corporate brochure voice.

## Language

Italian is the source of truth for voice. English is authored as a full peer — every string exists in both, same meaning, not a machine afterthought.

Voice: short sentences, verbs on buttons, honest hedges on projections. Permissive on first-run (“Puoi farlo dopo” / “You can do this later”). Undo where a mistake costs money.

**Words we use**

| Concept | IT | EN |
|---|---|---|
| Cash you can use now | Spendibile | Spendable |
| Home headline for that number | Disponibile da spendere | Available to spend |
| Held aside | Riserva | Reserve |
| Shared workspace | Gruppo | Group |
| Person in the group | Membro / Amministratore | Member / Admin |
| Budget window | Periodo | Period |
| Money movement | Transazione | Transaction |
| Repeating commitment | Ricorrente | Recurring |
| Where the cash lives | Conto | Account |
| Retail holdings | Investimento | Investment |
| Look-back | Rapporto | Report |

**Words we never use:** wealth management, net worth flex, crush your goals, streak, AI-powered, portfolio optimization, “click here”, OK/Submit/Yes as button labels.

Errors say what happened, why, and how to fix. No jokes on failure. Forecasts and sandboxes say they are illustrative, not advice.

## Scope

**In:** the whole product UI — auth, onboarding, home, accounts, transactions, budgets, investments, reports, settings, and every sheet/dialog those routes open. The app UI is the brand; there is no separate marketing surface.

**Out:** a public marketing site, banking-grade advice, brokerage execution, crypto.

**Platforms:** mobile-first web (phone shell with bottom nav). Tablet/laptop must work; they are not the design target.

**Mode:** product.

## Constraints

- Next.js App Router, Tailwind v4 + OKLCH tokens, shadcn/Radix, next-intl (`it` + `en`), Clerk auth.
- Restyle the existing component library via tokens. Do not fork a second Button/Input.
- Stripe-backed Premium exists in the data model; the free tier must already feel finished. Do not design paywalls this pass.
- `keep` is empty: palette, type, chrome, and copy voice may change. Routes and jobs stay unless a screen fails “one job.”

## Accessibility & inclusion

- WCAG 2.2 AA on every surface. European Accessibility Act is a ship gate, not a later task.
- Italian `lang` on the document; screen-reader copy authored in Italian, then English.
- Colour is never the only signal (income/expense, status, categories).
- Touch targets ≥44×44px on chrome and primary actions. `:focus-visible` rings. Visible labels, not placeholder-as-label. Placeholder text meets 4.5:1.
- `prefers-reduced-motion` is a contract.
- Amounts, balances, and destructive confirmations stay readable at 200% zoom.

## Success

A household opens Wealth Pillar in the week, trusts the spendable figure, and does not reconcilie it in a spreadsheet. We will not sacrifice that trust for conversion, gamification, or decorative charts.

## Source

authored
