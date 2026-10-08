// Plays every level headlessly with a scripted solution and checks that
// enough lemmings get saved. Run with `npm run verify-lemmings`.
//
// Each level is played over several random streams (the universe's RNG is
// advanced by a different amount before the level is built), because in the
// browser the stream differs on every attempt. Doing nothing must never be
// enough.
//
//   node js/lemmings/verify.mjs [-v] [--trials N] [--only "Level name"]

import { createRequire } from "module";
import { LEVELS, SKILLS, WIDTH, HEIGHT } from "./levels.js";

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

// Gives `skill` to the first lemming matching when(lemming, frame), `times`
// times, but not before frame `after`.
const rule = (skill, when, times = 1, after = 0) => ({ skill, when, times, after });

const walking = (l) => l.state === LemState.Walking;

const SOLUTIONS = {
  "Just dig!": [rule("digger", (l) => walking(l) && l.x >= 150 && l.y < 125)],
  "Bash on through": [
    rule("basher", (l) => walking(l) && l.dir === 1 && l.x >= 128 && l.x < 135),
  ],
  "Mind the gap": [
    rule("builder", (l) => walking(l) && l.dir === 1 && l.x >= 123 && l.x < 128),
  ],
  "Up and over": [
    rule("climber", walking, 10),
    rule("floater", walking, 10),
  ],
  "Going out with a bang": [rule("bomber", (l) => walking(l) && l.y < 170)],
  "Mine, all mine": [
    rule("miner", (l) => walking(l) && l.dir === 1 && l.x >= 180 && l.x < 190),
  ],
  Sandspiel: [
    rule("builder", (l) => walking(l) && l.dir === 1 && l.x >= 123 && l.x < 129),
    rule("basher", (l) => walking(l) && l.dir === 1 && l.x >= 182 && l.x < 190),
    rule("digger", (l) => walking(l) && l.x >= 235 && l.x < 250 && l.y < 102),
  ],
};

function play(level, solution, { seed = 0, verbose = false } = {}) {
  const u = Universe.new(WIDTH, HEIGHT);
  // A different random stream per seed: every filled cell draws once.
  for (let k = 0; k < seed; k++) u.fill_rect(0, 0, 97, 1, Species.Empty);
  u.reset();
  u.calm_winds();
  level.build(u, Species);
  const game = Lemmings.new();
  const [ex, ey] = level.entrance;
  const [xx, xy] = level.exit;
  game.setup(ex, ey, xx, xy, level.dir, level.lemmings, level.releaseRate);
  SKILLS.forEach((name, i) => game.set_skill_count(i, level.skills[name] || 0));

  const rules = solution.map((r) => ({ ...r, done: new Set() }));
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
    for (const r of rules) {
      if (r.done.size >= r.times || frame < r.after) continue;
      for (const l of lemmingsOf(game)) {
        if (r.done.has(l.index) || !r.when(l, frame)) continue;
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

const args = process.argv.slice(2);
const verbose = args.includes("-v");
const trialsArg = args.indexOf("--trials");
const trials = trialsArg >= 0 ? Number(args[trialsArg + 1]) : 5;
const onlyArg = args.indexOf("--only");
const only = onlyArg >= 0 ? args[onlyArg + 1] : null;

let failed = 0;
for (const level of LEVELS) {
  if (only && level.name !== only) continue;
  const solution = SOLUTIONS[level.name];
  if (!solution) {
    console.log(`?  ${level.name}: no scripted solution`);
    failed++;
    continue;
  }
  const runs = [];
  for (let t = 0; t < trials; t++) {
    if (verbose) console.log(`${level.name}, seed ${t * 13}:`);
    runs.push(play(level, solution, { seed: t * 13, verbose }));
  }
  const passed = runs.filter((r) => r.saved >= level.save).length;
  const ok = passed === trials;
  if (!ok) failed++;
  const saved = runs.map((r) => r.saved);
  console.log(
    `${ok ? "ok" : "FAIL"} ${level.name}: ${passed}/${trials} runs saved enough (need ${level.save} of ${level.lemmings}); saved ${saved.join(" ")}; ${(Math.max(...runs.map((r) => r.frame)) / 60).toFixed(1)}s at most`
  );

  // Doing nothing should never be enough.
  const idle = play(level, []);
  if (idle.saved >= level.save) {
    failed++;
    console.log(`FAIL ${level.name}: solvable without any skills (${idle.saved} saved)`);
  }
}
process.exit(failed ? 1 : 0);
