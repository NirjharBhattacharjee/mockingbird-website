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
- `app/actions/home-page.tsx`: the home page sections, rendered on the server
- `app/ui/`: server-only layout pieces (nav, section, footer) and `links.ts`
- `app/actions/public/`: everything that runs in the browser. Each `*.tsx` here is a `clientEntry`
  - `lib/pixel-field.ts`: the pixel grid canvas (background, level meter, wordmark, bird)
  - `lib/pixel-font.ts`: the "mockingbird" pixel font
  - `lib/events.ts`: window events the hydrated pieces use to talk to each other
- `app/styles/app.css`: Tailwind entry, Catppuccin flavors as CSS variables, motion
- `public/`: static files served as-is. `public/styles.css` is generated, don't edit it

## Ground rules

These come from mockingbird's [PHILOSOPHY.md](https://github.com/NirjharBhattacharjee/mockingbird/blob/main/docs/PHILOSOPHY.md):

- No analytics, trackers, cookies or third-party requests. Fonts are self-hosted.
- Never call the microphone. The talk demo is scripted.
- Nothing that implies a paid tier, credits, or "free for now".
- Respect `prefers-reduced-motion`. Every animation needs a still fallback.
