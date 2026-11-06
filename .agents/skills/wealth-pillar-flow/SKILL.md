---
name: wealth-pillar-flow
description: Trace or change Wealth Pillar financial behavior across actions, use cases, repositories and client state.
---

Read the relevant contracts in AGENTS.md, then trace only the affected path.
Check spendable/reserve/investment amounts, user/group authorization, currency
conversion, recurrence dates and portfolio snapshot completeness when touched.
Establish semantics from domain code and existing tests; do not infer them.
Include failure paths and state reconciliation in verification where applicable.
Follow the owning layer's patterns and run targeted checks from AGENTS.md.
