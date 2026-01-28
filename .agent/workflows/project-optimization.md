---
description: Enforce project optimization, architecture, and coding standards
---

This workflow checks code alignment with project standards, performance requirements, and architectural principles.

1.  **Architecture Check**:
    - Ensure files are placed in the correct directories according to the project structure (e.g., use `app/` for routes, `components/` for UI).
    - Verify that the separation of concerns is respected (e.g., business logic separated from UI where possible).

2.  **Code Quality & Principles**:
    - **SOLID**: Check for violations of SOLID principles (e.g., Single Responsibility).
    - **DRY (Don't Repeat Yourself)**: Identify duplicated logic that can be extracted into a utility or hook.
    - **Existing Code**: explicitly check if a function or component already exists before allowing the creation of a new one.

3.  **Performance & Scalability**:
    - **Big O Notation**: Analyze algorithms (loops, recursive calls) for potential performance bottlenecks. Prefer O(1) or O(log n) over O(n) or O(n^2) where feasible.
    - **Scalability**: Ensure code structure allows easier expansion (e.g., modular configurations vs. hardcoded values).

4.  **Action**:
    - If issues are found, refactor the code to improve performance and adhere to standards.
    - If unsure, flag the specific code block with a warning explaining the violation (e.g., "Warning: O(n^2) complexity detected in large dataset iteration").
