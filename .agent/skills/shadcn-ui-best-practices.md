---
name: Shadcn UI Best Practices
description: A skill for enforcing strict usage of shadcn/ui components over native HTML tags to ensure UI consistency, modularity, and mobile-first design.
---

# My Skill

I am an expert in shadcn/ui component architecture and modern React development. My primary mandate is to enforce the **exclusive use of shadcn/ui components** instead of native HTML elements to ensure a highly consistent, accessible, and professional UI. I rigorously apply a **mobile-first design strategy**, ensuring all components look great on small screens by default before adapting to larger viewports. I promote modularity by encouraging the breakdown of complex interfaces into smaller, reusable building blocks.

# When to use this skill

Use this skill when:

- **Building new pages or features**: To select the correct shadcn/ui components for every UI element.
- **Refactoring legacy code**: To replace raw HTML tags (like `<button>`, `<input>`, `<table>`) with their shadcn counterparts (`Button`, `Input`, `Table`).
- **Implementing responsive designs**: To ensure the "mobile-first" rule is strictly followed in every class definition.
- **Reviewing UI code**: To detect and correct inconsistencies or non-accessible patterns.
- **Designing reusable patterns**: When creating composite components that need to integrate seamlessly with the existing design system.

**Examples:**

- "Replace this native `<button>` with the `Button` component."
- "Refactor this form to use `Form`, `FormControl`, `Input`, and `Label` components instead of divs and inputs."
- "Ensure this Card layout stacks vertically on mobile and becomes a grid on desktop (mobile-first)."
- "Create a `DataTable` component using shadcn `Table` primitives."

# How to use it

Follow these strict rules and patterns:

### 1. No Native Tags Rule

Never use native HTML tags when a shadcn/ui equivalent exists.

- **Bad**: `<button className="...">Click me</button>`
- **Good**: `<Button>Click me</Button>`
- **Bad**: `<input type="text" ... />`
- **Good**: `<Input ... />`
- **Bad**: `<h1>Title</h1>`
- **Good**: `<TypographyH1>Title</TypographyH1>` (or a configured typography component)

### 2. Mandatory Mobile-First Design

Always write styles for the smallest screen first. Use `md:`, `lg:`, `xl:` prefixes only for larger screens.

- **Bad**: `class="flex-row md:flex-col"` (Building for desktop first is forbidden)
- **Good**: `class="flex flex-col md:flex-row"` (Default is mobile/column, `md` overrides for desktop/row)

### 3. Component Composition & Modularity

Don't build monolithic files. Break down UIs.

- Use `Card`, `CardHeader`, `CardContent`, `CardFooter` for standard containers.
- If a component exceeds ~150 lines, look for opportunities to extract sub-components.
- Keep components "dumb" where possible; handle logic in hooks or parent pages.

### 4. Layout & Grid

Use standard layout components or strictly controlled Tailwind classes.

- Use `container` class for page wrappers.
- Use `grid` and `flex` with gap tokens (e.g., `gap-4`) rather than arbitrary margins between siblings.

### 5. Dialogs & Interactive Elements

- Always use `Dialog`, `Sheet`, or `Popover` for overlays.
- Ensure all interactive states (hover, focus, active) are handled by the component variants, not ad-hoc CSS.

### Checklist for Implementation

- [ ] Did I replace all native buttons, inputs, and layout elements with shadcn/ui components?
- [ ] Is the layout vertically stacked by default (mobile view)?
- [ ] Are responsive classes (`md:`, `lg:`) used _only_ to adapt the design to larger screens?
- [ ] Are component props (like `variant="outline"`) used instead of overriding classes manually?
