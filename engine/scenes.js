/* Scroll-built 3D scenes, plug and play.
   Load three.js r128, set window.SCENES, then load this file. Every look below is a config switch:

   look      'real' | 'toon' | 'clay' | 'lowpoly' | 'neon' | 'flat' | 'sketch' | 'voxel'
   layout    'U' | 'V' | 'dolly' | 'elevator' | 'ring' | 'board' | 'helix' | 'notebook' | 'world'
   base      'square' | 'round' | 'island' (floating island, for layout 'world')
   assembly  'mixed' (each piece says how it arrives) | 'explode' | 'scatter' | 'grow' | 'rise' | 'drop'
   speed     'cinematic' | 'smooth' | 'snappy' | 'bouncy'
   quality   'high' | 'medium' | 'low'
   saturation  number, 1 = as written (0.6 muted … 1.4 vivid)
   lockTheme   'dark' or 'light' to fix the page to one theme (hides the switch)
   hud       'classic' | 'minimal' | 'side' | 'cinema'
   mode      'scroll' (default) | 'player'. Any page can also be opened with ?mode=player.
   timelapse { days, cycles } : the sun sweeps across a changing sky as a build progresses, with a day
             counter. A scene can set its own days. playSeconds sets how long Show me takes.

   Scenes can also have moving parts and things that leave: R.group(name, x, y, z, { ry }) … R.end()
   gathers the pieces in between into a named group, and a scene's live({ a, t, parts }) runs every
   frame to move those groups (a is how built the scene is). Give pieces a tag ({ tag: 'scaffold' })
   and a step with { removes: 'scaffold' } takes them away again during that step.

   Scroll mode: as you scroll down, the current scene builds itself; scroll up and it comes apart.
   Player mode: one stage that stays put. Press "Show me" to watch the current build play, drag the
   slider to scrub it, and use the style bar, the arrows, a swipe or the arrow keys to slide to another
   build. "Play all" tours every build in turn. Nobody has to scroll through every animation. */
(() => {
  'use strict';
  const CFG = window.SCENES;
  if (!CFG) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LOOK = CFG.look || CFG.style || 'real';
  const TOON = LOOK === 'toon', CLAY = LOOK === 'clay', LOW = LOOK === 'lowpoly', NEON = LOOK === 'neon', FLAT = LOOK === 'flat', REAL = LOOK === 'real', SKETCH = LOOK === 'sketch', VOXEL = LOOK === 'voxel';
  const OUTLINED = TOON || FLAT || VOXEL;
  const LAYOUT = CFG.layout || CFG.track || 'U';
  const NOTEBOOK = LAYOUT === 'notebook';
  const PLAYER = (new URLSearchParams(location.search).get('mode') || CFG.mode) === 'player' && CFG.hud !== 'game';
  const SPEEDS = { cinematic: { follow: 2.4, dur: .8, stagger: .35 }, smooth: { follow: 5, dur: .55, stagger: .5 }, snappy: { follow: 11, dur: .28, stagger: .7 }, bouncy: { follow: 7, dur: .5, stagger: .5 } };
  const SPEED = SPEEDS[CFG.speed] || SPEEDS.smooth;
  const QUALITY = { high: { pr: 2, shadow: 2048, aa: true }, medium: { pr: 1.5, shadow: 1024, aa: true }, low: { pr: 1, shadow: 0, aa: false } }[CFG.quality || 'medium'];
  const SAT = CFG.saturation ?? 1;
  const ASSEMBLY = CFG.assembly && CFG.assembly !== 'mixed' ? CFG.assembly : null;
  const BOUNCY = TOON || CLAY || VOXEL || CFG.speed === 'bouncy';
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const pad = (n) => String(n).padStart(2, '0');
  const SC = CFG.scenes, N = SC.length, UNIT = CFG.unit || 'Scene';
  const LOOK_NAME = { real: 'Realistic', toon: 'Cartoon', clay: 'Clay', lowpoly: 'Low-poly', neon: 'Neon', flat: 'Flat illustration', sketch: 'Pencil sketch', voxel: 'Voxel game' }[LOOK];
  const LAYOUT_NAME = { U: 'U-curve', V: 'V-curve', dolly: 'Dolly forward', elevator: 'Elevator', ring: 'Turntable', board: 'Map board', helix: 'Spiral', notebook: 'Notebook', world: 'Game world' }[LAYOUT];
  const arrowL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
  const arrowR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';

  /* ---------------- page ---------------- */
  if (CFG.lockTheme) document.documentElement.dataset.theme = CFG.lockTheme;
  document.body.classList.add('pat-' + (CFG.pattern || 'grid'), 'hud-' + (CFG.hud || 'classic'), 'layout-' + LAYOUT, PLAYER ? 'mode-player' : 'mode-scroll');
  const navHTML = `<div class="nav"><button class="arrow" type="button" id="prev" aria-label="Previous ${esc(UNIT.toLowerCase())}">${arrowL}</button><div class="pills" id="pills" role="group" aria-label="${esc(UNIT)}s"></div><button class="arrow" type="button" id="next" aria-label="Next ${esc(UNIT.toLowerCase())}">${arrowR}</button></div>`;
  const ctrlHTML = PLAYER ? `<div class="ctrl">
          <div class="dock">
            <button class="show" type="button" id="showBtn"><span class="ico" aria-hidden="true">▶</span><span id="showLbl">Show me</span></button>
            <label class="scrub"><span>${esc(CFG.meterLabel || 'Built')}</span><input type="range" id="scrub" min="0" max="1000" value="1000" aria-label="Scrub through this build"></label>
            <button class="tour" type="button" id="tourBtn" aria-pressed="false">Play all</button>
          </div>
          ${navHTML}
          <p class="swipe-hint" aria-hidden="true">Swipe or drag the scene to slide between ${esc(UNIT.toLowerCase())}s</p>
        </div>` : navHTML;
  const words = CFG.intro.title.split(' ');
  const hlFrom = CFG.intro.highlight ?? words.length - 1;
  document.body.insertAdjacentHTML('afterbegin', `
  <div class="top">
    <a class="brand" href="#top" id="top"><i aria-hidden="true">${esc(CFG.brand.mark)}</i>${esc(CFG.brand.name)}</a>
    <div class="top-r"><a class="chip" href="../">← <span>All templates</span></a>${CFG.lockTheme ? '' : '<button class="chip" type="button" id="themeBtn" aria-label="Switch between light and dark colours"><i aria-hidden="true"></i><span id="themeLbl">Dark</span></button>'}</div>
  </div>
  <section class="intro" aria-labelledby="intro-h">
    <p class="kicker">${esc(CFG.intro.kicker)}</p>
    <h1 id="intro-h" aria-label="${esc(CFG.intro.title)}">${words.map((w, i) => `<span class="w${i >= hlFrom ? ' hl' : ''}" style="--i:${i}" aria-hidden="true">${esc(w)}</span>`).join(' ')}</h1>
    <p class="lede">${esc(PLAYER ? CFG.intro.playerLede || CFG.intro.lede : CFG.intro.lede)}</p>
    <p class="hint"><i aria-hidden="true"></i>${esc(PLAYER ? CFG.intro.playerHint || 'Press Show me, or slide between them' : CFG.intro.hint || 'Scroll to start building')}</p>
    <span class="badge">${LOOK_NAME} · ${LAYOUT_NAME} · sample business</span>
  </section>
  <section class="stage" id="stage" aria-label="${esc(CFG.stageLabel || (PLAYER ? 'Builds you can play and switch between' : 'Scenes built as you scroll'))}">
    <div class="sticky">${NOTEBOOK ? `
      <div class="book" id="book">
        <div class="page left"><div class="pg-in" aria-live="polite">
          <p class="no"><b id="code"></b><span id="count"></span></p><h2><span id="name"></span></h2><p id="blurb" class="blurb"></p>
          <ol class="steps" id="steps" aria-label="Steps for this ${esc(UNIT.toLowerCase())}"></ol>
          <div class="meter"><small>${esc(CFG.meterLabel || 'Drawn')}</small><b id="pct">0%</b><p class="now" id="now">${PLAYER ? 'Press Show me' : 'Scroll to start'}</p><div class="bar" id="bar"><i></i></div></div>
          <span class="pg-no" id="pgL">1</span>
        </div></div>
        <div class="page right"><canvas class="gl" id="gl" aria-hidden="true"></canvas><div class="fallback" id="fallback" hidden><p class="lede">This drawing needs WebGL, which this browser has turned off.</p></div><span class="pg-no" id="pgR">2</span></div>
        <div class="leaf" id="leaf" aria-hidden="true"><div class="leaf-front" id="leafFront"><span class="pg-no" id="lfR">2</span></div><div class="leaf-back"><div class="pg-in"><p class="no"><b id="lfCode"></b></p><h2 id="lfName"></h2><p class="blurb" id="lfBlurb"></p></div></div></div>
        <div class="rings" aria-hidden="true"></div>
      </div>
      <div class="hud"><span></span><span></span>
        ${ctrlHTML}
      </div>` : `
      <canvas class="gl" id="gl" aria-hidden="true"></canvas>
      <div class="fallback" id="fallback" hidden><p class="lede">This animation needs WebGL, which this browser has turned off. Every step is listed further down.</p></div>
      <div class="hud">
        <div class="title" aria-live="polite"><p class="no"><b id="code"></b><span id="count"></span></p><h2><span id="name"></span></h2><p id="blurb"></p></div>
        <div class="mid"><ol class="steps panel" id="steps" aria-label="Steps for this ${esc(UNIT.toLowerCase())}"></ol><span></span>
          <div class="meter panel"><small>${esc(CFG.meterLabel || 'Built')}</small><b id="pct">0%</b><p class="now" id="now">${PLAYER ? 'Press Show me' : 'Scroll to start'}</p><div class="bar" id="bar"><i></i></div></div></div>
        ${ctrlHTML}
      </div>`}
    </div>
  </section>
  <section class="outro" aria-labelledby="outro-h">
    <p class="kicker">${esc(CFG.outro.kicker)}</p><h2 id="outro-h">${esc(CFG.outro.title)}</h2><p class="lede">${esc(CFG.outro.lede)}</p>
    <div class="list" id="list"></div>
    <a class="cta" href="#top">${esc(CFG.outro.cta || 'Back to the start ↑')}</a>
  </section>
  <footer><span>${esc(CFG.brand.name)} is a sample business for a website template. Everything on this page is made up.</span><a href="../">All templates</a></footer>`);

  /* ---------------- shared helpers (work for the real builder and the text-only stub) ---------------- */
  function helpers(R) {
    const rot = (cx, cz, ry, dx, dz) => [cx + dx * Math.cos(ry) + dz * Math.sin(ry), cz - dx * Math.sin(ry) + dz * Math.cos(ry)];
    R.walls = (color, o = {}) => {
      const h = o.h || 2.5;
      if (o.back !== false) R.box(4.24, h, .12, 0, 0, -2.06, color, 'rise', { tex: o.tex });
      if (o.left !== false) R.box(.12, h, 4, -2.06, 0, 0, o.leftColor || color, 'rise', { tex: o.tex });
    };
    R.planks = (n, c1, c2, o = {}) => { const w = 4 / n; for (let i = 0; i < n; i++) R.box(4, .04, w - .02, 0, 0, -2 + w / 2 + i * w, i % 2 ? c2 : c1, 'growX', { tex: o.tex || 'wood' }); };
    R.tiles = (n, c1, c2, o = {}) => { const s = 4 / n; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) R.box(s - .02, .03, s - .02, -2 + s / 2 + c * s, 0, -2 + s / 2 + r * s, (r + c) % 2 ? c2 : c1, 'pop', { tex: o.tex }); };
    R.slab = (color, o = {}) => R.box(4, .04, 4, 0, 0, 0, color, o.anim || 'growX', { tex: o.tex });
    R.plant = (x, z, s = 1, yb = 0, pot = '#e9e4dc', leaf = '#4f9d5a') => {
      R.cyl(.15 * s, .12 * s, .3 * s, x, yb, z, pot, 'pop');
      R.sph(.26 * s, x, yb + .52 * s, z, leaf, 'pop');
      R.sph(.18 * s, x + .1 * s, yb + .8 * s, z - .05 * s, leaf, 'pop');
    };
    R.chair = (x, z, ry = 0, color = '#c9c2b8', leg = '#2b2f34', s = 1) => {
      [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]].forEach(([a, b]) => { const [px, pz] = rot(x, z, ry, a * s, b * s); R.cyl(.022 * s, .022 * s, .42 * s, px, 0, pz, leg, 'rise'); });
      R.box(.46 * s, .06 * s, .46 * s, x, .42 * s, z, color, 'drop', { ry });
      const [bx, bz] = rot(x, z, ry, 0, -.21 * s); R.box(.46 * s, .46 * s, .06 * s, bx, .48 * s, bz, color, 'drop', { ry });
    };
    R.stool = (x, z, h, seat, leg) => { R.cyl(.025, .025, h - .05, x, 0, z, leg, 'rise'); R.cyl(.16, .16, .05, x, h - .05, z, seat, 'drop'); };
    R.table = (x, z, w, d, h, top, leg, o = {}) => {
      const ry = o.ry || 0;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const [px, pz] = rot(x, z, ry, a * (w / 2 - .06), b * (d / 2 - .06)); R.cyl(.03, .03, h - .05, px, 0, pz, leg, 'rise'); });
      R.box(w, .05, d, x, h - .05, z, top, 'drop', { ry, tex: o.tex });
    };
    R.roundTable = (x, z, r, h, top, leg) => { R.cyl(.2, .22, .03, x, 0, z, leg, 'pop'); R.cyl(.04, .05, h - .07, x, .03, z, leg, 'rise'); R.cyl(r, r, .04, x, h - .04, z, top, 'drop'); };
    R.lamp = (x, z, yb, shade = '#f4ead2', base = '#2b2f34') => { R.cyl(.05, .07, .2, x, yb, z, base, 'pop'); R.cyl(.1, .15, .18, x, yb + .2, z, shade, 'hang', { emissive: '#ffe1a0', ei: .6 }); };
    R.pendant = (x, z, y, shade, cord = '#2b2f34') => { R.cyl(.008, .008, 2.5 - y, x, y, z, cord, 'hang'); R.cyl(.06, .2, .2, x, y - .2, z, shade, 'hang', { metal: .4, rough: .4 }); R.sph(.05, x, y - .2, z, '#fff2c2', 'hang', { emissive: '#ffd77a', ei: 1.2 }); };
    R.figure = (x, z, shirt = '#3b6fd8', skin = '#e8b98f', o = {}) => {
      const s = o.s || 1, yb = o.yb || 0;
      R.cyl(.12 * s, .17 * s, .62 * s, x, yb, z, shirt, 'rise');
      R.sph(.14 * s, x, yb + .78 * s, z, skin, 'pop');
      if (o.hair) R.sph(.15 * s, x, yb + .84 * s, z - .015 * s, o.hair, 'pop', { sy: .62 });
    };
    R.shelf = (x, z, w, h, d, levels, color, o = {}) => {
      const ry = o.ry || 0;
      [-1, 1].forEach((a) => { const [px, pz] = rot(x, z, ry, a * (w / 2 - .03), 0); R.box(.05, h, d, px, 0, pz, color, 'rise', { ry }); });
      for (let i = 0; i < levels; i++) R.box(w, .04, d, x, .05 + i * (h - .1) / (levels - 1), z, color, 'growX', { ry });
    };
    R.bottles = (x0, z, yb, n, colors, o = {}) => { const gap = o.gap || .1; for (let i = 0; i < n; i++) { const c = colors[i % colors.length]; R.cyl(.035, .035, o.h || .18, x0 + i * gap, yb, z, c, 'pop', { glossy: true }); } };
    R.car = (x, z, color, o = {}) => {
      const ry = o.ry || 0, s = o.s || 1, yb = o.yb || 0;
      const P = (dx, dz) => rot(x, z, ry, dx * s, dz * s);
      const paint = { ry, metal: .55, rough: .32, glossy: true };
      [[-.85, -.5], [.85, -.5], [-.85, .5], [.85, .5]].forEach(([a, b]) => { const [px, pz] = P(a, b); R.cyl(.26 * s, .26 * s, .2 * s, px, yb + .26 * s, pz, '#1d1f22', 'pop', { rx: Math.PI / 2, ry, center: true, rough: .9 }); R.cyl(.14 * s, .14 * s, .21 * s, px, yb + .26 * s, pz, '#c9ced3', 'pop', { rx: Math.PI / 2, ry, center: true, metal: .8, rough: .25 }); });
      const [bx, bz] = P(0, 0); R.box(2.6 * s, .5 * s, 1.1 * s, bx, yb + .26 * s, bz, color, 'drop', paint);
      const [cx, cz] = P(-.15, 0); R.box(1.4 * s, .44 * s, 1.0 * s, cx, yb + .76 * s, cz, color, 'drop', paint);
      R.box(1.3 * s, .32 * s, 1.03 * s, cx, yb + .8 * s, cz, '#1e2a36', 'pop', { ry, metal: .6, rough: .12, glossy: true });
      [-.35, .35].forEach((b) => { const [hx, hz] = P(1.3, b); R.box(.04 * s, .1 * s, .24 * s, hx, yb + .5 * s, hz, '#fff6d0', 'pop', { ry, emissive: '#fff1b8', ei: 1.3 }); const [tx, tz] = P(-1.3, b); R.box(.04 * s, .1 * s, .24 * s, tx, yb + .5 * s, tz, '#d43a3a', 'pop', { ry, emissive: '#ff3030', ei: .9 }); });
    };
    return R;
  }

  /* ---------------- text list (works without WebGL) ---------------- */
  const stepNames = SC.map((s) => {
    const names = [];
    s.build(helpers({ step: (n) => names.push(n), box() {}, cyl() {}, sph() {}, cone() {}, torus() {}, sign() {}, group() {}, end() {} }));
    return names;
  });
  $('#list').innerHTML = SC.map((s, i) => `<article class="panel"><span class="kicker">${esc(s.code)}</span><b>${esc(s.name)}</b><ol>${stepNames[i].map((n) => `<li>${esc(n)}</li>`).join('')}</ol></article>`).join('');

  /* ---------------- theme ---------------- */
  const isDark = () => (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
  const themeKey = 'tpl-theme-' + (CFG.key || 'x');
  if (!CFG.lockTheme) { const saved = ls.get(themeKey); if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved; }
  const syncLbl = () => { const l = $('#themeLbl'); if (l) l.textContent = isDark() ? 'Light' : 'Dark'; };
  syncLbl();

  /* ---------------- WebGL ---------------- */
  let ok = !!window.THREE;
  if (ok) { try { const c = document.createElement('canvas'); ok = !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch { ok = false; } }
  if (!ok) {
    $('#fallback').hidden = false;
    document.addEventListener('click', (e) => { if (e.target.closest('#themeBtn')) { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; syncLbl(); } });
    return;
  }
  const T3 = CFG.three || {};
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: QUALITY.aa, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, QUALITY.pr));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = (REAL || CLAY || LOW) && !SKETCH ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = T3.exposure || (CLAY ? 1.15 : 1.05);
  const SHADOWS = QUALITY.shadow > 0 && !NEON && !FLAT && !SKETCH;
  renderer.shadowMap.enabled = SHADOWS;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const ortho = LAYOUT !== 'board' && (CFG.camera === 'ortho' || LOW);
  const camera = ortho ? new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 400) : new THREE.PerspectiveCamera(CFG.fov || 30, 1, .1, 400);
  const LIGHT = {
    real: [.62, 1.05, .12], toon: [.34, .82, .16], clay: [.75, .7, .25], lowpoly: [.6, 1.0, .15], neon: [0, 0, 0], flat: [.25, .35, .42], sketch: [0, 0, 0], voxel: [.42, .95, .22],
  }[LOOK];
  const hemi = new THREE.HemisphereLight(0xffffff, CLAY ? 0xf0dfe8 : 0xb9a99a, LIGHT[0]); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, LIGHT[1]);
  sun.position.set(6, 10, 7);
  if (SHADOWS) { sun.castShadow = true; sun.shadow.mapSize.set(QUALITY.shadow, QUALITY.shadow); Object.assign(sun.shadow.camera, { left: -5.5, right: 5.5, top: 5.5, bottom: -5.5, near: 1, far: 40 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = .02; if (CLAY) sun.shadow.radius = 6; }
  scene.add(sun); scene.add(sun.target);
  scene.add(new THREE.AmbientLight(0xffffff, LIGHT[2]));

  /* colour handling: saturation, pastel for clay, dark fills for neon */
  const tmpHSL = {};
  const PAPER = new THREE.Color(T3.paper || '#fbf8f1');
  const pencilMat = new THREE.LineBasicMaterial({ color: new THREE.Color(T3.pencil || '#2d2a32'), transparent: true, opacity: .85 });
  function adjust(hex) {
    const c = new THREE.Color(hex);
    c.getHSL(tmpHSL); c.setHSL(tmpHSL.h, Math.min(1, tmpHSL.s * SAT), tmpHSL.l);
    if (CLAY) c.lerp(new THREE.Color('#ffffff'), .2);
    return c;
  }
  const lin = (c) => (c.isColor ? c.clone() : new THREE.Color(c)).convertSRGBToLinear();
  const gradientMap = (() => { const data = FLAT ? [200, 255] : [70, 150, 255]; const t = new THREE.DataTexture(new Uint8Array(data), data.length, 1, THREE.LuminanceFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();

  /* procedural textures for the realistic look (and patterns other looks keep) */
  const texCache = new Map();
  function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function texCanvas(type, color) {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), rnd = seeded(type.length * 977 + 13);
    const base = adjust(color), white = new THREE.Color('#ffffff'), black = new THREE.Color('#000000');
    const shade = (k) => '#' + (k >= 0 ? base.clone().lerp(white, k) : base.clone().lerp(black, -k)).getHexString();
    g.fillStyle = shade(0); g.fillRect(0, 0, S, S);
    if (type === 'wood') {
      for (let i = 0; i < 70; i++) { const y = rnd() * S; g.strokeStyle = shade(rnd() < .5 ? -.12 - rnd() * .12 : .06); g.globalAlpha = .25 + rnd() * .35; g.lineWidth = .6 + rnd() * 2.2; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= S; x += 16) g.lineTo(x, y + Math.sin(x * .025 + i) * 2.5); g.stroke(); }
      g.globalAlpha = .35; g.fillStyle = shade(-.3); for (let k = 0; k < 2; k++) { g.beginPath(); g.ellipse(rnd() * S, rnd() * S, 9, 4, 0, 0, 7); g.fill(); }
    } else if (type === 'tile' || type === 'checker') {
      const n = type === 'checker' ? 8 : 4, s = S / n;
      for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) { g.fillStyle = type === 'checker' ? ((r + q) % 2 ? shade(-.75) : shade(.1)) : shade((rnd() - .5) * .08); g.fillRect(q * s + 2, r * s + 2, s - 4, s - 4); }
      if (type === 'tile') { g.strokeStyle = shade(.35); g.globalAlpha = .9; g.lineWidth = 3; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, S); g.moveTo(0, i * s); g.lineTo(S, i * s); g.stroke(); } }
    } else if (type === 'marble') {
      for (let i = 0; i < 9; i++) { g.strokeStyle = shade(-.35); g.globalAlpha = .12 + rnd() * .2; g.lineWidth = .6 + rnd() * 2; g.beginPath(); g.moveTo(rnd() * S, 0); g.bezierCurveTo(rnd() * S, S * .3, rnd() * S, S * .7, rnd() * S, S); g.stroke(); }
    } else if (type === 'fabric' || type === 'carpet' || type === 'concrete') {
      const n = type === 'concrete' ? 2600 : 5200;
      for (let i = 0; i < n; i++) { g.fillStyle = shade(rnd() < .5 ? -.18 : .14); g.globalAlpha = .18 + rnd() * .2; const z = type === 'carpet' ? 2 : 1; g.fillRect(rnd() * S, rnd() * S, z, z); }
    } else if (type === 'metal') {
      for (let i = 0; i < 220; i++) { g.strokeStyle = shade(rnd() < .5 ? -.12 : .18); g.globalAlpha = .12; g.beginPath(); const y = rnd() * S; g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
    } else if (type === 'grass') {
      for (let i = 0; i < 1800; i++) { g.strokeStyle = shade((rnd() - .5) * .4); g.globalAlpha = .5; const x = rnd() * S, y = rnd() * S; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 3, y - 4 - rnd() * 5); g.stroke(); }
    } else if (type === 'brick' || type === 'shingle') {
      const rows = 8, h = S / rows, w = type === 'brick' ? S / 4 : S / 6;
      g.fillStyle = type === 'brick' ? '#d8d2c8' : shade(-.5); g.fillRect(0, 0, S, S);
      for (let r = 0; r < rows; r++) for (let q = -1; q < S / w + 1; q++) { g.fillStyle = shade((rnd() - .5) * .22); g.fillRect(q * w + (r % 2 ? w / 2 : 0) + 2, r * h + 2, w - 4, h - (type === 'brick' ? 4 : 3)); }
    } else if (type === 'water') {
      const grd = g.createLinearGradient(0, 0, S, S); grd.addColorStop(0, shade(.15)); grd.addColorStop(1, shade(-.15)); g.fillStyle = grd; g.fillRect(0, 0, S, S);
      g.strokeStyle = '#ffffff'; for (let i = 0; i < 26; i++) { g.globalAlpha = .1 + rnd() * .25; g.lineWidth = 1 + rnd() * 1.5; g.beginPath(); const y = rnd() * S; g.moveTo(0, y); for (let x = 0; x <= S; x += 12) g.lineTo(x, y + Math.sin(x * .06 + i) * 4); g.stroke(); }
    } else if (type === 'stripes') {
      const cols = ['#d42f2f', '#ffffff', '#2f56c9', '#ffffff'], w = S / 4;
      for (let i = -8; i < 8; i++) { g.fillStyle = cols[((i % 4) + 4) % 4]; g.beginPath(); g.moveTo(i * w, S); g.lineTo(i * w + S, 0); g.lineTo(i * w + S + w, 0); g.lineTo(i * w + w, S); g.fill(); }
    }
    g.globalAlpha = 1;
    return c;
  }
  function getTex(type, color) {
    const k = type + color;
    if (!texCache.has(k)) { const t = new THREE.CanvasTexture(texCanvas(type, color)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = maxAniso; texCache.set(k, t); }
    return texCache.get(k);
  }
  const TEX_SIZE = { wood: .9, tile: 1.2, checker: 1.6, marble: 2, fabric: 1.5, carpet: 1.5, concrete: 2, metal: 2, grass: 1.5, brick: 1.2, shingle: 1.2, water: 2, stripes: 1 };
  const PATTERN_TEX = { checker: 1, stripes: 1 };   // patterns every look keeps; surface textures only the realistic look uses

  const matCache = new Map();
  function makeMat(hex, o, dims) {
    const useTex = o.tex && (REAL || PATTERN_TEX[o.tex]);
    if (useTex) {
      const map = getTex(o.tex, hex).clone(); map.needsUpdate = true;
      const ts = TEX_SIZE[o.tex] || 1.2;
      map.repeat.set(o.rep ? o.rep[0] : Math.max(1, Math.round(dims.w / ts)), o.rep ? o.rep[1] : Math.max(1, Math.round(Math.max(dims.h, dims.d) / ts)));
      if (OUTLINED) return new THREE.MeshToonMaterial({ map, gradientMap });
      if (NEON) return new THREE.MeshBasicMaterial({ map, color: 0x333344 });
      if (SKETCH) return new THREE.MeshBasicMaterial({ map, color: lin(PAPER.clone().lerp(new THREE.Color('#bbbbbb'), .3)) });
      return new THREE.MeshStandardMaterial({ map, roughness: o.rough ?? (o.tex === 'marble' || o.tex === 'tile' ? .35 : .8), metalness: o.metal ?? 0, flatShading: LOW });
    }
    const key = [hex, o.metal, o.rough, o.emissive, o.ei, o.opacity, o.glossy].join('|');
    if (matCache.has(key)) return matCache.get(key);
    const col = adjust(hex);
    let m;
    if (SKETCH) {
      const wash = col.clone().lerp(PAPER, o.emissive ? .15 : .55);
      m = new THREE.MeshBasicMaterial({ color: lin(wash), transparent: !!o.opacity, opacity: o.opacity ? .3 : 1, depthWrite: !o.opacity });
    } else if (NEON) {
      const fill = col.clone().lerp(new THREE.Color('#05060c'), o.emissive ? 0 : .82);
      m = new THREE.MeshBasicMaterial({ color: lin(fill), transparent: true, opacity: o.opacity ? Math.min(.35, o.opacity) : .92, depthWrite: !o.opacity });
    } else if (OUTLINED) m = new THREE.MeshToonMaterial({ color: lin(col), gradientMap });
    else if (CLAY) m = new THREE.MeshStandardMaterial({ color: lin(col), roughness: .95, metalness: 0 });
    else m = new THREE.MeshStandardMaterial({ color: lin(col), roughness: o.rough ?? (o.glossy ? .3 : .78), metalness: LOW ? 0 : o.metal ?? 0, flatShading: LOW });
    if (o.emissive && !NEON && !SKETCH) { m.emissive = lin(adjust(o.emissive)); m.emissiveIntensity = o.ei ?? 1; }
    if (o.opacity && !NEON && !SKETCH) { m.transparent = true; m.opacity = o.opacity; m.depthWrite = false; }
    matCache.set(key, m);
    return m;
  }
  // neon edge glow, one material per colour
  const glowCache = new Map();
  function glowMat(hex) {
    if (!glowCache.has(hex)) { const c = adjust(hex); c.getHSL(tmpHSL); c.setHSL(tmpHSL.h, Math.min(1, tmpHSL.s * 1.3 + .25), Math.max(.55, tmpHSL.l)); glowCache.set(hex, new THREE.LineBasicMaterial({ color: lin(c), transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false })); }
    return glowCache.get(hex);
  }
  const ghostMat = TOON || FLAT || SKETCH || VOXEL ? new THREE.LineDashedMaterial({ color: 0x1f4fd1, dashSize: .09, gapSize: .07, transparent: true, opacity: .55 }) : new THREE.LineBasicMaterial({ color: 0x1f4fd1, transparent: true, opacity: NEON ? .16 : .42 });
  const trackMat = new THREE.LineDashedMaterial({ color: 0x1f4fd1, dashSize: .25, gapSize: .2, transparent: true, opacity: .35 });
  const outlineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(T3.outline || '#1b1b1f'), side: THREE.BackSide });
  const plinthTop = OUTLINED ? new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap }) : SKETCH ? new THREE.MeshBasicMaterial({ color: lin(PAPER) }) : NEON ? new THREE.MeshBasicMaterial({ color: 0x0a0b12 }) : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9, flatShading: LOW });
  const plinthSide = OUTLINED ? new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap }) : SKETCH ? new THREE.MeshBasicMaterial({ color: lin(PAPER.clone().lerp(new THREE.Color('#cfc8bb'), .5)) }) : NEON ? new THREE.MeshBasicMaterial({ color: 0x07080d }) : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9, flatShading: LOW });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  function applyTheme() {
    const d = isDark(), pick = (v, fb) => (v ? (d ? v[1] : v[0]) : fb);
    ghostMat.color.set(pick(T3.ghost, d ? '#9fbaff' : '#1f4fd1'));
    trackMat.color.set(pick(T3.ghost, d ? '#9fbaff' : '#1f4fd1'));
    if (!NEON && !SKETCH) { plinthTop.color.copy(lin(adjust(pick(T3.plinth, d ? '#1c3557' : '#e6e1d9')))); plinthSide.color.copy(lin(adjust(pick(T3.plinthSide, d ? '#152a47' : '#c9c2b7')))); }
    floorMat.color.copy(lin(adjust(pick(T3.floor || T3.plinthSide, d ? '#152a47' : '#d9d4cc'))));
    hemi.intensity = LIGHT[0] * (d ? .85 : 1);
  }

  const blobMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 10, 64, 64, 64); r.addColorStop(0, NEON ? 'rgba(120,255,200,.12)' : 'rgba(0,0,0,.32)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })() });

  /* signs with text, redrawn once the page fonts have loaded */
  const signs = [];
  function drawSign(s) {
    const g = s.canvas.getContext('2d'), W = s.canvas.width, H = s.canvas.height;
    g.fillStyle = s.bg; g.fillRect(0, 0, W, H);
    const fam = getComputedStyle(document.body).getPropertyValue('--display') || 'sans-serif';
    let px = H * .62; g.font = `800 ${px}px ${fam}`;
    while (g.measureText(s.text).width > W * .86 && px > 8) { px -= 2; g.font = `800 ${px}px ${fam}`; }
    if (NEON) { g.shadowColor = s.fg; g.shadowBlur = H * .12; }
    g.fillStyle = s.fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s.text, W / 2, H / 2 + px * .04);
    s.tex.needsUpdate = true;
  }

  /* geometry per look */
  function boxGeom(w, h, d) {
    if (!CLAY) return new THREE.BoxGeometry(w, h, d);
    const r = Math.min(.07, Math.min(w, h, d) * .42), seg = (v) => Math.max(2, Math.min(18, Math.ceil(v / Math.max(r, .04))));
    const g = new THREE.BoxGeometry(w, h, d, seg(w), seg(h), seg(d));
    const p = g.attributes.position, nrm = g.attributes.normal, v = new THREE.Vector3(), n = new THREE.Vector3();
    const ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const cx = Math.max(-ix, Math.min(ix, v.x)), cy = Math.max(-iy, Math.min(iy, v.y)), cz = Math.max(-iz, Math.min(iz, v.z));
      n.set(v.x - cx, v.y - cy, v.z - cz);
      if (n.lengthSq() < 1e-10) n.fromBufferAttribute(nrm, i); else n.normalize();
      p.setXYZ(i, cx + n.x * r, cy + n.y * r, cz + n.z * r); nrm.setXYZ(i, n.x, n.y, n.z);
    }
    return g;
  }
  const cylSeg = (o) => o.seg ? (LOW || VOXEL ? Math.min(o.seg, 8) : o.seg) : VOXEL ? 6 : LOW ? 7 : CLAY ? 36 : 28;
  const sphGeom = (r) => (VOXEL ? new THREE.IcosahedronGeometry(r, 0) : LOW ? new THREE.IcosahedronGeometry(r, 1) : new THREE.SphereGeometry(r, CLAY ? 32 : 22, CLAY ? 24 : 16));

  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const easeIO = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const backOut = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const bounceOut = (x) => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; };
  const elasticOut = (x) => (x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (2 * Math.PI / 3)) + 1);
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const OUT_T = FLAT ? .016 : VOXEL ? .026 : .035;
  const rand = seeded(4242);

  /* ---------------- build scenes ---------------- */
  const built = SC.map((s) => {
    const group = new THREE.Group(), inner = new THREE.Group();
    inner.rotation.y = -Math.PI / 4; group.add(inner);
    const island = (s.base || CFG.base) === 'island';
    const round = island || (s.base || CFG.base) === 'round';
    const plinth = round
      ? new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.05, .34, LOW ? 10 : 64), [plinthSide, plinthTop, plinthSide])
      : new THREE.Mesh(CLAY ? boxGeom(4.5, .32, 4.5) : new THREE.BoxGeometry(4.5, .32, 4.5), CLAY ? plinthTop : [plinthSide, plinthSide, plinthTop, plinthSide, plinthSide, plinthSide]);
    plinth.position.y = round ? -.17 : -.16; plinth.receiveShadow = true; inner.add(plinth);
    if (OUTLINED) { const o = new THREE.Mesh(plinth.geometry, outlineMat); o.scale.set(1 + OUT_T / 3, 1 + OUT_T / .17, 1 + OUT_T / 3); plinth.add(o); }
    if (island) {
      const under = new THREE.Mesh(new THREE.CylinderGeometry(2.95, .4, 2.9, VOXEL ? 9 : 24), plinthSide); under.position.y = -.34 - 1.45; inner.add(under);
      if (OUTLINED) { const o = new THREE.Mesh(under.geometry, outlineMat); o.scale.set(1.012, 1.012, 1.012); under.add(o); }
      [[-2.2, -1.9, 1.2, .35], [2.0, -2.5, -1.0, .28], [.6, -3.6, 2.0, .22]].forEach(([x, y, z, r]) => { const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), plinthSide); rock.position.set(x, y, z); inner.add(rock); if (OUTLINED) { const o = new THREE.Mesh(rock.geometry, outlineMat); o.scale.setScalar(1.1); rock.add(o); } });
    }
    if (NEON) plinth.add(new THREE.LineSegments(new THREE.EdgesGeometry(plinth.geometry, 25), glowMat(T3.glow || '#7cf7d4')));
    if (SKETCH) plinth.add(new THREE.LineSegments(new THREE.EdgesGeometry(plinth.geometry, 25), pencilMat));
    if (s.ground) {
      const gg = round ? new THREE.CylinderGeometry(3.04, 3.04, .02, LOW ? 10 : 64) : new THREE.BoxGeometry(4.5, .02, 4.5);
      const gm = new THREE.Mesh(gg, makeMat(s.ground.color, { tex: s.ground.tex, rep: [4, 4] }, { w: 4.5, h: .02, d: 4.5 }));
      gm.position.y = .01; gm.receiveShadow = true; inner.add(gm);
    }
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 9.5), blobMat); blob.rotation.x = -Math.PI / 2; blob.position.y = -.35; blob.visible = !island; group.add(blob);
    const pieces = [], steps = [], parts = {}, stack = [];
    let cur = null;
    const parent = () => stack[stack.length - 1] || inner;
    const add = (geom, dims, x, y, z, color, anim, o) => {
      o = o || {};
      const mesh = new THREE.Mesh(geom, o.material || makeMat(color, o, dims));
      mesh.position.set(x, y, z);
      mesh.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
      mesh.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
      mesh.castShadow = SHADOWS && !o.opacity; mesh.receiveShadow = SHADOWS;
      if (OUTLINED && !o.opacity && !o.noOutline) { const ol = new THREE.Mesh(geom, outlineMat); ol.scale.set(1 + OUT_T / Math.max(dims.w, .02), 1 + OUT_T / Math.max(dims.h, .02), 1 + OUT_T / Math.max(dims.d, .02)); mesh.add(ol); }
      if (NEON) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geom, 25), glowMat(o.emissive || color)));
      if (SKETCH) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geom, 25), pencilMat));
      const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(geom, 25), ghostMat);
      ghost.position.copy(mesh.position); ghost.rotation.copy(mesh.rotation); ghost.scale.copy(mesh.scale);
      if (TOON || FLAT || SKETCH || VOXEL) ghost.computeLineDistances();
      parent().add(mesh); parent().add(ghost);
      const away = new THREE.Vector3(x, y - .6, z); if (away.lengthSq() < .01) away.set(0, 1, 0); away.normalize();
      const p = { mesh, ghost, anim: ASSEMBLY || anim, dims, pos: mesh.position.clone(), rot: mesh.rotation.clone(), scl: mesh.scale.clone(), away, rnd: new THREE.Vector3(rand() * 2 - 1, rand() * .8 + .3, rand() * 2 - 1).normalize(), spin: rand() * 2 - 1 };
      if (o.tag) p.tag = o.tag;
      pieces.push(p); cur.pieces.push(p);
      return p;
    };
    const R = helpers({
      step(name, verb, swatch, so = {}) { cur = { name, verb: verb || name, swatch: swatch || '#999', pieces: [], removes: so.removes ? [].concat(so.removes) : null }; steps.push(cur); },
      group(name, x = 0, y = 0, z = 0, o = {}) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0); parent().add(g); stack.push(g); if (name) parts[name] = g; return g; },
      end() { stack.pop(); },
      box(w, h, d, x, yb, z, color, anim = 'drop', o = {}) { return add(boxGeom(w, h, d), { w, h, d }, x, o.center ? yb : yb + h / 2, z, color, anim, o); },
      cyl(rt, rb, h, x, yb, z, color, anim = 'drop', o = {}) { return add(new THREE.CylinderGeometry(rt, rb, h, cylSeg(o)), { w: Math.max(rt, rb) * 2, h, d: Math.max(rt, rb) * 2 }, x, o.center ? yb : yb + h / 2, z, color, anim, o); },
      cone(r, h, x, yb, z, color, anim = 'drop', o = {}) { return add(new THREE.CylinderGeometry(0, r, h, cylSeg(o)), { w: r * 2, h, d: r * 2 }, x, yb + h / 2, z, color, anim, o); },
      sph(r, x, y, z, color, anim = 'pop', o = {}) { return add(sphGeom(r), { w: r * 2, h: r * 2, d: r * 2 }, x, y, z, color, anim, o); },
      torus(r, tube, x, y, z, color, anim = 'pop', o = {}) { return add(new THREE.TorusGeometry(r, tube, LOW || VOXEL ? 5 : 12, LOW || VOXEL ? 10 : 36), { w: (r + tube) * 2, h: (r + tube) * 2, d: tube * 2 }, x, y, z, color, anim, o); },
      sign(text, w, h, x, yb, z, bg, fg, anim = 'pop', o = {}) {
        const sideways = o.face === 'x', depth = o.depth || .04;
        const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.max(64, Math.round(512 * h / w));
        const tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = maxAniso;
        const bgc = '#' + adjust(bg).getHexString(), fgc = '#' + adjust(fg).getHexString();
        const sg = { canvas: cv, tex, text, bg: NEON ? '#07080d' : bgc, fg: NEON ? '#' + glowMat(fg).color.clone().convertLinearToSRGB().getHexString() : fgc }; drawSign(sg); signs.push(sg);
        const face = OUTLINED ? new THREE.MeshToonMaterial({ map: tex, gradientMap }) : SKETCH ? new THREE.MeshBasicMaterial({ map: tex }) : NEON ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshStandardMaterial({ map: tex, roughness: .6 });
        const side = makeMat(bg, {}, { w, h, d: depth });
        const mats = sideways ? [face, side, side, side, side, side] : [side, side, side, side, face, side];
        const geom = sideways ? new THREE.BoxGeometry(depth, h, w) : new THREE.BoxGeometry(w, h, depth);
        add(geom, sideways ? { w: depth, h, d: w } : { w, h, d: depth }, x, yb + h / 2, z, fg, anim, Object.assign({}, o, { material: mats }));
      },
    });
    s.build(R);
    const S = steps.length;
    steps.forEach((st, si) => {
      const n = st.pieces.length, span = 1 / S;
      st.pieces.forEach((p, j) => { p.t0 = si * span + (n > 1 ? (j / (n - 1)) * span * SPEED.stagger : 0); p.t1 = p.t0 + span * SPEED.dur; });
    });
    steps.forEach((st, si) => {
      if (!st.removes) return;
      const span = 1 / S, out = pieces.filter((p) => p.tag && st.removes.includes(p.tag)), n = out.length;
      out.forEach((p, j) => { p.t2 = si * span + (n > 1 ? (j / (n - 1)) * span * SPEED.stagger : 0); p.t3 = p.t2 + span * SPEED.dur; });
    });
    scene.add(group);
    return { s, group, pieces, steps, parts, stepNames: steps.map((x) => x.name) };
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => signs.forEach(drawSign));

  /* ---------------- layouts: where each scene sits for a carousel position c ---------------- */
  const BOARD_POS = SC.map((_, i) => new THREE.Vector3(i * 8.5, 0, i % 2 ? -4.2 : 0));
  const WORLD_POS = SC.map((_, i) => new THREE.Vector3(i * 9.5, [0, 2.2, -1.1, 1.6, -.4][i % 5], i % 2 ? -3.2 : 0));
  const FOLLOW = LAYOUT === 'world' ? WORLD_POS : BOARD_POS;
  const extra = new THREE.Group(); scene.add(extra);
  const dashed = (pts) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), trackMat); l.computeLineDistances(); extra.add(l); return l; };
  let ringDisc = null;
  const SPACING = 7.8, KY = .028, KZ = .07, KVY = .3, KVZ = .55, KR = .09;
  const RING_R = 10, RING_A = .74, HELIX_R = 7.6, HELIX_A = 1.15, HELIX_H = 3.4, LIFT_H = 5.0, DOLLY_D = 11;
  if (LAYOUT === 'U' || LAYOUT === 'V') {
    const tp = []; for (let x = -26; x <= 26; x += .25) tp.push(new THREE.Vector3(x, -.42 + (LAYOUT === 'V' ? KVY * Math.abs(x) : KY * x * x), LAYOUT === 'V' ? -KVZ * Math.abs(x) : -KZ * x * x)); dashed(tp);
  } else if (LAYOUT === 'ring') {
    ringDisc = new THREE.Group(); ringDisc.position.set(0, 0, -RING_R); extra.add(ringDisc);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(RING_R + 3.6, RING_R + 3.6, .3, LOW ? 16 : 96), floorMat); disc.position.y = -.5; disc.receiveShadow = SHADOWS; ringDisc.add(disc);
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, tick = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .12), plinthSide); tick.position.set(Math.sin(a) * (RING_R + 3.3), -.33, Math.cos(a) * (RING_R + 3.3)); tick.rotation.y = a; ringDisc.add(tick); }
  } else if (LAYOUT === 'helix') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 200, LOW ? 8 : 32), floorMat); pole.position.set(0, 0, -HELIX_R); extra.add(pole);
  } else if (LAYOUT === 'elevator') {
    dashed([new THREE.Vector3(-3.6, 60, -2.5), new THREE.Vector3(-3.6, -200, -2.5)]); dashed([new THREE.Vector3(3.6, 60, -2.5), new THREE.Vector3(3.6, -200, -2.5)]);
  } else if (LAYOUT === 'dolly') {
    dashed([new THREE.Vector3(-3.3, -.4, 12), new THREE.Vector3(-3.3, -.4, -DOLLY_D * N)]); dashed([new THREE.Vector3(3.3, -.4, 12), new THREE.Vector3(3.3, -.4, -DOLLY_D * N)]);
  } else if (LAYOUT === 'board') {
    const minX = -8, maxX = BOARD_POS[N - 1].x + 8;
    const ground = new THREE.Mesh(new THREE.BoxGeometry(maxX - minX, .3, 18), floorMat); ground.position.set((minX + maxX) / 2, -.55, -2); ground.receiveShadow = SHADOWS; extra.add(ground);
    const path = []; for (let i = 0; i < N - 1; i++) for (let k = 0; k <= 20; k++) { const t = k / 20; path.push(new THREE.Vector3(BOARD_POS[i].x + (BOARD_POS[i + 1].x - BOARD_POS[i].x) * t, -.38, BOARD_POS[i].z + (BOARD_POS[i + 1].z - BOARD_POS[i].z) * easeIO(t) + 3.2)); } dashed(path);
  }

  const tmp = new THREE.Vector3();
  let nbVisible = 0, flipK = -1;
  function place(b, i, c, t) {
    const g = b.group, d = i - c, idle = !reduce && Math.abs(d) < .5;
    g.rotation.set(0, 0, 0); g.scale.setScalar(1); g.visible = true;
    if (LAYOUT === 'U' || LAYOUT === 'V') {
      const xr = d * SPACING, V = LAYOUT === 'V';
      g.position.set(xr, V ? KVY * Math.abs(xr) : KY * xr * xr, V ? -KVZ * Math.abs(xr) : -KZ * xr * xr);
      g.rotation.y = -xr * KR; g.rotation.z = V ? -Math.sign(xr) * Math.min(Math.abs(xr), 8) * .02 : -xr * .012;
      g.scale.setScalar(1 - Math.min(.22, Math.abs(xr) * .028));
      g.visible = Math.abs(xr) < 22;
    } else if (LAYOUT === 'dolly') {
      if (d >= 0) { g.position.set((i % 2 ? 1 : -1) * Math.min(1, d) * 2.6, 0, -d * DOLLY_D); g.rotation.y = d * .3 * (i % 2 ? -1 : 1); }
      else { g.position.set((i % 2 ? 1 : -1) * -d * 4, -d * 7, -d * 4); g.rotation.x = d * .5; g.scale.setScalar(1 + d * .4); }
      g.visible = d > -1.4 && d < 3.5;
    } else if (LAYOUT === 'elevator') {
      g.position.set(d * 2.4, -d * LIFT_H, -Math.abs(d) * 2); g.rotation.y = d * .55; g.scale.setScalar(1 - Math.min(.3, Math.abs(d) * .15));
      g.visible = Math.abs(d) < 2.6;
    } else if (LAYOUT === 'ring') {
      const a = d * RING_A; g.position.set(Math.sin(a) * RING_R, 0, -RING_R + Math.cos(a) * RING_R); g.rotation.y = a;
      g.visible = Math.abs(a) < 2.2;
    } else if (LAYOUT === 'helix') {
      const a = d * HELIX_A; g.position.set(Math.sin(a) * HELIX_R, d * HELIX_H, -HELIX_R + Math.cos(a) * HELIX_R); g.rotation.y = a;
      g.visible = Math.abs(d) < 2.8;
    } else if (NOTEBOOK) {
      g.position.set(0, 0, 0); g.visible = i === nbVisible;
    } else if (LAYOUT === 'world') {
      g.position.copy(WORLD_POS[i]); if (!reduce) g.position.y += Math.sin(t * .8 + i * 1.3) * .12;
      g.visible = Math.abs(d) < 2.6;
    } else if (LAYOUT === 'board') {
      g.position.copy(BOARD_POS[i]);
      g.visible = Math.abs(d) < 2.5;
    }
    if (idle) { g.position.y += Math.sin(t * 1.4) * .035; if (TOON || CLAY) g.rotation.y += Math.sin(t * .8) * .05; }
  }
  function offset(m, p, dx, dy, dz) { tmp.set(dx, dy, dz).applyEuler(p.rot); m.position.add(tmp); }
  function animatePiece(p, q) {
    const m = p.mesh, d = p.dims;
    m.visible = q > 0; p.ghost.visible = q < 1;
    m.position.copy(p.pos); m.rotation.copy(p.rot); m.scale.copy(p.scl);
    if (q <= 0 || q >= 1) return;
    let k;
    switch (p.anim) {
      case 'drop':
        if (BOUNCY) { const b = bounceOut(q); m.position.y += (1 - b) * 3; const sq = q > .6 ? Math.sin(((q - .6) / .4) * Math.PI) * .16 : 0; m.scale.y *= 1 - sq; m.scale.x *= 1 + sq * .6; m.scale.z *= 1 + sq * .6; }
        else { k = ease(q); m.position.y += (1 - k) * 2.8; m.rotation.x += (1 - k) * .35; m.rotation.z += (1 - k) * -.25; }
        break;
      case 'rise': k = BOUNCY ? backOut(q) : ease(q); m.scale.y *= Math.max(.001, k); offset(m, p, 0, -(d.h / 2) * (1 - k) * p.scl.y, 0); break;
      case 'growX': k = BOUNCY ? backOut(q) : ease(q); m.scale.x *= Math.max(.001, k); offset(m, p, -(d.w / 2) * (1 - k) * p.scl.x, 0, 0); break;
      case 'growZ': k = BOUNCY ? backOut(q) : ease(q); m.scale.z *= Math.max(.001, k); offset(m, p, 0, 0, -(d.d / 2) * (1 - k) * p.scl.z); break;
      case 'pop': k = BOUNCY ? elasticOut(q) : backOut(q); m.scale.multiplyScalar(Math.max(.001, k)); break;
      case 'grow': k = backOut(q); m.scale.multiplyScalar(Math.max(.001, k)); m.position.y += (1 - ease(q)) * .3; break;
      case 'slide': k = BOUNCY ? backOut(q) : ease(q); m.position.x += (1 - k) * 3; m.rotation.y += (1 - k) * .4; break;
      case 'hang': k = BOUNCY ? bounceOut(q) : backOut(q); m.position.y += (1 - k) * 1.8; break;
      case 'spin': k = BOUNCY ? backOut(q) : ease(q); m.rotation.y += (1 - k) * Math.PI * 1.5; m.scale.multiplyScalar(Math.max(.001, Math.min(1, q * 2))); break;
      case 'explode': k = easeIO(q); m.position.addScaledVector(p.away, (1 - k) * 3.2); m.position.y += (1 - k) * 1.2; m.rotation.x += (1 - k) * p.spin * 1.2; m.rotation.z += (1 - k) * p.spin; break;
      case 'scatter': k = backOut(q); m.position.addScaledVector(p.rnd, (1 - ease(q)) * 6); m.rotation.y += (1 - k) * p.spin * 6; m.rotation.x += (1 - k) * p.spin * 3; m.scale.multiplyScalar(Math.max(.001, Math.min(1, q * 1.6))); break;
    }
  }
  function buildScene(b, a) {
    for (const p of b.pieces) {
      let q = (a - p.t0) / (p.t1 - p.t0);
      const leaving = p.t2 !== undefined && a > p.t2;
      if (leaving) q = 1 - (a - p.t2) / (p.t3 - p.t2);
      q = reduce ? (q > 0 ? 1 : 0) : clamp01(q);
      animatePiece(p, q);
      if (leaving) p.ghost.visible = false;
    }
  }

  /* ---------------- game world: a player that hops between islands, coins to collect ---------------- */
  let avatar = null; const coinSets = [];
  if (LAYOUT === 'world') {
    const A = CFG.avatar || {};
    const tmat = (hex) => OUTLINED ? new THREE.MeshToonMaterial({ color: lin(adjust(hex)), gradientMap }) : new THREE.MeshStandardMaterial({ color: lin(adjust(hex)) });
    const part = (w, h, d, hex, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), tmat(hex)); m.position.set(x, y, z); m.castShadow = SHADOWS; if (OUTLINED) { const o = new THREE.Mesh(m.geometry, outlineMat); o.scale.set(1 + .05 / w, 1 + .05 / h, 1 + .05 / d); m.add(o); } parent.add(m); return m; };
    avatar = new THREE.Group();
    const legs = [part(.16, .3, .16, A.legs || '#2b2350', -.12, .15, 0, avatar), part(.16, .3, .16, A.legs || '#2b2350', .12, .15, 0, avatar)];
    legs.forEach((l) => { l.geometry.translate(0, -.15, 0); l.position.y = .3; });
    part(.5, .5, .34, A.body || '#ff3ea5', 0, .55, 0, avatar);
    part(.46, .42, .42, A.skin || '#ffd7a8', 0, 1.02, 0, avatar);
    part(.08, .1, .02, '#1b1630', -.1, 1.04, .22, avatar); part(.08, .1, .02, '#1b1630', .1, 1.04, .22, avatar);
    part(.5, .13, .46, A.cap || '#2de2e6', 0, 1.27, 0, avatar); part(.5, .05, .22, A.cap || '#2de2e6', 0, 1.22, .3, avatar);
    avatar.userData.legs = legs; avatar.scale.setScalar(1.15); scene.add(avatar);
    const coinMat = OUTLINED ? new THREE.MeshToonMaterial({ color: lin(adjust('#ffd23f')), gradientMap, emissive: lin(new THREE.Color('#ffb800')), emissiveIntensity: .35 }) : new THREE.MeshStandardMaterial({ color: lin(adjust('#ffd23f')), metalness: .6, roughness: .3 });
    built.forEach((b) => {
      const set = [];
      for (let k = 0; k < 3; k++) {
        const holder = new THREE.Group(); holder.position.set(-1.2 + k * 1.2, 3.3 + (k % 2) * .35, .4);
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .07, VOXEL ? 8 : 24), coinMat); coin.rotation.x = Math.PI / 2;
        if (OUTLINED) { const o = new THREE.Mesh(coin.geometry, outlineMat); o.scale.set(1.08, 1.5, 1.08); coin.add(o); }
        holder.add(coin); b.group.add(holder); set.push(holder);
      }
      coinSets.push(set);
    });
  }
  const AV_OFF = new THREE.Vector3(1.75, 0, 2.15), avFrom = new THREE.Vector3(), avTo = new THREE.Vector3();
  function placeWorldExtras(st, t) {
    if (!avatar) return;
    const i0 = Math.min(N - 1, Math.floor(st.c + 1e-6)), i1 = Math.min(N - 1, i0 + 1), f = st.c - i0;
    avFrom.copy(built[i0].group.position).add(AV_OFF); avTo.copy(built[i1].group.position).add(AV_OFF);
    avatar.position.lerpVectors(avFrom, avTo, f);
    const jumping = f > .001 && f < .999 && i1 !== i0;
    avatar.position.y += jumping ? 4 * f * (1 - f) * 3.6 : reduce ? 0 : Math.abs(Math.sin(t * 5)) * .1;
    avatar.rotation.y = jumping ? f * Math.PI * 2 : reduce ? 0 : Math.sin(t * 1.2) * .35;
    const swing = jumping ? .9 : reduce ? 0 : Math.sin(t * 10) * .25;
    avatar.userData.legs[0].rotation.x = swing; avatar.userData.legs[1].rotation.x = -swing;
    coinSets.forEach((set, j) => {
      const a = st.build(j);
      set.forEach((h, k) => {
        h.visible = a < .995;
        h.rotation.y = t * 3 + k;
        const out = Math.max(0, (a - .88) / .115);
        h.scale.setScalar(Math.max(.001, 1 - out)); h.position.y = 3.3 + (k % 2) * .35 + out * 1.5 + (reduce ? 0 : Math.sin(t * 2 + k) * .1);
      });
    });
  }

  /* ---------------- scroll ---------------- */
  const DWELL = .72, PMAX = N - 1 + DWELL;
  const stage = $('#stage');
  if (!PLAYER) stage.style.height = `${N * 170 + 100}vh`;
  let target = 0, shown = 0;
  function readScroll() { if (PLAYER) return; const r = stage.getBoundingClientRect(), span = stage.offsetHeight - innerHeight; target = clamp01(-r.top / span) * PMAX; }
  function state(p) {
    const i = Math.min(N - 1, Math.floor(p)), f = p - i, moving = f > DWELL && i < N - 1;
    let c = i;
    if (moving) c = i + easeIO((f - DWELL) / (1 - DWELL));
    return { c, build: (j) => (j < i ? 1 : j > i ? 0 : moving ? 1 : clamp01(f / DWELL)) };
  }
  function scrollToScene(k, done = true) {
    const span = stage.offsetHeight - innerHeight, p = Math.min(PMAX, k + (done ? DWELL * .985 : 0));
    window.scrollTo({ top: stage.offsetTop + (p / PMAX) * span, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------------- player mode ---------------- */
  // Each build has its own progress (0 = bare plinth, 1 = finished). The camera slides between builds
  // on its own, so switching never replays the ones in between.
  const B = new Array(N).fill(1);
  const pState = { c: 0, build: (j) => B[j] };
  const PLAY_SECS = CFG.playSeconds || { cinematic: 9, smooth: 7, snappy: 4.5, bouncy: 6 }[CFG.speed] || 7;
  let cur = 0, camC = 0, camShown = 0, phase = 'idle', tourOn = false, holdT = 0, played = false, scrubbing = false;
  const playedSet = new Set();
  const going = () => phase === 'play' || phase === 'rewind' || phase === 'wait';
  function syncDock() {
    if (!PLAYER) return;
    const btn = $('#showBtn');
    btn.querySelector('.ico').textContent = going() ? '❚❚' : '▶';
    $('#showLbl').textContent = going() ? 'Pause' : B[cur] >= 1 ? (playedSet.has(cur) ? 'Show me again' : 'Show me') : B[cur] > 0 ? 'Keep building' : 'Show me';
    btn.classList.toggle('pulse', !played && !going());
    $('#tourBtn').setAttribute('aria-pressed', String(tourOn));
    $('#tourBtn').textContent = tourOn ? 'Stop tour' : 'Play all';
  }
  function goScene(j) {
    j = Math.max(0, Math.min(N - 1, j));
    // The room you leave snaps back to finished, so the neighbours on the track always look complete.
    if (j !== cur) { B[cur] = 1; if (!tourOn) phase = 'idle'; }
    cur = j; camC = j;
    if (tourOn) { playedSet.add(j); B[j] = 0; phase = 'wait'; holdT = 0; }
    syncDock();
  }
  function play() { played = true; playedSet.add(cur); phase = B[cur] >= 1 ? 'rewind' : 'play'; syncDock(); }
  function toggleTour() {
    tourOn = !tourOn;
    if (tourOn) { played = true; playedSet.add(cur); B[cur] = 0; phase = 'wait'; holdT = 0; } else phase = 'idle';
    syncDock();
  }
  function tickPlayer(dt) {
    if (phase === 'rewind') { B[cur] = reduce ? 0 : Math.max(0, B[cur] - dt / .6); if (B[cur] <= 0) phase = 'play'; }
    else if (phase === 'wait') { if (Math.abs(camC - camShown) < .02) { holdT += dt; if (holdT > .35) { holdT = 0; phase = 'play'; } } }
    else if (phase === 'play') { B[cur] = Math.min(1, B[cur] + dt / PLAY_SECS); if (B[cur] >= 1) { phase = tourOn ? 'hold' : 'idle'; holdT = 0; syncDock(); } }
    else if (phase === 'hold') { holdT += dt; if (holdT > 1.4) { if (cur < N - 1) goScene(cur + 1); else { tourOn = false; phase = 'idle'; syncDock(); } } }
  }

  /* ---------------- HUD ---------------- */
  $('#pills').innerHTML = SC.map((s, k) => `<button class="pill" type="button" data-scene="${k}">${esc(s.name)}</button>`).join('');
  const pills = [...document.querySelectorAll('.pill')];
  let hudScene = -1, hudStep = -2;
  function hud(st) {
    const k = PLAYER ? cur : Math.round(st.c), b = built[k], a = st.build(k);
    if (k !== hudScene) {
      const nm = $('#name');
      nm.textContent = b.s.name; nm.className = 'swap' + (k < hudScene ? ' back' : ''); void nm.offsetWidth;
      $('#code').textContent = b.s.code;
      $('#count').textContent = `${UNIT} ${pad(k + 1)} of ${pad(N)}`;
      if (NOTEBOOK) { $('#pgL').textContent = k * 2 + 1; $('#pgR').textContent = k * 2 + 2; }
      $('#blurb').textContent = b.s.blurb;
      $('#steps').innerHTML = b.steps.map((x, si) => `<li><span class="n">${pad(si + 1)}</span><span class="sw" style="--c:${x.swatch}"></span><span class="t">${esc(x.name)}</span></li>`).join('');
      pills.forEach((p, j) => p.setAttribute('aria-current', String(j === k)));
      const box = $('#pills'), pk = pills[k]; box.scrollTo({ left: pk.offsetLeft - (box.clientWidth - pk.clientWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      $('#prev').disabled = k === 0; $('#next').disabled = k === N - 1;
      hudScene = k; hudStep = -2;
    }
    const S = b.steps.length, si = a > .995 ? S : Math.min(S - 1, Math.floor(a * S));
    if (si !== hudStep) {
      [...$('#steps').children].forEach((li, j) => { li.className = j < si ? 'done' : j === si ? 'now' : ''; });
      $('#now').innerHTML = a <= 0 ? (PLAYER ? 'Press Show me to build it' : 'Scroll down to start') : si >= S ? `<em>${esc(b.s.name)} done.</em> ${PLAYER ? 'Try another' : 'Keep scrolling'}` : `${esc(b.steps[si].verb)}<br><em>${esc(b.steps[si].name)}</em>`;
      hudStep = si;
    }
    $('#pct').textContent = `${Math.round(a * 100)}%`;
    $('#bar').style.setProperty('--p', a.toFixed(3));
    pills.forEach((p, j) => p.style.setProperty('--p', st.build(j).toFixed(3)));
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.scene) (PLAYER ? goScene : scrollToScene)(+t.dataset.scene);
    else if (t.id === 'prev') PLAYER ? goScene(cur - 1) : scrollToScene(Math.max(0, hudScene - 1));
    else if (t.id === 'next') PLAYER ? goScene(cur + 1) : scrollToScene(Math.min(N - 1, hudScene + 1), false);
    else if (t.id === 'showBtn') { if (going()) { phase = 'idle'; tourOn = false; syncDock(); } else play(); }
    else if (t.id === 'tourBtn') toggleTour();
    else if (t.id === 'themeBtn') {
      const next = isDark() ? 'light' : 'dark';
      const go = () => { document.documentElement.dataset.theme = next; ls.set(themeKey, next); syncLbl(); applyTheme(); };
      document.startViewTransition && !reduce ? document.startViewTransition(go) : go();
    }
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { syncLbl(); applyTheme(); });

  /* ---------------- timelapse: the sun sweeps a few days across the sky as the build goes ---------------- */
  const TL = CFG.timelapse ? Object.assign({ days: 120, cycles: 4.3, start: .3 }, CFG.timelapse) : null;
  let tlSky = null;
  if (TL) {
    tlSky = document.createElement('div'); tlSky.className = 'tl-sky'; tlSky.setAttribute('aria-hidden', 'true');
    canvas.parentElement.insertBefore(tlSky, canvas);
    const title = document.querySelector('.hud .title');
    if (title) title.insertAdjacentHTML('beforeend', '<p class="tl-clock" aria-hidden="true"><b id="tlDay">Day 1</b><span id="tlWeek"></span></p>');
    document.body.classList.add('timelapse');
  }
  const SKY = [[0, '#1f2a4d', '#4d5f8c'], [.22, '#5b4f86', '#e89a76'], [.3, '#f2a36b', '#f7dcb4'], [.42, '#6fb1e6', '#cfe7f7'], [.62, '#6aa9e0', '#d6ebf8'], [.72, '#f08a5d', '#f6c98f'], [.8, '#6c4f8f', '#e7866a'], [1, '#1f2a4d', '#4d5f8c']];
  const skyA = new THREE.Color(), skyB = new THREE.Color(), warm = new THREE.Color('#ffb27a'), white = new THREE.Color('#ffffff'), nightSky = new THREE.Color('#5d6fa8');
  let tlLastDay = -1;
  function skyAt(ph, i) {
    for (let k = 1; k < SKY.length; k++) if (ph <= SKY[k][0]) { const [p0, ...c0] = SKY[k - 1], [p1, ...c1] = SKY[k], f = (ph - p0) / (p1 - p0); return skyA.set(c0[i]).lerp(skyB.set(c1[i]), f).getStyle(); }
    return SKY[0][i + 1];
  }
  function timelapse(k, a) {
    if (!TL) return;
    const ph = reduce ? .5 : ((TL.start + a * TL.cycles) % 1 + 1) % 1, ang = (ph - .25) * Math.PI * 2, elev = Math.sin(ang);
    const day = Math.max(0, Math.min(1, (elev + .15) / .4));
    sun.position.set(-Math.cos(ang) * 10, Math.max(.8, elev * 10 + 1.5), 6);
    sun.intensity = LIGHT[1] * (.18 + .82 * day);
    sun.color.copy(warm).lerp(white, Math.max(0, Math.min(1, elev * 2.2)));
    hemi.intensity = LIGHT[0] * (.38 + .62 * day);
    hemi.color.copy(nightSky).lerp(white, day);
    tlSky.style.setProperty('--sky1', skyAt(ph, 0)); tlSky.style.setProperty('--sky2', skyAt(ph, 1));
    const days = SC[k].days || TL.days, d = 1 + Math.round(a * (days - 1)), key = a >= 1 ? -k - 1 : k * 100000 + d;
    if (key !== tlLastDay) { tlLastDay = key; $('#tlDay').textContent = a >= 1 ? `Done in ${days} days` : `Day ${d} of ${days}`; $('#tlWeek').textContent = a >= 1 ? '' : `Week ${Math.ceil(d / 7)}`; }
  }

  /* ---------------- camera + loop ---------------- */
  let aspect = 1, baseDist = 15;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; aspect = w / h;
    renderer.setSize(w, h, false);
    baseDist = 15 * Math.max(1, 1.02 / aspect);
    if (ortho) { const v = 6.4 * Math.max(1, 1.05 / aspect); camera.left = -v * aspect; camera.right = v * aspect; camera.top = v; camera.bottom = -v; }
    else camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }
  const camTarget = new THREE.Vector3();
  function placeCamera(c) {
    const lookY = aspect < 1 ? .4 : 1.05;
    if (LAYOUT === 'board' || LAYOUT === 'world') {
      const i0 = Math.floor(c), i1 = Math.min(N - 1, i0 + 1), f = c - i0, W = LAYOUT === 'world';
      camTarget.copy(FOLLOW[i0]).lerp(FOLLOW[i1], W ? easeIO(f) : f);
      const lift = Math.sin(f * Math.PI) * (W ? 3 : 5);
      camera.position.set(camTarget.x, camTarget.y + (W ? baseDist * .4 : baseDist * .72) + lift, camTarget.z + (W ? baseDist * .95 : baseDist * .78) + lift * .6);
      camera.lookAt(camTarget.x, camTarget.y + lookY, camTarget.z);
      sun.position.set(camTarget.x + 6, camTarget.y + 10, camTarget.z + 7); sun.target.position.copy(camTarget);
      return;
    }
    if (ortho) { camera.position.set(0, 16, 20); camera.lookAt(0, lookY, 0); return; }
    const tilt = LAYOUT === 'ring' ? .72 : LAYOUT === 'elevator' ? .3 : LAYOUT === 'dolly' ? .38 : .5;
    camera.position.set(0, baseDist * tilt, baseDist); camera.lookAt(0, lookY, 0);
  }
  addEventListener('resize', resize);
  const evDetail = { c: 0, k: 0, builds: new Array(N).fill(0), si: 0, S: 0, steps: [], name: '' };
  window.SCENES_API = {
    count: N, names: SC.map((s) => s.name), codes: SC.map((s) => s.code),
    positions: LAYOUT === 'world' || LAYOUT === 'board' ? FOLLOW.map((p) => [p.x, p.z]) : null,
    goTo: PLAYER ? goScene : scrollToScene, play: PLAYER ? play : () => {}, mode: PLAYER ? 'player' : 'scroll', current: () => hudScene, segmentPx: () => (stage.offsetHeight - innerHeight) / PMAX, stage,
  };
  let running = false, last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    let st;
    if (PLAYER) {
      tickPlayer(dt);
      camShown += (camC - camShown) * (reduce ? 1 : 1 - Math.exp(-dt * SPEED.follow));
      if (Math.abs(camC - camShown) < .0005) camShown = camC;
      pState.c = camShown; st = pState;
      const sc = $('#scrub');
      if (!scrubbing) sc.value = Math.round(B[cur] * 1000);
      sc.setAttribute('aria-valuetext', `${Math.round(B[cur] * 100)}% built`);
    } else {
      shown += (target - shown) * (reduce ? 1 : 1 - Math.exp(-dt * SPEED.follow));
      if (Math.abs(target - shown) < .0005) shown = target;
      st = state(shown);
    }
    if (NOTEBOOK) {
      const i0 = Math.min(N - 1, Math.floor(st.c + 1e-6)), flipF = st.c - i0, flipping = flipF > .002 && i0 < N - 1;
      if (flipping && flipK !== i0) {
        // snapshot the finished drawing so the turning page carries it
        built.forEach((b, j) => { b.group.visible = j === i0; b.group.position.set(0, 0, 0); b.group.rotation.set(0, 0, 0); b.group.scale.setScalar(1); });
        buildScene(built[i0], 1); placeCamera(st.c); renderer.render(scene, camera);
        try { $('#leafFront').style.backgroundImage = `url(${canvas.toDataURL()}), var(--ruled)`; } catch {}
        const nb = SC[i0 + 1]; $('#lfCode').textContent = nb.code; $('#lfName').textContent = nb.name; $('#lfBlurb').textContent = nb.blurb; $('#lfR').textContent = i0 * 2 + 2;
        flipK = i0;
      }
      if (!flipping) flipK = -1;
      nbVisible = flipping ? i0 + 1 : Math.round(st.c);
      const leaf = $('#leaf'); leaf.style.display = flipping ? 'block' : 'none'; $('#book').style.setProperty('--f', flipF.toFixed(4));
    }
    built.forEach((b, j) => {
      place(b, j, st.c, now / 1000); buildScene(b, st.build(j));
      if (b.s.live && b.group.visible) b.s.live({ a: st.build(j), t: now / 1000, parts: b.parts, reduce });
    });
    if (TL) { const kk = PLAYER ? cur : Math.min(N - 1, Math.round(st.c)); timelapse(kk, st.build(kk)); }
    if (ringDisc) ringDisc.rotation.y = -st.c * RING_A;
    placeWorldExtras(st, now / 1000);
    placeCamera(st.c);
    renderer.render(scene, camera);
    hud(st);
    evDetail.c = st.c; evDetail.k = hudScene; for (let j = 0; j < N; j++) evDetail.builds[j] = st.build(j);
    evDetail.si = hudStep; evDetail.S = built[hudScene].steps.length; evDetail.steps = built[hudScene].stepNames; evDetail.name = built[hudScene].s.name;
    document.dispatchEvent(new CustomEvent('scenes:frame', { detail: evDetail }));
    if (running) requestAnimationFrame(frame);
  }
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    else if (!en.isIntersecting) running = false;
  }).observe(stage);
  addEventListener('scroll', readScroll, { passive: true });
  if (PLAYER) {
    const sc = $('#scrub'), box = stage.querySelector('.sticky');
    sc.addEventListener('input', () => { scrubbing = true; phase = 'idle'; tourOn = false; played = true; B[cur] = sc.value / 1000; syncDock(); });
    sc.addEventListener('change', () => { scrubbing = false; });
    sc.addEventListener('pointerup', () => { scrubbing = false; });
    // Drag or swipe the scene sideways: the camera follows your finger, then settles on a build.
    let dragX = null, dragC = 0;
    box.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button, a, input, label, .steps, .pills')) return;
      dragX = e.clientX; dragC = camC; box.classList.add('dragging');
    });
    addEventListener('pointermove', (e) => { if (dragX === null) return; camC = Math.max(0, Math.min(N - 1, dragC - (e.clientX - dragX) / (box.clientWidth * .55))); });
    const endDrag = (e) => {
      if (dragX === null) return;
      const dx = e.clientX - dragX; dragX = null; box.classList.remove('dragging');
      let j = Math.round(camC);
      if (j === cur && Math.abs(dx) > 50) j = cur + (dx < 0 ? 1 : -1);
      goScene(j);
    };
    addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
    addEventListener('keydown', (e) => {
      if (!running || e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goScene(cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goScene(cur - 1); }
    });
    syncDock();
  }
  applyTheme(); resize(); readScroll(); shown = target;
  frame(performance.now());
})();
