---
description: Create or update PROJECT_STRUCTURE.md to maintain accurate agent-readable codebase documentation.
---

This workflow maintains `PROJECT_STRUCTURE.md` as a living document. Use it for initial creation OR incremental updates when the project changes.

---

## When to Run This Workflow

- **Initial creation**: No `PROJECT_STRUCTURE.md` exists
- **After adding**: New features, pages, components, services, stores, hooks
- **After modifying**: Architecture patterns, data flows, styling system, database schema
- **After removing**: Deleted features, deprecated patterns
- **Periodic review**: Every major release or significant refactor

---

## 1. Assess Current State

// turbo
Check if `PROJECT_STRUCTURE.md` exists and identify what changed:

```bash
# Check file exists
ls -la PROJECT_STRUCTURE.md

# Check recent changes (last 10 commits)
git log --oneline -10 --name-only
```

Determine update scope:

- **Full regeneration**: File doesn't exist OR major refactor
- **Incremental update**: Specific sections need updating

---

## 2. Scan Changed Areas

// turbo
Based on what changed, scan the relevant directories:

**If features changed:**

```bash
ls -la src/features/
```

**If services changed:**

```bash
ls -la src/server/services/
```

**If stores changed:**

```bash
ls -la src/stores/
```

**If components changed:**

```bash
ls -la src/components/
```

**If pages changed:**

```bash
ls -la app/\(dashboard\)/
```

**If styling changed:**

- Read `app/globals.css` for new tokens/utilities

**If dependencies changed:**

- Read `package.json` for version updates

---

## 3. Update PROJECT_STRUCTURE.md

Apply targeted updates to the relevant sections. The file MUST maintain these sections:

### Required Sections

| Section                    | When to Update                       |
| -------------------------- | ------------------------------------ |
| **Quick Reference**        | Framework/dependency versions change |
| **Architecture Pattern**   | Data flow or pattern changes         |
| **Directory Structure**    | New/removed folders                  |
| **Feature Module Pattern** | New features added                   |
| **Feature List Table**     | Feature additions/removals           |
| **Services Layer**         | New/modified services                |
| **Stores**                 | New/modified Zustand stores          |
| **Hooks**                  | New/modified hooks                   |
| **User Flows**             | New/modified user flows              |
| **Mobile Patterns**        | New mobile-specific code             |
| **Styling System**         | New tokens, utilities, colors        |
| **Database Schema**        | Schema changes                       |
| **Testing**                | Test config changes                  |
| **Cache Strategy**         | Cache tag changes                    |
| **Naming Conventions**     | Convention changes                   |
| **Common Patterns**        | New reusable patterns                |
| **Agent Instructions**     | Workflow changes                     |
| **Dependencies**           | Package additions/updates            |

### Update Rules

1. **Preserve existing content** - Only modify what changed
2. **Keep agent-optimized format** - Tables, code blocks, clear headers
3. **Update version numbers** - Check package.json for current versions
4. **Add new entries** - Don't remove valid existing entries
5. **Mark deprecated items** - Use strikethrough ~~deprecated~~ before removal

---

## 4. Incremental Update Examples

### Adding a New Feature

1. Add to **Directory Structure** under `src/features/`
2. Add row to **Feature List Table**
3. If new service: add to **Services Layer**
4. If new store: add to **Stores** table
5. If new hooks: add to **Hooks** tables

### Adding a New Page

1. Add to **Directory Structure** under `app/(dashboard)/`
2. Update relevant **User Flows** if applicable

### Adding a New Service

1. Add to **Services Layer** table
2. Add key methods description
3. Update **Cache Strategy** if new cache tags added

### Modifying Styling

1. Update **Styling System** section
2. Add new tokens/utilities with their values
3. Update color references if palette changed

### Updating Dependencies

1. Update version in **Quick Reference** table
2. Update **Dependencies Quick Reference** section

---

## 5. Verification

// turbo
After updating, verify the file:

```bash
# Check file updated
head -50 PROJECT_STRUCTURE.md

# Verify no syntax issues (markdown linting optional)
wc -l PROJECT_STRUCTURE.md
```

Confirm:

- [ ] All changed areas are reflected
- [ ] Version numbers are current
- [ ] New additions are documented
- [ ] Removed items are cleaned up
- [ ] File renders correctly as markdown

---

## 6. Commit Guidance

When committing PROJECT_STRUCTURE.md updates:

```bash
git add PROJECT_STRUCTURE.md
git commit -m "docs: update PROJECT_STRUCTURE.md - [brief description of changes]"
```

Examples:

- `docs: update PROJECT_STRUCTURE.md - add receipts feature`
- `docs: update PROJECT_STRUCTURE.md - update Next.js to v16.2`
- `docs: update PROJECT_STRUCTURE.md - new transaction modal flow`
