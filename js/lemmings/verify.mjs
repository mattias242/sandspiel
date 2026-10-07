// Plays every level headlessly with a scripted solution and checks that
// enough lemmings get saved. Run with `npm run verify-lemmings`.

import { createRequire } from "module";
import { LEVELS, SKILLS, SIZE } from "./levels.js";

const require = createRequire(import.meta.url);
const { Universe, Lemmings, Species, LemState } = require(
  "../../crate/pkg-node/sandtable.js"
);

const STRIDE = 8;

function lemmingsOf(game) {
  const data = game.data();
  const out = [];
  for (let i = 0; i < data.length; i += STRIDE) {
    out.push({
      x: data[i],
      y: data[i + 1],
      dir: data[i + 2],
      state: data[i + 3],
      index: data[i + 7],
    });
  }
  return out;
}

// Gives `skill` to the first lemming matching `when`, `times` times.
const rule = (skill, when, times = 1) => ({ skill, when, times, done: new Set() });

const walking = (l) => l.state === LemState.Walking;

const SOLUTIONS = {
  "Just dig!": [rule("digger", (l) => walking(l) && l.x >= 110 && l.y < 125)],
  "Bash on through": [
    rule("basher", (l) => walking(l) && l.dir === 1 && l.x >= 88 && l.x < 95),
  ],
  "Mind the gap": [
    rule("builder", (l) => walking(l) && l.dir === 1 && l.x >= 83 && l.x < 88),
  ],
  "Up and over": [
    rule("climber", walking, 10),
    rule("floater", walking, 10),
  ],
  "Going out with a bang": [rule("bomber", (l) => walking(l) && l.y < 170)],
  "Mine, all mine": [
    rule("miner", (l) => walking(l) && l.dir === 1 && l.x >= 140 && l.x < 150),
  ],
  Sandspiel: [
    rule("builder", (l) => walking(l) && l.dir === 1 && l.x >= 83 && l.x < 89),
    rule("basher", (l) => walking(l) && l.dir === 1 && l.x >= 142 && l.x < 150),
    rule("digger", (l) => walking(l) && l.x >= 195 && l.x < 210 && l.y < 102),
  ],
};

function play(level, solution, { verbose = false } = {}) {
  const u = Universe.new(SIZE, SIZE);
  u.calm_winds();
  level.build(u, Species);
  const game = Lemmings.new();
  const [ex, ey] = level.entrance;
  const [xx, xy] = level.exit;
  game.setup(ex, ey, xx, xy, level.dir, level.lemmings, level.releaseRate);
  SKILLS.forEach((name, i) => game.set_skill_count(i, level.skills[name] || 0));

  const limit = level.seconds * 60;
  let frame = 0;
  const deaths = new Set();
  for (; frame < limit && !game.done(); frame++) {
    u.tick();
    game.tick(u);
    if (verbose) {
      for (const l of lemmingsOf(game)) {
        if (l.state >= LemState.Splatting && l.state <= LemState.Dissolving && !deaths.has(l.index)) {
          deaths.add(l.index);
          console.log(`  frame ${frame}: #${l.index} ${LemState[l.state]} at ${l.x},${l.y}`);
        }
      }
    }
    for (const r of solution) {
      if (r.done.size >= r.times) continue;
      for (const l of lemmingsOf(game)) {
        if (r.done.has(l.index) || !r.when(l)) continue;
        const skill = SKILLS.indexOf(r.skill);
        if (game.assign(l.x, l.y - 4, skill) === l.index) {
          r.done.add(l.index);
          if (verbose) console.log(`  frame ${frame}: ${r.skill} -> #${l.index} at ${l.x},${l.y}`);
        }
        break;
      }
    }
  }
  return { saved: game.saved(), dead: game.dead(), frame, done: game.done() };
}

let failed = 0;
const verbose = process.argv.includes("-v");
for (const level of LEVELS) {
  const solution = SOLUTIONS[level.name];
  if (!solution) {
    console.log(`?  ${level.name}: no scripted solution`);
    failed++;
    continue;
  }
  const r = play(level, solution, { verbose });
  const ok = r.saved >= level.save;
  if (!ok) failed++;
  console.log(
    `${ok ? "ok" : "FAIL"} ${level.name}: saved ${r.saved}/${level.lemmings} (need ${level.save}), dead ${r.dead}, ${(r.frame / 60).toFixed(1)}s${r.done ? "" : " (time up)"}`
  );

  // Doing nothing should never be enough.
  const idle = play(level, []);
  if (idle.saved >= level.save) {
    failed++;
    console.log(`FAIL ${level.name}: solvable without any skills (${idle.saved} saved)`);
  }
}
process.exit(failed ? 1 : 0);
