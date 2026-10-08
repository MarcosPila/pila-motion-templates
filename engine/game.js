/* Game layer for the scene templates. Load after engine/scenes.js.
   Adds: a press-start screen, a starfield sky, player card with level and XP, coin score, quest log,
   minimap, achievement toasts, score pops and combos, 8-bit sound (off until switched on),
   keyboard controls, a pause menu, floating buttons that bob and lean toward the cursor,
   and a crosshair cursor with a hammer and a sparkle trail. Config lives in window.SCENES.game. */
(() => {
  'use strict';
  const CFG = window.SCENES, API = window.SCENES_API;
  if (!CFG) return;
  const G = CFG.game || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const N = API ? API.count : CFG.scenes.length;
  const trophy = '<svg viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges"><path fill="#ffd23f" d="M3 2h10v1h2v3h-1v1h-1v1h-1v1H11v1H9v2h2v1h1v2H4v-2h1v-1h2V9H5V8H4V7H3V6H2V5H1V3h2zM2 4v1h1V4zm11 0v1h1V4z"/><path fill="#1b1630" d="M5 3h1v4H5z" opacity=".3"/></svg>';
  const hammer = '<svg viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges"><path fill="#a0714f" d="M7 6h2v9H7z"/><path fill="#1b1630" d="M2 2h12v4H2z"/><path fill="#c9ced3" d="M3 3h10v2H3z"/><path fill="#ffffff" d="M3 3h4v1H3z"/></svg>';

  /* ---------------- DOM ---------------- */
  document.body.classList.add('game');
  document.body.insertAdjacentHTML('beforeend', `
    <div class="g-sky" aria-hidden="true"><canvas id="gStars"></canvas><div class="g-sun"></div><div class="g-grid"></div></div>
    <button class="g-start" id="gStart" type="button" aria-label="Press start to play"><span class="g-logo">${esc(G.title || CFG.brand.name)}</span><span class="g-press">PRESS START</span><span class="g-sub">click, press any key, or scroll</span></button>
    <div class="g-hud" id="gHud">
      <div class="g-player g-panel" aria-label="Player"><span class="g-face" aria-hidden="true"></span><b>${esc(G.player || 'PLAYER 1')} · <span>LVL <i id="gLvl" style="font-style:normal">1</i></span></b><div class="g-xp" aria-hidden="true"><i id="gXp"></i></div></div>
      <div class="g-score g-panel" aria-label="Score"><span class="g-coin" aria-hidden="true"></span><b id="gScore">000000</b></div>
      <div class="g-tools"><button class="gbtn sq" type="button" id="gSound" aria-pressed="false" aria-label="Sound" title="Sound (M)">♪</button><button class="gbtn sq" type="button" id="gHelp" aria-label="How to play" title="How to play">?</button><button class="gbtn sq" type="button" id="gPause" aria-label="Pause" title="Pause (P)">II</button></div>
      <p class="g-level" id="gLevel" aria-live="polite"></p>
      <div class="g-quest g-panel" aria-live="polite"><p class="k">QUEST</p><h3 id="gQuest"></h3><ul id="gObj"></ul></div>
      <canvas class="g-map g-panel" id="gMap" width="380" height="256" aria-hidden="true"></canvas>
    </div>
    <div class="g-float" id="gFloat">${(G.floaters || []).map((f, i) => `<div class="g-fl${f.hideSmall ? ' hide-sm' : ''}" style="${f.pos};--delay:${-i * .7}s;--dur:${3 + (i % 3) * .5}s"><button class="gbtn" type="button" data-floater="${i}" style="--c:${f.color || 'var(--g-yellow)'}">${esc(f.label)}</button>${f.hint ? `<small>${esc(f.hint)}</small>` : ''}</div>`).join('')}</div>
    <div class="g-toasts" id="gToasts" aria-live="polite"></div>
    <div class="g-modal" id="gModal" hidden><div class="g-box g-panel" role="dialog" aria-modal="true" aria-labelledby="gModalH"><h3 id="gModalH"></h3><div id="gModalB"></div><div class="row"><button class="gbtn" type="button" id="gModalX">OK</button></div></div></div>
    <div class="g-cursor" id="gCursor" aria-hidden="true"><i class="ret"></i><i class="tool">${hammer}</i><i class="badge">A</i></div>`);

  /* ---------------- sound: tiny 8-bit beeps, only after the player switches it on ---------------- */
  let ac = null, soundOn = false;
  function beep(freq, dur = .08, type = 'square', vol = .045, when = 0) {
    if (!soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + .02);
    } catch {}
  }
  const sfx = {
    step: () => { beep(660, .06); beep(990, .09, 'square', .04, .06); },
    coin: () => { beep(988, .05); beep(1319, .14, 'square', .04, .05); },
    level: () => [523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, .13, 'square', .045, i * .09)),
    click: () => beep(180, .06, 'triangle', .07),
    start: () => [392, 523, 659, 784].forEach((f, i) => beep(f, .1, 'square', .045, i * .07)),
    whoosh: () => { beep(300, .2, 'sawtooth', .02); beep(500, .2, 'sawtooth', .015, .05); },
  };
  function setSound(on) { soundOn = on; $('#gSound').setAttribute('aria-pressed', String(on)); if (on) sfx.coin(); }

  /* ---------------- sky ---------------- */
  const sky = $('#gStars'), sx = sky.getContext('2d');
  let stars = [];
  function sizeSky() { sky.width = innerWidth; sky.height = innerHeight; stars = Array.from({ length: Math.round(innerWidth * innerHeight / 5000) }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight * .75, s: Math.random() < .15 ? 3 : 2, p: Math.random() * 6 })); drawSky(0); }
  function drawSky(t) { sx.clearRect(0, 0, sky.width, sky.height); for (const s of stars) { sx.globalAlpha = reduce ? .7 : .35 + .65 * Math.abs(Math.sin(t / 900 + s.p)); sx.fillStyle = s.s === 3 ? '#ffd23f' : '#ffffff'; sx.fillRect(s.x, s.y, s.s, s.s); } sx.globalAlpha = 1; }
  addEventListener('resize', sizeSky); sizeSky();

  /* ---------------- start screen ---------------- */
  const start = $('#gStart');
  let started = false;
  try { if (sessionStorage.getItem('g-started') === '1') { start.classList.add('gone'); start.hidden = true; started = true; } } catch {}
  function pressStart() {
    if (started) return; started = true;
    try { sessionStorage.setItem('g-started', '1'); } catch {}
    sfx.start(); burst(innerWidth / 2, innerHeight / 2, 30);
    start.classList.add('gone'); setTimeout(() => { start.hidden = true; }, 750);
  }
  start.addEventListener('click', pressStart);
  addEventListener('keydown', () => pressStart(), { once: true });
  addEventListener('wheel', () => pressStart(), { once: true, passive: true });
  addEventListener('touchmove', () => pressStart(), { once: true, passive: true });

  /* ---------------- particles, pops, toasts ---------------- */
  const COLORS = ['#ff3ea5', '#2de2e6', '#ffd23f', '#3ef08a', '#ffffff'];
  function burst(x, y, n = 12) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('i'); b.className = 'g-bit'; b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.setProperty('--c', COLORS[i % COLORS.length]);
      document.body.appendChild(b);
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 90;
      b.animate([{ transform: 'translate(-50%,-50%)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 40}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => b.remove();
    }
  }
  function pop(text, x, y, big) { const p = document.createElement('div'); p.className = 'g-pop' + (big ? ' big' : ''); p.textContent = text; p.style.left = x + 'px'; p.style.top = y + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 1150); }
  function toast(title, line) { const t = document.createElement('div'); t.className = 'g-toast g-panel'; t.innerHTML = `${trophy}<b>${esc(title)}</b><span>${esc(line)}</span>`; $('#gToasts').appendChild(t); setTimeout(() => t.remove(), 3500); }
  function shake() { if (reduce) return; const s = $('.sticky'); s.classList.remove('g-shake'); void s.offsetWidth; s.classList.add('g-shake'); }

  /* ---------------- game state from the engine ---------------- */
  let lastK = -1, lastSi = -2, score = 0, shown = 0, combo = 0, lastStepT = 0, allClear = false;
  const done = new Set();
  const objectives = (d) => d.steps.map((s, i) => `<li class="${i < d.si ? 'done' : i === d.si ? 'now' : ''}">${esc(s)}</li>`).join('');
  document.addEventListener('scenes:frame', (e) => {
    const d = e.detail, now = performance.now();
    if (d.k !== lastK) {
      const lv = $('#gLevel'); lv.textContent = `LEVEL 1-${d.k + 1} · ${d.name.toUpperCase()}`; lv.classList.remove('in'); void lv.offsetWidth; lv.classList.add('in');
      $('#gQuest').textContent = (G.questVerb || 'Build the') + ' ' + d.name.toLowerCase();
      $('#gLvl').textContent = d.k + 1;
      if (lastK !== -1) sfx.whoosh();
      lastK = d.k; lastSi = d.si; $('#gObj').innerHTML = objectives(d);
    }
    if (d.si !== lastSi) {
      if (d.si > lastSi && lastSi >= 0) {
        combo = now - lastStepT < 1600 ? combo + 1 : 1; lastStepT = now;
        const cx = innerWidth * .62, cy = innerHeight * .42;
        pop(`+${100 * combo}`, cx + (Math.random() - .5) * 120, cy);
        if (combo > 1) pop(`COMBO x${combo}`, cx, cy - 46, true);
        sfx.step();
      }
      lastSi = d.si; $('#gObj').innerHTML = objectives(d);
    }
    $('#gXp').style.setProperty('--p', d.builds[d.k].toFixed(3));
    if (d.builds[d.k] > .995 && !done.has(d.k)) {
      done.add(d.k); toast('ACHIEVEMENT UNLOCKED', `${d.name} complete · +500`); sfx.level(); shake(); burst(innerWidth * .6, innerHeight * .35, 24);
      if (done.size === N && !allClear) { allClear = true; setTimeout(() => { toast('ALL LEVELS CLEAR!', G.clearLine || 'You built the whole place.'); for (let i = 0; i < 4; i++) setTimeout(() => burst(innerWidth * (.2 + i * .2), innerHeight * .3, 26), i * 180); }, 900); }
    }
    score = Math.round(d.builds.reduce((s, b) => s + b, 0) * 1000) + done.size * 500;
    drawMap(d.c);
  });

  /* ---------------- minimap ---------------- */
  const map = $('#gMap'), mx = map.getContext('2d');
  const P = API && API.positions ? API.positions : Array.from({ length: N }, (_, i) => [i * 9, (i % 2) * -3]);
  const xs = P.map((p) => p[0]), zs = P.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const M = (p) => [30 + (p[0] - minX) / Math.max(1, maxX - minX) * (map.width - 60), map.height / 2 - 20 + (p[1] - minZ) / Math.max(1, maxZ - minZ || 1) * 60];
  function drawMap(c) {
    mx.clearRect(0, 0, map.width, map.height);
    mx.strokeStyle = 'rgba(255,255,255,.5)'; mx.setLineDash([8, 8]); mx.lineWidth = 4; mx.beginPath();
    P.forEach((p, i) => { const [x, y] = M(p); i ? mx.lineTo(x, y) : mx.moveTo(x, y); }); mx.stroke(); mx.setLineDash([]);
    P.forEach((p, i) => { const [x, y] = M(p); mx.fillStyle = done.has(i) ? '#3ef08a' : '#2b2350'; mx.strokeStyle = '#ffffff'; mx.lineWidth = 4; mx.fillRect(x - 13, y - 13, 26, 26); mx.strokeRect(x - 13, y - 13, 26, 26); mx.fillStyle = '#fff'; mx.font = 'bold 22px monospace'; mx.textAlign = 'center'; mx.fillText(String(i + 1), x, y + 40); });
    const i0 = Math.min(N - 1, Math.floor(c)), f = c - i0, a = M(P[i0]), b = M(P[Math.min(N - 1, i0 + 1)]);
    const px = a[0] + (b[0] - a[0]) * f, py = a[1] + (b[1] - a[1]) * f - Math.sin(f * Math.PI) * 26;
    mx.fillStyle = '#ff3ea5'; mx.fillRect(px - 8, py - 22, 16, 16); mx.strokeStyle = '#1b1630'; mx.lineWidth = 3; mx.strokeRect(px - 8, py - 22, 16, 16);
  }
  drawMap(0);

  /* ---------------- score ticker + sky loop ---------------- */
  function loop(t) {
    shown += (score - shown) * .12; if (Math.abs(score - shown) < .5) shown = score;
    $('#gScore').textContent = String(Math.round(shown)).padStart(6, '0');
    if (!reduce) drawSky(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---------------- show the HUD only while the game stage is on screen ---------------- */
  new IntersectionObserver(([en]) => document.body.classList.toggle('g-in', en.isIntersecting), { rootMargin: '-45% 0px -45% 0px' }).observe(API ? API.stage : $('#stage'));

  /* ---------------- dialogs ---------------- */
  let lastFocus = null;
  function openModal(title, html, extra = '') {
    lastFocus = document.activeElement;
    $('#gModalH').textContent = title; $('#gModalB').innerHTML = html + extra;
    $('#gModal').hidden = false; $('#gModalX').focus(); sfx.click();
  }
  function closeModal() { $('#gModal').hidden = true; if (lastFocus) lastFocus.focus({ preventScroll: true }); }
  $('#gModalX').addEventListener('click', closeModal);
  $('#gModal').addEventListener('click', (e) => { if (e.target.id === 'gModal') closeModal(); });
  const helpHTML = '<ul><li><kbd>→</kbd> <kbd>D</kbd> next level</li><li><kbd>←</kbd> <kbd>A</kbd> previous level</li><li><kbd>SPACE</kbd> build · <kbd>SHIFT</kbd>+<kbd>SPACE</kbd> undo</li><li><kbd>M</kbd> sound · <kbd>P</kbd> pause</li><li>Click the world to swing the hammer.</li></ul>';
  function pauseMenu() {
    const lv = (API ? API.names : []).map((n, i) => `<button class="gbtn" type="button" data-go="${i}" style="--c:${done.has(i) ? 'var(--g-green)' : '#ffffff'}">1-${i + 1} ${esc(n.toUpperCase())}</button>`).join('');
    openModal('PAUSED', `<p>Pick a level, or carry on where you were.</p><div class="row">${lv}</div>`);
  }

  /* ---------------- clicks ---------------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && b.dataset.floater) { const f = G.floaters[+b.dataset.floater]; openModal(f.title || f.label, f.html || `<p>${esc(f.body || '')}</p>`); return; }
    if (b && b.dataset.go) { closeModal(); API && API.goTo(+b.dataset.go); return; }
    if (b && b.id === 'gSound') { setSound(!soundOn); return; }
    if (b && b.id === 'gHelp') { openModal('HOW TO PLAY', helpHTML); return; }
    if (b && b.id === 'gPause') { pauseMenu(); return; }
    if (b) { sfx.click(); return; }
    // clicking the world: swing the hammer and build a little
    if (document.body.classList.contains('g-in') && !e.target.closest('a, .g-modal')) {
      sfx.coin(); burst(e.clientX, e.clientY, 10); pop('+10', e.clientX, e.clientY - 20);
      if (API) window.scrollBy({ top: API.segmentPx() * .05, behavior: reduce ? 'auto' : 'smooth' });
    }
  });

  /* ---------------- keyboard ---------------- */
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    if (!$('#gModal').hidden) { if (e.key === 'Escape') closeModal(); return; }
    const k = e.key.toLowerCase();
    if (k === 'm') setSound(!soundOn);
    else if (k === 'p' || e.key === 'Escape') { if (document.body.classList.contains('g-in')) pauseMenu(); }
    if (!document.body.classList.contains('g-in') || !API) return;
    if (e.key === 'ArrowRight' || k === 'd') { e.preventDefault(); API.goTo(Math.min(N - 1, API.current() + 1), false); }
    else if (e.key === 'ArrowLeft' || k === 'a') { e.preventDefault(); API.goTo(Math.max(0, API.current() - 1)); }
    else if (e.key === ' ' && !(e.target.closest && e.target.closest('button, a'))) { e.preventDefault(); window.scrollBy({ top: API.segmentPx() * (e.shiftKey ? -.12 : .12), behavior: reduce ? 'auto' : 'smooth' }); }
  });

  /* ---------------- cursor + floating buttons ---------------- */
  if (fine) {
    const cur = $('#gCursor');
    document.body.classList.add('g-cursor-on');
    let lastSpark = 0;
    addEventListener('pointermove', (e) => {
      cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      cur.classList.toggle('hover', !!e.target.closest('button, a, [role="button"]'));
      const now = performance.now();
      if (!reduce && now - lastSpark > 35) {
        lastSpark = now;
        const s = document.createElement('i'); s.className = 'g-spark'; s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
        s.style.setProperty('--c', COLORS[Math.floor(Math.random() * COLORS.length)]); s.style.setProperty('--dx', (Math.random() - .5) * 20 + 'px'); s.style.setProperty('--dy', 10 + Math.random() * 20 + 'px');
        document.body.appendChild(s); setTimeout(() => s.remove(), 620);
      }
      if (!reduce) document.querySelectorAll('.g-fl .gbtn').forEach((b) => {
        const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, dist = Math.hypot(dx, dy);
        const pull = Math.max(0, 1 - dist / 260);
        b.style.setProperty('--ry', (dx / 30 * pull).toFixed(1) + 'deg'); b.style.setProperty('--rx', (-dy / 30 * pull).toFixed(1) + 'deg');
        b.style.setProperty('--mx', (dx * .18 * pull).toFixed(1) + 'px'); b.style.setProperty('--my', (dy * .18 * pull).toFixed(1) + 'px');
      });
    }, { passive: true });
    addEventListener('pointerdown', () => { cur.classList.add('swing'); }, { passive: true });
    addEventListener('pointerup', () => { cur.classList.remove('swing'); }, { passive: true });
    document.addEventListener('mouseleave', () => { cur.style.transform = 'translate(-100px, -100px)'; });
  }
})();
