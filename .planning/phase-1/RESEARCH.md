# Phase 1 Research: Style & Theme Migration

## Audit of `src/styles/system.ts`

The following hardcoded tokens were identified in `src/styles/system.ts` that should be moved to the `@theme` block in `app/globals.css`:

### 1. Glassmorphism Tokens

- `glassmorphism.base`: `bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg`
- `glassmorphism.heavy`: `bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-xl`
- `glassmorphism.light`: `bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-sm`
- `glassmorphism.card`: `bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-2xl shadow-black/5`

### 2. Gradient Tokens

- `vibrantGradients.primary`: `bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500`
- `vibrantGradients.success`: `bg-gradient-to-br from-emerald-400 to-cyan-500`
- `vibrantGradients.warning`: `bg-gradient-to-br from-amber-400 to-orange-500`
- `vibrantGradients.danger`: `bg-gradient-to-br from-red-500 to-rose-600`

### 3. Opacity Tokens (Common Patterns)

- `bg-primary/10`, `bg-primary/15`, `bg-primary/20`
- `border-primary/10`, `border-primary/15`, `border-primary/20`
- `text-primary/60`, `text-primary/70`, `text-primary/50`

## Proposed `@theme` Additions

```css
@theme {
  /* Glass Colors */
  --color-glass-base: oklch(1 0 0 / 0.7);
  --color-glass-heavy: oklch(1 0 0 / 0.8);
  --color-glass-light: oklch(1 0 0 / 0.4);
  --color-glass-border: oklch(1 0 0 / 0.2);

  /* Semantic Opacity Shorthands */
  --color-primary-subtle: oklch(var(--color-primary) / 0.1);
  --color-primary-muted: oklch(var(--color-primary) / 0.2);
  --color-primary-border: oklch(var(--color-primary) / 0.15);

  /* Gradients (as colors or utilities) */
  --color-gradient-primary-start: oklch(0.595 0.178 270); /* Indigo-500 approx */
  --color-gradient-primary-via: oklch(0.6 0.2 300); /* Purple-500 approx */
  --color-gradient-primary-end: oklch(0.6 0.2 330); /* Pink-500 approx */
}
```

## Refactoring Plan

1.  **Define CSS Variables**: Add the identified design tokens as CSS variables in `app/globals.css`.
2.  **Update `@theme`**: Map these variables to Tailwind tokens.
3.  **Update `system.ts`**: Replace hardcoded utility strings with the new semantic tokens (e.g., `bg-primary/10` -> `bg-primary-subtle`).
