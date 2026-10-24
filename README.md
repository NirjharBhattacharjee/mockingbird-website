<h3 align="center">
  <img src=".github/assets/wordmark.png" width="560" alt="mockingbird">
</h3>

<p align="center">
  The website for <a href="https://github.com/NirjharBhattacharjee/mockingbird">mockingbird</a>, local voice dictation for macOS.<br>
  Live at <a href="https://mockingbirdvoice.org">mockingbirdvoice.org</a>.
</p>

<p align="center">
  <a href="https://mockingbirdvoice.org"><img src="https://img.shields.io/badge/live-mockingbirdvoice.org-cba6f7?style=for-the-badge&logo=googlechrome&logoColor=cdd6f4&labelColor=313244" alt="live at mockingbirdvoice.org"></a>
  <a href="https://github.com/NirjharBhattacharjee/mockingbird-website/commits/main"><img src="https://img.shields.io/github/last-commit/NirjharBhattacharjee/mockingbird-website?style=for-the-badge&logo=git&color=a6e3a1&logoColor=cdd6f4&labelColor=313244" alt="last commit"></a>
  <img src="https://img.shields.io/badge/built%20with-Remix%203-89b4fa?style=for-the-badge&logo=remix&logoColor=cdd6f4&labelColor=313244" alt="built with Remix 3">
  <img src="https://img.shields.io/badge/runs%20on-Bun-f5e0dc?style=for-the-badge&logo=bun&logoColor=cdd6f4&labelColor=313244" alt="runs on Bun">
  <img src="https://img.shields.io/badge/trackers-none-fab387?style=for-the-badge&logo=lock&logoColor=cdd6f4&labelColor=313244" alt="no trackers">
  <img src="https://img.shields.io/badge/license-MIT-94e2d5?style=for-the-badge&logo=opensourceinitiative&logoColor=cdd6f4&labelColor=313244" alt="MIT license">
</p>

<p align="center">
  <img src=".github/assets/landing.gif" alt="The landing page: the pixel wordmark assembles under the bird, holding F lights up the level meter, then scrolling morphs the pixels into each section's shape: the bird, the model pipeline, the dictionary book, the plug and the terminal" width="100%">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/palette/macchiato.png" width="400" alt="">
</p>

A pixel canvas sits behind the whole page. The wordmark assembles from
scattered pixels, then morphs into a new shape for every section as you
scroll, and in the last section you can fly the bird down a road. The docs at
[/docs](https://mockingbirdvoice.org/docs) are rendered from mockingbird's own
`docs/`.

This repo is separate from the app on purpose: nothing here ships with
mockingbird, and nothing in the app depends on it.

## 🚀 Run it

You need [Bun](https://bun.sh).

```sh
bun install
bun run dev
```

Then open http://localhost:44100. `bun run dev` rebuilds the CSS and restarts
the server on change, so reload the browser after an edit.

| Command | Does |
|---|---|
| `bun run dev` | Dev server with CSS watch and restart on change |
| `bun run start` | Production mode |
| `bun run test` | Tests (under Bun, the docs need `Bun.markdown`) |
| `bun run typecheck` | Type-check |
| `bun run docs:sync` | Copy `docs/*.md` from `../mockingbird` (or `$MOCKINGBIRD_DIR`) |

## ⌨️ On the page

| Key | Does |
|---|---|
| **F** (hold) | Run the talk demo: the level meter jumps and raw speech turns into clean text. It's scripted, the page never asks for the microphone |
| **T** | Cycle the Catppuccin flavors: Mocha, Macchiato, Frappé, Latte |
| **↑ / ↓** | Move between sections |
| **I G P H** | Jump to install, the guide, the philosophy, GitHub |

## 🧭 Ground rules

From mockingbird's [philosophy](https://github.com/NirjharBhattacharjee/mockingbird/blob/main/docs/PHILOSOPHY.md):

- No analytics, trackers, cookies or third-party requests. Fonts are self-hosted.
- Never call the microphone.
- Nothing that implies a paid tier. Mockingbird is free forever.
- Respect `prefers-reduced-motion`. Every animation has a still fallback.

## 📚 More

- [AGENTS.md](AGENTS.md): project layout and how Remix 3 works here
- [CONTRIBUTING.md](CONTRIBUTING.md): checks to run, and how deploys work
- [design/MOTION.md](design/MOTION.md): motion notes

Every merge to `main` deploys to [mockingbirdvoice.org](https://mockingbirdvoice.org) on Render.

MIT, same as mockingbird.
