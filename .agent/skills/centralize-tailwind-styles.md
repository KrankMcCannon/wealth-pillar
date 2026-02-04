---
name: Centralize Tailwind CSS Styles
description: A skill for centralizing and managing Tailwind CSS styles following version 4 best practices, promoting consistency and maintainability.
---

# My Skill

I am an expert in Tailwind CSS v4 architecture and design systems. My goal is to help you maintain a clean, consistent, and scalable styling codebase. I ensure that styles are centralized using CSS variables and the `@theme` directive, avoiding hardcoded arbitrary values in markup, and promoting the use of semantic tokens. I also guide the usage of utility composition tools like `cva` (Class Variance Authority) and `tailwind-merge` to handle component variants efficiently.

# When to use this skill

Use this skill when:

- **Starting a new project**: To set up a robust styling foundation using Tailwind v4.
- **Refactoring styling**: When you notice inconsistent colors, spacing, or typography across the application.
- **Creating new UI components**: To ensure they adhere to the design system and support variants (e.g., buttons with primary/secondary styles).
- **Fixing "messy" templates**: When JSX/HTML becomes unreadable due to excessive utility classes that should be abstracted or tokenized.
- **Updating from v3 to v4**: When migrating configuration from `tailwind.config.js` to CSS-native configuration.

**Examples:**

- "Make all buttons use the primary brand color defined in the theme."
- "Refactor this card component to use the global shadow and border-radius tokens."
- "Set up the global typography scale for the project."
- "Create a reusable 'Badge' component with 'success', 'warning', and 'error' variants."

# How to use it

Follow these steps and conventions to centralize styles with Tailwind v4:

### 1. Define Design Tokens in CSS

Instead of a JavaScript configuration file, use the main CSS file (e.g., `globals.css`) to define your theme variables. Use the `@theme` directive.

```css
@import 'tailwindcss';

@theme {
  /* Define colors */
  --color-primary: oklch(0.5 0.2 240);
  --color-primary-foreground: oklch(0.98 0 0);

  /* Define font families */
  --font-sans: 'Inter', sans-serif;

  /* Define spacing/other tokens if needed */
  --radius-lg: 0.5rem;
}
```

### 2. Use Semantic Class Names

Avoid hardcoding arbitrary values like `bg-[#123456]`. Always use the tokens defined in your theme.

- **Bad**: `class="bg-[#3b82f6] text-white"`
- **Good**: `class="bg-primary text-primary-foreground"`

### 3. Component Composition with `cn` (clsx + tailwind-merge)

Ensure you have a utility to merge classes safely.
`lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 4. Variant Management with `cva`

For components with multiple states or variants, use `class-variance-authority`.

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

### 5. Centralize Logic, Not Just Styles

If a set of classes is used repeatedly (e.g., a specific card layout), encapsulate it in a React component rather than creating an `@apply` class in CSS, unless strict reusability outside React is required. Tailwind v4 encourages keeping styles in markup but abstracting via components.

### 6. File Structure

- **Design Tokens**: `app/globals.css` (or `src/styles.css`)
- **Utilities**: `lib/utils.ts`
- **UI Components**: `components/ui/` (each component in its own file)

### Checklist for Quality

- [ ] Are all colors using theme variables?
- [ ] Are spacing values standard (not arbitrary pixels)?
- [ ] Is `tailwind-merge` used for all component props that accept `className`?
- [ ] Is the `@theme` block in CSS used instead of `tailwind.config.js` where possible?
