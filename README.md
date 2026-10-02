# mockingbird-website

The website for [mockingbird](https://github.com/NirjharBhattacharjee/mockingbird), local voice dictation for macOS.

This repo is separate from the app on purpose: nothing here ships with mockingbird, and nothing in the app depends on it.

## Status

Design draft. The site hasn't been built yet.

- Figma: [Mockingbird Website — Draft v1](https://www.figma.com/design/9QVwP55s5knn85pDkvUCeD)
- Motion spec: [design/MOTION.md](design/MOTION.md)
- Design notes and open questions: [design/NOTES.md](design/NOTES.md)

## Assets

| Path | What | Source |
|---|---|---|
| `assets/brand/logo.png` | Bird logo, 387×489, transparent | `mockingbird/docs/assets/logo.png` |
| `assets/media/demo.gif` | Terminal + chat demo | `mockingbird/docs/assets/demo.gif` |

## Ground rules (inherited from the app's philosophy)

- No analytics, trackers, or third-party scripts. The site makes no network calls the visitor didn't ask for.
- No account, newsletter wall, or "free for now" language. Mockingbird is free forever.
- Respect `prefers-reduced-motion` everywhere.

## License

MIT, same as mockingbird.
