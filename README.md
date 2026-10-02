# mockingbird-website

The website for [mockingbird](https://github.com/NirjharBhattacharjee/mockingbird), local voice dictation for macOS.

This repo is separate from the app on purpose: nothing here ships with mockingbird, and nothing in the app depends on it.

## Run it

```sh
bun install
bun run dev
```

Then open http://localhost:44100.

Built with [Remix 3](https://remix.run), TypeScript and Tailwind CSS v4, on Bun. See [AGENTS.md](AGENTS.md) for the project layout.

## Status

First mockup. The look borrows from [omarchy.org](https://omarchy.org): a pixel grid the whole hero snaps to, a pixel wordmark, monospace everywhere, square corners.

On the page:

- **Pixel field.** The pixel bird and the wordmark assemble from scattered pixels. Moving the pointer lights up nearby cells, clicking sends out a ripple, and hovering the wordmark glitches it.
- **Hold F to talk.** Hold F anywhere, or press and hold the demo button. The level meter at the bottom of the hero jumps, sparks fly from the bird, and the demo terminal shows raw speech turning into clean text. It's scripted: the page never asks for the microphone.
- **Press T** to cycle the Catppuccin flavors: Mocha, Macchiato, Frappé, Latte.
- **Status widget.** The widget in the bottom-left corner shows the talk state.

Also in this repo:

- Figma draft (pre-pixel style): [Mockingbird Website — Draft v1](https://www.figma.com/design/9QVwP55s5knn85pDkvUCeD)
- Motion notes: [design/MOTION.md](design/MOTION.md)

## Ground rules (from the app's philosophy)

- No analytics, trackers, or third-party requests. Fonts are self-hosted.
- No account, newsletter wall, or "free for now" language. Mockingbird is free forever.
- Respect `prefers-reduced-motion` everywhere.

## License

MIT, same as mockingbird.
