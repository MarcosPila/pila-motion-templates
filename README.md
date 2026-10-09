# Pila Motion Templates

Reference builds for motion-heavy websites, made for Pila Web Co.
Every business on these pages is a sample: names, prices and details are made up.

Live: https://marcospila.github.io/pila-motion-templates/

## What is here

| Folder | What it is |
| --- | --- |
| `plumbline/` | A full one-page website for a service business: hero, services, add-ons, process, work, plans, about, FAQ, quote form, contact. |
| `room-by-room/` | The first 3D scroll piece: five rooms build themselves on a U-shaped track. |
| `engine/` | The shared engine for the scroll scenes below (`scenes.js` + `scenes.css`). |
| `home-services/` … `interior-design/` | 13 industry scroll scenes, each a different combination of look, layout, speed and colour. |
| `sites/` | 17 complete motion websites on GSAP, Lenis and Vanta: twelve originals, one per industry, and five remixes (see below). |
| `kit/` | The shared kit for `sites/`: `kit.js`, `kit.css` and `art.js` (placeholder art). |

| Template | Look | Layout | Speed |
| --- | --- | --- | --- |
| home-services | toon | U | bouncy |
| automotive | real (exploded-view assembly) | dolly | cinematic |
| restaurant-cafe | clay | ring | smooth |
| travel | real | helix | cinematic |
| salon | flat | elevator | smooth |
| barbershop | toon | V | snappy |
| gym | neon (scatter assembly) | dolly | snappy |
| health-clinic | clay (grow assembly) | U | smooth |
| real-estate | real | board | smooth |
| professional-services | lowpoly (isometric) | V | smooth |
| photography-video | neon | ring | cinematic |
| online-store | flat | board | bouncy |
| interior-design | sketch | notebook | smooth |
| arcade | voxel + game layer | world (floating islands) | bouncy |

## Motion websites (`sites/`)

Twelve complete one-page websites, one per industry, each with its own look and its own signature motion. They are built on [GSAP](https://gsap.com) 3.15 (with its free plugins), [Lenis](https://github.com/darkroomengineering/lenis) smooth scroll and, on six of them, [Vanta](https://www.vantajs.com) animated backgrounds. Every page has a hero, services, about, social proof, an FAQ or details section, and a working multi-step form (which sends nothing).

| Site | Look | Signature moves | Background |
| --- | --- | --- | --- |
| `sites/home-services` Brightside | Bright, chunky, bouncy | Blueprint house draws itself (DrawSVG), van drives the route (MotionPath), pinned sideways services, before/after slider | none |
| `sites/automotive` Redline | Dark, condensed, red | Speed-streak canvas, wheels and rev counter follow scroll speed, pinned service bay with callouts, scramble price board | canvas |
| `sites/restaurant-cafe` Crumb & Kettle | Warm editorial serif | Morphing steam (MorphSVG), rotating words, Flip menu filter, stacked day cards, image trail, live "open now" | none |
| `sites/travel` Northbound | Airy, wide type | Plane flies the route while the map camera pans and zooms, parallax ridges, drag carousel with inertia | Vanta clouds |
| `sites/salon` Velvet & Vine | Slow, luxurious | Hero sinks away, price list with a floating photo, drifting lookbook columns, morphing blobs, tilt and glare | Vanta halo |
| `sites/barbershop` Fade Street | Gritty, black and bone | Barber pole, razor-cut section reveals, Flip-expanding cut cards, throwable barber deck, velocity marquee | grain |
| `sites/gym` Ironclad | Black and acid lime | Heartbeat and BPM that rise with scroll speed, zoom-through word, 3D-swinging program cards, Flip class schedule | none |
| `sites/health-clinic` Harbourview | Calm, accessible | Self-drawing icons, visit timeline that fills, doctors filtered by language, motion switch in the header | Vanta waves |
| `sites/real-estate` Keystone | Navy and brass | Featured home grows to full screen, grid/list Flip, Canadian mortgage calculator, dropping map pins | Vanta topology |
| `sites/professional-services` Ledgerline | Swiss, clean | Typed headline (TextPlugin), chart that draws with scroll, sideways tax-year calendar, Flip "recommended" badge | Vanta net |
| `sites/photography-video` Afterglow | Film, moody | Image trail, timecode, developing film strip, Flip lightbox, grain | Vanta fog |
| `sites/online-store` Sprout & Pot | Playful, rounded | Floating products follow the cursor, Flip sort, products fly into the cart, cart drawer, plant-finder quiz | none |

### Remixes

Five more sites that mix the looks and motion of the twelve above, each for a new kind of business, each with one new trick:

| Site | Mix of | New trick |
| --- | --- | --- |
| `sites/landscaping` Fernwood Landscapes | Home services (blueprint draw, chunky buttons, before/after) × Travel (Vanta clouds, sinking hills) × Café (stacked season cards) | A pinned garden plan that draws itself, then grows shrubs, trees and flowers; a mower that does laps on the hill |
| `sites/tattoo-studio` Black Lantern Tattoo | Barbershop (grit, razor cuts, swipe deck, footer fill) × Photography (grain, Vanta fog, Flip viewer) × Gym (glitch hover) | A flash sheet whose designs ink themselves line by line |
| `sites/spa` Stillwater Spa | Salon (slow serif luxury, floating-photo list, drifting columns, blobs) × Health clinic (Vanta waves, timeline, motion switch) | A breathing guide (in 4, hold 4, out 6) with a pause button |
| `sites/law-firm` Hartley &amp; Sato LLP | Real estate (navy and brass) × Accounting (typed headline, ledger rows, Vanta net, gliding badge) × Automotive (pinned bay with callouts and scrambling codes) | A case file that highlights, stamps and re-codes itself through four stages |
| `sites/music-venue` Northern Static | Gym (neon, flipping title, zoom-through word) × Automotive (speed streaks) × Online store (fly-to-cart, drawer) × Café (rotating words, filter) | An equalizer that jumps with scroll speed, and tickets that fly into a wallet |

### The kit (`kit/`)

Each site loads GSAP and the plugins it uses, Lenis, then `kit/art.js` and `kit/kit.js`, with `kit/kit.css` in the head. Configure with `window.KIT` before `kit.js`:

```html
<script>window.KIT = { ease: 'expo.out', dur: 1.2, stagger: 0.07, smooth: { lerp: 0.09 }, anchorOffset: 70, cursor: 'ring',
  spark: { color: ['#ffb703', '#fb5607'], selector: '.btn' },
  vanta: { el: '#hero-bg', effect: 'WAVES', options: { color: 0x0e4f4b } } };</script>
```

| Setting | What it does |
| --- | --- |
| `ease`, `dur`, `stagger` | Defaults for every kit animation (the "speed" of the site) |
| `smooth` | Lenis options (`lerp`, `duration`…), or `false` for native scroll |
| `anchorOffset` | Space kept above `#links` targets, for a sticky header |
| `cursor` | `false`, `'ring'` or `'dot'` follower; `data-cursor="View"` on an element shows a label |
| `spark` | Click sparks: `{ color, selector, kind: 'lines' or 'confetti', count }` |
| `vanta` | `{ el, effect, options }`. Loads three.js r134 (or p5 for `TOPOLOGY`/`TRUNK`) and the effect only after the page loads, only while on screen, never with reduced motion, save-data or no WebGL |

Then switch effects on in the HTML:

| Attribute | Effect |
| --- | --- |
| `data-reveal="up"` | Reveal on scroll: `up`, `down`, `left`, `right`, `fade`, `scale`, `pop`, `blur`, `skew`, `tilt`, `clip`, `wipe`, `iris`, `zoom`. Add `data-now` to play on load, `data-delay`, `data-dur` |
| `data-reveal-group="up"` | Same, for every child, staggered |
| `data-split="words"` | SplitText reveal by `chars`, `words` or `lines`; `data-split-anim` = `up`, `rotate`, `fade`, `blur`, `wave`, `scale`, `drop`, `flip`, `slide` |
| `data-count="1200"` | Count up on scroll; `data-prefix`, `data-suffix`, `data-decimals` |
| `data-scramble="in hover"` | ScrambleText on arrival and/or hover |
| `data-rotate="a\|b\|c"` | Rotating words |
| `data-draw="in"` or `"scroll"` | Draw an SVG's strokes (DrawSVG) |
| `data-magnet="0.3"` | Magnetic hover |
| `data-tilt="8"` + `data-glare` | 3D tilt with a light glare |
| `data-spotlight` | Light that follows the pointer inside a card |
| `data-marquee` | Endless marquee (`.mq-track` inside); `data-marquee-speed`, `-dir="right"`, `-velocity`, `-skew`, `-flip`, `-pause` |
| `data-parallax="0.2"` | Parallax drift |
| `data-hscroll` | Pinned sideways scroll of its `.hs-track`; pin a bigger parent with `data-hscroll-pin`; progress bar `data-hs-bar` |
| `data-stack` | Sticky stacked `.stack-card`s that shrink as the next arrives |
| `data-carousel` | Drag carousel with inertia (`.car-track`), buttons `data-car-prev` / `data-car-next` |
| `data-compare` | Before/after slider (range input inside, keyboard friendly) |
| `data-filter` | Flip-animated filter: buttons `data-filter-btn`, items `data-tags`, live count `data-filter-status` |
| `data-accordion` | Animated native `<details>` (body in `.acc-body`) |
| `data-steps` | Multi-step form: `<fieldset data-step>`, `data-next`, `data-back`, `data-steps-bar`, `data-steps-count`, thank-you panel `data-steps-done` |
| `data-trail` | Image trail behind the cursor (items in `.trail-items`) |
| `data-peek-list` + `data-peek` | Floating photo that follows the cursor over list rows |
| `data-circle-text="…"` | Spinning circular text badge; `data-circle-scroll` speeds it up with scroll |
| `data-progress`, `data-header`, `data-menu-toggle`, `data-motion-toggle`, `data-year` | Page progress bar, smart header, mobile menu, motion on/off switch, current year |

`kit/art.js` draws placeholder "photos" in SVG (`data-art="portrait"`, `room`, `kitchen`, `bath`, `house`, `car`, `food`, `plant`, `product`, `building`, `city`, `landscape`, `abstract`, `chair`, `gym`, `desk`, with `data-palette` and `data-seed`). Swap any of them for a real `<img>`.

Everything respects reduced motion (and the on-page motion switch). Content stays readable if the scripts fail to load. All motion code in `kit/` and `sites/` is our own; some effects are styled after common patterns (React Bits and others), but no third-party component code is copied in.

## Player mode (3D scenes)

Scroll mode makes a visitor scroll through every build. Player mode gives them the controls instead. One stage stays put, and the visitor can:

- press **Show me** to watch the current build play (it becomes **Pause** while playing, then **Show me again**);
- drag the **slider** to scrub through the build by hand;
- slide to another build with the **style bar**, the **arrows**, a **swipe or drag** on the scene, or the **← → keys**;
- press **Play all** to tour every build in turn.

Every build starts finished, so visitors can browse the results and only watch the ones they care about. Leaving a room half-built snaps it back to finished.

Turn it on per page with `mode: 'player'` in `window.SCENES`, or add `?mode=player` to any scene page's address. `build-showroom/` (Northline Renovations) is built for it, with six rooms. Optional text for this mode goes in `intro.playerLede` and `intro.playerHint`. Player mode is not used with the game layer (`hud: 'game'`).

### Timelapse, moving parts and things that leave

`construction-timelapse/` (Ironbridge Construction) uses three more engine features. Any scene template can use them:

- **Timelapse**: `timelapse: { days, cycles, start }` sweeps the sun across a changing sky as a build progresses: dawn, noon, sunset and night, a few times over. A day counter ("Day 87 of 240 · Week 13") sits under the title. A scene can set its own `days`. `playSeconds` sets how long Show me takes. Day changes are smooth sweeps, never flashes, and reduced motion keeps it at noon.
- **Moving parts**: `R.group(name, x, y, z, { ry })` … `R.end()` gathers pieces into a named group. A scene's `live({ a, t, parts })` runs every frame, so it can swing a crane's jib, run a trolley along it, dig with an excavator's arm or walk a worker around. `a` is how built the scene is, so the motion speeds up during the timelapse and stops when it's done.
- **Removal steps**: tag pieces with `{ tag: 'scaffold' }`, and a step with `{ removes: 'scaffold' }` (or a list of tags) takes them away during that step. That's how the hoarding, cabins, plant, cranes and scaffolding leave before handover.

## Plug and play (3D scenes)

Each scene page is one config, `window.SCENES`, loaded after three.js r128 and before `engine/scenes.js`.
Change these keys to restyle any page:

| Key | Options |
| --- | --- |
| `look` | `real`, `toon`, `clay`, `lowpoly`, `neon`, `flat`, `sketch`, `voxel` |
| `layout` | `U`, `V`, `dolly`, `elevator`, `ring`, `board`, `helix`, `notebook`, `world` |
| `assembly` | `mixed` (each piece says how it arrives), `explode`, `scatter`, `grow`, `rise`, `drop` |
| `speed` | `cinematic`, `smooth`, `snappy`, `bouncy` |
| `quality` | `high`, `medium`, `low` (pixel density and shadows) |
| `saturation` | number, `1` as written, lower is muted, higher is vivid |
| `hud` | `classic`, `minimal`, `side`, `cinema`, `game` (ignored by `notebook`) |
| `mode` | `scroll` (default) or `player` (press Show me, slide between builds; see Player mode). `?mode=player` in the address does the same |
| `timelapse` | `{ days, cycles, start }`: sun and sky sweep through days as each build progresses, with a day counter |
| `playSeconds` | how long Show me takes in player mode |
| `base` | `square`, `round`, or `island` (floating island) |
| `avatar` | for `world`: `{ body, skin, cap, legs }` colours of the player who hops between islands |
| `pattern` | page background: `grid`, `dots`, `lines`, `plain` |
| `lockTheme` | `dark` or `light` to fix the page to one theme |
| `three` | 3D colours: `ghost`, `plinth`, `plinthSide` as `[light, dark]`, plus `outline`, `glow`, `paper`, `pencil` |

The page's own colours and fonts are CSS variables in its `<style>` block (`--paper`, `--ink`, `--accent`, `--display`, `--body` and so on). The notebook layout also uses `--page`, `--rule`, `--margin`, `--cover` and `--ring`.

### The game layer

Add `engine/game.css` and `engine/game.js` (after `scenes.js`) and set `hud: 'game'` to get a press-start screen, starfield and grid horizon, player card with level and XP, coin score, quest log, minimap, achievements, combos, 8-bit sound (off until the player switches it on), keyboard controls (arrows or A/D, space, M, P), a pause menu, floating buttons that lean toward the cursor, and a crosshair cursor with a hammer. Configure it with `game: { title, player, questVerb, clearLine, floaters: [{ label, color, pos, hint, title, html, hideSmall }] }`.

### Writing scenes

Each scene is `{ code, name, blurb, build(R) }`. Inside `build`, every `R.step(name, verb, swatch)` is one step in the checklist, and every piece after it belongs to that step:

- `R.box(w, h, d, x, yBottom, z, colour, anim, options)`
- `R.cyl(rTop, rBottom, h, x, yBottom, z, colour, anim, options)`, `R.cone(...)`, `R.sph(r, x, y, z, ...)`, `R.torus(r, tube, x, y, z, ...)`
- `R.sign(text, w, h, x, yBottom, z, background, textColour, anim, options)`
- Helpers: `R.walls`, `R.planks`, `R.tiles`, `R.slab`, `R.plant`, `R.chair`, `R.stool`, `R.table`, `R.roundTable`, `R.lamp`, `R.pendant`, `R.figure`, `R.shelf`, `R.bottles`, `R.car`

`anim` is how the piece arrives: `drop`, `rise`, `growX`, `growZ`, `pop`, `slide`, `hang`, `spin`. Options include `ry` / `rx` / `rz` (rotation), `tex` (`wood`, `tile`, `marble`, `fabric`, `carpet`, `concrete`, `metal`, `grass`, `brick`, `shingle`, `water`, `checker`, `stripes`), `emissive`, `opacity`, `glossy`, `metal`, `rough`.

The room space runs from -2 to 2 on x and z, with the floor at y = 0, the back wall at z = -2 and the left wall at x = -2.

All pages honour reduce-motion, list every step as text below the animation, and fall back to that list if WebGL is off.

## Dependencies

No build step, no packages. Fonts come from Google Fonts. The 3D scenes use three.js r128 from cdnjs. The motion sites use GSAP 3.15.0 from jsDelivr, Lenis 1.3.26 from unpkg, and Vanta 0.5.24 from jsDelivr (with three.js r134 or p5.js 1.1.9 from cdnjs).

Licences:

- **GSAP:** the free Standard licence, fine for client sites, but not for building a competing no-code animation tool.
- **Lenis and Vanta:** MIT.
