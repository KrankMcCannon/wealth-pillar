---
description: Describe the project structure and generate a PROJECT_STRUCTURE.md file
---

This workflow analyzes the project structure and updates/creates a `PROJECT_STRUCTURE.md` file with a detailed description of each folder's purpose.

### Prerequisites
- Ensure you have read access to the directory.

1.  **Analyze Project Root**:
    - Use `list_dir` to list all directories in the project root.
    - Ignore standard ignored directories (e.g., `node_modules`, `.git`, `.next`, `.agent`, `.gemini`).

2.  **Generate Structure Description**:
    - For each directory, determine its logical purpose based on its name and contents.
    - *Example*:
      - `app/`: Application source code and routing (Next.js).
      - `components/`: Reusable UI components.
      - `lib/` or `utils/`: Helper functions.

3.  **Update PROJECT_STRUCTURE.md**:
    - Create or overwrite `PROJECT_STRUCTURE.md` in the root of the workspace.
    - Write a clean, readable Markdown structure.
    - Format:
      ```markdown
      # Project Structure

      ## /folder_name
      Description of what this folder contains and its role in the architecture.
      ```

4.  **Verification**:
    - Ensure the file is created.
    - Check that all major directories (excluding ignored ones) are present.

