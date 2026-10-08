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
  "Let it flow": [
    // Stop the first lemming before it reaches the deep lake.
    rule("blocker", (l) => walking(l) && l.dir < 0 && l.x <= 100),
    // The next one turns back at the blocker; bash the dam when it gets there.
    rule("basher", (l) => walking(l) && l.dir > 0 && l.x >= 146),
  ],
  "Thin ice": [
    // Wait for the ice to spread over the cave, then open the door.
    rule("basher", (l) => walking(l) && l.dir > 0 && l.x >= 92, 1, 1800),
    // The first one out digs down through the frozen lake into the cave.
    rule("digger", (l) => walking(l) && l.dir > 0 && l.x >= 176 && l.y < 112),
  ],
  "Burning bridges": [
    // Dig through the upper bridge as soon as the first lemming is over the lower walkway.
    rule("digger", (l) => walking(l) && l.y < 75 && l.x >= 110 && l.x <= 120),
    // Bash the wooden door of the exit cave.
    rule("basher", (l) => walking(l) && l.y > 100 && l.dir > 0 && l.x >= 264),
  ],
  "Slow burn": [
    // Wait until the barricade has burned away, then bash out of the pen.
    rule("basher", (l) => walking(l) && l.dir > 0 && l.x >= 94 && l.x <= 99, 1, 1200),
  ],
  "Rock bottom": [
    // Bash the block's shoulder: the block loses its near support and drops
    // column by column into the pit, filling it flush.
    rule("basher", (l) => walking(l) && l.x >= 145 && l.x <= 149 && l.dir === 1),
    // Dig down in front of the boulder...
    rule("digger", (l) => walking(l) && l.x >= 222 && l.x <= 228 && l.dir === 1),
    // ...and, once a lemming-height deep, bash under it through the dirt.
    rule("basher", (l) => l.state === LemState.Digging && l.y >= 160),
  ],
  "Acid test": [
    // Bridge the pond from part-way down the ramp, so no brick touches the acid.
    rule("builder", (l) => walking(l) && l.x >= 80 && l.x <= 86 && l.dir === 1),
    // Bash the pillar's shoulder: it drops into the vat and dissolves (and the
    // basher with it).
    rule("basher", (l) => walking(l) && l.x >= 172 && l.x <= 179 && l.dir === 1),
    // The next lemming bridges the hole the pillar leaves.
    rule("builder", (l) => walking(l) && l.x >= 177 && l.x <= 182 && l.dir === 1, 1, 740),
  ],
  "Seedbed": (() => {
    // The first rule never assigns anything: it tracks the lemmings so that a click goes to the
    // lemming we mean (not another one standing on the same cell), as a human would click.
    const seen = new Map();
    let lastFrame = -1;
    const track = (l, f) => {
      if (f < lastFrame) seen.clear();
      lastFrame = f;
      seen.set(l.index, { x: l.x, y: l.y, f });
      return false;
    };
    // A click on a cell picks the lowest-numbered lemming standing there.
    const first = (l, f) => [...seen].every(([i, p]) => i >= l.index || p.f !== f || p.x !== l.x || p.y !== l.y);
    return [
      rule("climber", track),
      // Bash the hedge in the tunnel when a lemming walks up to it (the last stalk grows from x=100).
      rule("basher", (l, f) => walking(l) && l.dir < 0 && l.x >= 101 && l.x <= 108 && first(l, f)),
    ];
  })(),
  "Soft landing": (() => {
    // The solution clicks like a human. The first rule never assigns anything: it tracks the
    // lemmings so that a click goes to the lemming we mean (not another one on the same cell).
    const seen = new Map();
    let lastFrame = -1;
    const track = (l, f) => {
      if (f < lastFrame) seen.clear();
      lastFrame = f;
      seen.set(l.index, { x: l.x, y: l.y, state: l.state, f });
      return false;
    };
    const now = (f) => [...seen].filter(([, p]) => p.f === f);
    // A click on a cell picks the lowest-numbered lemming standing there.
    const first = (l, f) => now(f).every(([i, p]) => i >= l.index || p.x !== l.x || p.y !== l.y);
    const inWell = (p) => p.x >= 216 && p.x <= 222 && p.y > 143;
    const onLanding = (p) => p.x >= 201 && p.x <= 239 && p.y <= 143 && p.y >= 120;
    // Everybody is caught in the well (or, if fungus fills the well to the brim, everybody is
    // on the landing around it; or 40 s have passed), and l is the highest lemming over the well.
    const ready = (l, f) => {
      const a = now(f).map(([, p]) => p);
      if (!a.length || !(a.every(inWell) || a.every(onLanding) || f > 2400)) return false;
      return l.x >= 217 && l.x <= 221 && a.every((p) => !(p.x >= 216 && p.x <= 222) || p.y >= l.y);
    };
    return [
      rule("climber", track),
      // The ice crack never fills: the first lemming to reach it builds over it.
      rule("builder", (l, f) => walking(l) && l.dir > 0 && l.x >= 117 && l.x <= 119 && first(l, f)),
      // Everybody is caught on the fungus plug in the well: the top one digs through it.
      rule("digger", (l, f) => walking(l) && first(l, f) && ready(l, f)),
    ];
  })(),
  "Termites": [
    // Wait until the mites have eaten through the door, then flood them.
    rule("basher", (l) => walking(l) && l.dir < 0 && l.x <= 74, 1, 1800),
    // Once the corridor is under water, build the steps up to the exit.
    rule("builder", (l) => walking(l) && l.dir > 0 && l.x >= 232 && l.x <= 233, 1, 2400),
  ],
  "Two fountains": [
    // Wait until the sand has filled the pit and buried its own cloner (it
    // stops at ~43 s), then bash out of the pen before the water gets deep.
    rule("basher", (l) => walking(l) && l.dir > 0 && l.x >= 96 && l.x <= 98, 1, 2700),
  ],
  "Lift-off": [
    // Bash the gas tank open. The gas drifts onto the rockets, they copy it and
    // fly off as harmless gas, and the lemmings drop 40 cells onto the exit.
    rule("basher", (l) => walking(l) && l.dir > 0 && l.x >= 201 && l.x <= 205, 1, 600),
  ],
  "Drink up": (() => {
    // The solution clicks like a human. The first rule never assigns anything: it tracks the
    // lemmings so that a click goes to the lemming we mean (not another one on the same cell),
    // remembers where right-walkers bounce off the vine curtain, and notes when a basher there
    // has finished.
    const seen = new Map();
    let lastFrame = -1, bounceX = null, bounceF = -1, bashEnd = -1, curtainF = -1;
    const track = (l, f) => {
      if (f < lastFrame) { seen.clear(); bounceX = null; bounceF = -1; bashEnd = -1; curtainF = -1; }
      lastFrame = f;
      const p = seen.get(l.index);
      if (p && p.dir > 0 && l.dir < 0 && l.x >= 200 && l.x < 280) { bounceX = l.x; bounceF = f; }
      if (p && p.state === LemState.Bashing && l.state !== LemState.Bashing && l.x >= 200 && l.x < 300) bashEnd = f;
      seen.set(l.index, { x: l.x, y: l.y, dir: l.dir, state: l.state, f });
      return false;
    };
    const atCurtain = (l, f) => walking(l) && l.dir > 0 && bounceX !== null && l.x >= bounceX - 3 && l.x <= bounceX && first(l, f);
    // A click on a cell picks the lowest-numbered lemming standing there.
    const first = (l, f) => [...seen].every(([i, p]) => i >= l.index || p.f !== f || p.x !== l.x || p.y !== l.y);
    return [
      rule("climber", track),
      // Wait until the room is dry (about 30 s), then bash in from the pen.
      rule("basher", (l, f) => walking(l) && l.dir > 0 && l.x >= 23 && l.x < 30 && first(l, f), 1, 1800),
      // The lemmings bounce off the vines: bash the curtain with the next one that walks up to it.
      rule("basher", (l, f) => { if (!(curtainF < 0 && atCurtain(l, f))) return false; curtainF = f; return true; }),
      // Spare: if they bounce there again after that basher has finished (a vine grew back), bash again.
      rule("basher", (l, f) => {
        if (!(curtainF >= 0 && bashEnd > curtainF && bounceF > bashEnd && atCurtain(l, f))) return false;
        curtainF = f; return true;
      }),
    ];
  })(),
  "Black gold": [
    // The first lemming walks the length of the lid and drops into the well.
    // The second one is turned into a blocker as soon as it is on the lid.
    rule("blocker", (l) => walking(l) && l.index === 1 && l.x >= 116),
    // Light the fuse of the lemming stuck in the well.
    rule("bomber", (l) => walking(l) && l.x >= 280 && l.y >= 102),
    // Once the fire in the tank is out, dig down next to the blocker.
    rule("digger", (l) => walking(l) && l.x >= 104 && l.x <= 112, 1, 3300),
  ],
  "Firedamp": [
    // Send one lemming over the pen wall.
    rule("climber", (l) => walking(l) && l.x >= 140 && l.dir > 0),
    // It digs a vent right in front of the lamp, under the steel lip.
    rule("digger", (l) => walking(l) && l.x >= 222 && l.x <= 225 && l.y === 99),
    // When the cave has burned clear, dig the others down into it.
    rule("digger", (l) => walking(l) && l.x >= 100 && l.x <= 140 && l.y < 100, 1, 2100),
  ],
  "Powder keg": [
    // Everyone walks across the dust and drops into the pit on the far bank.
    // The last lemming out of the hatch (#11) digs beside the gorge, down
    // through the dust tongue into the lava.
    rule("digger", (l) => walking(l) && l.index === 11 && l.x >= 122 && l.x <= 146),
    // When the fire is out, bash from the pit back into the empty gorge.
    rule("basher", (l) => walking(l) && l.x <= 240 && l.y > 110 && l.dir < 0, 1, 2400),
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
