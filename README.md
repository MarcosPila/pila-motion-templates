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

## Plug and play

Each scene page is one config, `window.SCENES`, loaded after three.js r128 and before `engine/scenes.js`.
Change these keys to restyle any page:

| Key | Options |
| --- | --- |
| `look` | `real`, `toon`, `clay`, `lowpoly`, `neon`, `flat`, `sketch` |
| `layout` | `U`, `V`, `dolly`, `elevator`, `ring`, `board`, `helix`, `notebook` |
| `assembly` | `mixed` (each piece says how it arrives), `explode`, `scatter`, `grow`, `rise`, `drop` |
| `speed` | `cinematic`, `smooth`, `snappy`, `bouncy` |
| `quality` | `high`, `medium`, `low` (pixel density and shadows) |
| `saturation` | number, `1` as written, lower is muted, higher is vivid |
| `hud` | `classic`, `minimal`, `side`, `cinema` (ignored by `notebook`) |
| `base` | `square` or `round` plinths |
| `pattern` | page background: `grid`, `dots`, `lines`, `plain` |
| `lockTheme` | `dark` or `light` to fix the page to one theme |
| `three` | 3D colours: `ghost`, `plinth`, `plinthSide` as `[light, dark]`, plus `outline`, `glow`, `paper`, `pencil` |

The page's own colours and fonts are CSS variables in its `<style>` block (`--paper`, `--ink`, `--accent`, `--display`, `--body` and so on). The notebook layout also uses `--page`, `--rule`, `--margin`, `--cover` and `--ring`.

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

Fonts from Google Fonts; three.js r128 from cdnjs. No build step, no packages.
