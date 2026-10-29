# CI and master protection

The `CI` workflow publishes one status check, `Quality`, on pull requests to
`master`, pushes to `master` and `codex/**`, and manual runs. It runs a frozen pnpm
install, lint, type checking, unit tests, PostgreSQL integration tests and the
production build. PostgreSQL 17 and synthetic Clerk keys keep CI independent of
production data and secrets. pnpm is pinned in `package.json`. The existing UI
fonts are included locally with their licenses to avoid network-dependent font
loader failures in clean builds.

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
