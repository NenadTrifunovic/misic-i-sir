/* Mišić i sir – UI. Screens: home, group, play, custom list, editor, how-to. */
(function () {
  'use strict';

  const E = window.MouseEngine;
  const LEVELS = window.MOUSE_LEVELS;
  const I18N = window.I18N;
  const SND = window.MouseAudio;

  const GROUPS = ['beginner', 'easy', 'medium', 'hard'];
  const ARROWS = { F: '↑', B: '↓', L: '←', R: '→' };
  const ANGLE = { N: 0, E: 90, S: 180, W: 270 };
  const S = 100;   // cell size in SVG units
  const PAD = 16;  // board padding in SVG units
  const EDITOR_ROWS = 6;
  const EDITOR_COLS = 6;

  const app = document.getElementById('app');
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  /* ---------- storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('misic.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('misic.' + k, JSON.stringify(v)); } catch (e) { /* private mode etc. */ } },
  };
  const progress = () => store.get('progress', {});
  function markDone(k) { const p = progress(); if (!p[k]) { p[k] = true; store.set('progress', p); } }
  const customLevels = () => store.get('custom', []);
  const saveCustom = (list) => store.set('custom', list);
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- i18n ---------- */
  let lang = store.get('lang', 'hr');
  if (!I18N[lang]) lang = 'hr';
  function t(key, vars) {
    let s = (I18N[lang] && I18N[lang][key]) || I18N.hr[key] || key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function applyLang() { document.documentElement.lang = lang; document.title = t('app.title'); }
  function setLang(l) { if (!I18N[l]) return; lang = l; store.set('lang', l); applyLang(); rerender(); }

  /* ---------- sound ---------- */
  SND.setMuted(!!store.get('muted', false));
  function toggleSound() {
    SND.setMuted(!SND.isMuted());
    store.set('muted', SND.isMuted());
    if (!SND.isMuted()) SND.click();
    $$('.snd-btn').forEach((b) => { b.textContent = SND.isMuted() ? '🔇' : '🔊'; });
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(text) {
    let el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------- SVG art ---------- */
  const MOUSE_SVG =
    '<circle cx="-21" cy="-19" r="12" fill="#4f9be8" stroke="#2c5fa8" stroke-width="3"/>' +
    '<circle cx="21" cy="-19" r="12" fill="#4f9be8" stroke="#2c5fa8" stroke-width="3"/>' +
    '<circle cx="-23" cy="-22" r="5.5" fill="#ffb3c6"/><circle cx="23" cy="-22" r="5.5" fill="#ffb3c6"/>' +
    '<path d="M0 36 q 12 16 28 8" fill="none" stroke="#2c5fa8" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="0" cy="2" rx="26" ry="34" fill="#4f9be8" stroke="#2c5fa8" stroke-width="3"/>' +
    '<path d="M-7 -24 L-30 -31 M-7 -21 L-31 -20 M7 -24 L30 -31 M7 -21 L31 -20" stroke="#1c2b3a" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="-9" cy="-11" r="4" fill="#1c2b3a"/><circle cx="9" cy="-11" r="4" fill="#1c2b3a"/>' +
    '<circle cx="-7.5" cy="-12.5" r="1.3" fill="#fff"/><circle cx="10.5" cy="-12.5" r="1.3" fill="#fff"/>' +
    '<circle cx="0" cy="-30" r="5" fill="#1c2b3a"/>' +
    '<circle cx="0" cy="6" r="4.5" fill="#ffd23f"/><circle cx="0" cy="24" r="4.5" fill="#7bd389"/>' +
    '<circle cx="-10" cy="15" r="4.5" fill="#ff8c42"/><circle cx="10" cy="15" r="4.5" fill="#b388eb"/>' +
    /* small pointer in front of the nose: shows where "forward" is */
    '<path class="nose-arrow" d="M0 -47 L-7 -38 L7 -38 Z" fill="#fff" stroke="#2c5fa8" stroke-width="2.5" stroke-linejoin="round"/>';

  /* Elongated mouse seen from above, drawn behind the arrow pad: the buttons sit on its back,
     the nose is above ↑ and the tail below ↓. viewBox -40 -62 80 126; the pad covers y -16..54. */
  const PAD_MOUSE_SVG =
    '<circle cx="-24" cy="-34" r="11.5" fill="#4f9be8" stroke="#2c5fa8" stroke-width="2.5"/>' +
    '<circle cx="24" cy="-34" r="11.5" fill="#4f9be8" stroke="#2c5fa8" stroke-width="2.5"/>' +
    '<circle cx="-26" cy="-36" r="5.5" fill="#ffb3c6"/><circle cx="26" cy="-36" r="5.5" fill="#ffb3c6"/>' +
    '<path d="M0 57 q 14 10 26 2 q 8 -5 4 -12" fill="none" stroke="#2c5fa8" stroke-width="3.5" stroke-linecap="round"/>' +
    '<ellipse cx="0" cy="6" rx="33" ry="52" fill="#5ea6ec" stroke="#2c5fa8" stroke-width="2.5"/>' +
    '<path d="M-7 -41 L-30 -47 M-7 -38 L-31 -36 M7 -41 L30 -47 M7 -38 L31 -36" stroke="#1c2b3a" stroke-width="1.8" stroke-linecap="round"/>' +
    '<circle cx="-9" cy="-27" r="4" fill="#1c2b3a"/><circle cx="9" cy="-27" r="4" fill="#1c2b3a"/>' +
    '<circle cx="-7.5" cy="-28.5" r="1.3" fill="#fff"/><circle cx="10.5" cy="-28.5" r="1.3" fill="#fff"/>' +
    '<circle cx="0" cy="-45" r="5" fill="#1c2b3a"/>' +
    '<path d="M0 -61 L-7 -52 L7 -52 Z" fill="#fff" stroke="#2c5fa8" stroke-width="2" stroke-linejoin="round"/>';

  const CHEESE_SVG =
    '<polygon points="-30,8 30,8 30,28 -30,28" fill="#e8b800" stroke="#c99a00" stroke-width="3" stroke-linejoin="round"/>' +
    '<polygon points="-30,8 30,8 30,-10 -30,-30" fill="#ffd93d" stroke="#c99a00" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="-12" cy="-6" r="5" fill="#e0a800"/><circle cx="10" cy="-1" r="4" fill="#e0a800"/>' +
    '<circle cx="-22" cy="2" r="2.5" fill="#e0a800"/><circle cx="18" cy="19" r="3.5" fill="#c99a00"/><circle cx="-14" cy="20" r="3" fill="#c99a00"/>';

  /* SVG transform attribute (not CSS): identical behaviour in every browser, incl. Safari/WebView. */
  function mouseTransform(pos, angle) {
    return 'translate(' + (pos.c * S + S / 2) + ' ' + (pos.r * S + S / 2) + ') rotate(' + angle + ')';
  }

  /* Build the SVG markup for a level. opts.grid draws ghost squares for an editor grid. */
  function boardMarkup(level, opts) {
    opts = opts || {};
    const b = opts.bounds || E.bounds(level);
    const cells = new Set(level.cells.map((c) => c[0] + ',' + c[1]));
    let h = '';
    if (opts.grid) {
      for (let r = b.minR; r <= b.maxR; r++) for (let c = b.minC; c <= b.maxC; c++) {
        if (!cells.has(r + ',' + c)) h += '<rect class="ghost" x="' + (c * S + 4) + '" y="' + (r * S + 4) + '" width="' + (S - 8) + '" height="' + (S - 8) + '" rx="12"/>';
      }
    }
    for (const [r, c] of level.cells) {
      h += '<rect class="cell" x="' + (c * S + 3) + '" y="' + (r * S + 3) + '" width="' + (S - 6) + '" height="' + (S - 6) + '" rx="12"/>';
    }
    if (level.cheese) {
      h += '<g class="cheese" transform="translate(' + (level.cheese[1] * S + S / 2) + ' ' + (level.cheese[0] * S + S / 2) + ')">' + CHEESE_SVG + '</g>';
    }
    for (const w of level.walls || []) {
      const [r1, c1, r2, c2] = w;
      if (r1 === r2) { const x = Math.max(c1, c2) * S, y = r1 * S; h += '<line class="wall" x1="' + x + '" y1="' + (y + 8) + '" x2="' + x + '" y2="' + (y + S - 8) + '"/>'; }
      else { const y = Math.max(r1, r2) * S, x = c1 * S; h += '<line class="wall" x1="' + (x + 8) + '" y1="' + y + '" x2="' + (x + S - 8) + '" y2="' + y + '"/>'; }
    }
    if (level.mouse) {
      const pos = { r: level.mouse[0], c: level.mouse[1] };
      h += '<g class="mouse" transform="' + mouseTransform(pos, ANGLE[level.mouse[2]]) + '">' + MOUSE_SVG + '</g>';
    }
    const viewBox = (b.minC * S - PAD) + ' ' + (b.minR * S - PAD) + ' ' + (b.cols * S + 2 * PAD) + ' ' + (b.rows * S + 2 * PAD);
    return { viewBox, html: h, bounds: b };
  }

  function boardSvg(level, cls, opts) {
    const m = boardMarkup(level, opts);
    return '<svg class="' + cls + '" viewBox="' + m.viewBox + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + m.html + '</svg>';
  }

  /* ---------- shared header ---------- */
  function headerHtml(title, backHash, extra) {
    return '<header class="bar">' +
      (backHash != null
        ? '<a class="icon-btn" href="' + backHash + '" aria-label="' + esc(t('back')) + '">‹</a>'
        : '<span class="icon-btn logo">🐭</span>') +
      '<h1 class="bar-title">' + esc(title) + '</h1>' +
      (extra || '') +
      '<button class="icon-btn snd-btn" data-act="sound" aria-label="' + esc(t('sound')) + '">' + (SND.isMuted() ? '🔇' : '🔊') + '</button>' +
      '<div class="lang-seg" role="group" aria-label="Language">' +
        '<button data-lang="hr" class="' + (lang === 'hr' ? 'on' : '') + '">HR</button>' +
        '<button data-lang="en" class="' + (lang === 'en' ? 'on' : '') + '">EN</button>' +
      '</div></header>';
  }

  /* ---------- home ---------- */
  function homeScreen() {
    const p = progress();
    const cards = GROUPS.map((g) => {
      const lv = LEVELS.filter((l) => l.group === g);
      const done = lv.filter((l) => p[l.id]).length;
      return '<a class="card group ' + g + '" href="#group/' + g + '">' +
        '<div class="card-title">' + esc(t('group.' + g)) + '</div>' +
        '<div class="card-sub">' + esc(t('group.' + g + '.sub')) + '</div>' +
        '<div class="card-stars" aria-label="' + esc(t('group.solved', { a: done, b: lv.length })) + '">' +
          '<span class="on">' + '★'.repeat(done) + '</span><span class="off">' + '★'.repeat(lv.length - done) + '</span></div></a>';
    }).join('');
    app.innerHTML = headerHtml(t('app.title'), null) +
      '<main class="home">' +
        '<div class="hero"><svg viewBox="-70 -60 220 120" class="hero-art" aria-hidden="true">' +
          '<g transform="rotate(90)">' + MOUSE_SVG + '</g>' +
          '<g transform="translate(110 10)">' + CHEESE_SVG + '</g></svg>' +
          '<p>' + esc(t('home.subtitle')) + '</p></div>' +
        '<div class="cards">' + cards + '</div>' +
        '<div class="cards secondary">' +
          '<a class="card" href="#custom">📁 ' + esc(t('home.myLevels')) + ' <span class="count">' + customLevels().length + '</span></a>' +
          '<a class="card" href="#editor">✏️ ' + esc(t('home.newLevel')) + '</a>' +
          '<a class="card" href="#howto">❓ ' + esc(t('home.howto')) + '</a>' +
        '</div>' +
        '<footer class="foot">' + esc(t('home.footer')) + '</footer>' +
      '</main>';
  }

  /* ---------- group (level list) ---------- */
  function groupScreen(g) {
    const lv = LEVELS.filter((l) => l.group === g);
    const p = progress();
    app.innerHTML = headerHtml(t('group.' + g), '#') +
      '<main class="list"><p class="sub">' + esc(t('group.' + g + '.sub')) + '</p><div class="tiles">' +
      lv.map((l, i) =>
        '<a class="tile ' + (p[l.id] ? 'done' : '') + '" href="#play/' + g + '/' + i + '">' +
          '<span class="tile-n">' + (i + 1) + '</span><span class="tile-star">' + (p[l.id] ? '★' : '') + '</span>' +
          boardSvg(l, 'mini') + '</a>').join('') +
      '</div></main>';
  }

  /* ---------- how to ---------- */
  function howtoScreen() {
    const items = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => '<li>' + esc(t('howto.' + i)) + '</li>').join('');
    app.innerHTML = headerHtml(t('howto.title'), '#') +
      '<main class="text"><ol class="howto">' + items + '</ol>' +
      '<div class="legend">' +
        '<div><span class="arrow up mini-key">↑</span>' + esc(t('cmd.F')) + '</div>' +
        '<div><span class="arrow down mini-key">↓</span>' + esc(t('cmd.B')) + '</div>' +
        '<div><span class="arrow left mini-key">←</span>' + esc(t('cmd.L')) + '</div>' +
        '<div><span class="arrow right mini-key">→</span>' + esc(t('cmd.R')) + '</div>' +
      '</div><p class="sub">' + esc(t('keys')) + '</p></main>';
  }

  /* ---------- play ---------- */
  let play = null;

  function levelKey(ctx) {
    if (ctx.kind === 'builtin') return ctx.level.id;
    if (ctx.kind === 'custom') return 'custom:' + ctx.id;
    return null;
  }
  function backHashFor(ctx) {
    if (ctx.kind === 'builtin') return '#group/' + ctx.group;
    if (ctx.kind === 'custom') return '#custom';
    return '#';
  }
  function nextHashFor(ctx) {
    if (ctx.kind === 'builtin') {
      const lv = LEVELS.filter((l) => l.group === ctx.group);
      if (ctx.index + 1 < lv.length) return '#play/' + ctx.group + '/' + (ctx.index + 1);
      const gi = GROUPS.indexOf(ctx.group);
      if (gi + 1 < GROUPS.length) return '#play/' + GROUPS[gi + 1] + '/0';
      return null;
    }
    if (ctx.kind === 'custom') {
      const list = customLevels();
      const i = list.findIndex((l) => l.id === ctx.id);
      if (i >= 0 && i + 1 < list.length) return '#play/c/' + list[i + 1].id;
    }
    return null;
  }
  function playTitle(ctx, level) {
    if (ctx.kind === 'builtin') return t('group.' + ctx.group) + ' ' + (ctx.index + 1);
    return level.name || t(ctx.kind === 'shared' ? 'shared.title' : 'custom.untitled');
  }

  function playScreen(level, ctx) {
    ctx.level = level;
    play = {
      level, ctx,
      lookup: E.prepare(level),
      program: new Array(level.slots).fill(null),
      cursor: null,
      running: false,
      mode: store.get('mode', 'plan') === 'free' ? 'free' : 'plan',
      angle: ANGLE[level.mouse[2]],
      free: { pos: E.startState(level), trace: [], queue: [], done: false },
    };
    renderPlay();
  }

  function renderPlay() {
    const P = play, L = P.level, ctx = P.ctx;
    const seg = '<div class="seg" role="group">' +
      '<button data-mode="plan" class="' + (P.mode === 'plan' ? 'on' : '') + '">' + esc(t('mode.plan')) + '</button>' +
      '<button data-mode="free" class="' + (P.mode === 'free' ? 'on' : '') + '">' + esc(t('mode.free')) + '</button></div>';
    const bm = boardMarkup(L);
    const isPlan = P.mode === 'plan';
    app.innerHTML = headerHtml(playTitle(ctx, L), backHashFor(ctx), seg) +
      '<main class="play">' +
        '<section class="board-wrap">' +
          (ctx.kind === 'shared' ? '<div class="banner">' + esc(t('shared.title')) + ' <button class="btn tiny" data-act="saveShared">' + esc(t('shared.save')) + '</button></div>' : '') +
          '<svg id="board" class="board" viewBox="' + bm.viewBox + '" preserveAspectRatio="xMidYMid meet">' + bm.html + '</svg>' +
          '<div id="msg" class="msg">' + esc(t(isPlan ? 'hint.plan' : 'hint.free')) + '</div>' +
        '</section>' +
        '<section class="controls">' +
          '<div class="slots-head"><span>' + esc(t(isPlan ? 'slots.plan' : 'slots.trace')) + '</span>' +
            (isPlan
              ? '<button class="btn tiny" data-act="undo">⌫ ' + esc(t('btn.undo')) + '</button><button class="btn tiny" data-act="clear">' + esc(t('btn.clear')) + '</button>'
              : '<button class="btn tiny" data-act="freeReset">↺ ' + esc(t('btn.reset')) + '</button>') +
          '</div>' +
          '<div id="slots" class="slots ' + (isPlan ? 'plan' : 'trace') + (L.slots > 10 ? ' many' : '') + '"></div>' +
          '<div class="pad-wrap">' +
            '<svg class="pad-bg" viewBox="-40 -62 80 124" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + PAD_MOUSE_SVG + '</svg>' +
            '<div class="pad">' +
              padButton('F', 'up') +
              padButton('L', 'left') +
              (isPlan
                ? '<button class="go" data-act="go">' + esc(t('btn.go')) + '</button>'
                : '<button class="go reset" data-act="freeReset" aria-label="' + esc(t('btn.reset')) + '">↺</button>') +
              padButton('R', 'right') +
              padButton('B', 'down') +
            '</div>' +
          '</div>' +
        '</section>' +
      '</main><div id="overlay" class="overlay hidden"></div>';
    renderSlots();
    applyMouse(isPlan ? E.startState(L) : P.free.pos, P.angle, false);
    if (!store.get('tipSeen', false)) showTip();
  }

  /* First-time explanation of the arrows, as a small card over the board. */
  function showTip() {
    const ov = $('#overlay');
    if (!ov) return;
    ov.innerHTML = '<div class="win-card tip-card">' +
      '<svg viewBox="-40 -62 80 124" class="tip-art" aria-hidden="true">' + PAD_MOUSE_SVG +
        '<text x="0" y="-5" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">↑</text>' +
        '<text x="-20" y="22" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">←</text>' +
        '<text x="20" y="22" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">→</text>' +
        '<text x="0" y="46" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">↓</text>' +
      '</svg>' +
      '<p>' + esc(t('tip.perspective')) + '</p>' +
      '<div class="row"><button class="btn primary" data-act="tipOk">' + esc(t('tip.ok')) + '</button></div></div>';
    ov.classList.remove('hidden');
  }

  /* Arrow button with a small word under it: ↑ forward, ↓ back, ← → turn (turns stay on the square). */
  function padButton(cmd, cls) {
    const turnMark = cmd === 'L' ? '<span class="curl">↺</span>' : cmd === 'R' ? '<span class="curl">↻</span>' : '';
    return '<button class="arrow ' + cls + '" data-cmd="' + cmd + '" aria-label="' + esc(t('cmd.' + cmd)) + '">' +
      turnMark + '<span class="glyph">' + ARROWS[cmd] + '</span><span class="lbl">' + esc(t('lbl.' + cmd)) + '</span></button>';
  }

  function renderSlots() {
    const P = play, el = $('#slots');
    if (!el) return;
    if (P.mode === 'plan') {
      el.innerHTML = P.program.map((c, i) =>
        '<button class="slot ' + (c ? 'filled' : '') + (P.cursor === i ? ' cursor' : '') + '" data-slot="' + i + '">' +
          '<span class="num">' + (i + 1) + '.</span><span class="arr">' + (c ? ARROWS[c] : '') + '</span></button>').join('');
    } else {
      el.innerHTML = P.free.trace.length
        ? P.free.trace.map((s, i) =>
          '<span class="slot filled' + (s.ok ? '' : ' fail') + '"><span class="num">' + (i + 1) + '.</span><span class="arr">' + ARROWS[s.cmd] + '</span></span>').join('')
        : '<span class="slots-empty">' + esc(t('slots.traceEmpty')) + '</span>';
      el.scrollLeft = el.scrollWidth;
    }
  }

  function showMsg(text, cls) {
    const el = $('#msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'msg' + (cls ? ' ' + cls : '');
  }

  const mouseEl = () => $('#board .mouse');

  /* Mouse animation: a small tween driven by requestAnimationFrame that writes the
     SVG transform attribute. visual = where the mouse currently is drawn. */
  let visual = null;   // { r, c, a }
  let animTimer = 0;   // setTimeout-driven (requestAnimationFrame pauses in background tabs)

  const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const easeOut = (k) => 1 - (1 - k) * (1 - k);
  const easeBack = (k) => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

  function drawMouse(v) {
    const m = mouseEl();
    if (m) m.setAttribute('transform', mouseTransform({ r: v.r, c: v.c }, v.a));
  }

  function tweenMouse(to, dur, ease) {
    clearTimeout(animTimer);
    const from = visual || to;
    return new Promise((resolve) => {
      const t0 = Date.now();
      const frame = () => {
        const k = Math.min(1, (Date.now() - t0) / dur);
        const e = ease(k);
        visual = { r: from.r + (to.r - from.r) * e, c: from.c + (to.c - from.c) * e, a: from.a + (to.a - from.a) * e };
        drawMouse(visual);
        if (k < 1) animTimer = setTimeout(frame, 16);
        else { visual = to; drawMouse(visual); resolve(); }
      };
      frame();
    });
  }

  function applyMouse(pos, angle, animate) {
    const to = { r: pos.r, c: pos.c, a: angle };
    if (!animate) { clearTimeout(animTimer); visual = to; drawMouse(to); return Promise.resolve(); }
    return tweenMouse(to, 420, easeInOut);
  }

  async function bumpAnim(pos, angle, blocked) {
    const nudged = { r: pos.r + (blocked.r - pos.r) * 0.22, c: pos.c + (blocked.c - pos.c) * 0.22, a: angle };
    await tweenMouse(nudged, 140, easeOut);
    await tweenMouse({ r: pos.r, c: pos.c, a: angle }, 260, easeBack);
  }

  function markSlot(i, cls) {
    const el = $('[data-slot="' + i + '"]');
    if (!el) return;
    el.classList.remove('active', 'done', 'fail');
    if (cls) el.classList.add(cls);
    if (cls === 'active' && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function clearMarks() { $$('.slot').forEach((s) => s.classList.remove('active', 'done', 'fail')); }

  /* plan editing */
  function addCmd(cmd) {
    const P = play;
    if (P.running) return;
    let i = P.cursor != null ? P.cursor : P.program.indexOf(null);
    if (i < 0) { showMsg(t('msg.full'), 'warn'); return; }
    P.program[i] = cmd;
    P.cursor = null;
    SND.click();
    renderSlots();
    showMsg(t('hint.plan'));
  }
  function tapSlot(i) {
    const P = play;
    if (P.running) return;
    if (P.program[i]) { P.program[i] = null; SND.remove(); }
    P.cursor = P.cursor === i ? null : i;
    renderSlots();
  }
  function undoCmd() {
    const P = play;
    if (P.running) return;
    let i = P.program.length - 1;
    while (i >= 0 && !P.program[i]) i--;
    if (i < 0) return;
    P.program[i] = null;
    P.cursor = null;
    SND.remove();
    renderSlots();
  }
  function clearProgram() {
    const P = play;
    if (P.running) return;
    P.program.fill(null);
    P.cursor = null;
    SND.remove();
    renderSlots();
    resetMouse();
    showMsg(t('hint.plan'));
  }
  function resetMouse() {
    const P = play;
    P.angle = ANGLE[P.level.mouse[2]];
    applyMouse(E.startState(P.level), P.angle, false);
  }

  async function runProgram() {
    const P = play;
    if (P.running) return;
    if (P.program.every((x) => !x)) { showMsg(t('msg.empty'), 'warn'); return; }
    P.running = true;
    app.classList.add('running');
    clearMarks();
    showMsg('');
    hideOverlay();
    const res = E.run(P.level, P.program);
    resetMouse();
    await sleep(350);
    for (const st of res.steps) {
      if (play !== P) return; // screen changed mid-run
      markSlot(st.index, 'active');
      if (st.ok) {
        if (st.cmd === 'L') { P.angle -= 90; SND.turn(); }
        else if (st.cmd === 'R') { P.angle += 90; SND.turn(); }
        else SND.step();
        await applyMouse(st.to, P.angle, true);
        await sleep(100);
        markSlot(st.index, 'done');
      } else {
        SND.bump();
        await bumpAnim(st.from, P.angle, st.blocked);
        markSlot(st.index, 'fail');
      }
      await sleep(110);
    }
    if (play !== P) return;
    P.running = false;
    app.classList.remove('running');
    if (res.success) onWin(false);
    else if (res.reason === 'wall' || res.reason === 'edge') {
      const failed = P.program[res.failIndex];
      showMsg(t('msg.' + res.reason, { n: res.failIndex + 1 }) + ' ' + t(failed === 'B' ? 'msg.hintB' : 'msg.hintF'), 'bad');
    }
    else if (res.reason === 'short' && !P.program.some((c) => c === 'F' || c === 'B')) showMsg(t('msg.onlyTurns'), 'bad');
    else showMsg(t('msg.' + res.reason), 'bad');
  }

  /* free mode: taps are queued so quick successive presses are not lost */
  function freeCmd(cmd) {
    const P = play;
    if (P.free.queue.length >= 6) return;
    P.free.queue.push(cmd);
    if (!P.running) freeDrain();
  }
  async function freeDrain() {
    const P = play;
    while (play === P && P.free.queue.length && !P.free.done) {
      await freeStep(P.free.queue.shift());
    }
  }
  async function freeStep(cmd) {
    const P = play;
    P.running = true;
    const res = E.step(P.level, P.lookup, P.free.pos, cmd);
    P.free.trace.push({ cmd, ok: res.ok });
    renderSlots();
    if (res.ok) {
      if (cmd === 'L') { P.angle -= 90; SND.turn(); }
      else if (cmd === 'R') { P.angle += 90; SND.turn(); }
      else SND.step();
      P.free.pos = res.pos;
      showMsg(t(cmd === 'L' || cmd === 'R' ? 'hint.turned' : 'hint.free'));
      await applyMouse(res.pos, P.angle, true);
      await sleep(60);
      if (play !== P) return;
      if (E.isCheese(P.level, res.pos)) { P.running = false; P.free.done = true; P.free.queue = []; onWin(true); return; }
    } else {
      SND.bump();
      showMsg(t('msg.freeBump.' + res.reason) + ' ' + t(cmd === 'B' ? 'msg.hintB' : 'msg.hintF'), 'bad');
      await bumpAnim(P.free.pos, P.angle, res.blocked);
    }
    if (play === P) P.running = false;
  }
  function freeReset() {
    const P = play;
    P.running = false;
    P.free = { pos: E.startState(P.level), trace: [], queue: [], done: false };
    resetMouse();
    renderSlots();
    showMsg(t('hint.free'));
    hideOverlay();
  }

  function setMode(m) {
    const P = play;
    if (P.mode === m) return;
    P.mode = m;
    store.set('mode', m);
    P.running = false;
    app.classList.remove('running');
    P.free = { pos: E.startState(P.level), trace: [], queue: [], done: false };
    P.angle = ANGLE[P.level.mouse[2]];
    renderPlay();
  }

  /* win */
  function confettiHtml() {
    const colors = ['#4f9be8', '#ffd23f', '#43b36b', '#ff8c42', '#b388eb', '#e5484d'];
    let h = '';
    for (let i = 0; i < 48; i++) {
      h += '<i class="confetti" style="left:' + (Math.random() * 100) + '%;background:' + colors[i % colors.length] +
        ';animation-duration:' + (2.2 + Math.random() * 1.8) + 's;animation-delay:' + (Math.random() * 0.8) + 's;transform:rotate(' + (Math.random() * 360) + 'deg)"></i>';
    }
    return h;
  }
  function onWin(free) {
    const P = play;
    SND.win();
    const key = levelKey(P.ctx);
    if (key) markDone(key);
    const next = nextHashFor(P.ctx);
    const ov = $('#overlay');
    ov.innerHTML = confettiHtml() +
      '<div class="win-card"><div class="win-emoji">🐭🧀</div><h2>' + esc(t('win.title')) + '</h2>' +
      '<p>' + esc(t(free ? 'msg.freeWin' : 'msg.win')) + '</p><div class="row">' +
        '<button class="btn" data-act="again">↺ ' + esc(t('btn.again')) + '</button>' +
        (next ? '<a class="btn primary" href="' + next + '">' + esc(t('btn.next')) + ' ›</a>' : '') +
        (P.ctx.kind === 'shared' ? '<button class="btn" data-act="saveShared">' + esc(t('shared.save')) + '</button>' : '') +
        '<a class="btn ghost" href="' + backHashFor(P.ctx) + '">' + esc(t('btn.levels')) + '</a>' +
      '</div></div>';
    ov.classList.remove('hidden');
    showMsg(t(free ? 'msg.freeWin' : 'msg.win'), 'good');
  }
  function hideOverlay() { const ov = $('#overlay'); if (ov) { ov.classList.add('hidden'); ov.innerHTML = ''; } }
  function again() {
    hideOverlay();
    if (play.mode === 'free') freeReset();
    else { clearMarks(); resetMouse(); showMsg(t('hint.plan')); }
  }
  function saveShared() {
    const P = play;
    const list = customLevels();
    const id = newId();
    const copy = Object.assign({ id }, E.normalize(P.level));
    copy.name = copy.name || t('custom.untitled');
    list.push(copy);
    saveCustom(list);
    toast(t('shared.saved'));
    location.hash = '#play/c/' + id;
  }

  /* ---------- custom level list ---------- */
  function customScreen() {
    const list = customLevels();
    const p = progress();
    app.innerHTML = headerHtml(t('custom.title'), '#') +
      '<main class="list">' +
      (list.length === 0 ? '<p class="sub empty">' + esc(t('custom.empty')) + '</p>' : '') +
      '<div class="custom-list">' +
      list.map((l) =>
        '<div class="custom-item">' +
          '<a class="custom-preview" href="#play/c/' + l.id + '">' + boardSvg(l, 'mini') + '</a>' +
          '<div class="custom-body"><div class="custom-name">' + (p['custom:' + l.id] ? '★ ' : '') + esc(l.name || t('custom.untitled')) + '</div>' +
          '<div class="custom-meta">' + esc(t('custom.slots', { n: l.slots })) + '</div>' +
          '<div class="row left">' +
            '<a class="btn primary small" href="#play/c/' + l.id + '">▶ ' + esc(t('custom.play')) + '</a>' +
            '<a class="btn small" href="#editor/' + l.id + '">✏️ ' + esc(t('custom.edit')) + '</a>' +
            '<button class="btn small" data-act="shareCustom" data-id="' + l.id + '">🔗 ' + esc(t('custom.share')) + '</button>' +
            '<button class="btn small danger" data-act="deleteCustom" data-id="' + l.id + '">🗑 ' + esc(t('custom.delete')) + '</button>' +
          '</div></div></div>').join('') +
      '</div>' +
      '<div class="row center"><a class="btn primary" href="#editor">✏️ ' + esc(t('home.newLevel')) + '</a></div>' +
      '<div id="shareBox" class="share-box hidden"></div>' +
      '</main>';
  }

  function shareLevel(level) {
    const url = location.href.split('#')[0] + '#l/' + E.encodeLevel(level);
    showShareBox(url);
    if (navigator.share) {
      navigator.share({ title: t('app.title'), text: level.name || '', url }).catch(() => {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => toast(t('editor.copied')), () => {});
    }
  }
  function showShareBox(url) {
    const box = $('#shareBox');
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML = '<label>' + esc(t('editor.copyManual')) + '</label><input type="text" readonly value="' + esc(url) + '" onclick="this.select()"><p class="sub">' + esc(t('editor.shareHint')) + '</p>';
    if (box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
  }
  function deleteCustom(id) {
    if (!confirm(t('confirm.delete'))) return;
    saveCustom(customLevels().filter((l) => l.id !== id));
    if (location.hash.startsWith('#editor')) location.hash = '#custom';
    else rerender();
  }

  /* ---------- editor ---------- */
  let ed = null;

  function editorScreen(id) {
    const existing = id ? customLevels().find((l) => l.id === id) : null;
    if (id && !existing) { location.hash = '#custom'; return; }
    ed = {
      id: existing ? existing.id : null,
      name: existing ? existing.name : '',
      slots: existing ? existing.slots : 5,
      slotsTouched: !!existing,
      cells: existing ? existing.cells.map((c) => c.slice()) : [],
      mouse: existing ? existing.mouse.slice() : null,
      cheese: existing ? existing.cheese.slice() : null,
      walls: existing ? existing.walls.map((w) => w.slice()) : [],
      tool: 'cells',
    };
    renderEditor();
  }

  const edLevel = () => ({ name: ed.name, slots: ed.slots, cells: ed.cells, mouse: ed.mouse, cheese: ed.cheese, walls: ed.walls });
  const edBounds = () => ({ minR: 0, minC: 0, maxR: EDITOR_ROWS - 1, maxC: EDITOR_COLS - 1, rows: EDITOR_ROWS, cols: EDITOR_COLS });
  const cellIdx = (r, c) => ed.cells.findIndex((p) => p[0] === r && p[1] === c);

  function renderEditor() {
    const tools = ['cells', 'walls', 'mouse', 'cheese'].map((k) =>
      '<button data-tool="' + k + '" class="' + (ed.tool === k ? 'on' : '') + '">' +
        ({ cells: '▦', walls: '▬', mouse: '🐭', cheese: '🧀' })[k] + ' ' + esc(t('editor.tool.' + k)) + '</button>').join('');
    app.innerHTML = headerHtml(t(ed.id ? 'editor.titleEdit' : 'editor.title'), ed.id ? '#custom' : '#') +
      '<main class="editor">' +
        '<section class="board-wrap">' +
          '<svg id="edBoard" class="board editor-board"></svg>' +
          '<div id="edInfo" class="msg"></div>' +
        '</section>' +
        '<section class="controls">' +
          '<div class="tools" role="group">' + tools + '</div>' +
          '<p id="edHelp" class="sub">' + esc(t('editor.help.' + ed.tool)) + '</p>' +
          '<label class="field"><span>' + esc(t('editor.name')) + '</span><input id="edName" type="text" maxlength="40" value="' + esc(ed.name) + '" placeholder="' + esc(t('custom.untitled')) + '"></label>' +
          '<div class="field"><span>' + esc(t('editor.slots')) + '</span><div class="stepper">' +
            '<button class="btn" data-act="slotsMinus">−</button><strong id="slotsVal">' + ed.slots + '</strong><button class="btn" data-act="slotsPlus">+</button></div></div>' +
          '<div class="row">' +
            '<button class="btn primary" data-act="edSavePlay">▶ ' + esc(t('editor.savePlay')) + '</button>' +
            '<button class="btn" data-act="edSave">💾 ' + esc(t('editor.save')) + '</button>' +
            '<button class="btn" data-act="edShare">🔗 ' + esc(t('editor.share')) + '</button>' +
            (ed.id ? '<button class="btn danger" data-act="deleteCustom" data-id="' + ed.id + '">🗑 ' + esc(t('editor.delete')) + '</button>' : '') +
          '</div>' +
          '<div id="shareBox" class="share-box hidden"></div>' +
        '</section>' +
      '</main>';
    const svg = $('#edBoard');
    svg.addEventListener('pointerdown', onEditorTap);
    $('#edName').addEventListener('input', (ev) => { ed.name = ev.target.value; });
    renderEditorBoard();
    updateEditorInfo();
  }

  function renderEditorBoard() {
    const svg = $('#edBoard');
    if (!svg) return;
    const m = boardMarkup(edLevel(), { grid: true, bounds: edBounds() });
    svg.setAttribute('viewBox', m.viewBox);
    svg.innerHTML = m.html;
  }

  function editorStatus() {
    const lvl = edLevel();
    if (!lvl.cells.length || !lvl.mouse || !lvl.cheese) return { ok: false, msg: t('editor.needMouse') };
    const best = E.solve(lvl);
    if (!best) return { ok: false, msg: t('editor.unsolvable') };
    if (ed.slots < best.length) return { ok: false, msg: t('editor.slotsTooFew', { n: best.length }), best };
    return { ok: true, msg: t('editor.shortest', { n: best.length }), best };
  }

  function updateEditorInfo() {
    let st = editorStatus();
    if (st.best && !ed.slotsTouched && ed.slots !== st.best.length) {
      ed.slots = st.best.length;
      $('#slotsVal').textContent = ed.slots;
      st = editorStatus();
    }
    const info = $('#edInfo');
    info.textContent = st.msg;
    info.className = 'msg ' + (st.ok ? 'good' : 'warn');
  }

  function svgPoint(svg, ev) {
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function onEditorTap(ev) {
    ev.preventDefault();
    const svg = ev.currentTarget;
    const p = svgPoint(svg, ev);
    const c = Math.floor(p.x / S), r = Math.floor(p.y / S);
    if (r < 0 || c < 0 || r >= EDITOR_ROWS || c >= EDITOR_COLS) return;
    const idx = cellIdx(r, c);
    const has = idx >= 0;
    const samePos = (a, b) => a && a[0] === b[0] && a[1] === b[1];
    switch (ed.tool) {
      case 'cells':
        if (has) {
          ed.cells.splice(idx, 1);
          ed.walls = ed.walls.filter((w) => !(w[0] === r && w[1] === c) && !(w[2] === r && w[3] === c));
          if (samePos(ed.mouse, [r, c])) ed.mouse = null;
          if (samePos(ed.cheese, [r, c])) ed.cheese = null;
          SND.remove();
        } else { ed.cells.push([r, c]); SND.click(); }
        break;
      case 'walls': {
        if (!has) { toast(t('editor.needCell')); return; }
        const dx = p.x - c * S, dy = p.y - r * S;
        const m = Math.min(dx, S - dx, dy, S - dy);
        let nr = r, nc = c;
        if (m === dx) nc = c - 1; else if (m === S - dx) nc = c + 1; else if (m === dy) nr = r - 1; else nr = r + 1;
        if (cellIdx(nr, nc) < 0) { toast(t('editor.wallNeedsTwo')); return; }
        const wi = ed.walls.findIndex((w) => (w[0] === r && w[1] === c && w[2] === nr && w[3] === nc) || (w[0] === nr && w[1] === nc && w[2] === r && w[3] === c));
        if (wi >= 0) { ed.walls.splice(wi, 1); SND.remove(); } else { ed.walls.push([r, c, nr, nc]); SND.click(); }
        break;
      }
      case 'mouse':
        if (!has) ed.cells.push([r, c]);
        if (samePos(ed.mouse, [r, c])) ed.mouse[2] = E.turn(ed.mouse[2], 'R');
        else ed.mouse = [r, c, 'N'];
        SND.turn();
        break;
      case 'cheese':
        if (!has) ed.cells.push([r, c]);
        ed.cheese = [r, c];
        SND.click();
        break;
    }
    renderEditorBoard();
    updateEditorInfo();
  }

  function setTool(k) {
    ed.tool = k;
    $$('.tools button').forEach((b) => b.classList.toggle('on', b.dataset.tool === k));
    $('#edHelp').textContent = t('editor.help.' + k);
  }
  function changeSlots(d) {
    ed.slots = Math.max(1, Math.min(30, ed.slots + d));
    ed.slotsTouched = true;
    $('#slotsVal').textContent = ed.slots;
    updateEditorInfo();
    SND.click();
  }
  function editorSave(andPlay) {
    const st = editorStatus();
    if (!st.ok) { toast(st.msg); return; }
    const lvl = E.normalize(edLevel());
    lvl.name = (ed.name || '').trim() || t('custom.untitled');
    const list = customLevels();
    if (ed.id) {
      const i = list.findIndex((l) => l.id === ed.id);
      if (i >= 0) list[i] = Object.assign({}, list[i], lvl); else list.push(Object.assign({ id: ed.id }, lvl));
    } else {
      ed.id = newId();
      list.push(Object.assign({ id: ed.id }, lvl));
    }
    saveCustom(list);
    toast(t('editor.saved'));
    if (andPlay) location.hash = '#play/c/' + ed.id;
    else if (location.hash !== '#editor/' + ed.id) history.replaceState(null, '', '#editor/' + ed.id);
  }
  function editorShare() {
    const st = editorStatus();
    if (!st.ok) { toast(st.msg); return; }
    const lvl = E.normalize(edLevel());
    lvl.name = (ed.name || '').trim();
    shareLevel(lvl);
  }

  /* ---------- routing ---------- */
  let current = { screen: 'home' };

  function render() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    window.scrollTo(0, 0);
    app.classList.remove('running');
    play = null; ed = null;
    if (parts[0] === 'group' && GROUPS.includes(parts[1])) { current = { screen: 'group' }; return groupScreen(parts[1]); }
    if (parts[0] === 'play') {
      if (parts[1] === 'c') {
        const l = customLevels().find((x) => x.id === parts[2]);
        if (!l) { location.replace('#custom'); return; }
        current = { screen: 'play' };
        return playScreen(l, { kind: 'custom', id: l.id });
      }
      const g = parts[1], i = parseInt(parts[2], 10);
      const lv = LEVELS.filter((l) => l.group === g);
      if (!lv[i]) { location.replace('#'); return; }
      current = { screen: 'play' };
      return playScreen(lv[i], { kind: 'builtin', group: g, index: i });
    }
    if (parts[0] === 'l' && parts[1]) {
      const l = E.decodeLevel(parts[1]);
      if (!l) { location.replace('#'); return; }
      current = { screen: 'play' };
      return playScreen(l, { kind: 'shared', enc: parts[1] });
    }
    if (parts[0] === 'custom') { current = { screen: 'custom' }; return customScreen(); }
    if (parts[0] === 'editor') { current = { screen: 'editor' }; return editorScreen(parts[1] || null); }
    if (parts[0] === 'howto') { current = { screen: 'howto' }; return howtoScreen(); }
    current = { screen: 'home' };
    homeScreen();
  }

  /* Re-render after a language change, keeping play/editor state. */
  function rerender() {
    if (current.screen === 'play' && play) { const keep = play; renderPlay(); if (keep.mode === 'plan') resetMouse(); return; }
    if (current.screen === 'editor' && ed) { renderEditor(); return; }
    render();
  }

  /* ---------- events ---------- */
  app.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-lang],[data-act],[data-cmd],[data-mode],[data-slot],[data-tool]');
    if (!b) return;
    SND.unlock();
    const d = b.dataset;
    if (d.lang) return setLang(d.lang);
    if (d.tool) return setTool(d.tool);
    if (d.cmd && play) return play.mode === 'plan' ? addCmd(d.cmd) : freeCmd(d.cmd);
    if (d.mode && play) return setMode(d.mode);
    if (d.slot != null && play) return tapSlot(parseInt(d.slot, 10));
    switch (d.act) {
      case 'sound': return toggleSound();
      case 'tipOk': store.set('tipSeen', true); hideOverlay(); return;
      case 'go': return runProgram();
      case 'undo': return undoCmd();
      case 'clear': return clearProgram();
      case 'freeReset': return freeReset();
      case 'again': return again();
      case 'saveShared': return saveShared();
      case 'shareCustom': { const l = customLevels().find((x) => x.id === d.id); if (l) shareLevel(l); return; }
      case 'deleteCustom': return deleteCustom(d.id);
      case 'slotsMinus': return changeSlots(-1);
      case 'slotsPlus': return changeSlots(1);
      case 'edSave': return editorSave(false);
      case 'edSavePlay': return editorSave(true);
      case 'edShare': return editorShare();
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (!play || ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
    const map = { ArrowUp: 'F', ArrowDown: 'B', ArrowLeft: 'L', ArrowRight: 'R' };
    if (map[ev.key]) { ev.preventDefault(); SND.unlock(); if (play.mode === 'plan') addCmd(map[ev.key]); else freeCmd(map[ev.key]); }
    else if (ev.key === 'Enter' && play.mode === 'plan') { ev.preventDefault(); runProgram(); }
    else if (ev.key === 'Backspace' && play.mode === 'plan') { ev.preventDefault(); undoCmd(); }
    else if (ev.key === 'Escape') hideOverlay();
  });

  window.addEventListener('hashchange', render);
  applyLang();
  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
    // When a new version of the worker takes over an already open page, reload once so the
    // page runs the new files (not on the very first install).
    let hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !refreshing && !(play && play.running)) { refreshing = true; location.reload(); }
      hadController = true;
    });
  }
})();
