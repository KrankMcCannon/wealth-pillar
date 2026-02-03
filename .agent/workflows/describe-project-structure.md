---
description: Analyze the entire codebase to generate a comprehensive PROJECT_STRUCTURE.md guide.
---

This workflow surveys the entire project to create a definitive guide (`PROJECT_STRUCTURE.md`) for agents and developers. This guide must be exhaustive and accurate.

### 1. Deep Exploration

// turbo
Begin by scanning the entire project structure.

- Execute `list_dir` on the path root and recursively on subdirectories (especially `src`, `app`, `components`, `lib`, `features`).
- **Read key files**: Open `package.json`, `tsconfig.json`, `next.config.*`, and representative files in each major directory to understand their role.
- **Analyze Code Patterns**: Thoroughly read files to identify:
  - How state is managed.
  - How styles are applied.
  - Data fetching strategies.
  - Naming conventions and file organization patterns.

### 2. Generate PROJECT_STRUCTURE.md

Create or overwrite `PROJECT_STRUCTURE.md` in the root. The file content MUST be detailed and follow this structure:

#### A. Project Architecture & Standards

- **Architecture Pattern**: Define the architectural style (e.g., Feature-Sliced, Monolithic Next.js, etc.) and how data flows.
- **Best Practices**:
  - Coding standards observed (e.g., "Logic extracted to hooks", "Zod for validation").
  - Naming conventions (PascalCase, kebab-case usages).
  - Technology specific patterns (e.g., Tailwind usage, server components).

#### B. Detailed File & Folder Dictionary

_Core Task_: For **every** folder and **every** significant file in the project (excluding ignored folders like `node_modules`, `.next`, `.git`):

- **Folder Goal**: explicit description of what the folder contains and its specific boundary/responsibility.
- **File Purpose**: Description of what each file does.
  - _Example Format_:
    - `src/utils/`: Generic helper functions.
      - `date-format.ts`: Functions for parsing and formatting dates.

#### C. Visual Project Tree

- Generate a complete directory tree representation of the project structure within a code block.

### 3. Verification

- Verify that `PROJECT_STRUCTURE.md` exists and accurately reflects the current state of the codebase.
