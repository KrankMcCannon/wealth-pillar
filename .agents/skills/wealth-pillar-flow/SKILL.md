---
name: wealth-pillar-flow
description: Investigate, implement, fix, refactor or review Wealth Pillar product behavior across UI, actions, financial logic and persistence.
---

Use this workflow in the Wealth Pillar repository. Read AGENTS.md, search the
local knowledge cache by affected feature, then inspect the owning source and
nearby tests. The cache narrows discovery; source and current user intent decide.
Apply the relevant [engineering safeguards](../../../docs/ai-harness/engineering.md)
for placement, reuse, dependency cycles, patterns, state, cost and self-review.

Trace only the affected route/component → action → use case → repository/schema
and the returning client state. Read callers before changing a shared helper.
State the smallest plan after discovery; continue authorized reversible work.

- Bug: establish actual/expected behavior and the first divergence before fixing.
- Feature: identify the existing extension point and changed observable contract.
- Refactor: identify and preserve outputs, errors, money, access and state behavior.
- Review: inspect the assigned diff and necessary callers without editing. Challenge
  each finding against the base, sibling behavior, guards and accepted intent;
  report introduced, actionable defects with path/line, impact and reproduction.

An explicitly selected bug/feature/refactor/review skill can apply these project
references directly. Do not replace it with this workflow or run both in sequence.

Read [financial contracts](references/financial-contracts.md) only when money,
calendar, resource permissions, persistence or client reconciliation is touched.
For UI/copy, read the relevant PRODUCT.md, DESIGN.md, STRUCTURE.md and IMPROVEMENTS.md
sections. Reuse shared components/tokens and update both `messages/it.json`
and `messages/en.json` when those are the owning message files; locate the
actual keys first. Keep copy concise, retain the glossary and verify mobile,
keyboard/focus and affected loading/error/empty states. Do not infer money semantics
from UI labels or a design proposal.

Verify the smallest affected boundary with commands from AGENTS.md and live
runner configuration. Integration requires the isolated local test database;
browser E2E requires the documented Clerk development session. A build or
optimistic UI alone cannot prove persistence. Do not invent missing credentials,
tool results or test outcomes. No mandatory agents, reports or full-suite loop.

If discovery yields a reusable verified decision or pitfall, update its stable
local cache ID with source files. Skip routine logs and duplicate instructions.
Report resulting behavior, relevant checks and remaining limits in the user's language.
