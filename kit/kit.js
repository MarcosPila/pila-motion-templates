/* Pila motion kit: Lenis smooth scroll wired to GSAP, plus effects you switch on with data
   attributes. Load order: GSAP, the GSAP plugins the page uses, Lenis, art.js, then this file.
   Configure with window.KIT before loading (all optional):
     ease, dur, stagger   GSAP defaults for every kit animation
     smooth               Lenis options, or false for native scroll
     anchorOffset         px kept clear above in-page link targets (sticky header height)
     cursor               false | 'ring' | 'dot'
     spark                false | { selector, color, kind: 'lines' | 'confetti', count }
     vanta                { el, effect, options } for an animated Vanta background
   After this file runs, window.KIT also holds: reduce, fine, lenis, velocity, scrollTo(),
   burst(), vanta(), $ and $$. The README lists every data attribute. */
(() => {
  const root = document.documentElement;
  if (!window.gsap) { root.classList.remove('js'); return; }

  const C = Object.assign({ ease: 'power3.out', dur: 0.9, stagger: 0.06, smooth: { lerp: 0.1 }, anchorOffset: 80, cursor: false, spark: false, vanta: null }, window.KIT || {});
  const vantaCfg = C.vanta;
  const sysReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pref = null;
  try { pref = localStorage.getItem('kit-motion'); } catch {}
  const reduce = sysReduce || pref === 'off';
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const num = (v, d) => (v === undefined || v === '' || isNaN(+v) ? d : +v);

  const plugins = ['ScrollTrigger', 'SplitText', 'Flip', 'DrawSVGPlugin', 'MorphSVGPlugin', 'MotionPathPlugin', 'ScrambleTextPlugin', 'TextPlugin', 'Draggable', 'InertiaPlugin', 'CustomEase', 'Observer', 'ScrollToPlugin'];
  gsap.registerPlugin(...plugins.map((n) => window[n]).filter(Boolean));
  gsap.defaults({ ease: C.ease, duration: C.dur });
  const ST = window.ScrollTrigger;
  const K = (window.KIT = Object.assign(C, { reduce, sysReduce, fine, lenis: null, velocity: 0, $, $$ }));
  if (reduce) root.classList.add('kit-reduce');
  const accent = () => getComputedStyle(root).getPropertyValue('--accent').trim() || '#ff5b14';
  const run = (name, fn) => { try { fn(); } catch (e) { console.warn('[kit] ' + name, e); } };
  const trig = (el, start) => ({ trigger: el, start: start || el.dataset.start || 'top 86%', once: true });

  /* Smooth scroll ------------------------------------------------------------------- */
  run('lenis', () => {
    if (reduce || !C.smooth || !window.Lenis) return;
    const lenis = new Lenis(Object.assign({ autoRaf: false }, C.smooth));
    if (ST) lenis.on('scroll', ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    K.lenis = lenis;
  });

  K.scrollTo = (target, opts = {}) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (K.lenis) return K.lenis.scrollTo(typeof target === 'number' ? target : el, { offset: -C.anchorOffset, ...opts });
    const y = typeof target === 'number' ? target : el.getBoundingClientRect().top + scrollY - C.anchorOffset;
    scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    K.scrollTo(t);
    history.pushState(null, '', '#' + id);
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  });

  // Scroll speed in px/s, smoothed; templates read KIT.velocity for their own effects.
  let lastY = scrollY;
  gsap.ticker.add((time, dt) => {
    const y = scrollY, v = ((y - lastY) / Math.max(dt, 1)) * 1000;
    lastY = y;
    K.velocity += (v - K.velocity) * 0.12;
    if (Math.abs(K.velocity) < 0.5) K.velocity = 0;
  });

  /* Page furniture ------------------------------------------------------------------ */
  run('motion toggle', () => $$('[data-motion-toggle]').forEach((b) => {
    b.textContent = reduce ? b.dataset.offText || 'Motion: off' : b.dataset.onText || 'Motion: on';
    b.setAttribute('aria-pressed', String(!reduce));
    if (sysReduce) { b.disabled = true; b.title = 'Your device is set to reduce motion'; return; }
    b.addEventListener('click', () => { try { localStorage.setItem('kit-motion', reduce ? 'on' : 'off'); } catch {} location.reload(); });
  }));

  run('year', () => $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear())));

  run('menu', () => $$('[data-menu-toggle]').forEach((btn) => {
    const menu = document.getElementById(btn.getAttribute('aria-controls'));
    if (!menu) return;
    const set = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      root.classList.toggle('menu-open', open);
      if (open) {
        K.lenis?.stop();
        if (!reduce) gsap.fromTo($$('a, [data-menu-item]', menu), { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.5, overwrite: true });
      } else K.lenis?.start();
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); } });
    matchMedia('(min-width: 900px)').addEventListener('change', () => set(false));
  }));

  run('header', () => {
    const header = $('[data-header]');
    if (!header || !ST) return;
    let hidden = false;
    const canHide = header.hasAttribute('data-header-hide');
    header.classList.toggle('is-scrolled', scrollY > 24);
    ST.create({ start: 0, end: 'max', onUpdate(self) {
      header.classList.toggle('is-scrolled', self.scroll() > 24);
      const hide = canHide && self.direction === 1 && self.scroll() > 320 && !root.classList.contains('menu-open') && !header.contains(document.activeElement);
      if (hide !== hidden) { hidden = hide; gsap.to(header, { yPercent: hide ? -110 : 0, duration: 0.45, ease: 'power2.out', overwrite: true }); }
    } });
  });

  run('progress', () => $$('[data-progress]').forEach((bar) => ST && gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } })));

  /* Reveals -------------------------------------------------------------------------- */
  const FROM = {
    up: { y: 48, autoAlpha: 0 }, down: { y: -48, autoAlpha: 0 }, left: { x: -70, autoAlpha: 0 }, right: { x: 70, autoAlpha: 0 },
    fade: { autoAlpha: 0 }, scale: { scale: 0.86, autoAlpha: 0 }, pop: { scale: 0.4, autoAlpha: 0, ease: 'back.out(2.2)' },
    blur: { y: 24, autoAlpha: 0, filter: 'blur(14px)' }, skew: { y: 90, skewY: 7, autoAlpha: 0 },
    tilt: { rotationX: -70, y: 40, autoAlpha: 0, transformPerspective: 900, transformOrigin: '50% 0%' },
    clip: { clipPath: 'inset(100% 0% 0% 0%)' }, wipe: { clipPath: 'inset(0% 100% 0% 0%)' }, iris: { clipPath: 'circle(0% at 50% 50%)' },
    zoom: { clipPath: 'inset(14% 14% 14% 14%)', scale: 1.18 },
  };
  const CLIP_TO = { clip: 'inset(0% 0% 0% 0%)', wipe: 'inset(0% 0% 0% 0%)', iris: 'circle(75% at 50% 50%)', zoom: 'inset(0% 0% 0% 0%)' };
  const BASE = { y: 0, x: 0, autoAlpha: 1, scale: 1, filter: 'blur(0px)', rotationX: 0, skewY: 0 };
  const fromVars = (k) => { const f = { ...(FROM[k] || FROM.up) }; delete f.ease; return f; };
  const toVars = (k, extra) => {
    const f = FROM[k] || FROM.up, t = {};
    for (const p in f) if (!['ease', 'transformPerspective', 'transformOrigin'].includes(p)) t[p] = p === 'clipPath' ? CLIP_TO[k] : BASE[p];
    if (f.ease) t.ease = f.ease;
    return Object.assign(t, extra);
  };
  K.reveal = (targets, kind = 'up', vars = {}) => gsap.fromTo(targets, fromVars(kind), toVars(kind, vars));

  run('reveal', () => {
    if (reduce) return;
    $$('[data-reveal]').forEach((el) => {
      const k = el.dataset.reveal || 'up';
      K.reveal(el, k, { delay: num(el.dataset.delay, 0), duration: num(el.dataset.dur, C.dur), scrollTrigger: el.hasAttribute('data-now') ? undefined : trig(el) });
    });
    $$('[data-reveal-group]').forEach((g) => {
      const k = g.dataset.revealGroup || 'up';
      K.reveal([...g.children], k, { stagger: num(g.dataset.stagger, C.stagger * 1.6), delay: num(g.dataset.delay, 0), duration: num(g.dataset.dur, C.dur), scrollTrigger: g.hasAttribute('data-now') ? undefined : trig(g) });
    });
  });

  const SPLIT = {
    up: { yPercent: 115 }, rotate: { yPercent: 110, rotate: 9, transformOrigin: '0% 100%' },
    fade: { autoAlpha: 0 }, blur: { autoAlpha: 0, filter: 'blur(12px)', y: 14 },
    wave: { y: 40, autoAlpha: 0, ease: 'back.out(3)' }, scale: { scale: 0, autoAlpha: 0, ease: 'back.out(2.4)' },
    drop: { y: -110, autoAlpha: 0, rotate: () => gsap.utils.random(-35, 35), ease: 'bounce.out' },
    flip: { rotationX: -100, autoAlpha: 0, transformOrigin: '50% 50% -30px', transformPerspective: 600 },
    slide: { xPercent: (i) => (i % 2 ? 40 : -40), autoAlpha: 0 },
  };
  run('split', () => {
    if (reduce || !window.SplitText) return;
    $$('[data-split]').forEach((el) => {
      const unit = ['chars', 'lines'].includes(el.dataset.split) ? el.dataset.split : 'words';
      const anim = SPLIT[el.dataset.splitAnim] ? el.dataset.splitAnim : 'up';
      const masked = anim === 'up' || anim === 'rotate';
      const each = { chars: 0.028, words: 0.07, lines: 0.12 }[unit] * (C.stagger / 0.06);
      SplitText.create(el, {
        type: unit === 'chars' ? 'words,chars' : unit === 'lines' ? 'lines' : 'words',
        mask: masked ? unit : undefined,
        autoSplit: unit === 'lines',
        onSplit(self) {
          const v = { ...SPLIT[anim] }, ease = v.ease;
          delete v.ease;
          return gsap.from(self[unit], { ...v, ease: ease || C.ease, duration: num(el.dataset.dur, C.dur), stagger: num(el.dataset.stagger, each), delay: num(el.dataset.delay, 0), scrollTrigger: el.hasAttribute('data-now') ? undefined : trig(el, 'top 88%') });
        },
      });
    });
  });

  /* Numbers and text ----------------------------------------------------------------- */
  run('count', () => $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count), dec = num(el.dataset.decimals, 0), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const fmt = (v) => pre + v.toLocaleString('en-CA', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
    el.textContent = fmt(end);
    if (reduce) return;
    const o = { v: num(el.dataset.from, 0) };
    el.textContent = fmt(o.v);
    gsap.to(o, { v: end, duration: num(el.dataset.dur, 2), ease: 'power2.out', scrollTrigger: trig(el, 'top 92%'), onUpdate: () => (el.textContent = fmt(o.v)) });
  }));

  run('scramble', () => {
    if (reduce || !window.ScrambleTextPlugin) return;
    $$('[data-scramble]').forEach((el) => {
      const text = el.textContent.trim(), mode = el.dataset.scramble || 'in';
      const go = () => gsap.to(el, { duration: num(el.dataset.dur, 1), scrambleText: { text, chars: el.dataset.scrambleChars || 'upperCase', speed: 0.6, revealDelay: 0.15 }, overwrite: true });
      if (mode.includes('in') && ST) ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: go });
      if (mode.includes('hover')) (el.closest('a, button, [data-scramble-host]') || el).addEventListener('pointerenter', go);
    });
  });

  run('rotate words', () => $$('[data-rotate]').forEach((el) => {
    const words = el.dataset.rotate.split('|').map((w) => w.trim());
    el.insertAdjacentHTML('afterend', `<span class="sr-only">${words.join(', ')}</span>`);
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = words.map((w) => `<span class="rw">${w}</span>`).join('');
    const spans = $$('.rw', el);
    gsap.set(spans.slice(1), { yPercent: 110, autoAlpha: 0 });
    const fit = () => gsap.set(el, { width: spans[i].offsetWidth });
    let i = 0;
    fit();
    document.fonts?.ready.then(fit);
    addEventListener('resize', fit);
    if (reduce) return;
    const every = num(el.dataset.rotateEvery, 2.6);
    const step = () => {
      const cur = spans[i];
      i = (i + 1) % spans.length;
      const nxt = spans[i];
      gsap.timeline()
        .to(cur, { yPercent: -110, autoAlpha: 0, duration: 0.5, ease: 'power3.in' })
        .fromTo(nxt, { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'back.out(1.6)' }, '-=0.1')
        .to(el, { width: nxt.offsetWidth, duration: 0.55, ease: 'power3.inOut' }, '<');
      gsap.delayedCall(every, step);
    };
    gsap.delayedCall(every, step);
  }));

  run('draw', () => {
    if (!window.DrawSVGPlugin) return;
    const SHAPES = 'path, line, polyline, polygon, circle, rect, ellipse';
    $$('[data-draw]').forEach((el) => {
      const shapes = (el.matches(SHAPES) ? [el] : $$(SHAPES, el)).filter((s) => getComputedStyle(s).stroke !== 'none');
      if (reduce || !shapes.length) return;
      const trigger = el.closest('[data-draw-trigger]') || el;
      if ((el.dataset.draw || 'in') === 'scroll') {
        gsap.fromTo(shapes, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', stagger: num(el.dataset.stagger, 0), scrollTrigger: { trigger, start: el.dataset.start || 'top 80%', end: el.dataset.end || 'bottom 45%', scrub: 0.6 } });
      } else {
        gsap.fromTo(shapes, { drawSVG: '0%' }, { drawSVG: '100%', duration: num(el.dataset.dur, 1.6), ease: 'power2.inOut', stagger: num(el.dataset.stagger, 0.12), delay: num(el.dataset.delay, 0), scrollTrigger: el.hasAttribute('data-now') ? undefined : trig(trigger, 'top 85%') });
      }
    });
  });

  /* Pointer effects -------------------------------------------------------------------- */
  run('magnet', () => {
    if (!fine || reduce) return;
    $$('[data-magnet]').forEach((el) => {
      const s = num(el.dataset.magnet, 0.35);
      const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, .45)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, .45)' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * s); yTo((e.clientY - r.top - r.height / 2) * s); });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  });

  run('tilt', () => {
    if (!fine || reduce) return;
    $$('[data-tilt]').forEach((el) => {
      const max = num(el.dataset.tilt, 10);
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      const glare = el.hasAttribute('data-glare') ? el.appendChild(Object.assign(document.createElement('span'), { className: 'kit-glare' })) : null;
      gsap.set(el, { transformPerspective: 900 });
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        rx((0.5 - py) * max); ry((px - 0.5) * max);
        if (glare) { glare.style.setProperty('--gx', px * 100 + '%'); glare.style.setProperty('--gy', py * 100 + '%'); }
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  });

  run('spotlight', () => $$('[data-spotlight]').forEach((el) => el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px');
    el.style.setProperty('--my', e.clientY - r.top + 'px');
  })));

  run('cursor', () => {
    if (!fine || reduce || !C.cursor) return;
    const cur = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'kit-cursor ' + (C.cursor === 'dot' ? 'dot' : 'ring'), innerHTML: '<b></b>' }));
    cur.setAttribute('aria-hidden', 'true');
    const lab = cur.firstChild, d = C.cursor === 'dot' ? 0.12 : 0.4;
    const xTo = gsap.quickTo(cur, 'x', { duration: d, ease: 'power3.out' }), yTo = gsap.quickTo(cur, 'y', { duration: d, ease: 'power3.out' });
    gsap.set(cur, { x: -100, y: -100 });
    addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor], a, button, input, select, textarea, summary, label');
      const label = t?.dataset.cursor || '';
      cur.classList.toggle('is-hover', !!t && !label);
      cur.classList.toggle('is-label', !!label);
      lab.textContent = label;
    });
    root.addEventListener('pointerleave', () => gsap.to(cur, { autoAlpha: 0, duration: 0.2 }));
    root.addEventListener('pointerenter', () => gsap.to(cur, { autoAlpha: 1, duration: 0.2 }));
  });

  // Click sparks: KIT.burst(x, y, { color, kind, count, size }) from anywhere
  let sparkCv, sparkCtx, sparks = [];
  const drawSparks = () => {
    const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    if (sparkCv.width !== w * dpr || sparkCv.height !== h * dpr) { sparkCv.width = w * dpr; sparkCv.height = h * dpr; }
    sparkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sparkCtx.clearRect(0, 0, w, h);
    const now = performance.now();
    sparks = sparks.filter((s) => now - s.t0 < s.life);
    for (const s of sparks) {
      const p = (now - s.t0) / s.life, e = 1 - Math.pow(1 - p, 3);
      sparkCtx.strokeStyle = sparkCtx.fillStyle = s.color;
      sparkCtx.globalAlpha = 1 - p;
      if (s.kind === 'confetti') {
        const x = s.x + Math.cos(s.a) * s.v * e * 120, y = s.y + Math.sin(s.a) * s.v * e * 120 + p * p * 160;
        sparkCtx.save(); sparkCtx.translate(x, y); sparkCtx.rotate(s.a + p * 12); sparkCtx.fillRect(-4, -2.5, 8, 5); sparkCtx.restore();
      } else {
        const r1 = e * s.size * 1.6, r2 = r1 + s.size * (1 - e);
        sparkCtx.lineWidth = 2; sparkCtx.lineCap = 'round';
        sparkCtx.beginPath(); sparkCtx.moveTo(s.x + Math.cos(s.a) * r1, s.y + Math.sin(s.a) * r1); sparkCtx.lineTo(s.x + Math.cos(s.a) * r2, s.y + Math.sin(s.a) * r2); sparkCtx.stroke();
      }
    }
    sparkCtx.globalAlpha = 1;
    if (!sparks.length) { gsap.ticker.remove(drawSparks); sparkCtx.clearRect(0, 0, w, h); }
  };
  K.burst = (x, y, o = {}) => {
    if (reduce) return;
    if (!sparkCv) {
      sparkCv = document.body.appendChild(Object.assign(document.createElement('canvas'), { className: 'kit-sparks' }));
      sparkCv.setAttribute('aria-hidden', 'true');
      sparkCtx = sparkCv.getContext('2d');
    }
    const n = o.count || (o.kind === 'confetti' ? 28 : 10), t0 = performance.now(), colors = [].concat(o.color || accent());
    if (!sparks.length) gsap.ticker.add(drawSparks);
    for (let i = 0; i < n; i++) sparks.push({ x, y, t0, a: (i / n) * Math.PI * 2 + Math.random() * 0.4, v: 0.5 + Math.random() * 0.8, life: o.kind === 'confetti' ? 1100 : 480, size: o.size || 16, kind: o.kind || 'lines', color: colors[i % colors.length] });
  };
  run('spark', () => {
    if (!C.spark) return;
    const o = C.spark === true ? {} : C.spark;
    document.addEventListener('pointerdown', (e) => { if (e.target.closest(o.selector || 'a, button, [data-spark]')) K.burst(e.clientX, e.clientY, o); });
  });

  run('trail', () => {
    if (!fine || reduce) return;
    $$('[data-trail]').forEach((box) => {
      const src = $$('.trail-items > *', box);
      if (!src.length) return;
      const layer = box.insertBefore(Object.assign(document.createElement('div'), { className: 'trail-layer' }), box.firstChild);
      layer.setAttribute('aria-hidden', 'true');
      Object.assign(layer.style, { position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none', zIndex: '0' });
      const gap = num(box.dataset.trail, 90);
      let i = 0, lx = -999, ly = -999;
      box.addEventListener('pointermove', (e) => {
        const r = box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        if (Math.hypot(x - lx, y - ly) < gap) return;
        lx = x; ly = y;
        const s = src[i++ % src.length];
        let t;
        if (s.hasAttribute('data-art') && window.ART) { t = s.cloneNode(false); delete t.dataset.artDone; window.ART.render(t); } else t = s.cloneNode(true);
        t.classList.add('trail-tile');
        t.style.left = x + 'px'; t.style.top = y + 'px';
        layer.appendChild(t);
        gsap.timeline({ onComplete: () => t.remove() })
          .fromTo(t, { scale: 0.3, autoAlpha: 0, rotate: gsap.utils.random(-14, 14) }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'power3.out' })
          .to(t, { scale: 0.2, autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, '+=0.5');
      });
    });
  });

  run('peek', () => {
    if (!fine || reduce) return;
    $$('[data-peek-list]').forEach((list) => {
      const peek = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'kit-peek' }));
      peek.setAttribute('aria-hidden', 'true');
      gsap.set(peek, { scale: 0.6 });
      const xTo = gsap.quickTo(peek, 'x', { duration: 0.55, ease: 'power3.out' }), yTo = gsap.quickTo(peek, 'y', { duration: 0.55, ease: 'power3.out' });
      let on = false, lastX = 0;
      list.addEventListener('pointermove', (e) => {
        if (!on) gsap.set(peek, { x: e.clientX, y: e.clientY });
        xTo(e.clientX); yTo(e.clientY);
        gsap.to(peek, { rotate: gsap.utils.clamp(-10, 10, (e.clientX - lastX) * 0.6), duration: 0.5, overwrite: 'auto' });
        lastX = e.clientX;
      });
      $$('[data-peek]', list).forEach((row) => row.addEventListener('pointerenter', () => {
        const layer = document.createElement('div');
        layer.innerHTML = row.dataset.peekImg ? `<img src="${row.dataset.peekImg}" alt="" style="width:100%;height:100%;object-fit:cover">` : window.ART ? window.ART.svg(row.dataset.peek, row.dataset.peekPalette?.split(','), num(row.dataset.peekSeed, 1)) : '';
        peek.appendChild(layer);
        gsap.fromTo(layer, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power3.out', onComplete: () => { while (peek.children.length > 1) peek.firstChild.remove(); } });
        if (!on) { on = true; gsap.to(peek, { autoAlpha: 1, scale: 1, duration: 0.4, overwrite: 'auto' }); }
      }));
      list.addEventListener('pointerleave', () => { on = false; gsap.to(peek, { autoAlpha: 0, scale: 0.6, duration: 0.35 }); });
    });
  });

  /* Scroll-driven blocks ------------------------------------------------------------ */
  run('parallax', () => {
    if (reduce) return;
    $$('[data-parallax]').forEach((el) => {
      const p = num(el.dataset.parallax, 0.2);
      gsap.fromTo(el, { y: () => -p * innerHeight * 0.5 }, { y: () => p * innerHeight * 0.5, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    });
  });

  run('hscroll', () => {
    if (reduce || !ST) return;
    $$('[data-hscroll]').forEach((sec) => {
      const track = $('.hs-track', sec);
      if (!track) return;
      const pinEl = sec.closest('[data-hscroll-pin]') || sec;
      const bar = $('[data-hs-bar]', pinEl);
      const dist = () => Math.max(0, track.scrollWidth - sec.clientWidth);
      sec._hs = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: {
        trigger: pinEl, start: pinEl.dataset.pinStart || 'top top', end: () => '+=' + dist(), pin: true, scrub: num(sec.dataset.scrub, 0.8), invalidateOnRefresh: true,
        onUpdate: bar ? (self) => gsap.set(bar, { scaleX: self.progress }) : undefined,
      } });
    });
  });

  run('stack', () => $$('[data-stack]').forEach((box) => {
    const cards = $$('.stack-card', box);
    cards.forEach((c, i) => c.style.setProperty('--i', i));
    if (reduce) return;
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (next) gsap.fromTo(c, { scale: 1, filter: 'brightness(1)' }, { scale: 1 - (cards.length - i) * 0.035, filter: 'brightness(.82)', ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 30%', scrub: true } });
    });
  }));

  run('marquee', () => $$('[data-marquee]').forEach((el) => {
    const track = $('.mq-track', el);
    if (!track) return;
    const items = [...track.children];
    for (let n = 0; track.scrollWidth < el.clientWidth + 200 && n < 20; n++) items.forEach((it) => { const c = it.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    const twin = track.cloneNode(true);
    twin.setAttribute('aria-hidden', 'true');
    $$('a, button', twin).forEach((a) => (a.tabIndex = -1));
    el.appendChild(twin);
    if (reduce) return;
    const right = el.dataset.marqueeDir === 'right';
    const speed = num(el.dataset.marqueeSpeed, 60);
    const tl = gsap.fromTo([track, twin], { xPercent: right ? -100 : 0 }, { xPercent: right ? 0 : -100, ease: 'none', duration: track.scrollWidth / speed, repeat: -1 });
    let hover = 1;
    if (el.hasAttribute('data-marquee-pause')) { el.addEventListener('pointerenter', () => (hover = 0.15)); el.addEventListener('pointerleave', () => (hover = 1)); }
    const vel = el.hasAttribute('data-marquee-velocity'), skew = el.hasAttribute('data-marquee-skew');
    const setSkew = skew ? gsap.quickSetter([track, twin], 'skewX', 'deg') : null;
    gsap.ticker.add(() => {
      const v = K.velocity;
      const target = (vel ? (v < 0 && el.hasAttribute('data-marquee-flip') ? -1 : 1) * (1 + Math.min(Math.abs(v) / 280, 6)) : 1) * hover;
      tl.timeScale(gsap.utils.interpolate(tl.timeScale(), target, 0.1));
      if (setSkew) setSkew(gsap.utils.clamp(-14, 14, -v / 140));
    });
    new IntersectionObserver(([e]) => tl.paused(!e.isIntersecting)).observe(el);
  }));

  run('circle text', () => $$('[data-circle-text]').forEach((el) => {
    const id = 'ct' + Math.random().toString(36).slice(2, 8);
    const txt = el.dataset.circleText.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    el.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 200 200" aria-hidden="true"><defs><path id="${id}" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs><text><textPath href="#${id}" textLength="488" lengthAdjust="spacing">${txt}</textPath></text></svg>`);
    if (reduce) return;
    const svg = el.firstElementChild;
    const spin = gsap.to(svg, { rotation: 360, duration: num(el.dataset.circleSpeed, 16), repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
    if (el.hasAttribute('data-circle-scroll')) gsap.ticker.add(() => spin.timeScale(gsap.utils.interpolate(spin.timeScale(), 1 + Math.min(Math.abs(K.velocity) / 120, 10) * Math.sign(K.velocity || 1), 0.1)));
  }));

  /* Interactive blocks ---------------------------------------------------------------- */
  run('filter', () => $$('[data-filter]').forEach((box) => {
    const btns = $$('[data-filter-btn]', box), items = $$('[data-tags]', box), status = $('[data-filter-status]', box);
    btns.forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filterBtn;
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const state = window.Flip ? Flip.getState(items) : null;
      let n = 0;
      items.forEach((it) => { const on = f === 'all' || it.dataset.tags.split(' ').includes(f); it.style.display = on ? '' : 'none'; n += on; });
      if (status) status.textContent = `Showing ${n} of ${items.length}`;
      if (!state || reduce) return ST?.refresh();
      Flip.from(state, {
        duration: 0.7, ease: 'power3.inOut', scale: true, absolute: true, stagger: 0.02,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, delay: 0.15 }),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.6, duration: 0.4 }),
        onComplete: () => ST?.refresh(),
      });
    }));
  }));

  run('compare', () => $$('[data-compare]').forEach((box) => {
    const range = $('input[type="range"]', box);
    if (!range) return;
    const set = (v) => { box.style.setProperty('--pos', v + '%'); range.value = v; };
    range.addEventListener('input', () => set(+range.value));
    set(+range.value || 50);
    if (reduce) return;
    const o = { v: 50 };
    gsap.timeline({ scrollTrigger: trig(box, 'top 70%') })
      .to(o, { v: 18, duration: 0.9, ease: 'power2.inOut', onUpdate: () => set(o.v) })
      .to(o, { v: 50, duration: 1.2, ease: 'elastic.out(1, .5)', onUpdate: () => set(o.v) });
  }));

  run('carousel', () => {
    if (!window.Draggable) return;
    $$('[data-carousel]').forEach((box) => {
      const track = $('.car-track', box);
      if (!track) return;
      box.classList.add('is-drag');
      box.scrollLeft = 0;
      const cards = [...track.children];
      const minX = () => Math.min(0, box.clientWidth - track.scrollWidth);
      const stops = () => [...new Set(cards.map((c) => Math.max(-c.offsetLeft, minX())))];
      const drag = Draggable.create(track, {
        type: 'x', bounds: { minX: minX(), maxX: 0 }, inertia: !!window.InertiaPlugin, edgeResistance: 0.85, dragClickables: true, zIndexBoost: false,
        snap: { x: (v) => gsap.utils.snap(stops(), v) },
      })[0];
      const go = (dir) => {
        const xs = stops(), x = gsap.getProperty(track, 'x');
        let i = xs.reduce((best, s, n) => (Math.abs(s - x) < Math.abs(xs[best] - x) ? n : best), 0);
        i = gsap.utils.clamp(0, xs.length - 1, i + dir);
        gsap.to(track, { x: xs[i], duration: reduce ? 0 : 0.7, ease: 'power3.out', onComplete: () => drag.update() });
      };
      const wrap = box.closest('[data-carousel-wrap]') || box.parentElement;
      $$('[data-car-prev]', wrap).forEach((b) => b.addEventListener('click', () => go(-1)));
      $$('[data-car-next]', wrap).forEach((b) => b.addEventListener('click', () => go(1)));
      track.addEventListener('focusin', (e) => {
        const card = cards.find((c) => c.contains(e.target));
        box.scrollLeft = 0;
        if (card) gsap.to(track, { x: Math.max(-card.offsetLeft, minX()), duration: reduce ? 0 : 0.5, onComplete: () => drag.update() });
      });
      addEventListener('resize', () => { drag.applyBounds({ minX: minX(), maxX: 0 }); });
    });
  });

  run('accordion', () => $$('[data-accordion] details').forEach((d) => {
    const sum = $('summary', d), body = $('.acc-body', d);
    d.classList.toggle('is-open', d.open);
    d.addEventListener('toggle', () => d.classList.toggle('is-open', d.open));
    if (!sum || !body || reduce) return;
    sum.addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) {
        d.classList.remove('is-open');
        gsap.to(body, { height: 0, duration: 0.4, ease: 'power2.inOut', overwrite: true, onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'height' }); ST?.refresh(); } });
      } else {
        d.open = true;
        gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: 0.5, ease: 'power2.out', overwrite: true, onComplete: () => ST?.refresh() });
      }
    });
  }));

  run('steps', () => $$('[data-steps]').forEach((form) => {
    const steps = $$('[data-step]', form), bar = $('[data-steps-bar]', form), count = $('[data-steps-count]', form);
    const done = (form.dataset.steps && document.getElementById(form.dataset.steps)) || form.parentElement.querySelector('[data-steps-done]');
    form.noValidate = true;
    let i = 0;
    const update = () => { bar?.style.setProperty('--p', (i + 1) / steps.length); if (count) count.textContent = `Step ${i + 1} of ${steps.length}`; };
    const valid = (s) => { const bad = $$('input, select, textarea', s).find((f) => !f.checkValidity()); if (bad) { bad.reportValidity(); bad.focus(); return false; } return true; };
    const show = (n, dir) => {
      const cur = steps[i], nxt = steps[n];
      const swap = () => {
        cur.hidden = true; nxt.hidden = false; i = n; update();
        $('input, select, textarea, button', nxt)?.focus({ preventScroll: true });
        if (!reduce) gsap.fromTo(nxt, { x: 40 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' });
        ST?.refresh();
      };
      if (reduce) swap(); else gsap.to(cur, { x: -40 * dir, autoAlpha: 0, duration: 0.25, ease: 'power2.in', onComplete: swap });
    };
    steps.forEach((s, n) => (s.hidden = n !== 0));
    update();
    form.addEventListener('click', (e) => {
      if (e.target.closest('[data-next]')) { e.preventDefault(); if (valid(steps[i]) && i < steps.length - 1) show(i + 1, 1); }
      if (e.target.closest('[data-back]')) { e.preventDefault(); if (i > 0) show(i - 1, -1); }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!valid(steps[i])) return;
      if (i < steps.length - 1) return show(i + 1, 1);
      if (!done) return;
      form.hidden = true;
      done.hidden = false;
      done.setAttribute('tabindex', '-1');
      done.focus({ preventScroll: true });
      // Next frame, so a page's own submit handler can fill the panel first.
      if (!reduce) requestAnimationFrame(() => {
        if (done.children.length) gsap.from(done.children, { y: 30, autoAlpha: 0, stagger: 0.08 });
        const r = done.getBoundingClientRect();
        K.burst(r.left + r.width / 2, r.top + 40, { kind: 'confetti', color: [accent(), '#ffd166', '#06d6a0', '#118ab2', '#ef476f'] });
      });
      ST?.refresh();
    });
  }));

  /* Vanta backgrounds: loaded only after the page is ready, only while on screen, never
     with reduced motion, save-data, or no WebGL. The host's own background shows otherwise. */
  const loaded = {};
  const load = (src) => loaded[src] || (loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }));
  const SRC = { three: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js', p5: 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.1.9/p5.min.js', fx: (n) => `https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.${n}.min.js` };
  K.vanta = (host, effect, opts = {}) => {
    const el = typeof host === 'string' ? $(host) : host;
    if (!el || reduce || navigator.connection?.saveData) return null;
    const name = effect.toLowerCase(), usesP5 = name === 'topology' || name === 'trunk';
    if (!usesP5) { const c = document.createElement('canvas'); if (!(c.getContext('webgl') || c.getContext('experimental-webgl'))) return null; }
    let fx = null, want = false, loading = null;
    const start = async () => {
      want = true;
      if (fx) return;
      loading ||= load(usesP5 ? SRC.p5 : SRC.three).then(() => load(SRC.fx(name)));
      try { await loading; } catch { return; }
      if (!want || fx || !window.VANTA) return;
      fx = window.VANTA[effect.toUpperCase()](Object.assign({ el, mouseControls: true, touchControls: true, gyroControls: false, minHeight: 200, minWidth: 200, scale: 1, scaleMobile: 1 }, opts));
      el.classList.add('vanta-on');
    };
    const stop = () => { want = false; if (fx) { fx.destroy(); fx = null; el.classList.remove('vanta-on'); } };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '120px' });
    const begin = () => setTimeout(() => io.observe(el), 250);
    document.readyState === 'complete' ? begin() : addEventListener('load', begin, { once: true });
    return { start, stop, get effect() { return fx; } };
  };
  if (vantaCfg) run('vanta', () => (K.vantaFx = K.vanta(vantaCfg.el, vantaCfg.effect, vantaCfg.options)));

  /* Done ----------------------------------------------------------------------------- */
  if (ST) {
    // Page scripts run after this file and may pin sections above the kit's own pins, so
    // re-sort every trigger by page position before measuring again.
    const resort = () => { ST.sort(); ST.refresh(); };
    document.fonts?.ready.then(resort);
    addEventListener('load', resort, { once: true });
  }
  root.classList.add('kit-ready');
})();
