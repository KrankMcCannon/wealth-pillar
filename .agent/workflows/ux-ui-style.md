---
description: Check and enforce UX/UI style consistency
---

This workflow ensures that the UI components and styles adhere to the project's established UX/UI guidelines.

1.  **Identify Context**:
    - Determine which UI components or pages are being modified or created.
    - Locate the project's design tokens (e.g., in `tailwind.config.ts`, `globals.css`, or a design system file).

2.  **Check Consistency**:
    - **Colors**: Verify that used colors match the project's color palette (variables, Tailwind classes).
    - **Typography**: specific fonts, sizes, and weights defined in the project.
    - **Spacing**: Ensure margins and paddings follow the spacing scale.
    - **Components**: Check if existing reusable components are being used instead of recreating them (e.g., using a custom `Button` vs. a standard HTML `<button>`).

3.  **Enforce Rules**:
    - IF styles are inconsistent:
        - Suggest changes to align with the style guide.
        - *Example*: "Replace `text-[#123456]` with `text-primary` to match the design system."
    - IF a new pattern is introduced without reason:
        - Flag it and ask if it should be added to the design system or if an existing pattern should be used.

4.  **Action**:
    - Apply the corrections to the code if authorized, or list the violation for user review.
