# Engineering safeguards for Wealth Pillar

Use the affected sections before material implementation and during review.
AGENTS.md applies the core rules without requiring a skill. This reference adds
concrete proof targets; it does not require a report table on every task.

## Understand, reuse and place

Trace the real input → validation → business logic → persistence → response/state
path. For a bug, identify where the bad state first originates and inspect affected
callers before choosing the fix. Compare equivalent nearby flows; correct the
shared cause without changing unrelated behavior or blindly copying a sibling bug.

Search for an existing helper, type, component or installed library before adding
one. Follow the nearest comparable implementations for naming, placement,
errors/results and lifecycle. Use the current package manifest and runner configs.
Prefer reuse, then standard library/native platform features, then an installed
dependency, then the smallest justified new implementation. Respect the existing
DateField and other product contracts when considering native alternatives.

- Routes/loaders compose pages under `app/[locale]/`; feature UI, form state and
  thin Server Actions belong under `src/features/`.
- Business rules belong in `src/server/use-cases/`; queries and persistence in
  `src/server/repositories/`; schema and migrations in `src/server/db/`.
- Reuse pure helpers and types at their existing owner. Shared components live in
  `src/components/`; do not create a competing Button/Input or financial classifier.
- Keep credentials and privileged DB clients on the server. A client component
  must not acquire a transitive import of a server-only implementation.

## Dependencies and patterns

Before introducing an import, injected dependency or barrel re-export, follow the
dependency in both directions through relevant transitive imports. A → B → A and
A → B → C → A are both cycles. Type-only imports do not automatically justify an
inverted ownership boundary. Use the lowest appropriate shared module for common
behavior, or the existing parameter/callback boundary if that fits the design.
Do not use lazy injection, dynamic imports or copied logic merely to conceal a cycle.
Do not introduce a DI framework into this project to reproduce another stack.

Keep actions, business rules and persistence responsibilities distinct. Apply
SOLID/DRY through the code's existing composition style; do not force a class,
interface, strategy or factory solely to satisfy a pattern name. Put provider
differences at an existing provider boundary when that is the actual ownership;
do not automatically extract every conditional into a new abstraction.

Preserve error/result shapes, validation, nullability and compatibility at callers.
Do not silence a type error with `any`, an unchecked cast or a swallowed exception
instead of fixing the contract. Search public exports, dynamic uses, tests and
configuration before declaring code unused.

## State, safety and operational cost

For the touched path identify valid states, transitions and failure outcomes.
Keep multi-write operations atomic through the owning transaction mechanism;
preserve idempotency, concurrency guards and authoritative client reconciliation.
Missing identity, ownership or required money/FX data must not become an implicit
successful operation. Check trust-boundary validation and server-derived scope.
Use the [financial reference](../../.agents/skills/wealth-pillar-flow/references/financial-contracts.md)
for the affected money, group, currency, calendar and snapshot invariants.

Assess actual growth in records, queries and external calls. Avoid N+1, repeated
full scans, unbounded accumulation and unnecessary network fan-out. Check query
filters/indexes and preserve complete financial aggregates: a silent row limit is
not an acceptable replacement for a complete ledger calculation. Use bounded
iteration, batching or existing aggregation according to the owning contract.

External I/O needs the existing timeout/error policy. Retry only when the operation
is idempotent or guarded; keep retries bounded and avoid retry amplification.
Partial failures must preserve consistent state and recoverable forms. Keep user
errors actionable and logs free of secrets and raw financial records. Optimize
with evidence from the changed path rather than speculative infrastructure.

## Self-review and verification

Read the actual final diff, including new files and necessary callers. Check the
root cause, sibling parity, correct layer, dependency direction, reused logic,
state transitions, money/permissions, query cost and error paths that are affected.
Remove clearly obsolete code created by the change; preserve shipped interfaces
and unrelated user edits. Simplicity does not remove validation, accessibility,
data protection or explicitly requested behavior.

Choose meaningful assertions at the smallest level that proves the risk. Use
nearby Vitest patterns; use isolated PostgreSQL for persistence/concurrency and
the documented Clerk development environment for browser persistence journeys.
Do not replace existing test frameworks with a smoke `assert` for the sake of
shorter code. Report checks actually run and distinguish failures from unavailable
environments. Derive commands from AGENTS.md and the live runner configuration.

For review findings, challenge the hypothesis against the base, sibling behavior,
upstream/downstream guards and accepted user intent. Keep only an actionable
introduced defect supported by a concrete path and reproduction/call chain;
separate pre-existing behavior and unresolved evidence. A later review checks
new hunks and earlier findings without repeating unchanged conclusions.

These are reasoning safeguards, not a new static dependency analyzer. TypeScript
and ESLint do not prove that every cycle or architectural mistake is absent.
