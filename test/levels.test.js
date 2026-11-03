// Run with:  node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../js/engine.js');
const LEVELS = require('../js/levels.js');

const EXPECTED_TURNS = { beginner: (n) => n === 0, easy: (n) => n === 1, medium: (n) => n === 2, hard: (n) => n >= 3 };

test('there are 14 levels with unique ids', () => {
  assert.equal(LEVELS.length, 14);
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, 14);
});

for (const level of LEVELS) {
  test(`level ${level.id}: mouse and cheese sit on cells, walls join neighbours`, () => {
    const cells = new Set(level.cells.map((c) => c.join(',')));
    assert.ok(cells.has(level.mouse.slice(0, 2).join(',')), 'mouse on a cell');
    assert.ok(cells.has(level.cheese.join(',')), 'cheese on a cell');
    for (const [r1, c1, r2, c2] of level.walls) {
      assert.ok(cells.has(`${r1},${c1}`) && cells.has(`${r2},${c2}`), 'wall between cells');
      assert.equal(Math.abs(r1 - r2) + Math.abs(c1 - c2), 1, 'wall between neighbours');
    }
  });

  test(`level ${level.id}: written solution reaches the cheese within the slots`, () => {
    const program = E.parseProgram(level.solution);
    assert.ok(program.length <= level.slots, `solution (${program.length}) fits in ${level.slots} slots`);
    const res = E.run(level, program);
    assert.equal(res.success, true, `solution ${level.solution} should succeed (${res.reason})`);
    assert.ok(EXPECTED_TURNS[level.group](E.countTurns(program)), `turn count matches group ${level.group}`);
  });

  test(`level ${level.id}: shortest solution found by search fits in the slots`, () => {
    const best = E.solve(level);
    assert.ok(best, 'solvable');
    assert.ok(best.length <= level.slots);
    assert.equal(E.run(level, best).success, true);
  });

  test(`level ${level.id}: survives share-link encoding`, () => {
    const back = E.decodeLevel(E.encodeLevel(level));
    assert.ok(back);
    assert.equal(E.run(back, E.parseProgram(level.solution)).success, true);
  });
}

test('engine: turning is separate from moving', () => {
  const lvl = { cells: [[0, 0], [0, 1]], mouse: [0, 0, 'N'], cheese: [0, 1], walls: [] };
  assert.equal(E.run(lvl, ['F']).reason, 'edge');
  assert.equal(E.run(lvl, ['R', 'F']).success, true);
  assert.equal(E.run(lvl, ['R', 'F', 'B']).reason, 'passed');
  assert.equal(E.run(lvl, ['R']).reason, 'short');
});

test('engine: walls block forward and backward moves', () => {
  const lvl = { cells: [[0, 0], [0, 1]], mouse: [0, 0, 'E'], cheese: [0, 1], walls: [[0, 0, 0, 1]] };
  assert.equal(E.run(lvl, ['F']).reason, 'wall');
  const lvl2 = { cells: [[0, 0], [0, 1]], mouse: [0, 1, 'E'], cheese: [0, 0], walls: [[0, 1, 0, 0]] };
  assert.equal(E.run(lvl2, ['B']).reason, 'wall');
  assert.equal(E.solve(lvl2), null);
});
