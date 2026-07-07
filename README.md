# Phases of Venus (Ptolemaic model) — HTML5

An accessible HTML5 port of the legacy Flash simulation `ptolemaicVenus004.swf`,
built on the shared KL-UNL foundation. It shows Ptolemy's geocentric model of
Venus (deferent + epicycle) and the phase Venus would show through a telescope
in that model, with a **Start / Stop animation** control.

## ⚠️ It must be served over HTTP — double-clicking `index.html` will NOT work

The KL-UNL masthead component (`foundation/kl-unl-masthead.js`) loads the page
title and the Help / About text with `fetch('foundation/contents.json')`.
Browsers **block `fetch()` over the `file://` protocol** (same-origin policy), so
if you open `index.html` directly from disk the masthead comes up empty/broken and
the title never appears. Serving the folder over HTTP fixes this.

## How to run locally

Run one of these **from inside this `html5/` folder**, then open the printed URL:

```sh
# Python 3
python3 -m http.server 8123
#   then open  http://localhost:8123/

# Node
npx serve
#   or
npx http-server
```

Or, in VS Code, use the **Live Server** extension.

Because you are serving from inside `html5/`, the simulation is at the server
**root** — the URL is `http://localhost:8123/`, not `.../html5/index.html`.

## Production

When deployed to the KL-UNL cloud host (served over HTTP/HTTPS) it just works.
The `file://` limitation only affects local double-clicking.

## Layout

```
html5/
  index.html            KL-UNL scaffold: .app-shell + <kl-unl-masthead> + panels
  foundation/           copied UNCHANGED from the sim's foundation/ folder
                        (kl-unl-masthead.js, kl-unl.css, kl-unl.js) plus the
                        contents.json copy with a minimal JSON-validity repair —
                        see CONVERSION_NOTES.md
  styles/styles.css     sim-specific styles only (foundation never edited)
  simulation.js         all sim logic (physics ported verbatim from the AS)
  assets/               exported vector shapes reused as-is (shape1/3/4/5/8/10/11.svg)
  README.md             this file
  CONVERSION_NOTES.md   behavior model, AS→HTML5 mapping, deviations
  ACCESSIBILITY.md      WCAG affordances, ARIA, keyboard map, color notes
```

No build step, no bundler, no framework, no CDN. The only runtime network request
is the local `foundation/contents.json`. There is no MathJax include because the
simulation contains no equations or mathematical notation.
