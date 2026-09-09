---
name: Wealth Pillar
description: Italian household finance — Daylight paper, precise numbers, calm trust
colors:
  background: 'oklch(0.995 0.008 240)'
  foreground: 'oklch(0.24 0.03 240)'
  card: 'oklch(1 0.004 240)'
  primary: 'oklch(0.52 0.1 240)'
  primary-foreground: 'oklch(0.99 0.008 240)'
  secondary: 'oklch(0.93 0.02 240)'
  accent: 'oklch(0.94 0.025 240)'
  muted: 'oklch(0.94 0.018 240)'
  muted-foreground: 'oklch(0.48 0.02 240)'
  border: 'oklch(0.88 0.02 240)'
  ring: 'oklch(0.52 0.1 240)'
  input: 'oklch(0.96 0.012 240)'
  income: 'oklch(0.46 0.09 165)'
  expense: 'oklch(0.5 0.1 22)'
  destructive: 'oklch(0.5 0.1 22)'
  success: 'oklch(0.52 0.1 165)'
  teal-accent: 'oklch(0.52 0.08 200)'
typography:
  display:
    fontFamily: 'var(--font-spline-sans), system-ui, sans-serif'
    fontSize: '2rem'
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: '-0.025em'
  headline:
    fontFamily: 'var(--font-spline-sans), system-ui, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'var(--font-spline-sans), system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 'normal'
  body:
    fontFamily: 'var(--font-spline-sans), system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 'normal'
  label:
    fontFamily: 'var(--font-spline-sans), system-ui, sans-serif'
    fontSize: '0.6875rem'
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: '0.05em'
rounded:
  sm: '0.5rem'
  md: '0.75rem'
  lg: '1rem'
  xl: '1.5rem'
  full: '9999px'
spacing:
  xs: '0.25rem'
  sm: '0.5rem'
  md: '1rem'
  lg: '1.5rem'
  xl: '2rem'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.md}'
    padding: '0.5rem 1rem'
  button-primary-hover:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.md}'
    padding: '0.5rem 1rem'
  button-destructive:
    backgroundColor: '{colors.expense}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '0.5rem 1rem'
  card-default:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.xl}'
    padding: '1rem'
  input-default:
    backgroundColor: '{colors.input}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '0.25rem 0.75rem'
    height: '2.25rem'
  nav-item-active:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.xl}'
    padding: '0.125rem 0.25rem'
  filter-chip-active:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.full}'
    padding: '0.5rem 1rem'
---

# Design System: Wealth Pillar

## 1. Overview

**Creative North Star: "Daylight Paper"**

Wealth Pillar is a product-only surface: the app UI is the brand. The visual system serves Italian households managing shared finances on a phone after dinner or a laptop on Sunday morning. The aesthetic is calm paper craft: high-L surfaces, a sky-blue brand hue, and numbers that read as definitive. Motion means something; chroma is earned rather than sprayed.

Density is mobile-first but never cramped. Surfaces are solid Daylight layers (`bg-background` → `bg-card` → `bg-muted`), not glass cards and not a navy vault. Typography is a single humanist sans (Spline Sans) with weight and tracking doing the hierarchy work. The emotional register from PRODUCT.md is **Affidabile, Calmo, Preciso**: shoulders drop when the app opens; nothing shouts for attention except what the user came to verify.

The shipped default is **light** (`defaultTheme="light"`, `enableSystem={false}`, `storageKey="wp-theme-daylight"`). Dark is a user toggle that keeps the **same hues** and only flips lightness (and paper chroma). Tokens live in `app/globals.css`; components do not fork with `dark:` color classes.

The system explicitly rejects generic AI-startup purple glow, personal-finance rainbow maximalism, crypto-bro neon, and boomer Italian banking chrome.

**Key Characteristics:**

- One family in both modes: paper/brand hue 240. Semantic hues: income 165, expense 22, warning 80, teal 200
- OKLCH-only token pipeline in Tailwind v4 `@theme`; no raw `#000` or `#fff`
- Solid Daylight surfaces: `border-border/20–35`, no decorative gradients
- Tabular-nums financial figures with semantic income/expense color used sparingly
- shadcn new-york primitives own their classes (colocated CVA/strings). Dashboard chrome lives in `home-design-foundation.ts` (`stitch*`). Tokens stay in `app/globals.css`.
- Motion: framer-motion for swipe/auth; CSS transitions elsewhere; always `prefers-reduced-motion` safe
- Touch targets ≥ 44×44pt on mobile shell; focus rings at `ring-ring/35–50`

## 2. Colors

One family. YAML values are the **light default**. Dark counterparts invert L (and paper chroma) only — they are not a second palette. Contract: `src/styles/palette-parity.test.ts`.

### Primary

- **Daylight Sky** (oklch(0.52 0.1 240)): CTAs, hero amounts, focus rings, chart-1. Dark: oklch(0.72 0.1 240). The committed accent — visible on every screen, never decorative-only.

### Secondary

- **Paper Layer** (oklch(0.93 0.02 240)): Secondary buttons, muted wells. Dark: oklch(0.3 0.02 240).
- **Paper Lift** (oklch(0.94 0.025 240)): Accent hover, active chips, active nav well. Dark: oklch(0.32 0.025 240).

### Tertiary

- **Teal Signal** (oklch(0.52 0.08 200)): Secondary positive accent — on-track badges, success-light contexts. Not a second primary. Dark: oklch(0.7 0.08 200).
- **Category hues** (10 named tokens in `@theme`): Used only on category badges and budget breakdowns. Muted chroma, never full-saturation rainbow.

### Neutral

- **Paper** (oklch(0.995 0.008 240)): Page background. Dark: oklch(0.22 0.01 240).
- **Paper Card** (oklch(1 0.004 240)): Card, popover, modal surfaces. Dark: oklch(0.27 0.012 240).
- **Ink** (oklch(0.24 0.03 240)): Body and heading color. Dark: oklch(0.94 0.012 240).
- **Ink Muted** (oklch(0.48 0.02 240)): Labels, eyebrows, metadata. Dark: oklch(0.72 0.02 240).
- **Hairline** (oklch(0.88 0.02 240)): Structural borders at 20–35% opacity in components. Dark: oklch(0.36 0.02 240).
- **Input** (oklch(0.96 0.012 240)): Form fields in both modes via `bg-input`. Dark: oklch(0.26 0.012 240).

### Named Rules

**The Committed Surface Rule.** Primary appears on CTAs, active tabs, and hero figures. It is not rationed to ≤10%; its presence defines the product. Restraint lives in semantic colors (income/expense/destructive), not in hiding the brand hue.

**The Semantic Sparingly Rule.** `--color-income` and `--color-expense` appear only on amounts, progress indicators, and destructive confirmations — never on backgrounds, never as decorative gradients. Color is never the sole signal; pair with weight, sign, or icon.

**The Hue Parity Rule.** Light and dark share hues. Do not remap a second Tailwind palette in dark. Do not hardcode navy 266.

## 3. Typography

**Display Font:** Spline Sans (system-ui, arial fallback via `next/font/google`)
**Body Font:** Spline Sans (same stack — single-family system)
**Label/Mono Font:** None — labels use Spline Sans at reduced size with uppercase tracking

**Character:** Humanist geometric sans with calm confidence. Weight contrast (400/500/700) carries hierarchy; the face is warm enough for household finance, precise enough for tabular amounts. No serif, no mono, no display novelty.

### Hierarchy

- **Display** (700, 32px / text-2xl, line-height 1.1, -0.025em tracking): Budget hero amounts, large balance figures. Always `tabular-nums`.
- **Headline** (700, 24px / text-xl, line-height 1.2): Page titles in header, section headers via `text-heading` utility.
- **Title** (600, 18px / text-lg): Card titles, row primary labels, user names in budget cards.
- **Body** (400/500, 14px / text-sm default, line-height 1.6): Descriptions, list metadata, form labels. Cap line length at 65–75ch in prose blocks.
- **Label** (600, 11px / text-[11px], uppercase, tracking-wide or 0.22em on CTAs): Section eyebrows ("BUDGET", "ACCOUNTS"), metric labels, filter chip text.

### Named Rules

**The Numbers Rule.** All financial amounts use `tabular-nums`. Hero figures get `tracking-[-0.02em]`. Amount component (`src/components/ui/primitives/amount.tsx`) is the canonical renderer — do not hand-style currency strings.

## 4. Elevation

Hybrid tonal layering with restrained shadows. Depth is conveyed primarily by surface stepping (background → card → muted/accent), not floating glass cards. Shadows appear on elevated chrome (drawer, FAB, page tabs) and active states — never as default card decoration.

The `.liquid-glass` utility exists but is not the default surface treatment. Prefer solid surfaces from `stitchSurface` and `stitchHome`.

### Shadow Vocabulary

- **Resting surface** (`--shadow-sm`): Icon containers, subtle card default via shadcn. Token: oklch 240, not navy rgba.
- **Elevated chrome** (`--shadow-md`): Drawer content, capsule tabs, `stitchSurface.cardLg`.
- **Modal / drawer** (`--shadow-xl`): Modal sheets. Same hue family as `--shadow-*` in `@theme`.
- **FAB / CTA** (`shadow-lg`): Page FAB (`stitchFab.pageAdd`) and `stitchSurface.primaryCta`.

### Named Rules

**The Flat-By-Default Rule.** Cards at rest use border, not drop shadow. Shadows respond to elevation (drawer, modal, FAB) or interaction — not to filling space.

## 5. Components

Product-shaped, mobile-first. Three layers: tokens in `app/globals.css`; shadcn primitives own their classes in `src/components/ui/`; dashboard chrome in `src/styles/home-design-foundation.ts`.

### Buttons

- **Shape:** Soft corners (8px / rounded-md default; 16px / rounded-2xl for primary CTA)
- **Primary:** `bg-primary text-primary-foreground`, h-9 px-4, font-medium text-sm. Hover: `bg-primary/90`. Focus: ring at `ring/50`.
- **Destructive:** Expense-tinted — `border-expense/35 bg-expense/12 text-expense`, not full red fill. Hover deepens tint.
- **Outline / Ghost:** Border or transparent with `hover:bg-accent`. Used for secondary actions in dense toolbars.
- **Primary CTA:** `stitchSurface.primaryCta` — full-width, min-h-52px, uppercase tracking-[0.22em], rounded-2xl, `shadow-lg`, active scale 0.98.

### Chips

- **Style:** Pill (`rounded-full`), 12px medium weight (`stitchTransactions.chip*`).
- **Inactive:** `border-border/35 bg-muted/80 text-muted-foreground`.
- **Active:** `bg-accent text-foreground` with inset `ring-primary/35`. Used in transaction filters (`FilterChip`).

### Cards / Containers

- **Corner Style:** xl (16px) for section cards; 2xl (rounded-2xl) for balance hero.
- **Background:** `bg-card` with `border-border/20–25`.
- **Shadow Strategy:** Token shadows on elevated chrome only.
- **Border:** 1px at 20–35% border opacity — structural, not accent stripes.
- **Internal Padding:** p-3 sm:p-4 for sections; py-2.5 for plain list rows.
- **Lists:** `stitchHome.scanSection` + `plainList` / `plainRow`. Nested cards are the exception (budget category progress, chart cards).

### Inputs / Fields

- **Style:** h-9, rounded-md, `border-input`, `bg-input` in both modes, text-sm.
- **Focus:** `border-ring` + ring at `ring-ring/50`. No glow, no gradient border.
- **Error:** `aria-invalid:border-destructive` + destructive ring at 20–40% opacity.
- **Select / Drawer triggers:** rounded-xl (12px), h-10, matching border/ring pattern.

### Navigation

- **Bottom bar:** Fixed, z-48, `border-t border-border/22`, `bg-background`. Five equal tabs. No overlapping center FAB.
- **Active tab:** `text-foreground`; icon well `bg-accent ring-1 ring-inset ring-primary/35`.
- **Inactive:** `text-muted-foreground hover:text-foreground`.
- **Page FAB:** `stitchFab.pageAdd` — 44×44pt minimum, rounded-2xl, `bg-foreground text-background`, fixed above the tab bar.
- **Header:** Opaque `bg-background`, `border-b border-border/22`, `shadow-sm`. Title + avatar/back + settings shortcut.

### MetricCard (signature component)

- **Role:** Unified financial metric display across accounts, budgets, reports, investments.
- **Structure:** Label row (optional icon in tinted container) → large tabular value → optional description → optional stats grid.
- **Variants:** default, highlighted, success, warning, danger — semantic border/background tints, not rainbow fills.
- **Values:** Routed through `Amount` primitive with `income` / `expense` / `neutral` type coloring.

### Drawers / Modals

- **Drawer:** Bottom sheet, `rounded-t-3xl`, max-h-85vh, `border-t border-border bg-card shadow-xl`.
- **Modal wrapper:** Uses modal-specific tokens (`--color-modal-*`) aliased to card/muted in both modes.

### Page tabs

Capsule tabs (`stitchPageTabs`): rounded-full list on `bg-card`; active trigger `bg-accent` + `ring-primary/35`.

## 6. Do's and Don'ts

### Do:

- **Do** use OKLCH semantic tokens from `app/globals.css` — never hardcode hex in components.
- **Do** apply `tabular-nums` on every currency, balance, and percentage display.
- **Do** pair income/expense/destructive color with iconography, sign prefix, or weight — never color alone.
- **Do** use solid Daylight surfaces (`stitchSurface.card`, `stitchHome.sectionCard`, `stitchHome.scanSection`) for dashboard sections.
- **Do** ship `prefers-reduced-motion` and `motion-reduce:*` on every new animation or transition.
- **Do** keep touch targets at ≥ 44×44pt on the mobile shell (bottom nav, FAB, header actions).
- **Do** use uppercase 11px eyebrows for section labels — one per section, not on every element.
- **Do** hedge investment and forecast UI with explicit disclaimer copy alongside muted visual treatment.

### Don't:

- **Don't** use purple/violet glow, glassmorphism as default, gradient text, or "vibrant gradient on dark" — the generic AI-startup aesthetic is forbidden.
- **Don't** deploy rainbow categories, cartoon icons, gamification badges, streak counters, or confetti — household finance is not a phone game.
- **Don't** use aggressive neon greens/reds, Robinhood-style hype, or decorative candlesticks — crypto-bro neon is forbidden.
- **Don't** use navy-and-gold gradients, heavy chrome, regulatory-formal density, or PSD2-bank aesthetic — boomer Italian banking is forbidden.
- **Don't** remap a second Tailwind palette in dark, or hardcode navy 266.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards, list items, or alerts.
- **Don't** wrap numbers in decorative containers — no hero-metric template (big number + gradient accent + supporting stat grid cliché).
- **Don't** default to nested cards — prefer flat list rows (`plainList`) inside scan sections.
- **Don't** reach for modals when inline expansion, drawers, or bottom sheets solve the flow.
- **Don't** enable `.liquid-glass` or `.liquid-shimmer` on financial data surfaces — shimmer is for loading states only, glass is non-default.
