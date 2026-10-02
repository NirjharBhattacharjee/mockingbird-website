# Design notes — draft v1

## In Figma

File: https://www.figma.com/design/9QVwP55s5knn85pDkvUCeD

- Page **Website — Home**, frame **Home — Desktop 1440**: nav, hero (typed line, bird, install command), waveform strip, demo (terminal + chat app + hold/speak/let go), pillars, pipeline, install tabs, commands + keys/sounds, philosophy quote, final CTA, footer.
- Variables: `Theme · Catppuccin Mocha` (21 colors) and `Spacing` (12). Every fill is bound to a variable.
- Pages **Motion spec** and **Foundations** exist but are empty.

## Not done yet (stopped by the Figma Starter plan's MCP call limit)

- Mobile frame (390 wide): nav + hamburger, stacked hero, waveform, steps, single-column sections.
- Motion spec board in Figma (the content is in [MOTION.md](MOTION.md)).
- Foundations board: logo lockups, palette swatches, type scale.
- Latte (light) mode: Starter allows one variable mode, so the light theme is only spec'd for now.

## Type

Geist (UI) + JetBrains Mono (commands, eyebrows). Display 76/SemiBold/−3%, H2 44/SemiBold/−2%, lede 18/160%, body 15, mono 14, eyebrow 13 mono +4%.

## Open questions

- Domain?
- The philosophy quote is condensed from docs/PHILOSOPHY.md §1. Use that wording or the original?
- Stack: Astro (what Omarchy uses; static, zero JS by default, islands for the canvas/typed pieces) is the suggestion.
- Need an SVG of the bird for the draw-in animation (the PNG can't be stroked).
