# DESIGN

## Overview

Warm operator on linen: a dry oat canvas, charcoal ink, one **pine** accent used rarely. The thing you remember is the **spendable figure** in a serif, tabular, unadorned. Chrome is quiet. Every dashboard page shares: skip link, sticky header (title + settings), content column with 16px inset, scannable sections, fixed 5-tab bar, optional ink FAB above the tab bar.

Layout: left-aligned content. One primary action per screen. Tight inside a group, generous between groups. Cards only when the object is distinct and tappable — prefer type, space, and hairlines.

## Colors

OKLCH. Neutrals sit on hue **95** (linen). Ink on hue **90**. Brand accent is **pine 170**. Expense is **rose 18**, never the brand colour. Token names in `app/globals.css` stay (`--color-primary`, `--color-income`, …).

### Light

| Role | Token | Value | Allowed on |
|---|---|---|---|
| Canvas | `--color-background` | `oklch(0.985 0.01 95)` | Page |
| Surface | `--color-card` | `oklch(0.995 0.006 95)` | Cards, sheets |
| Text | `--color-foreground` | `oklch(0.26 0.02 90)` | Body, titles, amounts (default) |
| Muted | `--color-muted-foreground` | `oklch(0.42 0.02 90)` | Meta, eyebrows, placeholders, “view all” links |
| Border | `--color-border` | `oklch(0.88 0.014 95)` | Hairlines |
| Wash | `--color-muted` / `--color-accent` | `oklch(0.94 0.012 95)` / `oklch(0.95 0.014 95)` | Hover, wells — **not** the brand accent |
| Brand | `--color-primary` | `oklch(0.40 0.07 170)` | Primary buttons, focus ring, selected tab well |
| On-brand | `--color-primary-foreground` | `oklch(0.99 0.008 95)` | Text on primary |
| Income | `--color-income` | `oklch(0.40 0.08 155)` | Inflow amounts + paired icon/sign |
| Expense | `--color-expense` | `oklch(0.50 0.12 18)` | Outflow amounts, danger |
| Warning | `--color-warning` | `oklch(0.62 0.10 80)` | Caution, not decoration |
| Info | `--color-teal-accent` | `oklch(0.44 0.06 185)` | “On track” and info only |

### Dark

Same hues, inverted L, accent slightly desaturated. Canvas `oklch(0.20 0.008 90)` — warm slate, not chocolate. Surfaces lift to `oklch(0.26 0.01 90)`. Primary `oklch(0.76 0.06 170)` with ink `oklch(0.20 0.008 90)` on it. Muted text `oklch(0.78 0.015 90)`.

**60 / 30 / 10:** linen and space ~60, ink and hairlines ~30, pine ~10. Do not paint numbers or section links in primary; spendable is ink (or expense when negative). “View all” links are muted, not brand.

Category tokens keep their names but drop chroma (~0.08–0.10). Colour never stands alone — icon or label travels with it.

## Typography

| Role | Family | Use |
|---|---|---|
| UI / body | Figtree (`--font-sans`) | Nav, forms, lists, buttons, meta |
| Display | Source Serif 4 (`--font-display`) | Spendable hero, page-level money figures |

Scale (approx): 12 meta / 14 secondary / 16 body / 18 section title / 30–44 display amount. Body ≥16px. Amounts always `tabular-nums`. Display tracking slightly tight (`-0.02em` to `-0.04em`). No uppercase + wide tracking on buttons.

## Elevation

Radius: `--radius` 0.75rem; sm 0.5; lg 0.75; xl 1.25. Sheets may use a larger top radius. FAB is 1.25rem, not a circle.

Shadows: slate-ink tint (hue 90), low. Dark mode uses shadow for depth, not glow.

Z: sticky page tools ~30, header/tab bar 48, dialogs 50, drawers 150.

## Components

Reuse shadcn/Radix. Restyle via tokens.

**Button.** Primary: pine fill, linen label, min-height 44px (52px for form submit). Secondary: wash + border. Destructive: expense wash + expense text, never a low-contrast cancel. Sentence case, verb + object. Focus: 2–3px ring, offset, `:focus-visible` only.

**Input.** Label above. Placeholder is an example at muted-foreground (no `/40`–`/60` opacity). Error text + `aria-invalid` + `aria-describedby`. Fields ≥16px on iOS. No focus ring on fields — caret + border only (existing contract).

**Choice.** Radios when 2–5 options must be compared. Segmented control for 2–4 view modes. Select only at 6+. Combobox when the list is long (categories, shares). Switch = immediate setting; checkbox = deferred form answer.

**Nav.** Five equal tabs, labels always visible. Active = ink + pine-tinted icon well, not a filled pill.

**Card.** One radius, one hairline, optional `shadow-sm`. Do not nest cards. Home spendable is a section, not a trophy metric with three chips.

**List row.** Min-height 44px, title + meta, amount tabular on the right. Income/expense colour + sign.

**Dialog / sheet.** Bottom sheet on mobile for create/edit. Handle, title, one primary at the bottom, Escape + restore focus. Confirmation names the object and the consequence.

**FAB.** Ink fill, cream glyph, above the tab bar (`bottom-24`). One per list page. `aria-label` required.

## Do's and Don'ts

- Do put the spendable number first, in display serif, with a plain-language label.
- Do use pine only on the thing that commits (save, add, continue) and on focus/selection.
- Do hedge investments and forecasts.
- Don’t use chocolate/terracotta as the whole theme, cool blue, cyan glow, gradient text, or glass as the default surface.
- Don’t uppercase-track buttons (industrial, not household).
- Don’t rainbow-tag categories; quiet tints + icon.
- Don’t treat dark mode as inverted light: lift surfaces, desaturate pine.
- Don’t add a second component library.

## Source

authored
