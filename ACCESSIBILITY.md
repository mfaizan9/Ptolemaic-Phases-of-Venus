# Accessibility Notes — Phases of Venus (Ptolemaic)

Target: WCAG 2.1 AA (AAA where reasonable). Human screen-reader QA on NVDA and
VoiceOver is still required — the notes below describe the affordances built in.

## Structure & landmarks
* `<html lang="en">`.
* Exactly one `<h1>` — "Phases of Venus" — rendered by the `<kl-unl-masthead>`
  component. Panels use `<h2>` ("Orbit View", "Telescope View"); no skipped levels.
* Landmarks: `<main>` wraps the two `<section>` panels (each `aria-labelledby` its
  heading); the masthead provides the `<header>`/`<nav>`; a `role="status"` live
  region sits at the end.

## Text alternatives (1.1.1)
The two `<canvas>` elements are `role="img"` with a concise `aria-label` (name) and
an `aria-describedby` pointing at a visually-hidden `.sr-only` description that is
**rebuilt from state on every render**:
* **Orbit canvas** — describes Earth at centre, where the Sun is relative to Earth,
  whether Venus is on the near/far side of its epicycle, and the dashed line.
* **Telescope canvas** — describes the current phase name, percent illuminated, and
  apparent diameter as a percent of maximum.

## Screen-reader narration & units (explicit supervisor requirement)
* A polite `aria-live` region (`#liveRegion`, `role="status"`) announces meaningful
  changes: animation **started / stopped**, **reset**, and — throttled to about once
  every 1.5 s during motion, plus once on stop — the current phase.
* **All values are announced with their quantity name and unit spelled out for
  speech**, never as bare numbers, e.g. *"Venus is a crescent phase, about 20
  percent illuminated, apparent diameter 17 percent of maximum. The Sun is above
  Earth."* "percent" and "degrees"-style words are written out rather than relying
  on glyphs or adjacent visual labels.
* The visible status line (`#phaseStatus`) is a purely visual echo and is marked
  `aria-hidden="true"` so it is not double-read alongside the live region.

## Keyboard (2.1.1 / 2.4.7)
* Native `<button>`s (masthead Reset / Help / About, and the sim's **Start / Stop
  animation** button) are fully keyboard operable with the browser's visible
  `:focus-visible` ring from `kl-unl.css`. Logical tab order; no traps. The
  Start/Stop button exposes `aria-pressed` (true while running).
* **Draggable Sun and Venus** (an enhancement beyond the original — see
  CONVERSION_NOTES.md) each have BOTH a pointer path and a keyboard path that
  mutate the same state:
  * Each is a transparent 44px overlay handle with `role="slider"`,
    `tabindex="0"`, `aria-valuemin/max/now` and a units-complete `aria-valuetext`
    (e.g. *"Sun 90 degrees around Earth, above"*, *"Venus 120 degrees on its
    epicycle; crescent phase, 20 percent illuminated"*), repositioned onto its
    object every render.
  * **Tab** focuses a handle (visible focus ring); **clicking/tapping** the object
    also focuses it (`.focus()` on `pointerdown`).
  * **Arrow keys** rotate by 2°; **Shift+Arrow / Page Up / Page Down** by 15°;
    **Home** = 0° (object to the right), **End** = 180° (opposite side). Tab always
    moves away normally — no trap.
  * Grabbing a handle (pointer or key) stops the animation so manual control is not
    fought by the loop. Pointer coordinates are mapped through the canvas scale so
    the angle math is correct at any display size; `touch-action: none` keeps a drag
    from scrolling the page on touch devices.
  * The slider's `aria-valuetext` (updated each render) is announced on keyboard
    change; pointer release additionally posts a units-complete summary to the live
    region.

## Timing / motion (2.2.2 / 2.3.3)
* Motion is **user-initiated** and is stopped with the same button, satisfying the
  "pause/stop" requirement for animation longer than 5 s. The sim never autoplays.
* Nothing flashes; the animation is smooth continuous rotation (well under 3
  flashes/second).
* `prefers-reduced-motion`: because the animation only runs when the user starts it
  and can be stopped at any time, no motion is forced on reduced-motion users; the
  static end state is always available.

## Color & contrast (1.4.1 / 1.4.3 / 1.4.11)
* Panel chrome uses the KL-UNL palette variables; body/heading/label text is well
  above 4.5:1 on white.
* Canvas "sky" is black. Orbit rings (`#cccccc`), the dashed line (`#99ccff`), the
  Sun (`#ffff99`), Earth (blue/grey) and Venus (white/grey) are all high-contrast
  on black.
* **Physical color kept, not used as the only signal:** the telescope disk shows
  Venus's real appearance — the lit side is white and the unlit side is a dark grey
  (`#404040`), matching the original. At the **new** phase the disk is entirely dark
  and therefore low-contrast against the black sky *by physical design*. This is
  never the only cue: the phase is always stated in text (visible status line + the
  canvas description + the live region: "new phase, about 0 percent illuminated").
  No state in this sim is encoded by color alone.

## Zoom & reflow (1.4.4 / 1.4.10)
* Body text is ≥ 1.125rem and everything is sized in rem/%/`aspect-ratio`, so text
  scales with the browser font setting.
* Layout reflows from the desktop two-column arrangement to a single stacked column
  at the foundation's 56rem breakpoint; verified at 375px width with **no horizontal
  scrolling** and no clipping. The canvases keep their original internal coordinate
  system and are scaled by CSS with preserved 1:1 aspect ratio.

## Touch / cross-browser
* Pointer interactions (the button plus the Sun/Venus drag handles) use Pointer
  Events, so mouse and touch share one path; handles are 44px+ targets with
  `touch-action: none`. The button is a native 44px+ target via the KL-UNL `.button`
  sizing. No hover-only affordances (the drag hint is always visible as text).
* Standards-only HTML/CSS/JS (`canvas`, `requestAnimationFrame`, `aspect-ratio`,
  CSS grid, custom elements) — all supported in current Chrome, Edge, Firefox, and
  Safari (desktop + iOS). No vendor-prefix-only CSS and no Chrome-only APIs.

## Math / MathJax
* The simulation contains **no equations, variables, units-with-notation, or math
  symbols in the UI**, so no MathJax rendering is required and none is included.
  The percent values in descriptions are plain natural-language numbers, not
  typeset math. (If educational math is added later, route it through the
  foundation's `kl-unl.js` `klunlShowEquation` per the pipeline rules.)

## Known limitation
* Automated screenshots were unavailable in this environment; visual verification
  was done via DOM/pixel inspection and the accessibility tree. A human pass with
  NVDA (Windows) and VoiceOver (macOS/iOS) is recommended before release.
```
