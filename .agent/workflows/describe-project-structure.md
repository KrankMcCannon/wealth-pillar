---
description: Describe the project structure and generate a PROJECT_STRUCTURE.md file
---

This workflow analyzes the project structure and updates/creates a `PROJECT_STRUCTURE.md` file with a detailed description of each folder's purpose.

1.  **Analyze Project Root**:
    - List all directories in the project root.
    - Ignore standard ignored directories (e.g., `node_modules`, `.git`, `.next`).

2.  **Generate Structure Description**:
    - For each directory, determine its logical purpose based on its name and contents.
    - *Example*: `app/` usually contains the application source code and routing logic in Next.js projects. `components/` contains reusable UI components.

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
    - Ensure the file is created and contains descriptions for all major root directories.
