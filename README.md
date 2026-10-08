# Pila Motion Templates

Reference builds for motion-heavy websites, made for Pila Web Co.
Both use a made-up renovation company, **Plumbline & Co.**: every name, price and detail is invented.

Live: https://marcospila.github.io/pila-motion-templates/

| Folder | What it is |
| --- | --- |
| `plumbline/` | A full one-page website for a service business: hero, services, add-ons, process, work, care plans, about, FAQ, quote form, contact. Every section has its own motion. |
| `room-by-room/` | A 3D scroll animation. Five rooms (kitchen, bathroom, living room, bedroom, deck) build themselves material by material on a U-shaped track. Scroll down to build, up to take apart. |

## Using them

Each template is a single `index.html` with its CSS and JavaScript inside. Open it in a browser, or copy the folder into a new project.

- **Plumbline:** to reuse it for a real business, edit the data block at the top of the script (services, add-ons, steps, projects, plans, FAQ) and the text in each section.
- **Room by room:** the rooms are defined as recipes at the top of the script (`kitchen`, `bathroom`, `living`, `bedroom`, `deck`). Each `R.step()` is one material and each `R.box()`, `R.cyl()` or `R.sph()` is one piece, with how it arrives (`drop`, `rise`, `growX`, `pop`, `slide`, `hang`).

Both honour the visitor's reduce-motion setting and have light and dark themes.

## Dependencies

- Fonts from Google Fonts (Archivo, JetBrains Mono, Source Sans 3).
- `room-by-room` loads three.js r128 from cdnjs.

Nothing else: no build step, no packages.
