/* Plug & Show: shows a template with a visitor's own business details in it.
 *
 * The form at pilawebco.ca/work/try collects the details, then opens a template:
 *   - templates on GitHub Pages get them in the address after the # sign
 *     (#plug=<base64url JSON>). Browsers never send that part to a server, and
 *     this script clears it from the address bar straight away.
 *   - the static samples on pilawebco.ca itself are opened with ?plug and read
 *     the details from localStorage ('pila-plug'), where the form saved them.
 * The details are then kept in sessionStorage for this tab only, so a static
 * sample keeps them from page to page. Opened any other way, a template shows
 * its made-up sample business as usual.
 *
 * A template describes its sample business before loading this file:
 *   <script type="application/json" id="plug-sample">{
 *     "template": "motion-gym",            id on pilawebco.ca (for the links back)
 *     "label": "Gym",                      the template's name in the preview bar
 *     "name": ["Ironclad Fitness", "Ironclad"],   every way the sample name is written
 *     "owner": ["Rachel Okafor", "Rachel"],       full name, then first name
 *     "phone": "(905) 555-0142", "email": "hi@x.example", "site": "x.example",
 *     "city": ["Calgary"], "address": ["Dundas St E"],
 *     "phrases": [["Hamilton & Burlington", "{city}"]],   exact rewrites, see fill()
 *     "color": { "accent": ["--accent"], "text": ["--on-accent"], "link": ["--link"], "bg": "--bg" },
 *     "hoursLine": "Mon–Sat, 7 am – 7 pm", the sample's hours, for {hours} in phrases
 *     "labelTag": "b",                     label element for rows added to its contact list
 *     "bar": "right",                      put the floating bar bottom right
 *     "css": "…"                           small style fixes for this template
 *   }</script>
 * Every sample value is swapped wherever it appears as text, in alt, title,
 * aria-label, data-* and meta attributes, and in tel: and mailto: links. Spots
 * that need more than a swap are marked in the markup:
 *   data-plug="brand"       the logo link. Holds an optional data-plug="mark" (the
 *                           icon, replaced by an uploaded logo) and data-plug="name".
 *   data-plug="name|owner|phone|email|site|city|address"   text set outright
 *   data-plug="hours"       a list of opening hours: rows are rebuilt from its first
 *                           row, using [data-plug-days] and [data-plug-time] inside it
 *                           (or a <dl> of dt/dd pairs). In a list that also holds other
 *                           things, mark the hour rows data-plug-row; with
 *                           data-plug-lines the rows are lines split by <br>.
 *   data-plug="hours-line"  hours on one line
 *   data-plug="contact"     where any detail the template has no place for is listed
 *                           (data-plug-title="Get in touch" adds a heading). On a <ul>
 *                           the details join that list as rows of their own.
 *   data-plug-text="…"      text to show instead, with {fields} filled in
 *   data-plug-hide="hours"  hidden when that detail was given (e.g. an "open now"
 *                           badge worked out from the sample's hours)
 * A 3D scene's window.SCENES strings are swapped too, before the engine reads them;
 * the engine then calls PLUG.slots() on the page it draws.
 */
(function () {
  'use strict';
  const KEY = 'pila-plug';
  const SESSION = 'pila-plug-on';
  const FOLD = 'pila-plug-fold';
  // Where "Edit details" and "Start with this template" may lead.
  const HOME = /^https:\/\/([a-z0-9-]+\.)?pilawebco\.ca$|^http:\/\/(localhost|127\.0\.0\.1)(:\d{2,5})?$/;

  let META;
  try {
    META = JSON.parse(document.getElementById('plug-sample').textContent);
  } catch (e) {
    return;
  }
  const D = load();
  if (!D) return;

  /* ------------------------------------------------------------ the details */

  function decode(s) {
    try {
      const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    } catch (e) {
      return null;
    }
  }

  function load() {
    let raw = null;
    let asked = false;
    const hash = location.hash.match(/^#plug=([A-Za-z0-9_-]+)$/);
    const url = new URL(location.href);
    if (hash) {
      asked = true;
      raw = decode(hash[1]);
    } else if (url.searchParams.has('plug')) {
      asked = true;
      try {
        raw = JSON.parse(localStorage.getItem(KEY));
        if (raw) raw.ret = location.origin;
      } catch (e) {}
    }
    if (asked) {
      url.hash = '';
      url.searchParams.delete('plug');
      history.replaceState(history.state, '', url.pathname + url.search);
      const d = raw && clean(raw);
      if (d) {
        try {
          sessionStorage.setItem(SESSION, JSON.stringify({ ...d, t: META.template }));
        } catch (e) {}
      }
      return d;
    }
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION));
      if (s && s.t === META.template) return clean(s);
    } catch (e) {}
    return null;
  }

  function clean(raw) {
    const str = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n) : '');
    const d = {
      name: str(raw.name, 80),
      owner: str(raw.owner, 80),
      phone: str(raw.phone, 40),
      email: str(raw.email, 120),
      site: str(raw.site, 120).replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase(),
      address: str(raw.address, 120),
      city: str(raw.city, 80),
      hours: (Array.isArray(raw.hours) ? raw.hours : [])
        .slice(0, 7)
        .map((r) => (Array.isArray(r) ? [str(r[0], 40), str(r[1], 60)] : null))
        .filter((r) => r && (r[0] || r[1])),
      logo: typeof raw.logo === 'string' && raw.logo.length < 250000 && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(raw.logo) ? raw.logo : '',
      logoName: raw.logoName !== false,
      // How light the logo is (0 black … 1 white), measured when it was picked.
      logoTone: typeof raw.logoTone === 'number' && raw.logoTone >= 0 && raw.logoTone <= 1 ? raw.logoTone : null,
      color: typeof raw.color === 'string' && /^#[0-9a-f]{6}$/i.test(raw.color) ? raw.color.toLowerCase() : '',
      ret: typeof raw.ret === 'string' && (raw.ret === location.origin || HOME.test(raw.ret)) ? raw.ret : '',
    };
    if (!d.name) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) d.email = '';
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/.test(d.site)) d.site = '';
    // An address on their own domain reads better than the sample's.
    if (!d.email && d.site) d.email = `${META.emailUser || 'hello'}@${d.site.split('/')[0]}`;
    d.digits = d.phone.replace(/\D/g, '');
    if (d.digits.length === 11 && d.digits[0] === '1') d.digits = d.digits.slice(1);
    if (d.digits.length < 7) d.phone = d.digits = '';
    return d;
  }

  /* ------------------------------------------------------- what goes where */

  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []).filter((s) => typeof s === 'string' && s);
  const first = (s) => s.split(' ')[0];
  const placed = new Set();

  // The sample's phone layout with their digits: "(905) 555-0142" → "(519) 555-0199".
  function phoneShown() {
    const sample = list(META.phone)[0] || '';
    if (D.digits.length !== 10 || sample.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '').length !== 10) return D.phone;
    let i = 0;
    const body = sample.replace(/^\+?1[\s.-]?(?=\(?\d{3})/, '');
    return body.replace(/\d/g, () => D.digits[i++]);
  }
  const PHONE = D.phone ? phoneShown() : '';
  const tel = () => (D.digits.length === 10 ? `+1${D.digits}` : D.digits);

  const hoursLine = () => D.hours.map((r) => r.filter(Boolean).join(' ')).join(' · ');
  const VALUES = {
    name: D.name,
    owner: D.owner,
    first: D.owner && first(D.owner),
    phone: PHONE,
    email: D.email,
    site: D.site,
    address: D.address,
    city: D.city,
    hours: D.hours.length ? hoursLine() : '',
  };
  const SAMPLE = {
    name: list(META.name)[0],
    owner: list(META.owner)[0],
    first: list(META.owner)[0] && first(list(META.owner)[0]),
    phone: list(META.phone)[0],
    email: META.email,
    site: META.site,
    address: list(META.address)[0],
    city: list(META.city)[0],
    hours: META.hoursLine,
  };

  // "{address?}, {city}": a field they left blank keeps the sample's value, or
  // drops out when it ends in ?. Commas and dots left dangling are tidied away.
  function fill(tpl, used) {
    let mine = false;
    const out = tpl.replace(/\{(\w+)(\?)?\}/g, (m, k, opt) => {
      if (VALUES[k]) {
        mine = true;
        if (used) used.add(k === 'first' ? 'owner' : k);
        return VALUES[k];
      }
      return opt ? '' : SAMPLE[k] || '';
    });
    if (!mine) return null;
    return out
      .replace(/(\s*[,·]\s*)+([,·])/g, '$2')
      .replace(/^\s*[,·]\s*|\s*[,·]\s*$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  const lit = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const word = (s) =>
    (/^[\p{L}\p{N}]/u.test(s) ? '(?<![\\p{L}\\p{N}])' : '') + lit(s) + (/[\p{L}\p{N}]$/u.test(s) ? '(?![\\p{L}\\p{N}])' : '');

  const swaps = [];
  const add = (sample, to, key, re) => {
    if (!sample || !to || sample === to) return;
    // A sample written in capitals (a sign, a giant headline word) stays in capitals.
    if (!re && sample.length > 2 && /\p{Lu}/u.test(sample) && sample === sample.toUpperCase()) to = to.toUpperCase();
    swaps.push({ re: re || word(sample), to, key, len: sample.length });
  };
  for (const [s, tpl] of META.phrases || []) {
    const used = new Set();
    const to = fill(tpl, used);
    if (to) swaps.push({ re: word(s), to, key: [...used], len: s.length + 1000 });
  }
  list(META.name).forEach((s) => add(s, D.name, 'name'));
  list(META.owner).forEach((s) => add(s, s.includes(' ') ? D.owner : D.owner && first(D.owner), 'owner'));
  list(META.city).forEach((s) => add(s, D.city, 'city'));
  list(META.address).forEach((s) => add(s, D.address, 'address'));
  list(META.email).forEach((s) => add(s, D.email, 'email'));
  list(META.site).forEach((s) => add(s, D.site, 'site'));
  list(META.phone).forEach((s) => {
    const n = s.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
    if (n.length !== 10 || !PHONE) return;
    const re = `(?<!\\d)(?:\\+?1[\\s.-]?)?\\(?${n.slice(0, 3)}\\)?[\\s.-]?${n.slice(3, 6)}[\\s.-]?${n.slice(6)}(?!\\d)`;
    add(s, PHONE, 'phone', re);
  });
  swaps.sort((a, b) => b.len - a.len);

  const RE = swaps.length ? new RegExp(swaps.map((s) => `(${s.re})`).join('|'), 'gu') : null;
  const TEST = RE && new RegExp(RE.source, 'u');
  const mine = Object.values(VALUES).filter((v) => v && v.length > 2);

  function swap(text) {
    if (!RE || !TEST.test(text)) return text;
    // Never swap inside something that is already theirs.
    const keep = [];
    for (const v of mine) for (let i = text.indexOf(v); i >= 0; i = text.indexOf(v, i + 1)) keep.push([i, i + v.length]);
    return text.replace(RE, (...m) => {
      const at = m[swaps.length + 1];
      if (keep.some(([a, b]) => at >= a && at < b)) return m[0];
      const s = swaps[m.slice(1, swaps.length + 1).findIndex((g) => g !== undefined)];
      [].concat(s.key).forEach((k) => placed.add(k));
      return s.to;
    });
  }

  /* -------------------------------------------------------------- the page */

  const ATTR = /^(alt|title|aria-label|aria-description|placeholder|content|data-(?!plug)[\w-]+)$/;
  const SKIP = 'script,style,noscript,textarea,template,[data-plug-skip],.plug-bar';

  function text(root) {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (TEST && TEST.test(n.nodeValue) && !n.parentElement.closest(SKIP)) nodes.push(n);
    nodes.forEach((n) => (n.nodeValue = swap(n.nodeValue)));
    for (const el of [root, ...root.querySelectorAll('*')]) {
      if (!el.attributes || el.closest(SKIP + ',head > script')) continue;
      for (const a of [...el.attributes]) {
        if (ATTR.test(a.name)) {
          const v = swap(a.value);
          if (v !== a.value) el.setAttribute(a.name, v);
        }
      }
      const href = el.getAttribute('href');
      if (!href) continue;
      if (/^tel:/i.test(href) && PHONE && TEST && TEST.test(href.slice(4))) {
        el.setAttribute('href', `tel:${tel()}`);
        placed.add('phone');
      } else if (/^mailto:/i.test(href) && D.email && list(META.email).some((e) => href.includes(e))) {
        el.setAttribute('href', `mailto:${D.email}`);
        placed.add('email');
      }
    }
  }

  function head() {
    document.title = swap(document.title);
    document.head.querySelectorAll('meta[content]').forEach((m) => m.setAttribute('content', swap(m.getAttribute('content'))));
  }

  // Window.SCENES (3D scenes): every string, before the engine draws the page.
  function scenes() {
    const S = window.SCENES;
    if (!S || typeof S !== 'object') return;
    const seen = new WeakSet();
    const deep = (o) => {
      if (!o || typeof o !== 'object' || seen.has(o)) return;
      seen.add(o);
      for (const k of Object.keys(o)) {
        if (typeof o[k] === 'string') o[k] = swap(o[k]);
        else if (typeof o[k] === 'object') deep(o[k]);
      }
    };
    deep(S);
    if (S.brand) {
      S.brand.name = D.name;
      S.brand.mark = initials(D.name);
    }
    placed.add('name');
  }

  function initials(name) {
    const words = name.replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter((w) => w && !/^(and|the|of|et|de)$/i.test(w));
    if (!words.length) return name.slice(0, 2).toUpperCase();
    return (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
  }

  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v != null && v !== false) el.setAttribute(k, v);
    el.append(...kids.flat().filter((k) => k != null && k !== ''));
    return el;
  };
  const logoImg = (alt) => h('img', { class: 'plug-logo', src: D.logo, alt, decoding: 'async' });

  // A dark logo in a dark header (or a light one in a light header) would all
  // but vanish, so it goes on a small tile of the opposite shade. The brand's
  // own text colour says which kind of header this is.
  function tile(el) {
    const img = el.querySelector('.plug-logo');
    const ink = toHex(getComputedStyle(el).color);
    if (!img || D.logoTone == null || !ink) return;
    const darkHeader = lum(ink) > 0.4;
    const bg = darkHeader ? 0.02 : 0.9;
    const ratio = (Math.max(D.logoTone, bg) + 0.05) / (Math.min(D.logoTone, bg) + 0.05);
    if (ratio < 3) img.classList.add(darkHeader ? 'plug-tile-light' : 'plug-tile-dark');
  }

  // Without a logo only the name changes. A wide logo (a wordmark) stands alone;
  // a squarish one takes the icon's place beside the name.
  function brand(el) {
    const mark = el.querySelector('[data-plug~="mark"]');
    const name = el.querySelector('[data-plug~="name"]');
    placed.add('name');
    if (!D.logo) {
      if (name) name.textContent = D.name;
      else el.replaceChildren(...(mark ? [mark] : []), D.name);
      return;
    }
    if (!D.logoName) {
      el.replaceChildren(logoImg(D.name));
      el.classList.add('plug-logo-only');
    } else {
      const img = logoImg('');
      if (!name) el.replaceChildren(img, h('span', { class: 'plug-logo-name', style: 'color:inherit;font-style:inherit' }, D.name));
      else {
        name.textContent = D.name;
        if (mark) mark.replaceWith(img);
        else name.before(img);
      }
    }
    tile(el);
  }

  function hours(el) {
    if (!D.hours.length) return;
    placed.add('hours');
    if (el.tagName === 'DL') {
      el.replaceChildren(...D.hours.flatMap(([d, t]) => [h('dt', null, d), h('dd', null, t)]));
      return;
    }
    // One line per row, split by <br>.
    if ('plugLines' in el.dataset) {
      el.replaceChildren(...D.hours.flatMap((r, i) => (i ? [h('br'), r.filter(Boolean).join(' ')] : [r.filter(Boolean).join(' ')])));
      return;
    }
    // Rows marked data-plug-row share a list with other things (a phone, an
    // address): only those rows are swapped. Otherwise every row is.
    const marked = [...el.querySelectorAll(':scope > [data-plug-row]')];
    const tpl = marked[0] || el.firstElementChild;
    if (!tpl) {
      el.textContent = hoursLine();
      return;
    }
    const rows = D.hours.map(([d, t]) => {
        const row = tpl.cloneNode(true);
        row.removeAttribute('id');
        row.removeAttribute('data-d');
        row.classList.remove('today');
        const days = row.querySelector('[data-plug-days]');
        const time = row.querySelector('[data-plug-time]');
        if (days || time) {
          if (days) days.textContent = d;
          if (time) time.textContent = t;
        } else if (row.children.length) {
          row.lastElementChild.textContent = t;
          const tn = [...row.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim());
          if (tn) tn.nodeValue = d;
          else if (row.children.length > 1) row.firstElementChild.textContent = d;
        } else row.textContent = `${d} ${t}`.trim();
        return row;
      });
    if (marked.length) {
      marked[0].before(...rows);
      marked.forEach((r) => r.remove());
    } else el.replaceChildren(...rows);
  }

  function slot(el, k) {
    if (k === 'brand') brand(el);
    else if (k === 'hours') hours(el);
    else if (k === 'hours-line' && D.hours.length) {
      el.textContent = hoursLine();
      placed.add('hours');
    } else if (k in VALUES && k !== 'hours' && VALUES[k] && !el.closest('[data-plug~="brand"]')) {
      el.textContent = VALUES[k];
      placed.add(k === 'first' ? 'owner' : k);
      if (el.tagName === 'A') {
        if (k === 'phone') el.href = `tel:${tel()}`;
        if (k === 'email') el.href = `mailto:${D.email}`;
      }
    }
  }

  // An element can carry several marks: data-plug="hours contact".
  function slots(root) {
    root.querySelectorAll('[data-plug]').forEach((el) => el.dataset.plug.split(/\s+/).forEach((k) => slot(el, k)));
    root.querySelectorAll('[data-plug-text]').forEach((el) => {
      el.textContent = fill(el.dataset.plugText, placed) ?? el.dataset.plugText.replace(/\{(\w+)\??\}/g, (m, k) => SAMPLE[k] || '');
    });
    // Templates often give these a display of their own, which beats [hidden].
    root.querySelectorAll('[data-plug-hide]').forEach((el) => {
      if (el.dataset.plugHide.split(/\s+/).some((k) => (k === 'logo' ? D.logo : VALUES[k]))) {
        el.hidden = true;
        el.style.setProperty('display', 'none', 'important');
      }
    });
    contact(root);
  }

  // Anything they typed that the template has no place for. In a list (the
  // template's own contact list) the rows join it and take its look; META.labelTag
  // sets the element the labels use there, to match its other rows.
  function contact(root) {
    const box = root.querySelector('[data-plug~="contact"]');
    if (!box || box.querySelector('.plug-extra, .plug-li')) return;
    const inList = box.matches('ul, ol');
    const tag = (inList && META.labelTag) || 'span';
    const items = [];
    const item = (label, ...value) =>
      items.push(h('li', { class: 'plug-li' }, h(tag, { class: 'plug-k' }, label), tag === 'span' ? ' ' : null, ...value));
    if (D.owner && !placed.has('owner')) item('Owner', D.owner);
    if (PHONE && !placed.has('phone')) item('Phone', h('a', { href: `tel:${tel()}` }, PHONE));
    if (D.email && !placed.has('email')) item('Email', h('a', { href: `mailto:${D.email}` }, D.email));
    const where = [!placed.has('address') && D.address, !placed.has('city') && D.city].filter(Boolean).join(', ');
    if (where) item('Address', where);
    if (D.hours.length && !placed.has('hours')) item('Hours', hoursLine());
    if (D.site && !placed.has('site')) item('Website', D.site);
    if (!items.length) return;
    if (inList) box.append(...items);
    else {
      const title = box.dataset.plugTitle;
      const center = getComputedStyle(box).textAlign === 'center';
      box.append(h('div', { class: `plug-extra${center ? ' plug-center' : ''}` }, title ? h('p', { class: 'plug-extra-h' }, title) : null, h('ul', null, items)));
    }
    box.hidden = false;
  }

  /* ---------------------------------------------------------------- colour */

  const hex2rgb = (s) => {
    s = s.replace('#', '');
    if (s.length === 3) s = [...s].map((c) => c + c).join('');
    const n = parseInt(s, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgb2hex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => {
    const A = hex2rgb(a);
    const B = hex2rgb(b);
    return rgb2hex(A.map((v, i) => v + (B[i] - v) * t));
  };
  const lum = (c) => {
    const [r, g, b] = hex2rgb(c).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const x = lum(a);
    const y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  function ensure(fg, bg, min) {
    if (contrast(fg, bg) >= min) return fg;
    const target = lum(bg) > 0.5 ? '#000000' : '#ffffff';
    for (let t = 0.05; t <= 1.0001; t += 0.05) {
      const c = mix(fg, target, t);
      if (contrast(c, bg) >= min) return c;
    }
    return target;
  }
  const readableOn = (bg) => (contrast('#000000', bg) >= contrast('#ffffff', bg) ? '#000000' : '#ffffff');
  function toHex(v) {
    v = (v || '').trim();
    if (/^#([0-9a-f]{3}){1,2}$/i.test(v)) return v;
    const m = v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+%?))?\s*\)$/i);
    if (!m || (m[4] && parseFloat(m[4]) === 0)) return null;
    return rgb2hex([m[1], m[2], m[3]].map(Number));
  }
  function background() {
    const C = META.color;
    const css = getComputedStyle(document.documentElement);
    return (C.bg && toHex(css.getPropertyValue(C.bg))) || toHex(getComputedStyle(document.body).backgroundColor) || toHex(css.backgroundColor) || '#ffffff';
  }
  let painted = '';
  function paint() {
    const C = META.color;
    if (!D.color || !C) return;
    // Link-coloured text has to read on the page, so it follows the theme.
    const bg = background();
    if (bg === painted) return;
    painted = bg;
    const s = document.documentElement.style;
    (C.accent || []).forEach((v) => s.setProperty(v, D.color));
    (C.text || []).forEach((v) => s.setProperty(v, readableOn(D.color)));
    (C.link || []).forEach((v) => s.setProperty(v, ensure(D.color, bg, 4.5)));
  }

  /* ------------------------------------------------------------------ bar */

  const STYLE = `
.plug-logo{display:inline-block;height:var(--plug-logo-h,1.8em);width:auto;max-width:min(200px,42vw);object-fit:contain;vertical-align:middle;flex:none}
.plug-logo+.plug-logo-name,.plug-logo+[data-plug~="name"]{margin-left:.45em}
.plug-logo.plug-tile-light,.plug-logo.plug-tile-dark{box-sizing:border-box;padding:.2em .4em;border-radius:.45em;height:calc(var(--plug-logo-h,1.8em) + .3em)}
.plug-logo.plug-tile-light{background:#fff}
.plug-logo.plug-tile-dark{background:#15171a}
.plug-extra{margin-top:1rem;font-size:.95em}
.plug-extra-h{margin:0 0 .4rem;font-weight:700}
.plug-extra ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:.35rem 1.4rem}
.plug-extra li{margin:0;padding:0;border:0}
.plug-extra .plug-k,.plug-li span.plug-k{opacity:.7;margin-right:.2em}
.plug-extra a{color:inherit;text-decoration:underline;text-underline-offset:3px}
.plug-center ul{justify-content:center}
.plug-bar{all:initial;position:fixed;z-index:2147483000;bottom:max(12px,env(safe-area-inset-bottom));left:12px;max-width:min(860px,calc(100vw - 24px));box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:.45rem .8rem;padding:.6rem .7rem .6rem .95rem;border-radius:14px;background:#0d2a1f;color:#f3f1e8;font:500 14px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 10px 30px rgb(0 0 0 / .28),0 0 0 1px rgb(255 255 255 / .08)}
.plug-bar.right{left:auto;right:12px}
.plug-bar *{box-sizing:border-box;font:inherit;color:inherit;letter-spacing:normal;text-transform:none}
.plug-bar p{margin:0;flex:1 1 250px;min-width:0}
.plug-bar b{font-weight:700}
.plug-bar small{display:block;color:#c9d6cf;font-size:12.5px;margin-top:2px}
.plug-bar .acts{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}
.plug-bar a,.plug-bar button{all:unset;box-sizing:border-box;cursor:pointer;border-radius:999px;padding:.42rem .8rem;font-weight:600;font-size:13.5px;line-height:1.2;white-space:nowrap}
.plug-bar .go{background:#f3c64f;color:#1b1a12}
.plug-bar .ed{box-shadow:inset 0 0 0 1.5px rgb(243 241 232 / .5)}
.plug-bar .x{padding:.42rem .55rem;color:#c9d6cf;text-decoration:underline;text-underline-offset:3px}
.plug-bar .fold{padding:.3rem .5rem;color:#c9d6cf;font-size:16px}
.plug-bar a:hover,.plug-bar button:hover{filter:brightness(1.12)}
.plug-bar a:focus-visible,.plug-bar button:focus-visible{outline:2px solid #f3c64f;outline-offset:2px}
.plug-bar.folded{padding:.35rem .4rem .35rem .85rem;gap:.4rem}
.plug-bar.folded p small,.plug-bar.folded .acts>:not(.fold){display:none}
.plug-bar.folded p{flex:0 1 auto}
.demo-bar.plugged .note{flex-basis:100%;color:#c9d6cf;font-size:.8rem}
.demo-bar.plugged button{all:unset;cursor:pointer;color:#f3c64f;font-weight:600;text-decoration:underline;text-underline-offset:3px;margin-left:.9rem}
.demo-bar.plugged button:focus-visible{outline:2px solid #f3c64f;outline-offset:3px}
@media (max-width:640px){.plug-bar{bottom:max(10px,env(safe-area-inset-bottom));left:10px;right:10px;max-width:none}.plug-bar.right{right:10px}.plug-bar.folded{right:auto}}
@media print{.plug-bar{display:none}}
${META.css || ''}`;

  function links() {
    const id = encodeURIComponent(META.template);
    return {
      edit: D.ret && `${D.ret}/work/try?template=${id}`,
      start: D.ret && `${D.ret}/quote?package=starter&template=${id}&from=plug`,
    };
  }

  function sample() {
    try {
      sessionStorage.removeItem(SESSION);
    } catch (e) {}
    location.reload();
  }

  function bar() {
    const { edit, start } = links();
    const label = META.label ? ` in the ${META.label} template` : '';
    const demo = document.querySelector('.demo-bar');
    if (demo) {
      demo.classList.add('plugged');
      demo.setAttribute('aria-label', 'Your preview');
      demo.replaceChildren(
        h('p', null, h('b', null, 'Your preview'), ' ', h('span', null, `${D.name}${label}`)),
        h(
          'p',
          null,
          edit ? h('a', { href: edit }, 'Edit details') : null,
          start ? h('a', { href: start }, 'Start with this template') : null,
          h('button', { type: 'button', 'data-sample': '' }, 'See the sample')
        ),
        h('p', { class: 'note' }, 'Your details stay in this browser. Photos, prices and reviews are still the sample’s.')
      );
      demo.querySelector('[data-sample]').addEventListener('click', sample);
      return;
    }
    let folded = matchMedia('(max-width: 640px)').matches;
    try {
      const f = sessionStorage.getItem(FOLD);
      if (f) folded = f === '1';
    } catch (e) {}
    const fold = h('button', { type: 'button', class: 'fold', 'aria-expanded': String(!folded), 'aria-label': 'Show or hide the preview options' }, folded ? '▴' : '▾');
    const el = h(
      'aside',
      { class: `plug-bar${META.bar === 'right' ? ' right' : ''}${folded ? ' folded' : ''}`, 'aria-label': 'Your preview' },
      h('p', null, h('b', null, 'Your preview'), ' · ', D.name, h('small', null, 'Your details stay in this browser. Photos, prices and reviews are still the sample’s.')),
      h(
        'span',
        { class: 'acts' },
        edit ? h('a', { class: 'ed', href: edit }, 'Edit details') : null,
        start ? h('a', { class: 'go', href: start }, 'Start with this template') : null,
        h('button', { type: 'button', class: 'x', 'data-sample': '' }, 'See the sample'),
        fold
      )
    );
    el.querySelector('[data-sample]').addEventListener('click', sample);
    fold.addEventListener('click', () => {
      const now = !el.classList.contains('folded');
      el.classList.toggle('folded', now);
      fold.setAttribute('aria-expanded', String(!now));
      fold.textContent = now ? '▴' : '▾';
      try {
        sessionStorage.setItem(FOLD, now ? '1' : '0');
      } catch (e) {}
    });
    document.body.append(el);
  }

  /* ------------------------------------------------------------------- run */

  document.head.append(h('style', { id: 'plug-style' }, STYLE));
  document.documentElement.classList.add('plugged');
  head();
  scenes();
  text(document.body);
  slots(document.body);
  paint();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', paint);
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bar);
  else bar();

  window.PLUG = { data: D, meta: META, slots, swap };
})();
