# Motion spec (v1 draft)

Based on how [omarchy.org](https://omarchy.org) moves (read from its shipped CSS and JS), adapted for a voice product. Every animation is off under `prefers-reduced-motion: reduce`.

| # | Name | From Omarchy | What it does | Timing |
|---|---|---|---|---|
| 01 | Hero rise | `hero-rise` | Eyebrow → H1 → typed line → lede → CTAs → command fade up in sequence | opacity 0→1, translateY 14px→0, 550ms `cubic-bezier(.21,.47,.32,.98)`, 70ms stagger |
| 02 | Bird draws itself | `mark-draw` | The logo as an SVG outline: strokes draw in, then the facets fill. After that it floats gently | `stroke-dashoffset` 1→0, 650ms `cubic-bezier(.45,0,.25,1)`; facet fill 300ms, 40ms stagger; float ±6px, 6s ease-in-out, infinite |
| 03 | Typed phrase | `typed` + `typed-blink` | "your voice never leaves your ▮" cycles Mac → laptop → desk → hands. Types, holds, then deletes back to the shared prefix | type 55ms/char, hold 1.8s, delete 28ms/char; block caret 1.06s step-end, infinite; reduced motion: static "Mac" |
| 04 | Waveform field | hero field canvas (`--t-field-*`) | A canvas strip of 110 bars that breathes at rest. Bars near the pointer rise and brighten. It spikes when the demo "records" | 60fps, paused offscreen via IntersectionObserver; idle amp 0.25; hover radius 120px, 180ms ease-out |
| 05 | Demo timeline | new | Plays once at 40% in view: terminal lines type → Fn key presses → HUD pill with live bars → pop → the sentence types into the composer | 180ms per terminal line; key press 90ms; HUD in 200ms; record 2.4s; text 22ms/char; optional tink/pop sounds, off by default |
| 06 | Pipeline pulse | new | A dot travels LISTEN → HEAR → TIDY → TYPE. Each stage's border lights up as it passes | 4s loop; stage glow 300ms; reduced motion: all stages lit, no dot |
| 07 | Section reveal | framer `whileInView` | Section heads and card groups fade up once | 400ms ease-out, y 12px, viewport amount .3, once; cards stagger 60ms |
| 08 | Flavor switch | `theme-split-wipe` + theme picker | Nav swatches switch between Catppuccin Mocha / Macchiato / Frappé / Latte with a wipe; saved in localStorage only | 200ms `cubic-bezier(.7,0,1,1)`; View Transitions API with a swap fallback |
| 09 | Micro-interactions | 150–260ms transitions | Copy → "copied ✓" for 1.2s; buttons lift 1px; link underlines grow from the left | hover 150ms ease-out; press 90ms; transform 260ms `cubic-bezier(.2,0,0,1)` |

## v2: scenes, after remix.run

The home page became a run of full-height scenes, with motion borrowed from [remix.run](https://remix.run) and kept in pixels. 04 and 07 still apply. 02 and 06 are replaced by the rows below.

| # | Name | What it does | Timing |
|---|---|---|---|
| 10 | Bird to home link | The pixel bird above the wordmark flies into the nav as you scroll the hero, shrinking as it goes, and becomes the home link. Scrolling back up flies it back | scrubbed by scroll: lands at 85% of the hero's first 55%; ease in-out; swoops down 8% of the viewport mid-flight; reduced motion: jumps at 50% |
| 11 | Wordmark idles | The wordmark's color cycles through Catppuccin accents. It glitches on hover and on its own now and then, and pixels near the pointer shy away | accent every 2.6s with a 650ms blend; glitch 90–210ms, every 3.5–7.5s; push radius 6 cells; reduced motion: sky, still |
| 12 | Transition element | Scroll past 45% of the hero and the wordmark's pixels fly off and re-form into the next scene's shape: bird, fn key, pipeline, terminal, lock, road, heart. Every scene change re-forms them | 900ms ease-out per pixel, up to 280ms stagger, a sideways swing on the way; reduced motion: shapes swap in place |
| 13 | Shapes answer back | Holding F presses the fn key down half a cell and brightens it. The "how it works" tabs light their stage of the pipeline and dim the rest | follows the talk state; immediate on tab change |
| 14 | Section index | Bottom left: the scenes, with a bar in the current scene's accent. ↑ and ↓ jump between scenes | bar 300ms; smooth scroll, instant with reduced motion |

Not carried over from Omarchy: Plausible analytics (mockingbird's site has none) and the 20-theme random pick on first load (we default to Mocha, matching the TUI).
