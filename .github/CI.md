# CI and master protection

The `CI` workflow runs on pull requests to `master`, pushes to `master`, and manual
runs. Feature-branch pushes do not duplicate PR runs. All checks still run for every
PR, including documentation-only changes.

The following jobs run independently in parallel:

- Static checks: content-based ESLint cache and incremental TypeScript checking.
- Unit tests: Node and DOM projects on separate runners; only browser-dependent tests
  create jsdom. Per-file isolation stays enabled. `pnpm test` still runs both projects.
- PostgreSQL integration: a disposable PostgreSQL 17 Alpine service, available without
  waiting for lint or unit tests. Tests keep their transaction/concurrency assertions
  and serial fixture isolation.
- Production build: persisted `.next/cache`; no PostgreSQL container is needed.

Each job uses a frozen pnpm installation. Synthetic Clerk credentials keep CI independent
of production data and secrets. The final `Quality` job runs even after failed or
cancelled dependencies, and passes only when every required job succeeded. Branch
protection continues to require that single GitHub Actions check.

ESLint, TypeScript and Next caches are keyed by runner, dependency/config hashes and
commit, with restore prefixes for earlier commits. They cache incremental work only;
no test is skipped and no production output or credentials are reused. The local font
files and pinned pnpm version keep builds reproducible.

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
