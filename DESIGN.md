---
name: Wealth Pillar
description: Italian household finance — confident dark craft, precise numbers, calm trust
colors:
  background: "oklch(0.141 0.036 271)"
  foreground: "oklch(0.944 0.026 272)"
  card: "oklch(0.257 0.092 264)"
  primary: "oklch(0.764 0.12 266)"
  primary-foreground: "oklch(0.141 0.036 271)"
  secondary: "oklch(0.298 0.101 264)"
  accent: "oklch(0.326 0.098 263)"
  muted: "oklch(0.298 0.101 264)"
  muted-foreground: "oklch(0.758 0.059 267)"
  border: "oklch(0.5 0.174 266)"
  ring: "oklch(0.764 0.12 266)"
  income: "oklch(0.86 0.13 155)"
  expense: "oklch(0.8 0.09 22)"
  destructive: "oklch(0.8 0.09 22)"
  success: "oklch(0.75 0.1 150)"
  teal-accent: "oklch(0.87 0.11 175)"
typography:
  display:
    fontFamily: "var(--font-spline-sans), system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "var(--font-spline-sans), system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "var(--font-spline-sans), system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "var(--font-spline-sans), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-spline-sans), system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-destructive:
    backgroundColor: "{colors.expense}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1rem"
  input-default:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.25rem 0.75rem"
    height: "2.25rem"
  nav-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: "0.125rem 0.25rem"
  filter-chip-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "0.5rem 1rem"
---

# Design System: Wealth Pillar

## 1. Overview

**Creative North Star: "The Calm Vault"**

Wealth Pillar is a product-only surface: the app UI is the brand. The visual system serves Italian households managing shared finances on a phone after dinner or a laptop on Sunday morning. The aesthetic is confident dark craft in the Revolut and Apple Wallet lane: a deep navy vault where numbers read as definitive, motion means something, and chroma is earned rather than sprayed.

Density is mobile-first but never cramped. Surfaces are solid Stitch navy layers with subtle inset highlights, not glass cards floating in purple void. Typography is a single humanist sans (Spline Sans) with weight and tracking doing the hierarchy work. The emotional register from PRODUCT.md is **Affidabile, Calmo, Preciso**: shoulders drop when the app opens; nothing shouts for attention except what the user came to verify.

The system explicitly rejects generic AI-startup purple glow, personal-finance rainbow maximalism, crypto-bro neon, and boomer Italian banking chrome. Light mode tokens exist in `app/globals.css` but the shipped default is forced dark (`defaultTheme="dark"`, `enableSystem={false}`).

**Key Characteristics:**

- Committed color strategy: primary violet-blue carries navigation, CTAs, and active states across 30–50% of any screen
- OKLCH-only token pipeline in Tailwind v4 `@theme`; no raw `#000` or `#fff`
- Stitch solid surfaces: `border-border/20–35`, inset white hairlines, no decorative gradients
- Tabular-nums financial figures with semantic income/expense color used sparingly
- shadcn new-york primitives extended by `home-design-foundation.ts` class-string layer
- Motion: framer-motion for swipe/auth; CSS transitions elsewhere; always `prefers-reduced-motion` safe
- Touch targets ≥ 44×44pt on mobile shell; focus rings at 3px `ring-ring/50`

## 2. Colors

A committed violet-navy palette: the background IS the brand, primary lifts off it for navigation and CTAs, semantic greens and roses carry financial meaning only.

### Primary

- **Stitch Periwinkle** (oklch(0.764 0.12 266)): Active nav items, primary buttons, hero amounts, focus rings, chart-1. The committed accent — visible on every screen, never decorative-only.
- **Periwinkle Deep** (oklch(0.595 0.178 270), light mode only): Fallback primary when light theme is enabled.

### Secondary

- **Vault Layer** (oklch(0.298 0.101 264)): Secondary buttons, input backgrounds, muted list rows, elevated surface steps below card.
- **Vault Lift** (oklch(0.326 0.098 263)): Accent hover states, active filter chips, interactive row hover.

### Tertiary

- **Teal Signal** (oklch(0.87 0.11 175)): Secondary positive accent — watchlist highlights, success-light contexts. Not a second primary.
- **Category hues** (10 named tokens in `@theme`): Used only on category badges and budget breakdowns. Muted chroma, never full-saturation rainbow.

### Neutral

- **Deep Vault** (oklch(0.141 0.036 271)): Page background. The base layer everything sits on.
- **Vault Card** (oklch(0.257 0.092 264)): Card, popover, modal surfaces.
- **Vault Text** (oklch(0.944 0.026 272)): Primary body and heading color on dark.
- **Vault Muted** (oklch(0.758 0.059 267)): Secondary labels, eyebrows, metadata.
- **Vault Border** (oklch(0.5 0.174 266)): Structural borders at 20–35% opacity in components.

### Named Rules

**The Committed Surface Rule.** Primary appears on navigation chrome, CTAs, active tabs, and hero figures. It is not rationed to ≤10%; its presence defines the product. Restraint lives in semantic colors (income/expense/destructive), not in hiding the brand hue.

**The Semantic Sparingly Rule.** `--color-income` and `--color-expense` appear only on amounts, progress indicators, and destructive confirmations — never on backgrounds, never as decorative gradients. Color is never the sole signal; pair with weight, sign, or icon.

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

Hybrid tonal layering with restrained shadows. Depth is conveyed primarily by surface stepping (background → card → muted/accent) and inset white hairlines (`inset_0_1px_0_rgba(255,255,255,0.06)`), not floating glass cards. Shadows appear on elevated chrome (bottom bar backdrop, drawer, FAB) and active states — never as default card decoration.

The `.liquid-glass` utility exists but is not the default surface treatment. Prefer solid Stitch surfaces from `stitchSurface` and `stitchHome`.

### Shadow Vocabulary

- **Resting surface** (`--shadow-sm`): Icon containers, subtle card default via shadcn.
- **Elevated chrome** (`--shadow-md`): Bottom nav FAB, drawer content, active card lift.
- **Modal / drawer** (`--shadow-xl`, custom `0 16px 36px rgba(0,7,30,0.28)`): Section cards, balance hero, primary CTA glow.
- **FAB emphasis** (`shadow-lg shadow-primary/25`): Center add button in bottom navigation.

### Named Rules

**The Flat-By-Default Rule.** Cards at rest use border + inset highlight, not drop shadow. Shadows respond to elevation (drawer, modal, FAB) or interaction — not to filling space.

## 5. Components

Product-shaped, mobile-first. shadcn new-york base in `src/components/ui/`; Stitch class-string layer in `src/styles/home-design-foundation.ts` for dashboard pages.

### Buttons

- **Shape:** Soft corners (8px / rounded-md default; 16px / rounded-2xl for Stitch primary CTA)
- **Primary:** `bg-primary text-primary-foreground`, h-9 px-4, font-medium text-sm. Hover: `bg-primary/90`. Focus: 3px ring at `ring/50`.
- **Destructive:** Expense-tinted — `border-expense/35 bg-expense/15 text-expense`, not full red fill. Hover deepens tint.
- **Outline / Ghost:** Border or transparent with `hover:bg-accent`. Used for secondary actions in dense toolbars.
- **Stitch CTA:** Full-width, min-h-52px, uppercase tracking-[0.22em], rounded-2xl, shadow `[0_10px_32px_rgba(0,16,70,0.45)]`, active scale 0.98.

### Chips

- **Style:** Pill (`rounded-full`), 12px medium weight, px-4 py-2.
- **Inactive:** `border-border/35 bg-muted/80 text-muted-foreground`.
- **Active:** `bg-accent text-foreground` with inset periwinkle hairline. Used in transaction filters (`FilterChip`).

### Cards / Containers

- **Corner Style:** xl (16px) for section cards; 2xl (rounded-2xl / 30px) for balance hero.
- **Background:** `bg-card/90` with `border-border/20–25`.
- **Shadow Strategy:** Custom rgba shadow on large sections; inset highlight on rows.
- **Border:** 1px at 20–35% border opacity — structural, not accent stripes.
- **Internal Padding:** p-4 sm:p-5 for sections; px-3 py-2.5 for list rows.

### Inputs / Fields

- **Style:** h-9, rounded-md, `border-input`, dark: `bg-input/30`, text-sm.
- **Focus:** `border-ring` + 3px `ring-ring/50`. No glow, no gradient border.
- **Error:** `aria-invalid:border-destructive` + destructive ring at 20–40% opacity.
- **Select / Drawer triggers:** rounded-xl (12px), h-10, matching border/ring pattern.

### Navigation

- **Bottom bar:** Fixed, z-48, `border-t border-border/22`, `bg-background/94 backdrop-blur-md`. Five tabs + center FAB column.
- **Active tab:** `bg-primary/20 text-primary ring-1 ring-inset ring-primary/20`.
- **Inactive:** `text-primary/75 hover:bg-primary/10`.
- **FAB:** 44×44pt minimum, rounded-full, `border-[3px] border-background bg-primary`, `-translate-y` overlap, `active:scale-[0.97]`.
- **Header:** Sticky top, backdrop-blur-xl, border-b border-border/22. Title + avatar/back + settings shortcut.

### MetricCard (signature component)

- **Role:** Unified financial metric display across accounts, budgets, reports, investments.
- **Structure:** Label row (optional icon in tinted container) → large tabular value → optional description → optional stats grid.
- **Variants:** default, highlighted, success, warning, danger — semantic border/background tints, not rainbow fills.
- **Values:** Routed through `Amount` primitive with `income` / `expense` / `neutral` type coloring.

### Drawers / Modals

- **Drawer:** Bottom sheet, `rounded-t-3xl`, max-h-85vh, `border-t border-border bg-card shadow-xl`.
- **Modal wrapper:** Uses modal-specific tokens (`--color-modal-*`) aligned with card/muted in dark mode.

## 6. Do's and Don'ts

### Do:

- **Do** use OKLCH semantic tokens from `app/globals.css` — never hardcode hex in components.
- **Do** apply `tabular-nums` on every currency, balance, and percentage display.
- **Do** pair income/expense/destructive color with iconography, sign prefix, or weight — never color alone.
- **Do** use Stitch solid surfaces (`stitchSurface.card`, `stitchHome.sectionCard`) for dashboard sections.
- **Do** ship `prefers-reduced-motion` and `motion-reduce:*` on every new animation or transition.
- **Do** keep touch targets at ≥ 44×44pt on the mobile shell (bottom nav, FAB, header actions).
- **Do** use uppercase 11px eyebrows for section labels — one per section, not on every element.
- **Do** hedge investment and forecast UI with explicit disclaimer copy alongside muted visual treatment.

### Don't:

- **Don't** use purple/violet glow, glassmorphism as default, gradient text, or "vibrant gradient on dark" — the generic AI-startup aesthetic is forbidden.
- **Don't** deploy rainbow categories, cartoon icons, gamification badges, streak counters, or confetti — household finance is not a phone game.
- **Don't** use aggressive neon greens/reds, Robinhood-style hype, or decorative candlesticks — crypto-bro neon is forbidden.
- **Don't** use navy-and-gold gradients, heavy chrome, regulatory-formal density, or PSD2-bank aesthetic — boomer Italian banking is forbidden.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards, list items, or alerts.
- **Don't** wrap numbers in decorative containers — no hero-metric template (big number + gradient accent + supporting stat grid cliché).
- **Don't** default to nested cards — prefer flat list rows with inset hairlines inside section cards.
- **Don't** reach for modals when inline expansion, drawers, or bottom sheets solve the flow.
- **Don't** enable `.liquid-glass` or `.liquid-shimmer` on financial data surfaces — shimmer is for loading states only, glass is non-default.
