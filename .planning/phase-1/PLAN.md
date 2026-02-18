---
phase: 01-style-theme-migration
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [app/globals.css]
autonomous: true
requirements: [NFR1]
must_haves:
  truths:
    - "Tailwind v4 theme contains semantic color tokens for glassmorphism and opacities"
    - "CSS variables for theme tokens are correctly handled in light and dark mode"
  artifacts:
    - path: "app/globals.css"
      provides: "Semantic design tokens in Tailwind v4 theme"
      contains: "@theme"
  key_links:
    - from: "app/globals.css"
      to: "Tailwind @theme"
      via: "variable declaration"
      pattern: "--color-glass-base|--color-primary-subtle"
---

<objective>
Define semantic design tokens in the Tailwind v4 theme within 'app/globals.css' to centralize style management.

Purpose: Moving tokens to the CSS layer allows for cleaner utility usage and easier theme-wide adjustments.
Output: An updated 'app/globals.css' with new '@theme' declarations.
</objective>

<execution_context>
@/Users/ivanapiscitelli/.gemini/get-shit-done/workflows/execute-plan.md
@/Users/ivanapiscitelli/.gemini/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-1/RESEARCH.md
@app/globals.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Define CSS Variables for Glassmorphism and Semantic Opacities</name>
  <files>app/globals.css</files>
  <action>
    Add the following semantic tokens to the '@theme' block in 'app/globals.css':
    1. Glassmorphism:
       - '--color-glass-base': oklch(1 0 0 / 0.7) [Light mode override needed in html.dark: oklch(0 0 0 / 0.4)]
       - '--color-glass-heavy': oklch(1 0 0 / 0.8) [Light mode override needed in html.dark: oklch(0 0 0 / 0.6)]
       - '--color-glass-light': oklch(1 0 0 / 0.4) [Light mode override needed in html.dark: oklch(0 0 0 / 0.2)]
       - '--color-glass-border': oklch(1 0 0 / 0.2) [Light mode override needed in html.dark: oklch(1 0 0 / 0.1)]
    
    2. Semantic Opacity Shorthands (map existing primary/background variables):
       - '--color-primary-subtle': oklch(var(--color-primary) / 0.1)
       - '--color-primary-muted': oklch(var(--color-primary) / 0.2)
       - '--color-primary-border': oklch(var(--color-primary) / 0.15)
       - '--color-bg-glass': oklch(var(--color-background) / 0.6)
    
    3. Gradient Color Points:
       - '--color-gradient-primary-start': oklch(0.595 0.178 270)
       - '--color-gradient-primary-via': oklch(0.6 0.2 300)
       - '--color-gradient-primary-end': oklch(0.6 0.2 330)

    Ensure they are defined within the '@theme' block and overrides are placed in 'html.dark' or as appropriate for Tailwind v4 + shadcn setup.
  </action>
  <verify>Check 'app/globals.css' contains the new '--color-*' declarations within '@theme'.</verify>
  <done>All requested CSS variables are defined in 'app/globals.css' and support dark mode.</done>
</task>

<task type="auto">
  <name>Task 2: Define Semantic Utilities (Optional/Best Practice)</name>
  <files>app/globals.css</files>
  <action>
    In the '@theme' block, add the following mappings for easier consumption in 'system.ts':
    - '--color-glass-card': oklch(var(--color-card) / 0.6)
    - '--color-border-subtle': oklch(var(--color-border) / 0.3)
    
    Also add a few '@utility' shortcuts if it simplifies 'system.ts' migration (e.g., 'liquid-glass-base' if combining background + blur + border).
  </action>
  <verify>Check 'app/globals.css' for the additional semantic utilities.</verify>
  <done>Semantic utilities and additional mappings are added.</done>
</task>

</tasks>

<verification>
Ensure 'npm run build' or Tailwind compilation doesn't throw errors with the new variables.
</verification>

<success_criteria>
Tailwind v4 theme has the new tokens available as 'bg-glass-base', 'bg-primary-subtle', etc.
</success_criteria>

<output>
After completion, create '.planning/phases/01-style-theme-migration/01-01-SUMMARY.md'
</output>
---
phase: 01-style-theme-migration
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified: [src/styles/system.ts]
autonomous: true
requirements: [NFR1]
must_haves:
  truths:
    - "'src/styles/system.ts' uses semantic tokens instead of hardcoded utility strings"
    - "Opacity patterns like '/10' are replaced with semantic shorthands"
  artifacts:
    - path: "src/styles/system.ts"
      provides: "Refactored style registry using centralized theme tokens"
      contains: "bg-glass-base|bg-primary-subtle"
  key_links:
    - from: "src/styles/system.ts"
      to: "Tailwind @theme tokens"
      via: "utility class consumption"
      pattern: "bg-glass-base|bg-primary-subtle"
---

<objective>
Surgically replace hardcoded Tailwind utility strings in 'src/styles/system.ts' with the new semantic theme tokens defined in 'app/globals.css'.

Purpose: Aligning 'system.ts' with the Tailwind v4 theme ensures design consistency and allows for global style changes.
Output: A refactored 'src/styles/system.ts' file using centralized tokens.
</objective>

<execution_context>
@/Users/ivanapiscitelli/.gemini/get-shit-done/workflows/execute-plan.md
@/Users/ivanapiscitelli/.gemini/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-1/RESEARCH.md
@.planning/phases/01-style-theme-migration/01-01-SUMMARY.md
@src/styles/system.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Refactor Glassmorphism Styles</name>
  <files>src/styles/system.ts</files>
  <action>
    Locate the 'glassmorphism' object in 'src/styles/system.ts' and update as follows:
    - 'base': 'bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg' -> 'bg-glass-base backdrop-blur-xl border border-glass-border shadow-lg'
    - 'heavy': 'bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-xl' -> 'bg-glass-heavy backdrop-blur-2xl border border-glass-border shadow-xl'
    - 'light': 'bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-sm' -> 'bg-glass-light backdrop-blur-md border border-glass-border shadow-sm'
    - 'card': 'bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-2xl shadow-black/5' -> 'bg-card/60 backdrop-blur-xl border border-glass-border shadow-2xl shadow-black/5' (or use new bg-glass-card utility if defined)
  </action>
  <verify>Check 'system.ts' for replaced strings in 'glassmorphism' object.</verify>
  <done>Glassmorphism styles now use semantic theme tokens.</done>
</task>

<task type="auto">
  <name>Task 2: Refactor Vibrant Gradients</name>
  <files>src/styles/system.ts</files>
  <action>
    Locate 'vibrantGradients' in 'src/styles/system.ts' and update:
    - Replace 'from-indigo-500 via-purple-500 to-pink-500' with something mapping to the new 'gradient-primary' points if possible, or keep as is if v4 handles gradients differently (Tailwind v4's linear-to-br is preferred).
    - Example replacement: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' -> 'bg-linear-to-br from-gradient-primary-start via-gradient-primary-via to-gradient-primary-end'.
  </action>
  <verify>Check 'vibrantGradients' for updated gradient classes.</verify>
  <done>Gradients use updated Tailwind v4 syntax and tokens.</done>
</task>

<task type="auto">
  <name>Task 3: Refactor Opacity Patterns Globally</name>
  <files>src/styles/system.ts</files>
  <action>
    Perform a global find-and-replace (carefully) for the following patterns in 'src/styles/system.ts':
    - 'bg-primary/10' -> 'bg-primary-subtle'
    - 'bg-primary/15' -> 'bg-primary-border' (check context)
    - 'bg-primary/20' -> 'bg-primary-muted'
    - 'border-primary/10' -> 'border-primary-subtle'
    - 'border-primary/15' -> 'border-primary-border'
    - 'border-primary/20' -> 'border-primary-muted'
    - 'text-primary/60' -> 'text-primary/60' (if no shorthand exists, keep or use semantic text color tokens if defined)
    - 'bg-card/60' -> 'bg-card-glass' (if defined)
  </action>
  <verify>Use grep to count occurrences of '/10', '/15', '/20' in 'src/styles/system.ts' and ensure they are significantly reduced or eliminated.</verify>
  <done>Majority of hardcoded opacity strings are replaced with semantic theme tokens.</done>
</task>

</tasks>

<verification>
Ensure 'npm run build' passes. Use 'grep' to verify that '/10', '/15', '/20' strings are replaced.
</verification>

<success_criteria>
'system.ts' uses semantic tokens that map to 'globals.css' variables.
</success_criteria>

<output>
After completion, create '.planning/phases/01-style-theme-migration/01-02-SUMMARY.md'
</output>
---
phase: 01-style-theme-migration
plan: 03
type: execute
wave: 3
depends_on: [02]
files_modified: []
autonomous: false
requirements: [NFR1]
must_haves:
  truths:
    - "UI elements using 'system.ts' styles look correct in both light and dark mode"
    - "No visual regression in glassmorphism or gradients"
  artifacts: []
  key_links: []
---

<objective>
Manually verify that the style migration hasn't introduced visual regressions and that the new theme tokens are correctly applied across light and dark modes.

Purpose: Automated tools can check for string replacements, but human eyes are needed for visual fidelity and mode-switching correctness.
Output: Verification of a consistent UI.
</objective>

<execution_context>
@/Users/ivanapiscitelli/.gemini/get-shit-done/workflows/execute-plan.md
@/Users/ivanapiscitelli/.gemini/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/styles/system.ts
@app/globals.css
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Refactored style system using Tailwind v4 theme tokens.</what-built>
  <how-to-verify>
    1.  Start the development server: 'npm run dev' (if available).
    2.  Visit the application and navigate through several pages (Home, Transactions, Budgets).
    3.  Check UI components that use 'glassmorphism' (e.g., cards, navigation).
    4.  Verify gradients in both modes.
    5.  Toggle light and dark mode and ensure colors and opacities are correct.
    6.  Ensure no 'broken' utility strings appear (e.g., check console for Tailwind warnings if possible).
  </how-to-verify>
  <resume-signal>approved</resume-signal>
</task>

</tasks>

<verification>
Manual verification successful.
</verification>

<success_criteria>
Visual consistency confirmed across the app in both light and dark modes.
</success_criteria>

<output>
After completion, create '.planning/phases/01-style-theme-migration/01-03-SUMMARY.md'
</output>
