/* Placeholder art for the sites/ templates: flat SVG "photos" drawn in code, so a template
   looks finished before the client's real photos arrive. Swap any [data-art] box for an <img>.
   <div data-art="room" data-palette="#wall,#floor,#main,#accent" data-seed="3"></div>
   Kinds: landscape room kitchen bath portrait house car food plant product building city
   abstract chair gym desk. data-art-fit="meet" shows the whole drawing instead of cropping;
   data-art-grain adds film grain. */
(() => {
  let uid = 0, auto = 1;
  const hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const dk = (c, t = 0.25) => mix(c, '#000000', t);
  const lt = (c, t = 0.25) => mix(c, '#ffffff', t);
  const rng = (s) => { let x = (Math.abs(Math.floor(s)) % 2147483646) + 1; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
  const grad = (a, b, vertical = true) => { const id = 'ag' + uid++; return [id, `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`]; };
  const ridge = (y, amp, r, step = 50) => { let d = `M0,400 L0,${y - r() * amp}`; for (let x = step; x <= 400; x += step) d += ` L${x},${(y - r() * amp).toFixed(1)}`; return d + ' L400,400 Z'; };
  const leaf = (x, y, a, s, c) => `<g transform="translate(${x},${y}) rotate(${a}) scale(${s})"><path d="M0,0 C-22,-30 -18,-80 0,-110 C18,-80 22,-30 0,0Z" fill="${c}"/><path d="M0,-4 L0,-100" stroke="${dk(c, 0.2)}" stroke-width="2"/></g>`;
  const HAIR = ['#2b1d16', '#5a3825', '#c99a5b', '#1a1a1a', '#8b4b2b', '#d8c3a5'];

  const DEF = {
    landscape: ['#f6b48f', '#f7e1c4', '#3d5a6c', '#ffd166'], room: ['#efe6da', '#c8a27a', '#4f6d7a', '#e07a5f'],
    kitchen: ['#f1ece4', '#d9d2c5', '#2f4858', '#c9a227'], bath: ['#e3eef0', '#cfd8dc', '#7fa7b0', '#d4a373'],
    portrait: ['#e8d5c4', '#c9a68b', '#3a2e2a', '#d9a07e'], house: ['#bde0fe', '#cfe8b8', '#e76f51', '#264653'],
    car: ['#1b1b1f', '#3a3a42', '#c1121f', '#e5e5e5'], food: ['#a47148', '#efe3d0', '#ffffff', '#d9472b'],
    plant: ['#fdf0d5', '#f7d6bf', '#e07a5f', '#2d6a4f'], product: ['#ffe5ec', '#ffc2d1', '#3d405b', '#f2cc8f'],
    building: ['#cfe2f3', '#7d8b99', '#0e1b2c', '#b08d57'], city: ['#1d3557', '#e63946', '#0b132b', '#f1faee'],
    abstract: ['#ffcad4', '#f4acb7', '#9d8189', '#ffe5d9'], chair: ['#2b2b2b', '#e9e4da', '#7a1f1f', '#c0c0c0'],
    gym: ['#111111', '#262626', '#d7ff3a', '#555555'], desk: ['#eef0eb', '#b08968', '#1f7a4d', '#f2c14e'],
  };

  const K = {
    landscape([a, b, c, d], r) {
      const [g, gd] = grad(a, b);
      return [gd, `<rect width="400" height="400" fill="url(#${g})"/><circle cx="${140 + r() * 120}" cy="${140 + r() * 40}" r="${30 + r() * 16}" fill="${d}"/>
        <path d="${ridge(230, 90, r)}" fill="${mix(c, b, 0.6)}"/><path d="${ridge(270, 70, r, 40)}" fill="${mix(c, b, 0.3)}"/><path d="${ridge(305, 40, r, 66)}" fill="${c}"/>
        <rect y="335" width="400" height="65" fill="${mix(a, c, 0.45)}" opacity=".85"/><path d="M60 352h70M180 364h90M110 378h60M260 350h50" stroke="${lt(a, 0.4)}" stroke-width="3" stroke-linecap="round" opacity=".6"/>`];
    },
    room([a, b, c, d], r) {
      const [g, gd] = grad(lt(c, 0.65), lt(d, 0.55));
      const sofa = r() > 0.5;
      return [gd, `<rect width="400" height="400" fill="${a}"/><rect y="292" width="400" height="108" fill="${b}"/><rect y="286" width="400" height="7" fill="${dk(a, 0.12)}"/>
        <rect x="60" y="64" width="120" height="160" fill="url(#${g})" stroke="#fff" stroke-width="7"/><path d="M120 64v160M60 144h120" stroke="#fff" stroke-width="5"/>
        <rect x="236" y="86" width="96" height="70" fill="${d}" stroke="#fff" stroke-width="6"/><circle cx="270" cy="114" r="14" fill="${lt(d, 0.4)}"/>
        <ellipse cx="250" cy="338" rx="160" ry="22" fill="${lt(d, 0.45)}"/>
        ${sofa ? `<rect x="160" y="196" width="182" height="52" rx="16" fill="${dk(c, 0.08)}"/><rect x="146" y="232" width="210" height="58" rx="14" fill="${c}"/><rect x="170" y="216" width="72" height="34" rx="10" fill="${lt(c, 0.2)}"/><rect x="256" y="216" width="72" height="34" rx="10" fill="${lt(c, 0.2)}"/><rect x="158" y="288" width="8" height="16" fill="${dk(b, 0.4)}"/><rect x="336" y="288" width="8" height="16" fill="${dk(b, 0.4)}"/>`
        : `<rect x="180" y="250" width="150" height="12" rx="3" fill="${dk(b, 0.25)}"/><rect x="192" y="262" width="8" height="44" fill="${dk(b, 0.35)}"/><rect x="310" y="262" width="8" height="44" fill="${dk(b, 0.35)}"/><path d="M200 200h40l-6 50h-28z" fill="${c}"/><circle cx="290" cy="236" r="14" fill="${d}"/>`}
        <path d="M290 0v118" stroke="${dk(a, 0.5)}" stroke-width="2"/><path d="M266 140c0-18 10-24 24-24s24 6 24 24z" fill="${d}"/>
        <rect x="74" y="258" width="44" height="42" rx="4" fill="${dk(d, 0.15)}"/>${leaf(96, 260, -30, 0.55, '#3f7d4e')}${leaf(96, 260, 8, 0.7, '#4c9a5e')}${leaf(96, 260, 40, 0.5, '#2f6b40')}`];
    },
    kitchen([a, b, c, d], r) {
      let tiles = '';
      for (let x = 40; x < 360; x += 26) tiles += `<path d="M${x} 150v62" stroke="${dk(a, 0.08)}"/>`;
      for (let y = 150; y < 212; y += 15) tiles += `<path d="M40 ${y}h320" stroke="${dk(a, 0.08)}"/>`;
      let doors = '';
      for (let x = 44; x < 356; x += 64) doors += `<rect x="${x}" y="52" width="58" height="84" rx="3" fill="${c}"/><rect x="${x}" y="226" width="58" height="70" rx="3" fill="${c}"/><rect x="${x + 25}" y="${r() > 0.5 ? 236 : 120}" width="8" height="3" rx="1.5" fill="${d}"/>`;
      return ['', `<rect width="400" height="400" fill="${a}"/><rect y="300" width="400" height="100" fill="${b}"/>${tiles}${doors}
        <rect x="36" y="210" width="328" height="14" fill="${lt(b, 0.5)}"/><rect x="150" y="190" width="76" height="20" rx="3" fill="${dk(c, 0.5)}"/>
        <path d="M120 0v40M280 0v40" stroke="${dk(a, 0.5)}" stroke-width="2"/><path d="M104 56c0-14 7-18 16-18s16 4 16 18z" fill="${d}"/><path d="M264 56c0-14 7-18 16-18s16 4 16 18z" fill="${d}"/>
        <rect x="290" y="186" width="22" height="24" rx="4" fill="${lt(d, 0.3)}"/>${leaf(301, 188, -20, 0.25, '#4c9a5e')}${leaf(301, 188, 20, 0.22, '#3f7d4e')}`];
    },
    bath([a, b, c, d]) {
      let tiles = '';
      for (let x = 0; x <= 400; x += 34) tiles += `<path d="M${x} 0v300" stroke="${lt(a, 0.5)}" stroke-width="2"/>`;
      for (let y = 0; y <= 300; y += 34) tiles += `<path d="M0 ${y}h400" stroke="${lt(a, 0.5)}" stroke-width="2"/>`;
      return ['', `<rect width="400" height="400" fill="${a}"/>${tiles}<rect y="300" width="400" height="100" fill="${b}"/>
        <rect x="40" y="236" width="200" height="74" rx="30" fill="#fbfbfb"/><rect x="40" y="236" width="200" height="12" rx="6" fill="${c}"/><path d="M80 236v-34h22" stroke="${dk(d, 0.2)}" stroke-width="5" fill="none"/>
        <circle cx="306" cy="132" r="52" fill="${lt(a, 0.55)}" stroke="${d}" stroke-width="6"/><rect x="262" y="226" width="92" height="84" rx="4" fill="${c}"/><rect x="270" y="214" width="76" height="14" rx="7" fill="#fbfbfb"/>
        <rect x="290" y="258" width="36" height="3" fill="${d}"/><rect x="250" y="160" width="10" height="70" rx="3" fill="${lt(d, 0.3)}"/>`];
    },
    portrait([a, b, c, d], r) {
      const [g, gd] = grad(a, b);
      const hair = HAIR[Math.floor(r() * HAIR.length)], kind = Math.floor(r() * 5);
      const hairs = [
        `<path d="M146 200c-4-70 112-70 108 0c-10-34-98-34-108 0z" fill="${hair}"/>`,
        `<path d="M142 214c-10-96 126-96 116 0l8 96c-20 8-30-40-32-90c-6-30-62-30-68 0c-2 50-12 98-32 90z" fill="${hair}"/>`,
        `<path d="M146 200c-4-70 112-70 108 0c-10-34-98-34-108 0z" fill="${hair}"/><circle cx="200" cy="124" r="26" fill="${hair}"/>`,
        Array.from({ length: 13 }, (_, i) => `<circle cx="${148 + i * 8.7}" cy="${150 + Math.abs(6 - i) * 4 - r() * 6}" r="${16 + r() * 6}" fill="${hair}"/>`).join(''),
        `<path d="M150 186c0-56 100-56 100 0c-10-22-90-22-100 0z" fill="${hair}"/><path d="M152 214c6 46 26 60 48 60s42-14 48-60c-6 20-20 28-48 28s-42-8-48-28z" fill="${hair}"/>`,
      ];
      return [gd, `<rect width="400" height="400" fill="url(#${g})"/><circle cx="200" cy="200" r="130" fill="${lt(a, 0.3)}" opacity=".45"/>
        <path d="M66 400c8-78 66-112 134-112s126 34 134 112z" fill="${c}"/><path d="M182 236h36v62c-12 10-24 10-36 0z" fill="${dk(d, 0.12)}"/>
        <ellipse cx="148" cy="208" rx="8" ry="13" fill="${dk(d, 0.06)}"/><ellipse cx="252" cy="208" rx="8" ry="13" fill="${dk(d, 0.06)}"/>
        <ellipse cx="200" cy="200" rx="52" ry="63" fill="${d}"/>${hairs[kind]}`];
    },
    house([a, b, c, d], r) {
      const [g, gd] = grad(a, lt(a, 0.5));
      const wall = lt(mix(b, '#f5efe6', 0.6), 0.3);
      return [gd, `<rect width="400" height="400" fill="url(#${g})"/><circle cx="320" cy="90" r="26" fill="#fff6d5"/><rect y="300" width="400" height="100" fill="${b}"/>
        <path d="M186 400l10-90h10l14 90z" fill="${lt(b, 0.35)}"/>
        <rect x="236" y="96" width="22" height="56" fill="${dk(c, 0.2)}"/><rect x="104" y="190" width="192" height="120" fill="${wall}"/><path d="M88 196L200 106l112 90z" fill="${c}"/>
        <rect x="184" y="246" width="34" height="64" rx="2" fill="${d}"/><circle cx="210" cy="280" r="2.5" fill="${lt(c, 0.5)}"/>
        <rect x="122" y="214" width="44" height="40" fill="${lt(a, 0.15)}" stroke="#fff" stroke-width="4"/><path d="M144 214v40M122 234h44" stroke="#fff" stroke-width="3"/>
        <rect x="234" y="214" width="44" height="40" fill="${lt(a, 0.15)}" stroke="#fff" stroke-width="4"/><path d="M256 214v40M234 234h44" stroke="#fff" stroke-width="3"/>
        <circle cx="200" cy="168" r="12" fill="${lt(a, 0.15)}" stroke="#fff" stroke-width="3"/>
        <rect x="46" y="250" width="8" height="56" fill="#6b4f3a"/><circle cx="50" cy="236" r="30" fill="#2d6a4f"/><circle cx="34" cy="252" r="20" fill="#40916c"/>
        <rect x="346" y="262" width="7" height="44" fill="#6b4f3a"/><circle cx="350" cy="252" r="${20 + r() * 8}" fill="#40916c"/>
        <path d="M60 306h80M260 306h100" stroke="${dk(b, 0.2)}" stroke-width="10" stroke-linecap="round" stroke-dasharray="1 14"/>`];
    },
    car([a, b, c, d], r) {
      const [g, gd] = grad(a, b);
      const wheel = (x) => `<circle cx="${x}" cy="282" r="31" fill="#0d0d0d"/><circle cx="${x}" cy="282" r="18" fill="${d}"/><circle cx="${x}" cy="282" r="5" fill="${dk(d, 0.4)}"/>`;
      return [gd, `<rect width="400" height="400" fill="url(#${g})"/><rect y="306" width="400" height="94" fill="${dk(b, 0.35)}"/><ellipse cx="205" cy="310" rx="168" ry="12" fill="#000" opacity=".45"/>
        <path d="M44 282v-30c0-14 10-20 30-23l52-6l44-34c10-8 22-11 38-11h56c18 0 30 6 42 18l30 29l24 5c14 3 24 12 24 26v26z" fill="${c}"/>
        <path d="M176 222l28-26c6-5 12-7 22-7h28v33z" fill="${lt(a, 0.55)}" opacity=".85"/><path d="M262 222v-33h12c12 0 20 4 28 12l22 21z" fill="${lt(a, 0.55)}" opacity=".85"/>
        <path d="M60 246h290" stroke="${lt(c, 0.35)}" stroke-width="3" opacity=".7"/><rect x="342" y="244" width="22" height="10" rx="4" fill="#fff6c2"/><rect x="44" y="244" width="14" height="10" rx="3" fill="#ff3b3b"/>
        ${wheel(120)}${wheel(300)}`];
    },
    food([a, b, c, d], r) {
      let wood = '';
      for (let y = 0; y < 400; y += 22) wood += `<path d="M0 ${y + r() * 6}h400" stroke="${dk(a, 0.12)}" stroke-width="2"/>`;
      const v = Math.floor(r() * 3);
      const dish = [
        `<circle cx="200" cy="206" r="104" fill="${c}"/><circle cx="200" cy="206" r="82" fill="${dk(c, 0.04)}"/><circle cx="200" cy="206" r="52" fill="#6f4e37"/><path d="M200 222c-22-14-22-34-8-36c6 0 8 4 8 8c0-4 2-8 8-8c14 2 14 22-8 36z" fill="${lt('#c69c6d', 0.3)}"/><path d="M296 186c26 0 30 40 0 40" stroke="${c}" stroke-width="12" fill="none"/>`,
        `<circle cx="200" cy="200" r="130" fill="${c}"/><circle cx="200" cy="200" r="104" fill="${dk(c, 0.03)}"/><rect x="118" y="150" width="96" height="86" rx="18" fill="#e9c46a" stroke="#b5835a" stroke-width="7"/><path d="M226 216c-10-40 60-50 66-14c6 30-56 46-66 14z" fill="#fff"/><circle cx="256" cy="210" r="15" fill="#f4a300"/><circle cx="160" cy="268" r="14" fill="${d}"/><circle cx="186" cy="282" r="12" fill="${d}"/><path d="M220 270c20-10 40 0 50 12" stroke="#5c9e4a" stroke-width="10" stroke-linecap="round"/>`,
        `<circle cx="200" cy="200" r="118" fill="${c}"/><circle cx="200" cy="200" r="88" fill="${d}"/>${Array.from({ length: 12 }, () => `<circle cx="${160 + r() * 80}" cy="${160 + r() * 80}" r="${7 + r() * 6}" fill="${['#3d348b', '#e63946', '#f1faee', '#7b2cbf'][Math.floor(r() * 4)]}"/>`).join('')}<path d="M190 128c8-10 22-10 30 0" stroke="#5c9e4a" stroke-width="6" fill="none"/>`,
      ][v];
      return ['', `<rect width="400" height="400" fill="${a}"/>${wood}<rect x="290" y="270" width="110" height="130" fill="${b}" transform="rotate(-12 340 330)"/>${dish}<path d="M56 110v140M48 110v40M64 110v40" stroke="#c9c9c9" stroke-width="5" stroke-linecap="round"/>`];
    },
    plant([a, b, c, d], r) {
      const [g, gd] = grad(a, b);
      const n = 5 + Math.floor(r() * 4), tall = r() > 0.5;
      let leaves = '';
      for (let i = 0; i < n; i++) leaves += leaf(200 + (r() - 0.5) * 20, 262, -60 + (120 * i) / (n - 1) + (r() - 0.5) * 14, tall ? 0.8 + r() * 0.5 : 0.6 + r() * 0.3, [d, dk(d, 0.15), lt(d, 0.15)][i % 3]);
      return [gd, `<rect width="400" height="400" fill="url(#${g})"/><circle cx="200" cy="200" r="140" fill="${lt(a, 0.4)}" opacity=".6"/><ellipse cx="200" cy="344" rx="90" ry="12" fill="${dk(b, 0.25)}" opacity=".5"/>
        ${leaves}<path d="M152 266h96l-12 76h-72z" fill="${c}"/><rect x="146" y="254" width="108" height="20" rx="4" fill="${dk(c, 0.12)}"/>`];
    },
    product([a, b, c, d], r) {
      const [g, gd] = grad(a, b);
      const v = Math.floor(r() * 3);
      const item = [
        `<rect x="164" y="156" width="72" height="176" rx="20" fill="${c}"/><rect x="186" y="116" width="28" height="46" fill="${c}"/><rect x="182" y="98" width="36" height="24" rx="4" fill="${d}"/><rect x="164" y="210" width="72" height="64" fill="${d}"/><path d="M178 232h44M178 248h30" stroke="${c}" stroke-width="4"/><rect x="176" y="166" width="8" height="150" rx="4" fill="#fff" opacity=".18"/>`,
        `<rect x="134" y="194" width="132" height="140" rx="24" fill="${c}"/><rect x="128" y="168" width="144" height="32" rx="8" fill="${d}"/><rect x="152" y="236" width="96" height="56" rx="6" fill="${lt(d, 0.45)}"/><path d="M168 256h64M168 272h40" stroke="${c}" stroke-width="4"/>`,
        `<path d="M200 140l90 40v104l-90 46l-90-46v-104z" fill="${c}"/><path d="M200 180l90-40v0l-90 40l-90-40z" fill="${lt(c, 0.25)}"/><path d="M110 180l90 40v110l-90-46z" fill="${dk(c, 0.12)}"/><path d="M200 220l90-40v104l-90 46z" fill="${c}"/><path d="M110 180l90 40l90-40" stroke="${d}" stroke-width="10" fill="none"/><path d="M200 220v110" stroke="${d}" stroke-width="10"/>`,
      ][v];
      return [gd, `<rect width="400" height="400" fill="url(#${g})"/><circle cx="200" cy="220" r="128" fill="${lt(b, 0.35)}"/><ellipse cx="200" cy="340" rx="96" ry="12" fill="${dk(b, 0.3)}" opacity=".45"/>${item}`];
    },
    building([a, b, c, d], r) {
      const [g, gd] = grad(a, lt(a, 0.55));
      let win = '';
      for (let y = 86; y < 320; y += 22) for (let x = 152; x < 252; x += 24) win += `<rect x="${x}" y="${y}" width="14" height="12" fill="${r() > 0.35 ? lt(d, 0.35) : dk(c, 0.25)}"/>`;
      for (let y = 160; y < 320; y += 22) for (let x = 270; x < 320; x += 20) win += `<rect x="${x}" y="${y}" width="11" height="12" fill="${r() > 0.5 ? lt(d, 0.2) : dk(c, 0.45)}"/>`;
      return [gd, `<rect width="400" height="400" fill="url(#${g})"/><rect x="60" y="210" width="80" height="130" fill="${mix(c, a, 0.55)}"/><rect x="140" y="70" width="124" height="270" fill="${c}"/><rect x="262" y="148" width="66" height="192" fill="${dk(c, 0.18)}"/><rect x="134" y="62" width="136" height="10" fill="${d}"/>${win}
        <rect y="336" width="400" height="64" fill="${b}"/><circle cx="96" cy="326" r="20" fill="#2d6a4f"/><circle cx="340" cy="324" r="22" fill="#40916c"/><circle cx="118" cy="332" r="14" fill="#40916c"/>`];
    },
    city([a, b, c, d], r) {
      const [g, gd] = grad(a, b);
      let s = '', x = 0;
      while (x < 400) { const w = 26 + r() * 40, h = 60 + r() * 170; s += `<rect x="${x}" y="${300 - h}" width="${w}" height="${h + 2}" fill="${c}"/>`; for (let y = 312 - h; y < 290; y += 16) for (let wx = x + 6; wx < x + w - 8; wx += 12) if (r() > 0.6) s += `<rect x="${wx}" y="${y}" width="5" height="7" fill="${d}" opacity=".8"/>`; x += w + 2; }
      return [gd, `<rect width="400" height="400" fill="url(#${g})"/><circle cx="${120 + r() * 160}" cy="190" r="56" fill="${lt(b, 0.35)}"/>${s}<rect y="300" width="400" height="100" fill="${dk(c, 0.2)}"/><path d="M40 330h120M220 350h140M90 372h90" stroke="${d}" stroke-width="3" opacity=".35"/>`];
    },
    abstract([a, b, c, d], r) {
      const id = 'ab' + uid++;
      const blobs = Array.from({ length: 6 }, (_, i) => `<circle cx="${r() * 400}" cy="${r() * 400}" r="${70 + r() * 110}" fill="${[b, c, d, lt(c, 0.3)][i % 4]}"/>`).join('');
      return [`<filter id="${id}"><feGaussianBlur stdDeviation="36"/></filter>`, `<rect width="400" height="400" fill="${a}"/><g filter="url(#${id})">${blobs}</g>`];
    },
    chair([a, b, c, d], r) {
      let floor = '';
      for (let x = 0; x < 400; x += 40) for (let y = 300; y < 400; y += 40) if ((x / 40 + y / 40) % 2) floor += `<rect x="${x}" y="${y}" width="40" height="40" fill="${dk(b, 0.75)}"/>`;
      return ['', `<rect width="400" height="400" fill="${a}"/><rect y="300" width="400" height="100" fill="${b}"/>${floor}
        <path d="M110 210V110a90 90 0 0 1 180 0v100z" fill="${lt(a, 0.15)}" stroke="${d}" stroke-width="7"/><rect x="96" y="208" width="208" height="10" fill="${dk(d, 0.2)}"/>
        <rect x="166" y="150" width="68" height="86" rx="14" fill="${c}"/><rect x="180" y="132" width="40" height="20" rx="6" fill="${dk(c, 0.2)}"/>
        <rect x="150" y="230" width="100" height="28" rx="10" fill="${c}"/><rect x="142" y="218" width="16" height="30" rx="6" fill="${dk(c, 0.25)}"/><rect x="242" y="218" width="16" height="30" rx="6" fill="${dk(c, 0.25)}"/>
        <rect x="193" y="256" width="14" height="44" fill="${d}"/><ellipse cx="200" cy="304" rx="54" ry="10" fill="${d}"/><path d="M226 268l30 26h28" stroke="${d}" stroke-width="7" fill="none" stroke-linecap="round"/>`];
    },
    gym([a, b, c, d], r) {
      const [g, gd] = grad(a, b);
      const v = r() > 0.5;
      return [gd, `<rect width="400" height="400" fill="url(#${g})"/><path d="M150 0h100l90 300H60z" fill="#fff" opacity=".05"/><rect y="300" width="400" height="100" fill="${dk(b, 0.4)}"/>
        ${v ? `<rect x="96" y="262" width="208" height="12" rx="4" fill="#9a9a9a"/><rect x="104" y="214" width="30" height="108" rx="6" fill="${d}"/><rect x="138" y="230" width="20" height="76" rx="5" fill="${c}"/><rect x="266" y="214" width="30" height="108" rx="6" fill="${d}"/><rect x="242" y="230" width="20" height="76" rx="5" fill="${c}"/>`
        : `<path d="M168 214a32 32 0 0 1 64 0" stroke="${d}" stroke-width="16" fill="none"/><circle cx="200" cy="262" r="52" fill="${d}"/><circle cx="200" cy="262" r="20" fill="${c}"/><ellipse cx="200" cy="316" rx="60" ry="8" fill="#000" opacity=".5"/>`}`];
    },
    desk([a, b, c, d], r) {
      return ['', `<rect width="400" height="400" fill="${a}"/><rect x="40" y="60" width="96" height="70" fill="${lt(c, 0.75)}" stroke="${dk(a, 0.15)}" stroke-width="3"/><path d="M56 112l20-18l18 10l28-26" stroke="${c}" stroke-width="4" fill="none"/>
        <rect y="252" width="400" height="16" fill="${b}"/><rect x="60" y="268" width="12" height="132" fill="${dk(b, 0.3)}"/><rect x="328" y="268" width="12" height="132" fill="${dk(b, 0.3)}"/>
        <rect x="138" y="128" width="140" height="92" rx="6" fill="#1d1d1f"/><rect x="146" y="136" width="124" height="74" fill="${lt(c, 0.85)}"/><path d="M156 196l22-22l18 12l26-30l28 18" stroke="${c}" stroke-width="4" fill="none"/><rect x="200" y="220" width="16" height="22" fill="#2a2a2c"/><rect x="180" y="240" width="56" height="12" rx="3" fill="#2a2a2c"/>
        <rect x="70" y="236" width="56" height="16" rx="2" fill="#fff" transform="rotate(-6 98 244)"/><rect x="300" y="222" width="26" height="30" rx="4" fill="${d}"/><path d="M326 230c12 0 12 16 0 16" stroke="${d}" stroke-width="4" fill="none"/>
        <rect x="340" y="214" width="26" height="38" rx="4" fill="${dk(d, 0.1)}"/>${leaf(353, 216, -20, 0.4, '#3f7d4e')}${leaf(353, 216, 22, 0.35, '#4c9a5e')}`];
    },
  };

  function svg(kind, palette, seed = 1, opts = {}) {
    const draw = K[kind] || K.abstract;
    const pal = palette && palette.length >= 4 ? palette : DEF[kind] || DEF.abstract;
    const [defs, body] = draw(pal, rng(seed * 9973 + kind.length * 31));
    let grain = '';
    if (opts.grain) { const id = 'gr' + uid++; grain = `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0"/></filter><rect width="400" height="400" filter="url(#${id})" opacity=".35"/>`; }
    return `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid ${opts.fit === 'meet' ? 'meet' : 'slice'}" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}${grain}</svg>`;
  }

  function render(el) {
    if (el.dataset.artDone) return;
    const pal = el.dataset.palette ? el.dataset.palette.split(',').map((s) => s.trim()) : null;
    el.insertAdjacentHTML('afterbegin', svg(el.dataset.art, pal, Number(el.dataset.seed) || auto++, { fit: el.dataset.artFit, grain: el.hasAttribute('data-art-grain') }));
    el.dataset.artDone = '1';
  }

  window.ART = { svg, render, mix, lt, dk, kinds: Object.keys(K) };
  document.querySelectorAll('[data-art]').forEach(render);
})();
