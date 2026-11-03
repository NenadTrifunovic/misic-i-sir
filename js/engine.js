/* Mišić i sir – game engine (pure logic, no DOM).
   Works in the browser (window.MouseEngine) and in Node (module.exports). */
(function (root) {
  'use strict';

  const DIRS = ['N', 'E', 'S', 'W'];
  const DELTA = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
  const ARROW_TO_CMD = { '↑': 'F', '↓': 'B', '←': 'L', '→': 'R' };
  const CMD_TO_ARROW = { F: '↑', B: '↓', L: '←', R: '→' };

  const key = (r, c) => r + ',' + c;

  function wallKey(r1, c1, r2, c2) {
    if (r1 > r2 || (r1 === r2 && c1 > c2)) return key(r2, c2) + '|' + key(r1, c1);
    return key(r1, c1) + '|' + key(r2, c2);
  }

  function prepare(level) {
    return {
      cells: new Set(level.cells.map((c) => key(c[0], c[1]))),
      walls: new Set((level.walls || []).map((w) => wallKey(w[0], w[1], w[2], w[3]))),
    };
  }

  function turn(dir, cmd) {
    const i = DIRS.indexOf(dir);
    return cmd === 'L' ? DIRS[(i + 3) % 4] : DIRS[(i + 1) % 4];
  }

  function startState(level) {
    return { r: level.mouse[0], c: level.mouse[1], dir: level.mouse[2] };
  }

  function isCheese(level, p) {
    return !!level.cheese && p.r === level.cheese[0] && p.c === level.cheese[1];
  }

  /* Execute one command. Returns { ok, pos, reason?, blocked? } */
  function step(level, lookup, pos, cmd) {
    lookup = lookup || prepare(level);
    if (cmd === 'L' || cmd === 'R') {
      return { ok: true, pos: { r: pos.r, c: pos.c, dir: turn(pos.dir, cmd) } };
    }
    const d = DELTA[pos.dir];
    const m = cmd === 'B' ? -1 : 1;
    const r = pos.r + d[0] * m;
    const c = pos.c + d[1] * m;
    if (!lookup.cells.has(key(r, c))) return { ok: false, pos, reason: 'edge', blocked: { r, c } };
    if (lookup.walls.has(wallKey(pos.r, pos.c, r, c))) return { ok: false, pos, reason: 'wall', blocked: { r, c } };
    return { ok: true, pos: { r, c, dir: pos.dir } };
  }

  /* Run a whole program (array of 'F','B','L','R'; empty entries are skipped). */
  function run(level, program) {
    const lookup = prepare(level);
    let pos = startState(level);
    const steps = [];
    let visitedCheese = isCheese(level, pos);
    for (let i = 0; i < program.length; i++) {
      const cmd = program[i];
      if (!cmd) continue;
      const from = pos;
      const res = step(level, lookup, pos, cmd);
      if (!res.ok) {
        steps.push({ index: i, cmd, from, to: from, ok: false, reason: res.reason, blocked: res.blocked });
        return { success: false, reason: res.reason, failIndex: i, steps, pos, visitedCheese };
      }
      pos = res.pos;
      steps.push({ index: i, cmd, from, to: pos, ok: true });
      if (isCheese(level, pos)) visitedCheese = true;
    }
    const success = isCheese(level, pos);
    return {
      success,
      reason: success ? 'cheese' : visitedCheese ? 'passed' : 'short',
      failIndex: -1,
      steps,
      pos,
      visitedCheese,
    };
  }

  function parseProgram(str) {
    return Array.from(str)
      .map((ch) => ARROW_TO_CMD[ch] || (CMD_TO_ARROW[ch] ? ch : null))
      .filter(Boolean);
  }

  function toArrows(program) {
    return program.filter(Boolean).map((c) => CMD_TO_ARROW[c]).join('');
  }

  function countTurns(program) {
    return program.filter((c) => c === 'L' || c === 'R').length;
  }

  function bounds(level) {
    if (!level.cells.length) return { minR: 0, maxR: 0, minC: 0, maxC: 0, rows: 1, cols: 1 };
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const [r, c] of level.cells) {
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }
    return { minR, maxR, minC, maxC, rows: maxR - minR + 1, cols: maxC - minC + 1 };
  }

  /* Breadth-first search for the shortest program; null when unsolvable. */
  function solve(level) {
    if (!level.mouse || !level.cheese) return null;
    const lookup = prepare(level);
    const start = startState(level);
    if (!lookup.cells.has(key(start.r, start.c))) return null;
    if (!lookup.cells.has(key(level.cheese[0], level.cheese[1]))) return null;
    const sk = (p) => p.r + ',' + p.c + ',' + p.dir;
    const prev = new Map([[sk(start), null]]);
    const queue = [start];
    while (queue.length) {
      const p = queue.shift();
      if (isCheese(level, p)) {
        const cmds = [];
        let k = sk(p);
        while (prev.get(k)) {
          const [pk, cmd] = prev.get(k);
          cmds.push(cmd);
          k = pk;
        }
        return cmds.reverse();
      }
      for (const cmd of ['F', 'B', 'L', 'R']) {
        const res = step(level, lookup, p, cmd);
        if (!res.ok) continue;
        const k = sk(res.pos);
        if (prev.has(k)) continue;
        prev.set(k, [sk(p), cmd]);
        queue.push(res.pos);
      }
    }
    return null;
  }

  /* Shift a level so its top-left cell is at (0,0). */
  function normalize(level) {
    const b = bounds(level);
    const sh = (p) => [p[0] - b.minR, p[1] - b.minC];
    return Object.assign({}, level, {
      cells: level.cells.map(sh),
      mouse: level.mouse ? [level.mouse[0] - b.minR, level.mouse[1] - b.minC, level.mouse[2]] : null,
      cheese: level.cheese ? sh(level.cheese) : null,
      walls: (level.walls || []).map((w) => [w[0] - b.minR, w[1] - b.minC, w[2] - b.minR, w[3] - b.minC]),
    });
  }

  /* --- URL-safe encoding for sharing levels --- */
  function utf8Encode(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    return Uint8Array.from(Buffer.from(str, 'utf8'));
  }
  function utf8Decode(bytes) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
    return Buffer.from(bytes).toString('utf8');
  }
  function b64encode(str) {
    const bytes = utf8Encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = typeof btoa === 'function' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = typeof atob === 'function' ? atob(s) : Buffer.from(s, 'base64').toString('binary');
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return utf8Decode(bytes);
  }

  function encodeLevel(level) {
    const l = normalize(level);
    return b64encode(
      JSON.stringify({ v: 1, n: l.name || '', s: l.slots, c: l.cells, m: l.mouse, h: l.cheese, w: l.walls || [] })
    );
  }

  const isInt = (x) => Number.isInteger(x) && x >= 0 && x < 50;
  const isCell = (p) => Array.isArray(p) && p.length >= 2 && isInt(p[0]) && isInt(p[1]);

  function decodeLevel(str) {
    try {
      const o = JSON.parse(b64decode(str));
      if (!o || !Array.isArray(o.c) || !o.c.length || !o.c.every(isCell)) return null;
      if (!isCell(o.m) || !DIRS.includes(o.m[2]) || !isCell(o.h)) return null;
      const walls = Array.isArray(o.w)
        ? o.w.filter((w) => Array.isArray(w) && w.length === 4 && w.every(isInt))
        : [];
      return {
        name: String(o.n || '').slice(0, 40),
        slots: Math.max(1, Math.min(30, (o.s | 0) || 5)),
        cells: o.c.map((p) => [p[0], p[1]]),
        mouse: [o.m[0], o.m[1], o.m[2]],
        cheese: [o.h[0], o.h[1]],
        walls,
      };
    } catch (e) {
      return null;
    }
  }

  const api = {
    DIRS, DELTA, CMD_TO_ARROW, ARROW_TO_CMD,
    prepare, turn, startState, isCheese, step, run,
    parseProgram, toArrows, countTurns, bounds, solve, normalize,
    encodeLevel, decodeLevel,
  };
  root.MouseEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
