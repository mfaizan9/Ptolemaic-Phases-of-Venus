# Conversion Notes — Phases of Venus (Ptolemaic)

## Behavior model (one paragraph)

This is a passive demonstrator with a single control. Earth sits fixed at the
centre. A **Sun** orbits Earth on a large deferent of radius 290; the **centre of
Venus's epicycle** orbits Earth on a deferent of radius 150 and is always kept on
the Earth–Sun line (a dashed line joins Earth → epicycle centre → Sun). **Venus**
orbits the epicycle centre on an epicycle of radius 108. The Sun completes one
orbit every 12 seconds (`animationSpeed`); Venus's angular rate is the Sun's rate
divided by `0.615178` (Venus's orbital period in years). From these positions the
program computes the Sun–Venus–Earth phase angle (law of cosines) and draws, in a
separate **telescope view**, the phase Venus would show — its illuminated fraction
and its apparent size (which grows as Venus gets closer to Earth). The only user
interaction is a **Start animation / Stop animation** toggle button. There are no
sliders, no draggable objects, no numeric readouts, and no equations in the
original.

## Source of truth

* Behavior: `scripts/DefineSprite_59/frame_1/DoAction.as` (the original
  "Simulator" frame script — constants, angular rates, and the phase-disk drawing
  are ported **verbatim**).
* Toggle wiring: `scripts/DefineSprite_59/frame_1/PlaceObject2_57_..._on(initialize).as`
  (`clickHandler = "toggleAnimation"`).
* Stage size: 900 × 660 (read from the SWF header).
* Layout reference: `Screenshot 2026-07-06 211907.png` / `frames/1.png`.

## Verbatim constants (unchanged)

| Constant          | Value      | Meaning                                    |
|-------------------|-----------:|--------------------------------------------|
| `animationSpeed`  | `12`       | seconds per Sun deferent orbit             |
| `epicycleRadius`  | `108`      | Venus orbit radius about the epicycle centre |
| `deferentRadius`  | `150`      | epicycle-centre orbit radius about Earth   |
| `sunRadius`       | `290`      | Sun orbit radius about Earth (= Earth–Sun distance) |
| Venus period      | `0.615178` | divisor for Venus's angular rate           |

All on-screen text is verbatim: the telescope caption
*"Venus as would be seen through a telescope in this configuration:"*
(from `texts/16.txt`) and the button labels *"start animation" / "stop animation"*.
In the HTML5 port the button labels are sentence-cased ("Start animation" /
"Stop animation") to match KL-UNL button styling; wording is otherwise unchanged.

## AS → HTML5 mapping

| ActionScript (Flash)                              | HTML5 port                                    |
|---------------------------------------------------|-----------------------------------------------|
| `onEnterFrame = animationUpdate`                  | `requestAnimationFrame(frame)` loop           |
| `getTimer()` (ms)                                 | `performance.now()`                           |
| `dt = (now-last)/(animationSpeed*1000)`           | ported verbatim in `advance()`                |
| `sunAngle += dt*2π`, `venusAngle += dt/0.615178*2π` | ported verbatim                             |
| `deferentMC.*._x/_y`, `_rotation` (degrees)       | canvas positions/rotations (deg→rad)          |
| `localToGlobal` distances → phase angle           | computed in Earth-local coords (isometry — identical distances) in `computeGeometry()` |
| `mc.curveTo(cx,cy, ax,ay)`                         | `ctx.quadraticCurveTo(cx,cy, ax,ay)`          |
| `mc.beginFill(4210752/16777215)`                  | `#404040` (dark side) / `#ffffff` (lit side)  |
| `mc._xscale = mc._yscale = 100*(150-108)/evd`     | `ctx.scale(scalePct/100, …)`                  |
| `toggleAnimation / start / stopAnimation`         | same functions in `simulation.js`             |
| FPushButton component                             | native `<button>` (no Flash component ported) |
| Masthead / About / Help / Reset                   | `<kl-unl-masthead>` (Reset via `sim-reset`)   |

## Exported assets reused as-is (not redrawn)

All static art is reused directly from the SWF's exported shapes, composited on
the canvas with `drawImage` at original size, rotating only the elements the AS
rotated (dashed line, Earth dot, Venus dot). `images/` was empty — the sim uses no
bitmaps.

| File (`assets/`) | Original shape | Role                              |
|------------------|----------------|-----------------------------------|
| `shape10.svg`    | shapes/10.svg  | Sun deferent ring (r = 290)       |
| `shape3.svg`     | shapes/3.svg   | Venus deferent ring (r = 150)     |
| `shape4.svg`     | shapes/4.svg   | Venus epicycle ring (r = 108)     |
| `shape1.svg`     | shapes/1.svg   | dashed Earth–Sun line             |
| `shape11.svg`    | shapes/11.svg  | Sun disk (yellow, r = 14)         |
| `shape8.svg`     | shapes/8.svg   | Earth dot (blue/grey half-lit)    |
| `shape5.svg`     | shapes/5.svg   | Venus dot (white/grey half-lit)   |

Only the **telescope phase disk** is code-drawn (it is generated at runtime by the
AS `curveTo` block — there is no exported file for it), so it is reproduced with
canvas 2D drawing. The Flash push-button skin shapes (17/19/21/23/26/29/51) and the
subset Verdana fonts are **not** reused — the native KL-UNL button and the
foundation font stack replace them.

## The contents.json entry

This sim's masthead entry **already exists** in the shared `contents.json` under
the key **`renaissancePtolemaic`** (`meta.title` = "Phases of Venus"), with Help
and About text describing exactly this demonstrator. `index.html` therefore uses
`sim-id="renaissancePtolemaic"`. No new entry needed to be added.

### JSON-validity repair (necessary deviation)

The `contents.json` shipped in the source `foundation/` folder is **not valid
JSON** as delivered, which would make `response.json()` throw and break the
masthead for *every* sim. The copy placed in `html5/foundation/` was repaired with
the **minimum** changes required to make it parse, changing no visible content:

1. **Unescaped quotes in two `<a href="…">` links** (in the `renaissancePtolemaic`
   and `venusphases` Help entries) were escaped to `href=\"…\"`.
2. **Five raw control characters embedded inside string values** (literal newlines /
   a tab in other sims' entries) were replaced with a single space (invisible once
   the HTML is rendered).

No keys, structure, titles, or human-readable wording were altered. **Recommended
follow-up:** fix these two bugs upstream in the canonical shared `contents.json`.
The `kl-unl-masthead.js`, `kl-unl.css`, and `kl-unl.js` foundation files are copied
in **byte-for-byte unchanged** (verified with `diff`).

## Deviations from the original (all Goal-C / presentation only)

* **Layout:** rendered inside the KL-UNL shell (white panels, foundation palette,
  masthead) instead of the flat black Flash stage. Panel arrangement mirrors the
  screenshot — orbit diagram on the left, telescope view + button on the right —
  and stacks to a single column on narrow/portrait widths. Physics, geometry, and
  the black "sky" of each canvas are unchanged.
* **Source casing quirk (benign):** the AS line
  `deferentMC.epicycleMc.venusMC._y = vy;` mis-cases `epicycleMC` as `epicycleMc`.
  The SWF targets Flash Player 6, where ActionScript is **case-insensitive**, so
  this resolved to the correct object and Venus's y-coordinate *was* set. The port
  reproduces the intended behavior (Venus travels a full circle on the epicycle).
* **Text equivalents added** (phase name, % illuminated, apparent size, orbit
  description) for accessibility — see ACCESSIBILITY.md. These are derived from the
  exact geometry and add no new physics.
* **Interactive Sun & Venus added (enhancement, requested).** The original is
  animation-only. By request, the Sun and Venus are now draggable (pointer) and
  keyboard-operable (arrow / Page / Home / End) so the configuration can be set
  manually. Dragging the **Sun** sets `sunAngle` (rotates the whole system —
  the epicycle centre stays on the Earth–Sun line); dragging **Venus** sets
  `venusAngle` (moves it around the epicycle). Both feed the SAME state object and
  the SAME `render()` used by the animation, so the physics and phase math are
  unchanged — only the *input* is new. Grabbing either handle stops the animation.
  This mirrors the draggable interaction described for the sibling `venusphases`
  sim ("Venus and the earth are draggable"). Full keyboard map and ARIA details are
  in ACCESSIBILITY.md.
* **Equal-height panels.** The Orbit View and Telescope View panels are set to
  equal height (grid `align-items: stretch` + flex-column panels); the telescope
  content is spaced within its box. Purely presentational.
```
