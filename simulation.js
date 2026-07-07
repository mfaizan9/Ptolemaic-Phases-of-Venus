/* =============================================================================
 * Phases of Venus (Ptolemaic model)  --  HTML5 port
 *
 * Behavioral ground truth: scripts/DefineSprite_59/frame_1/DoAction.as
 * (the original "The Simulator" frame script). All constants, angular rates,
 * and the phase-disk drawing are ported VERBATIM from that ActionScript.
 *
 * Original AS1 note: the source targets Flash Player 6, where ActionScript is
 * case-INSENSITIVE, so the source line `deferentMC.epicycleMc.venusMC._y = vy;`
 * (note the lower-case "Mc") resolves to the same object as `epicycleMC` and
 * DOES set Venus's y-coordinate. We reproduce the intended behavior: Venus
 * moves on a full circle around the epicycle centre. (See CONVERSION_NOTES.md.)
 * ========================================================================== */

"use strict";

/* ---- Physics / geometry constants (VERBATIM from the ActionScript) -------- */
const INITIAL = {
  animationSpeed: 12,   // seconds for the Sun to complete one deferent orbit
  epicycleRadius: 108,  // Venus's orbit radius about the epicycle centre  (px)
  deferentRadius: 150,  // epicycle-centre orbit radius about Earth         (px)
  sunRadius:      290,  // Sun's orbit radius about Earth                   (px)
  sunAngle:       0,
  venusAngle:     0,
};

// Venus's angular rate is the Sun's rate divided by 0.615178 (Venus's period,
// in years). Ported verbatim:  venusAngle += dt / 0.615178 * 2*PI
const VENUS_PERIOD = 0.615178;

const TWO_PI = 2 * Math.PI;
const DEG = 180 / Math.PI;

/* ---- Single source of truth: one mutable state object --------------------- */
const state = {
  sunAngle:   INITIAL.sunAngle,
  venusAngle: INITIAL.venusAngle,
  running:    false,   // is the animation loop active?
  timeLast:   0,       // performance.now() of previous frame (ms)
  rafId:      null,
  // derived values (recomputed every render, used by the a11y description):
  illumFraction: 0,
  phaseName:  "new",
  apparentPct: 0,
  sunClock:   "",
  nearFar:    "",
};

/* ---- Canvas / stage layout ------------------------------------------------
 * Original Flash stage was 900x660 with Earth near (333,343). We keep the
 * ORIGINAL internal coordinate system for all physics (radii 108/150/290);
 * only the absolute origin (Earth) is placed at the centre of each canvas.
 * Every ported position is relative to Earth, so this translation is exact. */
const ORBIT = { w: 640, h: 640, cx: 320, cy: 320 }; // Earth at centre
const PHASE = { w: 240, h: 240, cx: 120, cy: 120, r: 100 }; // disk base radius 100

/* ---- Exported vector assets (REUSED as-is; never redrawn) -----------------
 * Each is an exported shape from the original SWF (shapes/*.svg). We composite
 * them onto the canvas with drawImage at their original size, rotating only the
 * elements the AS rotated. Registration points (rotation centres) taken from
 * each SVG's own transform. */
const ASSETS = {
  sunOrbit:  { src: "assets/shape10.svg", w: 581, h: 581, cx: 290.5, cy: 290.5 }, // r=290 ring
  deferent:  { src: "assets/shape3.svg",  w: 301, h: 301, cx: 150.5, cy: 150.5 }, // r=150 ring
  epicycle:  { src: "assets/shape4.svg",  w: 217, h: 217, cx: 108.5, cy: 108.5 }, // r=108 ring
  line:      { src: "assets/shape1.svg",  w: 291, h: 1,   cx: 0,     cy: 0.5   }, // dashed Earth-Sun line
  sun:       { src: "assets/shape11.svg", w: 28,  h: 28,  cx: 14,    cy: 14    }, // yellow disk r=14
  earth:     { src: "assets/shape8.svg",  w: 21,  h: 21,  cx: 10.5,  cy: 10.5  }, // blue/grey dot
  venus:     { src: "assets/shape5.svg",  w: 20,  h: 20,  cx: 10,    cy: 10    }, // white/grey dot
};
const imgs = {}; // filled after loadAssets()

/* ---- DOM handles (assigned on init) --------------------------------------- */
let orbitCanvas, orbitCtx, phaseCanvas, phaseCtx;
let playBtn, statusText, liveRegion, orbitDesc, phaseDesc;
let sunHandle, venusHandle;
let dragging = null;            // "sun" | "venus" | null
let dpr = 1;

/* Keyboard angular steps (radians): arrows = fine, Shift/Page = coarse. */
const STEP_FINE = 2 * Math.PI / 180;    // 2 degrees
const STEP_COARSE = 15 * Math.PI / 180; // 15 degrees

/* --------------------------------------------------------------------------
 * ASSET LOADING
 * ------------------------------------------------------------------------ */
function loadAssets() {
  const entries = Object.entries(ASSETS);
  return Promise.all(entries.map(([key, a]) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { imgs[key] = img; resolve(); };
    img.onerror = () => reject(new Error("Failed to load " + a.src));
    img.src = a.src;
  })));
}

/* --------------------------------------------------------------------------
 * HiDPI canvas setup: backing store = logical size * devicePixelRatio, then
 * scale the context so all drawing code uses logical (original) coordinates.
 * ------------------------------------------------------------------------ */
function setupCanvas(canvas, logicalW, logicalH) {
  dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(logicalW * dpr);
  canvas.height = Math.round(logicalH * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/* --------------------------------------------------------------------------
 * CORE PHYSICS  (ported verbatim from animationUpdate() in DoAction.as)
 * Advances angles by elapsed wall-clock time, exactly like the AS getTimer()
 * logic:  dt = (now - last) / (animationSpeed * 1000).
 * ------------------------------------------------------------------------ */
function advance(now) {
  const dt = (now - state.timeLast) / (INITIAL.animationSpeed * 1000);
  state.timeLast = now;
  state.sunAngle   += dt * TWO_PI;
  state.venusAngle += dt / VENUS_PERIOD * TWO_PI;
}

/* Compute all Earth-relative positions & the phase geometry from the two
 * angles. Coordinates use the original Flash convention: x right, y DOWN,
 * with y = -radius*sin(angle) (screen-Y-down with sin negated). */
function computeGeometry() {
  const S = state.sunAngle, V = state.venusAngle;
  const cosS = Math.cos(S), sinS = Math.sin(S);

  // Positions relative to Earth (Flash local coords, y-down).
  const sun = { x: INITIAL.sunRadius * cosS, y: -INITIAL.sunRadius * sinS };
  const epi = { x: INITIAL.deferentRadius * cosS, y: -INITIAL.deferentRadius * sinS };
  const venus = {
    x: epi.x + INITIAL.epicycleRadius * Math.cos(V),
    y: epi.y - INITIAL.epicycleRadius * Math.sin(V),
  };

  // Earth-Venus and Sun-Venus vectors/distances; Earth-Sun distance = sunRadius.
  const evx = venus.x, evy = venus.y;                 // Venus - Earth (Earth at 0,0)
  const svx = venus.x - sun.x, svy = venus.y - sun.y; // Venus - Sun
  const evd = Math.sqrt(evx * evx + evy * evy);
  const svd = Math.sqrt(svx * svx + svy * svy);
  const esd = INITIAL.sunRadius;

  // Phase angle at Venus, via law of cosines (clamped like the AS).
  let ca = (evd * evd + svd * svd - esd * esd) / (2 * evd * svd);
  if (ca > 1) ca = 1; else if (ca < -1) ca = -1;
  const a = Math.acos(ca);

  // Terminator side flag f (+1 / -1), ported verbatim.
  const f = ((((V - S) / TWO_PI) % 1 + 1) % 1 > 0.5) ? 1 : -1;

  // Apparent-size scale (percent), ported verbatim.
  const scalePct = 100 * (INITIAL.deferentRadius - INITIAL.epicycleRadius) / evd;

  // Venus icon rotation (degrees), ported verbatim.
  const venusRotDeg = DEG * Math.atan2(svy, svx) - 90;

  return { sun, epi, venus, evd, svd, a, f, scalePct, venusRotDeg };
}

/* --------------------------------------------------------------------------
 * RENDER  --  single function that redraws BOTH canvases and syncs the DOM /
 * live region from `state`. Called after every change (animation tick, reset).
 * ------------------------------------------------------------------------ */
function render() {
  const g = computeGeometry();
  drawOrbit(g);
  drawPhase(g);
  updateReadouts(g);
  updateHandles(g);
}

/* ---- Orbit view: composite the reused SVG assets ------------------------- */
function drawOrbit(g) {
  const ctx = orbitCtx, cx = ORBIT.cx, cy = ORBIT.cy;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, ORBIT.w, ORBIT.h);
  ctx.fillStyle = "#000000";               // the "sky" (original stage was black)
  ctx.fillRect(0, 0, ORBIT.w, ORBIT.h);

  // Static rings (centred on Earth): Sun's deferent, then Venus's deferent.
  drawCentered(ctx, imgs.sunOrbit, ASSETS.sunOrbit, cx, cy);
  drawCentered(ctx, imgs.deferent, ASSETS.deferent, cx, cy);

  // Dashed Earth-Sun line: rotates by -sunAngle about Earth (AS: lineMC._rotation).
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-state.sunAngle);
  ctx.drawImage(imgs.line, -ASSETS.line.cx, -ASSETS.line.cy);
  ctx.restore();

  // Epicycle ring, centred on the moving epicycle centre.
  drawCentered(ctx, imgs.epicycle, ASSETS.epicycle, cx + g.epi.x, cy + g.epi.y);

  // Sun disk (no rotation in the AS).
  drawCentered(ctx, imgs.sun, ASSETS.sun, cx + g.sun.x, cy + g.sun.y);

  // Earth dot: rotates by (-sunAngle + 90deg) about its centre.
  drawRotated(ctx, imgs.earth, ASSETS.earth, cx, cy, -state.sunAngle + Math.PI / 2);

  // Venus dot: rotates by venusRotDeg about its centre (lit side faces the Sun).
  drawRotated(ctx, imgs.venus, ASSETS.venus, cx + g.venus.x, cy + g.venus.y,
              g.venusRotDeg / DEG);

  ctx.restore();
}

function drawCentered(ctx, img, meta, x, y) {
  ctx.drawImage(img, x - meta.cx, y - meta.cy);
}
function drawRotated(ctx, img, meta, x, y, angleRad) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);
  ctx.drawImage(img, -meta.cx, -meta.cy);
  ctx.restore();
}

/* ---- Telescope view: the code-drawn phase disk --------------------------
 * Ported verbatim from the AS drawing block (n=4, r=100, curveTo -> quadratic
 * Bezier). Two filled regions: dark side (#404040) and lit side (#ffffff),
 * bounded by a semicircle and the terminator ellipse (half-width s = r*cos a).
 * ----------------------------------------------------------------------- */
function drawPhase(g) {
  const ctx = phaseCtx;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, PHASE.w, PHASE.h);
  ctx.fillStyle = "#000000";               // telescope field of view (black sky)
  ctx.fillRect(0, 0, PHASE.w, PHASE.h);

  const n = 4;
  const r = PHASE.r;
  const a = g.a;
  const f = g.f;
  const s = r * Math.cos(a);
  const step = Math.PI / n;
  const halfStep = step / 2;
  const kr = r / Math.cos(halfStep);
  const ks = s / Math.cos(halfStep);

  ctx.translate(PHASE.cx, PHASE.cy);
  ctx.scale(g.scalePct / 100, g.scalePct / 100); // AS: mc._xscale = mc._yscale

  // --- dark side (#404040) ---
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.fillStyle = "#404040";
  let i;
  for (i = 1; i <= n; i++) {
    const angle = i * step;
    const ax = r * Math.sin(angle), ay = -r * Math.cos(angle);
    const cAngle = angle - halfStep;
    const cx = kr * Math.sin(cAngle), cy = -kr * Math.cos(cAngle);
    ctx.quadraticCurveTo(f * cx, cy, f * ax, ay);
  }
  for (i = n - 1; i >= 0; i--) {
    const angle = i * step;
    const ax = s * Math.sin(angle), ay = -r * Math.cos(angle);
    const cAngle = angle + halfStep;
    const cx = ks * Math.sin(cAngle), cy = -kr * Math.cos(cAngle);
    ctx.quadraticCurveTo(f * cx, cy, f * ax, ay);
  }
  ctx.closePath();
  ctx.fill();

  // --- lit side (#ffffff) ---
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.fillStyle = "#ffffff";
  for (i = 1; i <= n; i++) {
    const angle = i * step;
    const ax = -r * Math.sin(angle), ay = -r * Math.cos(angle);
    const cAngle = angle - halfStep;
    const cx = -kr * Math.sin(cAngle), cy = -kr * Math.cos(cAngle);
    ctx.quadraticCurveTo(f * cx, cy, f * ax, ay);
  }
  for (i = n - 1; i >= 0; i--) {
    const angle = i * step;
    const ax = s * Math.sin(angle), ay = -r * Math.cos(angle);
    const cAngle = angle + halfStep;
    const cx = ks * Math.sin(cAngle), cy = -kr * Math.cos(cAngle);
    ctx.quadraticCurveTo(f * cx, cy, f * ax, ay);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/* --------------------------------------------------------------------------
 * READOUTS + screen-reader description (derived from the exact geometry).
 * The original sim shows no numbers; these text equivalents DESCRIBE the two
 * canvases for low-vision / audio-only users (WCAG 1.1.1). No physics added.
 * ------------------------------------------------------------------------ */
function phaseNameFor(k) {
  if (k < 0.02) return "new";
  if (k < 0.48) return "crescent";
  if (k <= 0.52) return "quarter (half)";
  if (k < 0.98) return "gibbous";
  return "full";
}
function sunClockFor(angle) {
  // Describe where the Sun sits relative to Earth as a compass-ish direction.
  const deg = ((angle * DEG) % 360 + 360) % 360; // CCW from +x (right)
  const dirs = [
    [0, "to the right"], [45, "to the upper right"], [90, "above"], [135, "to the upper left"],
    [180, "to the left"], [225, "to the lower left"], [270, "below"], [315, "to the lower right"], [360, "to the right"],
  ];
  let best = dirs[0];
  for (const d of dirs) if (Math.abs(deg - d[0]) < Math.abs(deg - best[0])) best = d;
  return best[1];
}

function updateReadouts(g) {
  const k = (1 + Math.cos(g.a)) / 2;      // illuminated fraction (0 new .. 1 full)
  const pct = Math.round(k * 100);
  const name = phaseNameFor(k);
  const apparentPct = Math.round(g.scalePct);
  const nearFar = g.evd < (INITIAL.deferentRadius)
    ? "near side, closer to Earth" : "far side, farther from Earth";

  state.illumFraction = k;
  state.phaseName = name;
  state.apparentPct = apparentPct;
  state.sunClock = sunClockFor(state.sunAngle);
  state.nearFar = nearFar;

  // Visible status line under the telescope view.
  statusText.textContent =
    `Phase: ${name} — ${pct}% illuminated — apparent size ${apparentPct}% of maximum`;

  // Canvas text equivalents (kept current every frame; read via aria-describedby).
  phaseDesc.textContent =
    `Telescope view of Venus: ${name} phase, about ${pct} percent illuminated, ` +
    `apparent diameter ${apparentPct} percent of its maximum.`;
  orbitDesc.textContent =
    `Ptolemaic orbit view. Earth is at the centre. The Sun is ${state.sunClock}. ` +
    `Venus sits on its epicycle, currently on the ${nearFar}. ` +
    `A dashed line joins Earth, the epicycle centre, and the Sun.`;
}

/* Announce the current state through the polite live region (units spelled
 * out for speech). Called on commit points, not every animation frame. */
function announce() {
  const pct = Math.round(state.illumFraction * 100);
  liveRegion.textContent =
    `Venus is a ${state.phaseName} phase, about ${pct} percent illuminated, ` +
    `apparent diameter ${state.apparentPct} percent of maximum. ` +
    `The Sun is ${state.sunClock}.`;
}

/* --------------------------------------------------------------------------
 * ANIMATION LOOP  (onEnterFrame -> requestAnimationFrame)
 * ------------------------------------------------------------------------ */
function frame(now) {
  if (!state.running) return;
  advance(now);
  render();
  throttledAnnounce(now);
  state.rafId = requestAnimationFrame(frame);
}

let lastAnnounce = 0;
function throttledAnnounce(now) {
  if (now - lastAnnounce > 1500) { announce(); lastAnnounce = now; }
}

function startAnimation() {
  if (state.running) return;
  state.running = true;
  state.timeLast = performance.now();
  lastAnnounce = state.timeLast;
  playBtn.textContent = "Stop animation";
  playBtn.setAttribute("aria-pressed", "true");
  liveRegion.textContent = "Animation started.";
  state.rafId = requestAnimationFrame(frame);
}

function stopAnimation() {
  if (!state.running) return;
  state.running = false;
  if (state.rafId) cancelAnimationFrame(state.rafId);
  state.rafId = null;
  playBtn.textContent = "Start animation";
  playBtn.setAttribute("aria-pressed", "false");
  render();
  announce(); // final state on stop
}

function toggleAnimation() {          // AS: toggleAnimation()
  if (state.running) stopAnimation();
  else startAnimation();
}

/* --------------------------------------------------------------------------
 * RESET  (wired to the masthead's "sim-reset" event) -> exact initial state.
 * ------------------------------------------------------------------------ */
function resetSim() {
  stopAnimation();
  state.sunAngle = INITIAL.sunAngle;
  state.venusAngle = INITIAL.venusAngle;
  render();
  liveRegion.textContent = "Simulation reset to its starting configuration.";
}

/* --------------------------------------------------------------------------
 * DRAG + KEYBOARD interaction for the Sun and Venus handles.
 * Dragging the Sun rotates the whole system (sets sunAngle); dragging Venus
 * moves it around its epicycle (sets venusAngle). Both a pointer path and a
 * keyboard path mutate the SAME state and re-render. Grabbing a handle stops
 * the animation so manual control is not fought by the loop.
 * ------------------------------------------------------------------------ */
function normDeg(rad) {
  return Math.round((((rad * DEG) % 360) + 360) % 360);
}

/* Position the two overlay handles on top of their objects (percent of the
 * orbit stage) and refresh their slider value + spoken valuetext. */
function updateHandles(g) {
  if (!sunHandle) return;

  const sunLeft = (ORBIT.cx + g.sun.x) / ORBIT.w * 100;
  const sunTop  = (ORBIT.cy + g.sun.y) / ORBIT.h * 100;
  sunHandle.style.left = sunLeft + "%";
  sunHandle.style.top  = sunTop + "%";
  const sunDeg = normDeg(state.sunAngle);
  sunHandle.setAttribute("aria-valuenow", String(sunDeg));
  sunHandle.setAttribute("aria-valuetext",
    `Sun ${sunDeg} degrees around Earth, ${state.sunClock}`);

  const venLeft = (ORBIT.cx + g.venus.x) / ORBIT.w * 100;
  const venTop  = (ORBIT.cy + g.venus.y) / ORBIT.h * 100;
  venusHandle.style.left = venLeft + "%";
  venusHandle.style.top  = venTop + "%";
  const venDeg = normDeg(state.venusAngle);
  const pct = Math.round(state.illumFraction * 100);
  venusHandle.setAttribute("aria-valuenow", String(venDeg));
  venusHandle.setAttribute("aria-valuetext",
    `Venus ${venDeg} degrees on its epicycle; ${state.phaseName} phase, ` +
    `${pct} percent illuminated`);
}

/* Convert a pointer event to logical (original-stage) canvas coordinates,
 * mapping through the current CSS scale so hit math matches at any size. */
function eventToLogical(e) {
  const rect = orbitCanvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (ORBIT.w / rect.width),
    y: (e.clientY - rect.top) * (ORBIT.h / rect.height),
  };
}

/* Set the Sun angle from a pointer position (angle about Earth). */
function sunAngleFromPointer(p) {
  const dx = p.x - ORBIT.cx, dy = p.y - ORBIT.cy;
  return Math.atan2(-dy, dx);          // y-down + sin-negated (matches AS)
}

/* Set the Venus angle from a pointer position (angle about the epicycle centre,
 * which sits on the current Earth-Sun line). */
function venusAngleFromPointer(p) {
  const epiX = ORBIT.cx + INITIAL.deferentRadius * Math.cos(state.sunAngle);
  const epiY = ORBIT.cy - INITIAL.deferentRadius * Math.sin(state.sunAngle);
  const dx = p.x - epiX, dy = p.y - epiY;
  return Math.atan2(-dy, dx);
}

function onHandlePointerDown(which, e) {
  e.preventDefault();
  stopAnimation();                     // take manual control
  dragging = which;
  const h = which === "sun" ? sunHandle : venusHandle;
  h.focus();
  try { h.setPointerCapture(e.pointerId); } catch (_) { /* older browsers */ }
  applyPointer(which, e);
}

function applyPointer(which, e) {
  const p = eventToLogical(e);
  if (which === "sun") state.sunAngle = sunAngleFromPointer(p);
  else state.venusAngle = venusAngleFromPointer(p);
  render();
}

function onHandlePointerMove(which, e) {
  if (dragging !== which) return;
  e.preventDefault();
  applyPointer(which, e);
}

function onHandlePointerUp(which, e) {
  if (dragging !== which) return;
  dragging = null;
  const h = which === "sun" ? sunHandle : venusHandle;
  try { h.releasePointerCapture(e.pointerId); } catch (_) { /* no-op */ }
  announce();                          // speak final configuration
}

function onHandleKey(which, e) {
  const coarse = e.shiftKey || e.key === "PageUp" || e.key === "PageDown";
  const step = coarse ? STEP_COARSE : STEP_FINE;
  let handled = true;

  const get = () => which === "sun" ? state.sunAngle : state.venusAngle;
  const set = (v) => { if (which === "sun") state.sunAngle = v; else state.venusAngle = v; };

  switch (e.key) {
    case "ArrowRight":
    case "ArrowUp":
    case "PageUp":   set(get() + step); break;
    case "ArrowLeft":
    case "ArrowDown":
    case "PageDown": set(get() - step); break;
    case "Home":     set(0); break;                 // Sun/Venus to the right (0 deg)
    case "End":      set(Math.PI); break;           // opposite side (180 deg)
    default: handled = false;
  }
  if (!handled) return;                 // let Tab and other keys pass through
  e.preventDefault();
  stopAnimation();
  render();                             // aria-valuetext (updated here) is spoken
}

function setupInteraction() {
  [["sun", sunHandle], ["venus", venusHandle]].forEach(([which, h]) => {
    h.addEventListener("pointerdown", (e) => onHandlePointerDown(which, e));
    h.addEventListener("pointermove", (e) => onHandlePointerMove(which, e));
    h.addEventListener("pointerup",   (e) => onHandlePointerUp(which, e));
    h.addEventListener("pointercancel", (e) => onHandlePointerUp(which, e));
    h.addEventListener("keydown", (e) => onHandleKey(which, e));
  });
}

/* --------------------------------------------------------------------------
 * INIT
 * ------------------------------------------------------------------------ */
function init() {
  orbitCanvas = document.getElementById("orbitCanvas");
  phaseCanvas = document.getElementById("phaseCanvas");
  playBtn     = document.getElementById("playBtn");
  statusText  = document.getElementById("phaseStatus");
  liveRegion  = document.getElementById("liveRegion");
  orbitDesc   = document.getElementById("orbitDesc");
  phaseDesc   = document.getElementById("phaseDesc");
  sunHandle   = document.getElementById("sunHandle");
  venusHandle = document.getElementById("venusHandle");

  orbitCtx = setupCanvas(orbitCanvas, ORBIT.w, ORBIT.h);
  phaseCtx = setupCanvas(phaseCanvas, PHASE.w, PHASE.h);

  playBtn.addEventListener("click", toggleAnimation);
  setupInteraction();

  // Reset comes from the KL-UNL masthead (bubbling, composed CustomEvent).
  document.addEventListener("sim-reset", resetSim);

  // Re-apply HiDPI backing size if the device pixel ratio changes (e.g. zoom).
  window.addEventListener("resize", () => {
    orbitCtx = setupCanvas(orbitCanvas, ORBIT.w, ORBIT.h);
    phaseCtx = setupCanvas(phaseCanvas, PHASE.w, PHASE.h);
    render();
  });

  loadAssets()
    .then(() => { render(); })   // AS calls animationUpdate() once at load (stopped)
    .catch((err) => {
      console.error(err);
      statusText.textContent = "Error: could not load simulation art assets.";
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
