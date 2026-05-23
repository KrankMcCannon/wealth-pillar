## Design Context

**Source of truth:** [PRODUCT.md](../PRODUCT.md) (strategic) and [DESIGN.md](../DESIGN.md) (visual). Read both before UI or copy work.

**Register:** `product` — l'app autenticata è l'intera superficie; non esiste marketing site separato.

### Users

Famiglie e piccoli gruppi B2C, **Italian-first** (IT primario, EN peer per viaggiatori/expat). Contesto: smartphone dopo cena, laptop la domenica mattina, occasionalmente tablet. Lavoro principale: un unico posto affidabile e calmo per conti, transazioni, budget, ricorrenze e portafoglio investimenti condiviso, con ruoli admin/member chiari e numeri senza ambiguità. EUR, Europe/Rome.

### Brand Personality

**Affidabile, Calmo, Preciso.** Fiducia finanziaria senza spettacolo. Voce diretta, operativa, rassicurante sotto attrito. Onboarding permissivo (skip, "puoi farlo dopo"), undo dove il costo dell'errore è reale. Proiezioni e sandbox sempre con hedging esplicito ("a titolo illustrativo, non consulenza"). Obiettivo emotivo: spalle che si rilassano all'apertura dell'app. Crafted, non corporate; competente, non cute.

### Aesthetic Direction

**North Star: "The Calm Vault"** — craft dark confidente nella lane Revolut / Apple Wallet. Palette Stitch navy OKLCH, dark forzato di default, Spline Sans, superfici solide con inset hairline (no glassmorphism default). **Committed color strategy:** primary periwinkle su nav, CTA e figure hero (30–50% superficie); income/expense/destructive usati con parsimonia e mai come unico segnale. Mobile-first, swipe touch-friendly, motion funzionale (framer-motion su swipe/auth; `prefers-reduced-motion` obbligatorio).

### Anti-references

- Estetica AI-startup generica (purple glow, glassmorphism, gradient text)
- Personal-finance maximalism (arcobaleno categorie, badge, gamification)
- Crypto-bro neon (verdi/rossi aggressivi, hype Robinhood)
- Banking italiano boomer (navy+gold, chrome pesante, densità PSD2-formal)

### Design Principles

1. **Design IS the experience** — ogni schermata (loading, error, empty, confirm) allo stesso craft bar; niente schermate usa-e-getta.
2. **Numbers earn certainty** — `tabular-nums`, peso deliberato, colore semantico income/expense usato con parsimonia; niente decorazione attorno ai numeri.
3. **Hedged truth on the unprovable** — disclaimer esplicito su investimenti, previsioni e sandbox; fiducia da onestà, non da certezza teatrale.
4. **Permissive onboarding, opinionated daily use** — skip/defer/undo in onboarding; defaults decisi dopo la prima sessione; non chiedere due volte.
5. **Italian-first, not translated-Italian** — copy scritto in IT per famiglie italiane; EN mantenuto aggiornato ma non è la fonte di verità.

### Accessibility

WCAG 2.2 AA (AAA aspirazionale su contenuti finanziari critici). EAA 2025 come baseline. Touch target ≥ 44×44pt sulla shell mobile. Colore mai unico segnale. Label reali sui form, `aria-describedby` sugli errori, copy screen-reader in IT prima dell'EN.
