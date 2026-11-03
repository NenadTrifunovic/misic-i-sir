/* The 14 built-in levels. Coordinates are [row, col], row 0 at the top.
   mouse: [row, col, facing]  facing: N (up), E (right), S (down), W (left)
   walls: [r1, c1, r2, c2]    a wall between two neighbouring cells
   solution: one valid plan, used by the tests only. */
(function (root) {
  'use strict';

  const row = (r, c1, c2) => { const a = []; for (let c = c1; c <= c2; c++) a.push([r, c]); return a; };
  const col = (c, r1, r2) => { const a = []; for (let r = r1; r <= r2; r++) a.push([r, c]); return a; };

  const LEVELS = [
    /* ---- Beginner (0 turns) ---- */
    { id: 'b1', group: 'beginner', slots: 5, cells: row(0, 0, 5), mouse: [0, 0, 'E'], cheese: [0, 5], walls: [], solution: '↑↑↑↑↑' },
    { id: 'b2', group: 'beginner', slots: 3, cells: col(0, 0, 3), mouse: [0, 0, 'S'], cheese: [3, 0], walls: [], solution: '↑↑↑' },

    /* ---- Easy (1 turn) ---- */
    { id: 'e1', group: 'easy', slots: 5, cells: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], mouse: [2, 0, 'N'], cheese: [0, 2], walls: [], solution: '↑↑→↑↑' },
    { id: 'e2', group: 'easy', slots: 5, cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], mouse: [0, 0, 'S'], cheese: [2, 2], walls: [], solution: '↑↑←↑↑' },
    { id: 'e3', group: 'easy', slots: 5, cells: [...row(0, 0, 3), ...row(1, 1, 3)], mouse: [0, 0, 'E'], cheese: [1, 3],
      walls: [[0, 1, 1, 1], [0, 2, 1, 2]], solution: '↑↑↑→↑' },

    /* ---- Medium (2 turns) ---- */
    { id: 'm1', group: 'medium', slots: 5, cells: [...row(0, 0, 1), ...row(1, 0, 1)], mouse: [1, 1, 'N'], cheese: [1, 0],
      walls: [[1, 0, 1, 1]], solution: '↑←↑←↑' },
    { id: 'm2', group: 'medium', slots: 7, cells: [[0, 1], [0, 2], [1, 2], [2, 0], [2, 1], [2, 2]], mouse: [2, 0, 'E'], cheese: [0, 1], walls: [], solution: '↑↑←↑↑←↑' },
    { id: 'm3', group: 'medium', slots: 10, cells: [...row(0, 0, 4), ...row(1, 1, 4)], mouse: [0, 0, 'E'], cheese: [1, 1],
      walls: [[0, 1, 1, 1], [0, 2, 1, 2], [0, 3, 1, 3]], solution: '↑↑↑↑→↑→↑↑↑' },

    /* ---- Hard (3+ turns) ---- */
    { id: 'h1', group: 'hard', slots: 10, cells: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3], [2, 4]], mouse: [0, 0, 'E'], cheese: [2, 4], walls: [], solution: '↑→↑←↑→↑←↑↑' },
    { id: 'h2', group: 'hard', slots: 10, cells: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2], [3, 0], [3, 1], [3, 2]], mouse: [3, 0, 'E'], cheese: [0, 0], walls: [], solution: '↑↑←↑↑←↑↑→↑' },
    { id: 'h3', group: 'hard', slots: 10, cells: [[0, 1], [0, 2], [0, 3], [1, 1], [1, 3], [2, 0], [2, 1], [2, 3]], mouse: [2, 0, 'E'], cheese: [2, 3], walls: [], solution: '↑←↑↑→↑↑→↑↑' },
    { id: 'h4', group: 'hard', slots: 12, cells: [...row(0, 0, 3), ...row(1, 0, 3), [2, 0], [2, 2], [2, 3], [3, 3]], mouse: [2, 0, 'N'], cheese: [3, 3],
      walls: [[0, 0, 1, 0], [1, 2, 1, 3], [1, 2, 2, 2]], solution: '↑→↑←↑→↑↑→↑↑↑' },
    { id: 'h5', group: 'hard', slots: 16, cells: [[0, 0], [0, 1], ...row(1, 0, 4), ...row(2, 0, 2)], mouse: [0, 0, 'S'], cheese: [1, 4],
      walls: [[0, 0, 1, 0], [1, 1, 1, 2], [1, 1, 2, 1]], solution: '←↑→↑→↑←↑←↑↑←↑→↑↑' },
    { id: 'h6', group: 'hard', slots: 16, cells: [...row(0, 0, 5), ...row(1, 1, 5), ...row(2, 2, 4)], mouse: [0, 0, 'E'], cheese: [0, 5],
      walls: [[0, 1, 0, 2], [0, 2, 1, 2], [0, 3, 1, 3], [0, 4, 1, 4], [1, 2, 1, 3], [2, 3, 2, 4]], solution: '↑→↑←↑→↑←↑←↑→↑↑←↑' },
  ];

  root.MOUSE_LEVELS = LEVELS;
  if (typeof module !== 'undefined' && module.exports) module.exports = LEVELS;
})(typeof window !== 'undefined' ? window : globalThis);
