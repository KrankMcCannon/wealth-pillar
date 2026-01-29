---
description: Enforce project optimization, architecture, and coding standards
---

This workflow checks code alignment with project standards, performance requirements, and architectural principles.

1.  **Architecture Check**:
    - Ensure files are placed in the correct directories.
    - Verify that the separation of concerns is respected (e.g., components should not directly query the DB).

2.  **Code Quality & Principles**:
    - **SOLID**: Check for violations of SOLID principles.
    - **DRY**: Identify duplicated logic.
    - **Existing Code**: Check if a function already exists before creating a new one.

3.  **Performance & Scalability**:
    - **Big O Notation**: Analyze algorithms for potential bottlenecks.
      - *Example*: Avoid nested loops O(n^2) when dealing with large arrays. Prefer maps/sets for O(1) lookups.
    - **Scalability**: Ensure code structure allows easier expansion.

4.  **Action**:
    - If issues are found, refactor the code.
    - If unsure, flag the specific code block with a warning.

