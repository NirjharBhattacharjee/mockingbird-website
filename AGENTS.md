# mockingbird-website agent guide

The marketing site for [mockingbird](https://github.com/NirjharBhattacharjee/mockingbird). Remix 3, TypeScript, Tailwind v4, run with Bun.

## Commands

```sh
bun install
bun run dev        # builds CSS, watches it, and restarts the server on change: http://localhost:44100
bun run start      # production mode
bun run test       # remix test
bun run typecheck
```

There's no HMR script: the scaffold's `hmr.ts` relies on a Node-only runner. `bun --watch` restarts the server, so reload the browser after a change.

## Remix 3

This is Remix 3, not Remix 2 or React Router. Components are setup functions that return a render function, and they hydrate one by one through `clientEntry`. Read `.agents/skills/remix/SKILL.md`, then `node_modules/remix/INDEX.md`, before using an unfamiliar API.

## Layout

- `app/routes.ts`, `app/router.ts`, `app/actions/controller.tsx`: route contract, router, actions
- `app/actions/document.tsx`: the `<html>` shell (fonts, `/styles.css`, `/theme-init.js`, import map)
- `app/actions/home-page.tsx`: the home page: the hero, then one full-height `Scene` per section, rendered on the server
- `app/actions/docs-page.tsx`, `app/docs.ts`: the `/docs` pages, rendered with `Bun.markdown` from `content/docs/`
- `content/docs/`: a copy of mockingbird's `docs/*.md`. Refresh it with `bun run docs:sync` (reads `../mockingbird`, or `$MOCKINGBIRD_DIR`), don't edit it here
- `app/ui/`: server-only layout pieces (nav, scene, tabs, footer) and `links.ts`
- `app/actions/public/`: everything that runs in the browser. Each `*.tsx` here is a `clientEntry`
  - `lib/pixel-field.ts`: the fixed pixel canvas behind the home page (background, level meter, the wordmark that morphs into each scene's shape, the bird that flies into the nav)
  - `lib/shapes.ts`: each scene's shape, drawn from Nerd Font icons or canvas paths
  - `lib/pixel-font.ts`: the "mockingbird" pixel font
  - `lib/events.ts`: window events the hydrated pieces use to talk to each other
- `app/styles/app.css`: Tailwind entry, fonts, Catppuccin flavors as CSS variables, tabs, docs prose, motion
- `public/`: static files served as-is. `public/styles.css` is generated, don't edit it

The tests run under Bun (`bun --bun remix test`) because the docs need `Bun.markdown`.

## Ground rules

These come from mockingbird's [PHILOSOPHY.md](https://github.com/NirjharBhattacharjee/mockingbird/blob/main/docs/PHILOSOPHY.md):

- No analytics, trackers, cookies or third-party requests. Fonts are self-hosted.
- Never call the microphone. The talk demo is scripted.
- Nothing that implies a paid tier, credits, or "free for now".
- Respect `prefers-reduced-motion`. Every animation needs a still fallback.
