# Product

## Register

product

## Users

Italian-first B2C households — families and small groups (couples, partners,
parents, adult children) co-managing personal finances together. They are
non-professional users; their context is the smartphone after dinner, the laptop
on a Sunday morning, occasionally a tablet. The job to be done: have one
trustworthy, calm place that consolidates accounts, transactions, budgets, and a
retail investment portfolio across the people they share money with, with clear
roles (admin vs member) and zero ambiguity about what the numbers say. English
is supported for travelers and expats but the product is written in Italian for
Italian households, not localized from English. Default currency EUR, default
timezone Europe/Rome.

## Product Purpose

Wealth Pillar exists to give Italian families operational control over shared
household finances in one place — no spreadsheets, no chasing each other for
receipts, no fragmented banking apps. Members add accounts and transactions,
set category budgets, track recurring flows, and monitor a retail investment
portfolio with daily-cached market data; the admin holds permission boundaries;
the household gets a single source of truth. Success looks like a household
that opens Wealth Pillar weekly and trusts the numbers without re-verifying.
Stripe-backed Premium tiers are planned for larger groups and export features,
but the free tier must already feel finished.

## Brand Personality

**Affidabile, Calmo, Preciso.** Financial trust without performance. The voice
is direct, operationally helpful, and reassuring under friction ("Something
interrupted loading your accounts — it's usually temporary. ... your data stays
safe on our side."). It hedges honestly about forecasts and projections rather
than playing certainty theater ("Figures are illustrative, not advice.").
Onboarding is permissive ("You can set them later"), undo is offered where the
cost of mistakes is real ("You can undo this action for a few seconds").
Emotional goal: the moment a user opens Wealth Pillar, their shoulders drop.
The product reads as crafted, not corporate; competent, not cute.

## Anti-references

- **Generic AI-startup aesthetic** — no purple/violet glow, no glassmorphism,
  no gradient text, no "vibrant gradient on dark" cliché. We are not a 2024
  SaaS marketing site.
- **Personal-finance maximalism** — no rainbow categories, no cartoon icons,
  no gamification badges, no streak counters, no confetti. Household finance
  is not a phone game.
- **Crypto-bro neon** — no aggressive greens and reds shouting at the user,
  no Robinhood-style hype, no candlestick-as-decoration. Markets are
  background context, not the show.
- **Boomer Italian banking** — no navy-and-gold gradients, no heavy chrome,
  no regulatory-formal density, no PSD2-bank aesthetic. We respect the user's
  intelligence without performing institutional gravitas.

The Revolut and Apple-Wallet lane is where we live: confident dark, restrained
chroma, hardware-grade craft, motion that means something, copy that doesn't
waste words.

## Design Principles

1. **Design IS the experience.** There is no marketing surface separate from
   the app; the product UI is the brand. Every screen — including loading,
   error, empty, and confirmation states — is held to the same craft bar.
   No throwaway screens.

2. **Numbers earn certainty.** Financial figures must read as definitive:
   tabular alignment, deliberate weight, semantic income/expense color used
   sparingly enough to retain meaning. Decorative treatments around numbers
   are banned. Skeletons preserve layout to avoid jarring shifts.

3. **Hedged truth on the unprovable.** For investments, forecasts, projections,
   and sandboxes, explicit "illustrative, not advice" hedging is a first-class
   feature, not a footnote. Trust comes from honest uncertainty, not confident
   bluff.

4. **Permissive onboarding, opinionated daily use.** Let users skip, defer, and
   undo (already in the copy and onboarding flows). Once they're past the
   first session, be decisive about defaults — calendar, recurring frequencies,
   category color, default account. Don't ask twice.

5. **Italian-first, not translated-Italian.** Copy is authored in Italian for
   Italian households (default surname _Rossi_, EUR, Europe/Rome, Italian
   fiscal calendar). English is a peer locale for travelers and expats — kept
   up-to-date, but never the source of truth for voice.

## Accessibility & Inclusion

- **WCAG 2.2 AA across all product surfaces**, aspirational AAA for
  financial-critical content (amounts, balances, error confirmations,
  destructive-action copy).
- **European Accessibility Act (EAA) 2025 compliance.** EAA became mandatory
  for many consumer financial services in the EU from June 2025; Wealth Pillar
  treats it as a hard baseline, not a future task. This means accessible auth,
  navigation, forms, error messaging, and information about financial services
  in machine-readable form.
- **Italian users with disabilities are not a translated afterthought.** Screen-
  reader labels, language attributes (`lang="it"`), and announcement copy are
  authored in Italian, then translated to English — not the reverse.
- **Reduced motion is already respected in code** (`prefers-reduced-motion`,
  `motion-reduce:*`). This is a contract: any new motion must ship with a
  reduced-motion path.
- **Color is never the sole signal.** Income/expense, success/destructive, and
  category colors must always be paired with iconography, weight, or copy —
  protecting users with reduced color discrimination.
- **Touch targets ≥ 44×44pt on the mobile shell**; keyboard focus rings are
  visible and themed; tab order matches reading order.
- **Forms** use real labels (not placeholder-as-label), explicit error
  association (`aria-describedby`), and Italian-first error copy.
