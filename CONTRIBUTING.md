# Contributing

Thanks for helping out. Fork the repo, make your change on a branch, and open a pull request against `main`.

## Before you open a PR

```sh
bun install
bun run typecheck
bun run test
```

CI runs the same checks on every pull request, then builds the Docker image and checks that `/healthz` responds. A PR needs a green CI run before it can merge.

## Deploys

Every merge to `main` deploys to [mockingbirdvoice.org](https://mockingbirdvoice.org) on Render, once CI passes on that commit. You don't need to do anything to deploy.

## Ground rules

Read [AGENTS.md](AGENTS.md) for the layout and the rules from mockingbird's philosophy. In short: no analytics, trackers or third-party requests, never touch the microphone, nothing that hints at a paid tier, and every animation needs a `prefers-reduced-motion` fallback. PRs that break these won't be merged.
