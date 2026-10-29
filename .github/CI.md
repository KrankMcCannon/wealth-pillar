# CI and master protection

The `CI` workflow runs on PRs to `master`, pushes to `master`, and manual runs.
Feature-branch pushes do not duplicate PR runs. Static checks and build always run
in parallel with test selection. Unit and integration runners start only when the
planner selects files for them. A skipped integration job does not start PostgreSQL.

## Selecting affected tests

`Select affected tests` uses the PR's base SHA or push's `before` SHA, with full Git
history. It selects test **files** through Vitest's import graph (`list --changed`),
including direct/transitive dependencies and changed tests themselves. It publishes
selected files and the baseline in the run summary. The runner executes that exact
list with normal per-file isolation and fails on an unexpected empty selection.
The integration suite currently occupies one file, so any related change runs all
of its cases; unrelated changes skip its database service entirely.

- Changes to dependencies, shared configuration, workflow/planner, test setup,
  locales/assets/CSS/SQL or deleted/renamed files run the full suite.
- Missing/invalid baselines and manual runs run the full suite.
- Documentation-only changes select no unit/integration files; lint, types and build
  still run. A source change with no importing tests is visible as an empty selection.
- Planner and Quality logic have independent Node tests, including a real Git/Vitest
  dependency fixture and cache invalidation checks. They run in the planner job.

No test results are cached. All selected tests execute on every run. Use
`workflow_dispatch` to request a full audit whenever needed. Browser E2E require
local Clerk development credentials and a dedicated fixture DB; see [tests](../tests/README.md).

## Incremental caches

pnpm's content-addressed store is cached by the pinned Node runtime and lockfile.
ESLint, TypeScript and Next caches are separate. Keys include Node version, OS,
architecture, lockfile/package hashes, tool configuration and relevant **file content**.
A documentation-only commit reuses the same key rather than allocating a new cache.
Restore prefixes stay inside the same runtime/dependency/configuration scope.

Every cache-enabled job records exact hit, compatible prefix hit or miss and restored
size in its summary, before running validation. Cache hits never bypass lint, type
checking or build. Only `.eslintcache`, `tsconfig.tsbuildinfo` and `.next/cache` are
stored; no production output or credentials are reused. PR caches are scoped by
GitHub to the PR merge ref; master push runs populate caches reusable by later PRs.
GitHub automatically evicts unused caches; no unsafe cross-branch restore is used.

## Why Quality runs last

`Quality` is the required aggregate check, not another validation workload. Its few
seconds of work must run **after** the parallel jobs so it can verify their results.
Running it independently would let a green status appear while tests still run/fail.
It accepts a skipped test job only when a successful planner explicitly selected no
files for it; missing outputs, failed/cancelled checks and unexpected skips fail it.
This retains the single existing branch-protection check without weakening it.

`master-protection.json` records the branch protection configuration: pull requests
and the GitHub Actions `Quality` check are required, including for administrators.
The branch must be up to date; force pushes and deletion are disabled. An additional
reviewer is optional so the repository owner can merge their own verified PRs.

For bootstrap, publish CI on a branch and obtain a passing `Quality` check before
applying this configuration. Do not require a nonexistent check on `master` before
the first verified PR is available.

```sh
gh api --method PUT repos/KrankMcCannon/wealth-pillar/branches/master/protection \
  --input .github/master-protection.json
```

For future work, push a branch, open a PR, wait for `Quality`, and merge. Direct
pushes to `master` are intentionally blocked after protection is enabled.

Dependabot checks npm dependencies and GitHub Actions weekly. SheetJS remains at
0.20.3 from its official CDN; its tarball is pinned with SHA-512 integrity in the
lockfile, verified by a clean frozen install.
