# Material levels

Levels 8–22 each introduce one new material, named on the level's intro card,
and let the player find out how it helps and how it hinders lemmings. They are
built only from the rules in [MATERIALS.md](MATERIALS.md), on the 320×240
world.

Every level meets these constraints:

- at most 15% of its cells are dynamic material at the start (Dirt and Steel
  are static);
- it uses only materials introduced in earlier levels besides its own;
- it has a clear entrance, exit, lemming count and save quota;
- it comes with a scripted solution.

## How the levels are proven solvable

The scripted solutions live in `js/lemmings/verify.mjs`, and
`npm run verify-lemmings` (or `node js/lemmings/verify.mjs --trials N`) runs
them. Each rule plays like a person clicking: it gives a skill to a lemming
when that lemming reaches a spot, optionally "not before frame N". It never
relies on frame-perfect timing.

Each level is checked three ways:

- **Many random streams.** Before building the level, verify.mjs advances the
  simulation's random generator by a different amount, because in the
  browser every attempt gets a different stream. During design every level
  passed 12 of 12 streams in the stricter checker the designers used, and the
  plant level 72 of 72 with seeded vine growth.
- **Doing nothing fails.** A run with no skills must miss the quota.
- **In the real game.** The same solutions were played inside the browser
  build, with the wind/fluid simulation running (results below).

## What can make a solution unreliable

These apply to every level; each level's own flags follow below.

- **Randomness.**
  - Most material rules use the simulation's seeded RNG, so a fixed stream
    always plays the same way.
  - The browser keeps one simulation for the whole session, so every attempt
    starts from a different stream.
  - Plant vines, seed petals, fungus fluff and rocket trail colours use
    `Math.random` and differ on every run.
- **Wind and pressure exist only in the browser.**
  - Fire, lava and burning material create updrafts that can lift light
    cells (fire, gas, dust, sand, water, acid).
  - Explosions, flashes and burning dust make pressure bursts. They pass
    through walls and turn nearby stone into sand, ice into water and dust
    into fire.
  - How much of a burst reaches the fluid sim depends on the frame rate. The
    headless checks run with calm air, so levels near heat or bombs are
    flagged.
- **The world waits for "Let's go".** Nothing moves while the intro card is
  showing, so every attempt starts from the state the level builds, as in
  the checks.
- **Levels that keep a blocker** (Let it flow, Black gold) only end when time
  runs out or the player nukes the blocker, as in the original game.

## Results in the real game

Every scripted solution reached its quota in every run, both headless and in the browser build. The browser runs used Chromium with software WebGL; each run plays in real time with the fluid sim on.

| # | Level | New material | Quota | Saved headless | Saved in the browser (runs) |
|---|---|---|---|---|---|
| 1 | Just dig! | — | 5 of 10 | 10 | 10 (1 run) |
| 2 | Bash on through | — | 12 of 15 | 15 | 15 (1) |
| 3 | Mind the gap | — | 9 of 10 | 10 | 10 (1) |
| 4 | Up and over | — | 8 of 10 | 10 | 10 (1) |
| 5 | Going out with a bang | — | 8 of 10 | 8–9 | 9 (1) |
| 6 | Mine, all mine | — | 10 of 12 | 12 | 12 (1) |
| 7 | Sandspiel | — | 16 of 20 | 20 | 20 (1) |
| 8 | Let it flow | Water | 12 of 15 | 14 | 13–14 (3) |
| 9 | Thin ice | Ice | 10 of 12 | 12 | 12 (1) |
| 10 | Rock bottom | Stone | 16 of 20 | 20 | 20 (1) |
| 11 | Burning bridges | Wood | 10 of 12 | 12 | 12 (3) |
| 12 | Slow burn | Fire | 10 of 12 | 12 | 12 (3) |
| 13 | Black gold | Oil | 13 of 16 | 14 | 14 (3) |
| 14 | Firedamp | Gas | 11 of 14 | 13 | 13 (20) |
| 15 | Powder keg | Dust | 10 of 12 | 11 | 11 (3) |
| 16 | Acid test | Acid | 15 of 20 | 19 | 19 (1) |
| 17 | Drink up | Plant | 8 of 10 | 10 | 10 (1) |
| 18 | Seedbed | Seed | 8 of 10 | 10 | 10 (3) |
| 19 | Soft landing | Fungus | 8 of 10 | 10 | 10 (1) |
| 20 | Termites | Mite | 17 of 20 | 20 | 20 (1) |
| 21 | Two fountains | Cloner | 17 of 20 | 20 | 20 (1) |
| 22 | Lift-off | Rocket | 17 of 20 | 20 | 20 (3) |

The first version of Firedamp lit its gas from a lava lamp. It passed every headless run but failed in the browser:

- the flash's pressure bursts blew lava out of the lamp onto the cave floor;
- the wind made it random when the gas reached the lamp.

It was rebuilt with a bomber as the spark.


## 8. Let it flow — Water

> Lemmings can wade through shallow water, but deep water drowns them. Water that runs onto lava turns it to stone.

15 lemmings, save 12, release rate 50, 120 s. Skills: 1 blocker, 2 bashers.

**Helps**

- Shallow water is harmless: the lemmings land in a 3-deep lagoon and wade, block and bash in it.
- Water flows: once the dam is bashed, the whole lagoon runs out through the tunnel and down the slope.
- Water turns lava to stone: the outflow covers the lava moat and its top layer becomes a stone crust the lemmings walk across; the rest of the water runs on into the sump.

**Hinders**

- Deep water drowns: lemmings that walk left step onto the ridge and drop into the 40-deep lake. Without a blocker every lemming drowns there (idle run: 0 saved).
- Bashing the ridge instead of the dam opens the lagoon into the lake and the basher walks in and drowns (tested: all 15 drown).
- Water pours into whatever lies below it: a lemming walking under the outflow would drown, which is why the slope is gentle and the moat is flush with its banks (see flags).

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. Trial 0, f241 (4.0 s): blocker on the first lemming (#0) as it wades left through the lagoon, at x=100 (it would reach the ridge and the deep lake at x=53). Rule: walking, dir left, x <= 100.
2. The next lemmings turn at the blocker and wade right to the dam. f457 (7.6 s): basher on #1 when it reaches the dam (x=146, walking right). Rule: walking, dir right, x >= 146.
3. The basher opens the 16-wide dam at f526; the lagoon drains down the slope, the first lava cell turns to stone at f574 and the whole 50-cell moat surface is stone by f705. The basher steps onto the crust at f683 and everyone behind it follows to the exit. 14 of 15 saved (the blocker stays behind; the level then runs to the clock, or the player nukes).

**Reliability**

- 14/15 is the maximum (the blocker can't be freed); quota 12 leaves room for two drowned lemmings if the player is slow with the blocker.
- Keep the slope gentle (about 0.46 down per cell). On a 1:1 slope the outflow sprays up to ~5 cells above the ground and drowned 3 lemmings walking down under it in testing; a 3-cell step down into the moat with water pouring over it also drowned one. The flush moat and gentle slope fixed both (12/12).
- Browser only: lava makes weak updrafts and water blows at 40, so some of the outflow could be lifted off the lava before it cools it. Low risk: the lagoon keeps draining for several seconds and refills any gap; the stone crust itself (blow threshold 70) is not affected.
- The crust forms ahead of the lemmings because the outflow outruns the basher, whenever the player bashes: over the 12 trials the unbroken crust was always at least 32 cells ahead of the leading lemming, and the whole surface was stone by f684-705. It is 1 cell thick over 20 cells of lava; nothing in the level digs, so it holds.

## 9. Thin ice — Ice

> Ice slowly freezes any water it touches. Lemmings can walk on ice and dig through it, but only where the lake has frozen.

12 lemmings, save 10, release rate 50, 120 s. Skills: 1 basher, 2 diggers.

**Helps**

- Ice freezes the water it touches: the ice door turns the 196-wide, 22-deep lake into solid ice, spreading outwards at roughly 2.5-3 cells a second, top to bottom at about the same pace.
- Frozen water is solid ground: the lemmings walk out over the lake on it.
- Ice can be bashed (the door) and dug (a shaft through the frozen lake and the lake bed into the exit cave).

**Hinders**

- The ice door shuts the lemmings in until someone bashes it.
- Until the ice gets there the lake is deep open water: lemmings that walk past the frozen part sink and drown. Tested: opening the door at 10 s or at 19 s drowns all 12.
- A digger that digs where the water below has not frozen yet drowns, and so does everyone who falls into its shaft.
- Digging anywhere except right over the cave (lemming x 172-287) only finds rock down to the steel floor; the followers then fall to their deaths (tested at x=169: 5 splats).

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. Let them drop into the pen and wait while the ice spreads from the door. Over the 12 trials the lake is frozen top to bottom past the dig spot (x=178) between f1591 and f1844.
2. Trial 0, f1827 (30.5 s): basher on a lemming at the ice door (x=92, walking right). Rule: walking, dir right, x >= 92, not before f1800.
3. f2082 (34.7 s): digger on the first lemming out on the ice when it is above the cave (x=176). Rule: walking, dir right, x >= 176, on the ice (y < 112). (Walkers overtake the basher at the door, so in trial 0 this is #6.)
4. The others fall into the shaft behind it; it breaks into the cave about 2 s later and everyone walks right to the exit. 12 of 12 saved; the level ends at f2846 (47 s).

**Reliability**

- Freezing is random per cell. The solution opens the door at f1800 (30 s); when the digger starts (f2082) the lake is frozen solid 9 to 25 cells beyond its shaft in all 12 trials (median 18). A human who opens the door the moment the ice reaches the cave is cutting it close, and opening at about 19 s drowned everyone in testing; quota 10/12.
- If the digger is not the front lemming of a bunch, the 1-2 lemmings ahead of the shaft walk on to the open water and drown (covered by the quota).
- No lava on purpose: tested ice under lava, beside lava and lava dropped on a frozen lake; each time one layer turns to stone within ~2 s and the reaction stops, so lava can't melt a bridge during play.
- Browser only: high fluid pressure turns ice to water, but nothing here explodes or burns, so the fluid sim stays calm.

## 10. Rock bottom — Stone

> Stone drops straight down the moment nothing holds it up. It can fill a pit for you, but it fills your tunnels too.

20 lemmings, save 16, release rate 50, 180 s. Skills: 3 bashers, 1 digger.

**Helps**

- The 40x40 stone block spans the pit, held up only because it rests on both sides (a stone cell with stone up-left and up-right never falls). Bashing its 12-high shoulder removes the near support, and the block unzips column by column straight down into the pit, filling it flush so everyone walks across.

**Hinders**

- Tunnelling through the boulder makes the stone above the tunnel drop into it right behind the basher, sealing it. Only the basher gets through (at release rate 99, also one lemming right on its heels); the boulder just sinks ~12 rows and still walls off the crowd. Even two bashes leave a wall (tested: 2 saved).
- Digging in front of the boulder and bashing too high (less than a lemming-height down) cuts the boulder's base, so it collapses into that tunnel too. Bashing under it with dirt left in between is safe, because dirt never falls.

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. f421 (7.0 s): the first lemming walks up to the block's 12-high shoulder. While it still faces right (x 142-149; x=145 here), give it a BASHER. It cuts the shoulder away, and the block, now held on one side only, unzips column by column straight down into the pit, filling it flush. The basher drops in with it and lands on top unhurt.
2. f751 (12.5 s): the crowd crosses the filled pit and turns at the boulder. Give a DIGGER to a lemming walking right a few cells before the boulder (x 196-231; x=222 here).
3. f806 (13.4 s): once the digger is a lemming-height down (feet y >= 160, i.e. 10+ rows below the surface; any y 159-195 works), give it a BASHER. It tunnels right under the boulder through dirt, leaving two dirt rows under the stone, so the boulder never moves. The tunnel comes out in the cliff at x=260.
4. Everyone follows down the shaft, through the tunnel and a 34-row drop into the cavern to the exit: 20/20 saved at f2836 in all 12 trials.

**Reliability**

- Fully deterministic: stone, dirt and lemmings use no RNG, so all 12 trials are identical. Tested basher assignment anywhere at x=142..149 (facing right) and release rate 99: same flush fill, 20/20 saved.
- The flush fill depends on three small steps in the pit floor (x=153..155) that compensate for the cells the basher shaves off the first falling columns. A basher given while the lemming faces left is wasted.
- Spare basher: one bash of the boulder can be recovered from (dig + bash still works); two bashes of the boulder do not flatten it (tested: only the 2 bashers escape).
- Browser: no lava/fire/bombs, so no updrafts or blast pressure near the stone (stone blows only above wind 70 and turns to sand only under blast pressure). Low risk.

## 11. Burning bridges — Wood

> Wood makes sturdy bridges and is easy to dig through. But where lava touches it, it catches fire, and the fire eats along the wood.

12 lemmings, save 10, release rate 70, 150 s. Skills: 2 diggers, 2 bashers.

**Helps**

- Wood stays put: two long wooden bridges span the lava lake with nothing under them; the lower one carries the lemmings to the exit cave.
- Wood is soft: a digger goes straight through the 5-thick upper bridge (5 rows, ~25 frames) and a basher opens the wooden cave door.

**Hinders**

- Lava sets wood alight: the post at the far end of the upper bridge stands in a lava pool, catches fire at once, and the fire climbs it and eats back along the upper bridge towards the lemmings (~6-7 cells/s); the whole bridge is gone by ~40 s.
- Burning wood kills: lemmings that stay on the upper bridge walk into the flames (idle run: all 12 burn on the bridge). Digging too late or too close to the fire (x 200: 1-6 saved; 6th lemming instead of the 1st: 7 saved) loses lemmings; digging left of the lower walkway (x 80) drops everyone into the lava.

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. Lemmings land on the left cliff and walk right onto the upper wooden bridge, towards the fire that starts at the post in the lava. As soon as the first lemming is above the lower walkway (x 110-120 on the upper bridge), give it a DIGGER. Trial 0: f358 (5.97 s), lemming #0 at 110,69. Everyone behind it drops through the hole, 43 cells down onto the lower walkway.
2. On the lower walkway they walk right to the wooden door of the exit cave. Give a BASHER to the first lemming that reaches the door (walking right, x >= 264). Trial 0: f894 (14.90 s), lemming #0 at 264,117.
3. Everyone walks into the cave to the exit (298,117) while the upper bridge burns away above them. Trial 0: 12/12 saved, level over at f1696 (28.3 s).

**Reliability**

- Browser updraft: fire rises, so sparks from the upper bridge go up, away from the lower walkway (good), but the fire front along the upper bridge may move at a different speed than headless (~6-7 cells/s). Headless margin: the front reaches the dig spot (x~110) after ~30 s; the last lemming drops through by ~18 s. The player can also raise the release rate.
- Lava in the small pool next to the burning post (blow threshold 60) could be flung by a strong updraft; it would only land on dirt or on the already-burning bridge, so it is harmless, but untested in the browser.
- Ignition must have air: my first version laid the bridge flat on the lava pocket and the fire fizzled in 2 of 12 streams (burning cells with no empty neighbour cannot spawn fire). A post dipping into an open pool lights in 12/12 streams.
- A wooden rail at the lower walkway's left end turns lemmings around, so ones that arrive before the door is bashed don't walk off into the lava.
- The bashed door keeps its top 5 rows hanging from the cave roof (wood stays put); cosmetic.
- Lava-touching wood is NOT a permanent torch: verified in species.rs (the rb>1 branch overwrites the relight) and experimentally; the post burns out and the bridge with it.

## 12. Slow burn — Fire

> Fire burns wood away and any lemming it touches, then dies out. It creeps along wood too, so watch where the beams lead.

12 lemmings, save 10, release rate 75, 150 s. Skills: 2 bashers.

**Helps**

- Fire clears the way: the burning wooden barricade in the corridor is completely gone after ~14 s (all 12 streams), opening the path to the exit. There is no other way past it: bashing it means walking into the flames.
- Fire dies out on its own once its wood is gone, so the corridor is safe again a moment after the barricade disappears.

**Hinders**

- Fire kills on touch: lemmings let out too early walk into the burning barricade (bash at the first chance: only 5-7 of 12 saved).
- Fire creeps along connected wood: the same fire climbs the post above the barricade, runs left along the wooden beam (from ~15 s) and down the post into the pen, then burns the pen's wooden floor. It reaches the lower half of the pen at ~35-50 s; anyone still inside burns (idle run: all 12 burn in the pen at 43-48 s). Waiting too long (bash at 40 s) already costs lemmings in some streams.

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. Lemmings drop into the pen (wooden floor, steel left wall, dirt right wall) and pace. Wait while the barricade burns down (gone at ~14 s) and watch the fire start along the beam towards the pen.
2. Not before frame 1200 (20 s), give a BASHER to a lemming walking right next to the pen's right wall (x 94-99). Trial 0: f1228 (20.47 s), lemming #8 at 94,143. Any bash between ~12 s and ~35 s saves all 12 in all streams.
3. The bash opens the wall; everyone walks out, over the ashes of the barricade, to the exit (300,146). Trial 0: 12/12 saved, level over at f2338 (39 s). The fire reaches the empty pen afterwards.

**Reliability**

- Browser updraft: fire rises. The fuse runs up, across and then DOWN into the pen, and the downward part fights the updraft, so the fire most likely reaches the pen later in the browser (wider window). The barricade's burn-out (14 s headless) may differ too; the scripted 20 s wait leaves 6 s of slack, and a human simply waits until the barricade has vanished.
- The fire placed at frame 0 (fill_rect fire lives ~0.7-1.3 s) only lights the barricade. In the browser it is blown upward along the barricade's faces, still touching it, so ignition should be as reliable, but this is untested.
- Fire only travels along wood that has air beside it: in an earlier version the beam squeezed through a dirt ceiling and the fire stalled there; the final layout has no ceiling.
- Sparks reach ~15 cells from burning wood (measured); the pen's right wall is 48 cells from the barricade, so lemmings are safe while they wait.
- Timing window measured over 12 streams: bash not before 0 s -> 5-7 saved; 6.7 s -> 8-10 (3/12 pass); 11.7 s and 35 s -> 12/12 all saved; 40 s -> 7-12 (9/12 pass).

## 13. Black gold — Oil

> Oil drowns lemmings just like water, but oil burns. Set it alight, keep everyone well back, and the tank will burn itself empty.

16 lemmings, save 13, release rate 20, 150 s. Skills: 1 blocker, 1 bomber, 1 digger.

**Helps**

- Burning oil disappears: once the tank has burned out, the lemmings can dig through its lid and walk along the bottom to the exit.
- Oil floats on water: the water stays behind when the oil burns (only a thin film of oil is left on it), and 3 cells of liquid are shallow enough to wade.

**Hinders**

- Oil drowns lemmings like water: digging into the full tank drops them into 19 cells of oil.
- Burning oil is deadly: the bomb blast lights the oil, flames run along the tank for about 25-30 s, and any lemming that walks into the well or digs down too early burns.
- Someone has to light it: the bomber in the well is lost.

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. The first lemming (#0) walks right along the lid and drops into the dry well at the far end (x 280-287), where it is trapped.
2. f500: make the second lemming (#1) a blocker as soon as it is on the lid (x>=116, here 116,89). Everyone behind it stays on the left, far from the well.
3. f857: give the lemming in the well (#0, at 280,104) the bomber. It explodes at ~f1157; the blast reaches into the oil around the well and sets it alight.
4. Wait while the oil burns away from right to left under the lid (fire out ~25-30 s after the blast, i.e. by ~f2990).
5. f3300 (no earlier than the fire being out): give a digger to a lemming next to the blocker (x 104-112, here #11 at 106,89). Everyone falls 24 cells into the empty tank and walks right through the shallow water to the exit (262,119).
6. The blocker stays on the lid; nuke (or wait out the clock) once the others are home. 14 of 16 saved.

**Reliability**

- The bomb's 14 fire cells use the Lemmings RNG with a fixed seed, so their pattern is identical every play; tested 6 different fuse timings (bomber 0-90 frames late) x 6 streams: always lit.
- Browser: burning oil and its fire make strong updrafts; under the lid this can change how fast the burn front moves. The dig is a human 'when the fire is out' decision, so timing differences are harmless.
- Browser: wind passes through dirt (only steel blocks it), which is why the blocker stands on plain dirt and not on sand.
- The blocker is not saved (14/16 max). Quota 13 leaves one spare (e.g. the second lemming also falling into the well).

## 14. Firedamp — Gas

> Gas is harmless to walk through, but one spark sets the whole cloud ablaze. Anything inside burns, lemmings and wood alike.

14 lemmings, save 11, release rate 30, 180 s. Skills: 1 climber, 1 bomber, 1 digger.

**Helps**

- Gas is harmless: the climber drops through the crack into the cloud and walks about in it unhurt; left alone it would pace there for the rest of the level. After the flash the crowd walks through whatever wisps are left, unhurt.
- One spark lights the whole cloud: the bomb inside it starts a flash that sweeps the entire cave (the gaps above the barricades make it one connected cloud) and burns all three wooden barricades, the only way past them. Then nothing is left burning: the cave is dark again 6-9 s after the blast.

**Hinders**

- Everything inside the cloud burns: the bomber goes up with it. If the crowd is dug into the cave first, they pace unharmed in the gas, stuck at the first barricade, until the spark: then all of them burn (dig first, bomb later: 0 saved in 12/12 streams).
- No spark, no way through: digging the crowd down without lighting the gas leaves them stuck behind the barricades (0 saved in 12/12 streams).
- The flash needs a few seconds to sweep the cave and the barricades burn on briefly: digging in 4-5 s after the blast walks lemmings into the fire (dig at f1200, 4.3 s after the blast: 8-10 saved, short of the quota in 12/12 streams).

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. The lemmings drop into a pen on the roof of the gas cave (steel wall with a lip on the left, 12-high dirt wall on the right) and pace. The cave below is sealed: steel walls and floor, a 4-thick dirt roof with one 1-wide crack at x 228.
2. f248 (4.13 s): make a lemming walking right near the right pen wall a climber (x>=130, dir right; here #0 at 130,99). It climbs out (f278-326), walks right along the roof and drops through the crack (f605), landing in the gas between barricades 2 and 3 at f640 (228,133).
3. f640 (10.67 s): give it the bomber while it walks on the cave floor (y 133, x 207-249; here #0 at 228,133). It climbs barricade 3, bumps the roof, drops back, walks left and explodes at f940 near barricade 2. The flash runs both ways through the cave: headless all wood gone by f1250-1280 and the last fire out by f1460-1480 (4 streams); browser: wood and fire gone by f1320.
4. Not before f2100 (35 s), i.e. once the cave is dark: give the digger to a lemming in the pen (x 80-120; here #2 at 94,99). Everyone falls 30 cells into the burned-out cave and walks right to the exit (285,133). First saved f2748; level over at f3241 with 13 of 14 saved (the bomber is the only loss).

**Reliability**

- The spark is the player's click: the bomb's fire cells come from the lemmings RNG (reseeded every setup) and it goes off in a dense cloud, so the gas lights at once every time. Headless, 12 streams each, 13 saved in every one: bomber given on the roof just after the climb, while climbing, at x 200, on landing, 26 s or 50 s into the level, or before the climb in the pen (explodes on the open roof at x~176, the crater lights the cloud); bomb at 100 s and 130 s: 6/6. Browser: bomb at 100 s (1 run) and the roof-crater bomb (2 runs) also 13 saved.
- No lasting heat: no lava, oil, fire or water at frame 0. After the flash only the barricades burn, for a few seconds. Browser census (5 probe runs): cave gas ~3100 -> 0-8 cells and wood 156 -> 0 by f1320; no fire anywhere after f1320 and none ever seen in the pen (sampled every 60 frames).
- Safe dig window: headless digging from f1300 (6 s after the blast) saves 13 in 12/12 streams, f1200 fails; browser digging at f1500 saves 13 (2 runs). The solution waits until f2100, a human until the cave goes dark.
- The crack leaks a little gas onto the roof before the blast (headless ~30 cells in the air after 15 s, ~200 after 165 s, under 10 over the pen; browser similar). It is too thin to carry the flash; in the browser the blast's wind blows it to the screen edges (a 100 s bomb blew ~20 unlit wisps over the pen for a moment; nobody hurt).
- Browser: the bomb and flash make strong pressure and updrafts. The cave stays sealed except the 1-wide crack, the pen is 80+ cells away behind a 4-thick roof, and there is no stone, ice, dust, water or lava for the wind and pressure to move or convert. If the bomb goes off on the open roof (fuse lit before the climber reaches the crack), the crater sprays fire up to ~30 cells: one fire cell reached the pen wall in each of 2 browser runs, no extra deaths.
- Player mistakes that cost lemmings: bombing a lemming in the pen (the crater opens the cave under the crowd) or digging before the flash. The quota 11 of 14 leaves two spare beyond the bomber.

## 15. Powder keg — Dust

> Dust is solid like sand: lemmings can walk on it and dig through it. But one touch of flame turns a whole heap of dust into fire.

12 lemmings, save 10, release rate 40, 180 s. Skills: 1 digger, 1 basher.

**Helps**

- Dust is solid: the whole crowd walks straight across the dust-filled gorge as if it were rock.
- Dust burns away in a flash: once lit, the 3,200 cells of dust in the gorge are gone within about 5 s, opening the way down to the exit that was buried under it.

**Hinders**

- One flame turns the whole heap into fire: the lemming that digs the dust down onto the lava burns with it, and anyone still on the gorge when it lights would burn and fall.
- Dust collapses like sand, so digging or bashing through the gorge does not open it for the others (the hole refills or drains into a funnel); it has to be burned.

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. The lemmings walk right from the hatch, across the dust that fills the gorge (x 150-209), and drop into the pit on the far bank (x 236-271), which they cannot climb out of.
2. f1541: when the LAST lemming (#11) is on the near bank beside the gorge (x 122-146, here 122,99), make it a digger. It digs down through the dust tongue under the bank and into the lava pocket below; dust pours down after it. (The walker ahead of it steps off the dust at f1687.)
3. The falling dust touches the lava and the flash races up through the tongue and the whole gorge (~f1790; the digger burns at f1788); the gorge is empty by ~f2100-2150 in all 12 streams.
4. f2400 (once the fire is out): give the basher to a lemming in the pit walking left (x<=240, here #8 at 240,115). It tunnels 25 cells into the empty gorge; everyone drops 30 cells to the floor, turns at the steel stump and walks right to the exit (226,145) under the far bank. 11 of 12 saved.

**Reliability**

- Any dig position on the near bank from x 122 to 146 works (tested at 122, 134 and 146: 11/11/11 saved in 12/12 streams). Digging left of x 122 misses the dust tongue and wastes the digger.
- Uses 'the last lemming' to light the dust because the gorge must be empty of walkers: with release rate 40 the dig takes ~4 s to reach the lava, by which time the walker ahead is off the dust (1.7-1.9 s margin when digging at the earliest spot, more further right).
- Browser: explosion/flash pressure converts dust even through walls and much faster than headless; here every dust cell is meant to burn, and there is no other heat or pressure source near the dust before the dig.
- Browser: dust blows in wind of 10+; the only heat before the dig is the lava pocket ~45 rows under the bank, whose updraft is weak, so the dust bridge should stay put.

## 16. Acid test — Acid

> Acid eats everything except steel, even solid stone. Drop the pillar in, but keep your bridges out of the acid.

20 lemmings, save 15, release rate 1, 200 s. Skills: 3 builders, 1 basher.

**Helps**

- The 30-high stone pillar plugs the way. It can't be climbed, bridged over (even two builders rise only 24), or tunnelled (stone drops into the tunnel). Bashing its shoulder drops it through the hole into the acid vat, and the acid eats all 150 stone cells: the obstacle is simply gone. The vat's acid level drops ~3 rows as it is used up.

**Hinders**

- The pond at the foot of the ramp and the vat dissolve any lemming that falls in. Idle lemmings walk down the ramp into the pond (0 saved).
- A bridge whose bricks touch the acid is eaten from below. Started at the very foot of the ramp (x 89-90), its first step lies on the acid, and the builder falls in and dissolves within ~20 frames. Started part-way down the ramp (x 78-88), it stays clear. Since bridges rise one row per two cells, only a bridge's first step can ever touch.
- The basher that drops the pillar falls through the hole with it and dissolves. The 5-wide hole then stays open over the acid, and the next lemming must bridge it before walking in.

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. f275 (4.6 s): give a BUILDER to the first lemming part-way down the ramp, walking right (x 78-88; x=80 here). Its bridge passes above the pond, and everyone drops 20 rows onto the lower ground.
2. f730 (12.2 s): give a BASHER to that lemming as it walks right toward the pillar's 9-high shoulder (x 172-179; x=172 here). It cuts the shoulder away. The pillar loses its near support and unzips straight down the hole into the vat, where the acid dissolves it. The basher falls in too (dissolves at f822).
3. f790 (13.2 s): once the pillar has dropped through (not before ~f740), give a BUILDER to the next lemming walking right toward the hole (x 177-182; x=177 here). Its bridge spans the 5-wide hole within its first step or two.
4. Everyone crosses to the exit: 19/20 saved at f4523 in all 12 trials (only the basher is lost).

**Reliability**

- Player-released acid is impossible in this engine. Acid eats any non-steel container on frame 1, and steel can't be dug, so acid is either free (and acts at once) or dormant in steel. Lemmings can only feed it, so here the 'help' is feeding it the pillar. Tested and rejected: stone dropped into a brim-full vat (the acid eats it; only 0-5 cells spill); a block dropped into a shallow acid pit (acid eats each column by a random amount, leaving a surface with steps of up to 20).
- The vat has 40 rows of air above the acid. Without that gap, acid swapping upward through the sinking stone spilled onto the floor beside the hole and ate dents (seen in a prototype). Checked over 8 seeds: the floor stays intact.
- Timing at the hole: a builder started there within ~25 frames of the bash (possible only if the player raises the release rate so lemmings bunch up) lays bricks into the still-falling stone, and the bridge is wrecked. At the default rate the next lemming arrives ~60-75 frames after the bash; tested builder starts at x=177/180/182 with basher starts at x=172/176/179: all 19 saved.
- Overtaking: walkers that catch up with a builder fall off its unfinished end. Release rate 1 (185 frames apart) prevents this at the pond. The hole is only 5 wide, so the first step already spans it and overtakers land safely. A slow player whose crowd bunches at the pillar still saved 18-19 in most runs.
- The 'bridge eaten' trap only catches a builder started at the very foot of the ramp. A player who builds a bit early never sees it (the hint warns instead). With 3 builders, one such mistake is recoverable.
- Browser: no lava/fire/bombs, so no updrafts or blast pressure; acid (blow threshold 40) and stone stay put. Low risk.

## 17. Drink up — Plant

> Plants drink water and grow into it, so give them time. Their vines hang down and block the way, but you can bash through.

10 lemmings, save 8, release rate 50, 240 s. Skills: 3 bashers.

**Helps**

- Plants drink water: a 2x2 plant in the far corner of the flooded room grows into the water and uses it up. The room (140 wide, 9 deep, deadly) is nearly dry after about 30 s, and the leftover plant is soft, so a basher goes straight through it.

**Hinders**

- Plant under the low roof on the right hangs a curtain of vines down to the floor within ~2 s (a thin plant pillar marks its left edge). The lemmings bounce off it until it is bashed.
- Impatience is punished: bash into the room too early and the water floods the small pen. A full room floods it more than 6 deep and drowns the lemmings; a half-drunk one still floods it, and the plant then grows after the water into a tangle that traps the lemmings in the pen. Bashing at the first chance (~2.5 s) or at 8 s saved 0 in 4 of 4 runs.

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. The lemmings drop into a small pen (x 6-29) and pace between the steel wall and the room's dirt wall. Wait while the plant drinks the room, until it looks dry (about 30 s).
2. f1800 (30.0 s): basher to a lemming walking right at x 23-29, just before the room wall (trial 0: #2 at 27,140). It bashes through the wall, the dry room (the rocks on the floor keep it bashing) and the far wall.
3. The lemmings bounce off the curtain's plant pillar at x 219. Basher to the next lemming walking right up to it (x 216-219; trial 0: f2854, 47.6 s, #5 at 216,140). It cuts through the pillar and every vine.
4. All 10 walk on to the exit at x 302. (Spare basher: if they bounce at the curtain again after that basher has finished, a vine grew back; bash again.)

**Reliability**

- Vines grow with JS Math.random, so the curtain is different in every play. Without the pillar, lemmings bounced off the first vine that reached the floor and the basher started there; a vine just left of it that had stopped one cell short could creep down later and re-block the path (2 of 36 plays saved 0). The 1-wide plant pillar at the curtain's left edge (its ra decays, so its cut stub cannot regrow) makes the basher start left of every vine. With it: 72/72 plays in three 24-trial batches with seeded Math.random (MSEED 3, 4, 5; batch 3 had failed before the fix) plus 12/12 in run.mjs.
- Plant growth into water uses the seeded RNG. Over 16 random streams the room still holds 143-272 water cells at 20 s and 32-99 at 30 s; about 24-48 cells stay trapped between the floor rocks for good (harmless puddles). Bashing in at 12 s passed 1 of 4 runs and at 15 s 2 of 4 in one batch but 4 of 4 in another (the outcome also depends on JS randomness). At 20 s and at 30 s it passed 12 of 12. The solution waits 30 s.
- Growing plant deletes the cell opposite the water it grows into (even steel), so the room's 6-thick dirt walls get pitted; they were never breached in testing.
- No fire or lava in the level, so the browser's wind should not move anything.
- The SOLUTION's first rule is a no-op tracker (it never assigns a skill). It makes the scripted clicks land on the lemming a player would click, not on another lemming standing on the same cell, and finds where the lemmings bounce off the vines.

## 18. Seedbed — Seed

> Seeds that land on sand sprout into tall stalks that stop lemmings like a wall. On dirt they just pile up.

10 lemmings, save 8, release rate 50, 180 s. Skills: 2 bashers.

**Helps**

- Seeds that land on sand sprout: seeds trickling from a pocket in the roof onto the sand bed at the cliff edge grow within ~2 s into a thicket of stalks (later seeds sprout on the stalks too), a fence that turns the lemmings back before they walk off into the lava.
- On plain dirt seeds do not sprout: a roof pocket above the exit platform piles its seeds into a ramp up the 9-high platform, and seeds sprinkled on the dirt walkway just lie there in small heaps.

**Hinders**

- Seeds lying on the sand floor of the low tunnel to the exit sprout into a hedge that blocks it, so it has to be bashed.
- Bashing the wrong stalks hurts: bash through the fence and the basher plus the next lemming or two walk into the lava (tested: 7-8 saved). The cut stalks then regrow as vines and close the gap again.

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. The lemmings drop at x 190 and walk right; the fence at x 236-262 turns them back, and the hedge in the tunnel (x 66-100) stops them on the left, so they pace in between.
2. f658 (11.0 s): basher to a lemming walking left at x 101-108, right at the hedge (trial 0: #0 at 108,149). It bashes through the tunnel's hedge.
3. The lemmings walk out of the tunnel, up the ramp of piled seeds onto the platform and into the exit at x 16.

**Reliability**

- Stalks grow with the seeded RNG; only the flower heads use JS Math.random (cosmetic). The fence is ~25 cells tall at f150, long before the first lemming reaches it (~f272).
- The hedge sits in a tunnel exactly 9 rows high on purpose: stalks that a basher cuts in the open leave their tops hanging, and those regrow as vines within seconds and block the path again.
- Lava lies under the cliff (x 272-320, y 205-232). In the browser its heat makes updrafts, and seeds blow at wind threshold 35. The fence's seeds fall 10+ cells to the left of the lava and ~55 cells above it, so this should not matter, but it is untested in the browser.
- The SOLUTION's first rule is a no-op tracker (it never assigns a skill). It makes the scripted click land on the lemming a player would click, not on another lemming standing on the same cell.

## 19. Soft landing — Fungus

> Fungus creeps over dirt and plugs small holes, which can catch a falling lemming or trap it. It cannot grow on ice.

10 lemmings, save 8, release rate 70, 240 s. Skills: 2 builders, 2 diggers.

**Helps**

- Fungus plugs small holes: the well to the exit cave is a 62-cell drop (every lemming splats without the fungus, tested), but fungus corks the dirt collar half way down within a few seconds, so lemmings that fall in land on the plug after ~35 cells.
- Fungus never grows on ice, so the ice walkway, the ice-lined well shaft and the ice exit cave stay clean while it creeps all along the dirt roof.

**Hinders**

- The same plug traps every lemming that lands on it, so dig through it. Dig too early and the lemmings still to come fall straight through the open hole and splat (digging as soon as the first one landed saved 3-6).
- The crack in the upper walkway is lined with ice, so no fungus will ever fill it: build over it or the lemmings fall in (idle saves 0).

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. f424 (7.1 s): builder to the first lemming walking right at x 117-119, the edge of the ice crack (trial 0: #0 at 117,130). Its first step covers the 3-wide crack and the others walk over it.
2. The lemmings drop onto the landing and fall into the well, onto the fungus plug.
3. When every lemming is caught on the plug (trial 0: f1365, 22.8 s), digger to the highest lemming in the well (#0 at 219,175). They all ride down with it and fall ~20 cells into the exit cave.
4. They walk to the exit at x 282.

**Reliability**

- The plug grows with the seeded RNG and closes the 3-wide well within ~6 s, long before the first lemming arrives (~f740). Fungus with high ra also sends out fluffy outgrowth that uses JS Math.random, so it differs in every play. It may fill the well higher up (the lemmings then land on the fluff, a shorter fall) or even to the brim (the lemmings then walk over it on the landing and the digger starts from the top). The solution handles both.
- Fire through fungus proved slow and patchy (burning fungus only spawns fire into empty cells), so no fire or lava is used.
- Tried and dropped: a fungus skin over a pond and a fungus-filled crack in a walkway both bridge the gap, but random fluff lumps on them blocked the walkers in 2-4 of 6 test plays, and bashers sent at them keep bashing as long as fungus is ahead. The help is therefore inside the well, where fluff cannot block anyone.
- No heat sources, so the browser's wind should not move anything (fungus blows at threshold 54).
- The SOLUTION's first rule is a no-op tracker (it never assigns a skill). It makes the scripted clicks land on the lemming a player would click, not on another lemming standing on the same cell, and lets the dig wait until everybody is caught.

## 20. Termites — Mite

> Mites are harmless to lemmings, but they chew through wood: doors, and your builders' steps too. Water kills them.

20 lemmings, save 17, release rate 50, 150 s. Skills: 1 basher, 2 builders.

**Helps**

- Mites chew through wood: 48 termites in the corridor eat the bottom of the wooden door, the only way out of the start cave (it opens after 4.5-18 s; 270-1080 frames over 72 streams, median ~520).
- Mites are harmless to lemmings and not solid: the lemmings walk straight through the swarm.

**Hinders**

- Mites eat builders' steps too: build the steps over the fence while the termites live and they chew them apart (2-6 of 20 saved over 6 streams).
- Bash the door instead of waiting and the one basher is gone, so the pool can't be released and the mites eat the steps (0-3 saved).
- Water kills mites: once the dam is bashed the pool spreads through the cave and the corridor (the fence has a slot for water) and every mite dies within ~4-5 s. Waiting 100 s without flooding saves 0-8.

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. Wait while the mites eat the door (trial 0: open at ~f570). Lemmings shuttle between the dam and the fence unharmed.
2. f1837 (30.6 s): basher to a lemming walking left at x <= 74 (it is at 74,179, just right of the dirt dam), not before frame 1800. The pool floods the cave floor, runs through the doorway and kills all mites by ~f2100 in every trial.
3. f2400 (40.0 s): builder to a lemming walking right at x 232-233 (233,182), not before frame 2400. Its steps cross the 5-high fence; everyone climbs over and wades to the exit. Trial 0 is done at f3950 (66 s).
- Also works: flooding before the door opens (the water waits behind the door): 6/6 streams 20 saved. Recovery with the spare builder (build too early, watch the mites eat the steps, flood, build again): 6/6 streams 20 saved.

**Reliability**

- Only one basher, on purpose: it forces the player to let the termites open the door. A click that lands on an overlapping lemming at the dam would waste it; not seen in 52 streams.
- Lemmings standing between the start of the steps and the fence get trapped under the steps. Starting the steps at x 232-233 (as close to the fence as still clears it) avoids it: 52/52 streams saved 20 (12 run.mjs trials + 40 extra). With the builder at x 228-230, 1 stream in 52 lost a lemming this way.
- The door's opening time depends on the random stream (4.5-18 s); the scripted 30 s wait stands for a player waiting until the door is visibly open.
- No heat in the level, so browser winds should not move the mites (blow threshold 30).

## 21. Two fountains — Cloner

> A cloner copies whatever touches it and never stops until it is buried. One pours sand, one pours water.

20 lemmings, save 17, release rate 50, 120 s. Skills: 2 bashers.

**Helps**

- The sand cloner pours endless sand into the deep pit; once it is full the lemmings can walk across.
- It stops by itself: the sand piles up until the cloner is buried (a cloner only fills empty cells).

**Hinders**

- The water cloner never stops: it fills the sump behind the sill, spills into the pen at 34-40 s and floods it; at 6 deep (72-83 s, frames 4290-4950 over the 12 trials) every lemming still inside drowns.
- Leave too early and the lemmings fall into the half-filled pit (deadly while the sand is low) or stall in front of the falling sand, which blocks walkers like a wall.
- Cloners are steel: nothing can dig them away; only burying stops them.

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. Wait in the pen. The sand fills the pit to both edges at 35.5-37.5 s (frames 2130-2250 over the 12 trials) and buries its own cloner at 42-44.5 s (frames 2520-2670), so the sand stops falling. Water starts spilling into the pen at 34-40 s.
2. f2700 (45.0 s): basher to a lemming walking right at x 96-98 (just before the dirt door), not before frame 2700. It bashes through in about 1 s; everyone walks out, over the small sand hill and right to the exit.
- Spare basher: when two lemmings stand on the same cell (one walking each way) a click can land on the wrong one and waste a basher; the second basher covers that.

**Reliability**

- Window measured on 2 streams x 12 bash times: bashing at 35-60 s saves 20/20; 65 s saves 17-20; 70+ s mostly drowns; 10-30 s loses most lemmings on some streams (falls) and few on others (they ride the rising sand out).
- No heat in the level, so browser winds should not move the sand or water.
- Water has no pressure in sandspiel: it never drains through low slots, so the spring has to spill from above. The sill is 4 high so the spill never reaches a lemming's head (drowning probe 5 up); 0/40 extra streams drowned anyone before the door opens.

## 22. Lift-off — Rocket

> A rocket copies the first thing that touches it and flies off trailing it. Until then, a pit full of rockets is a floor.

20 lemmings, save 17, release rate 50, 120 s. Skills: 2 bashers.

**Helps**

- Dormant rockets are solid: the rocket-filled pit is a floor the lemmings walk across.
- Lit by gas, every rocket flies off trailing gas, which lemmings can walk and fall through: the floor turns into a trapdoor onto the exit 40 cells below (a safe fall).

**Hinders**

- A rocket copies the FIRST thing that touches it. Water from the cloner spring on the far left creeps toward the pit; if it gets there first (58-73 s), the rockets fly off trailing water, the pit becomes a deep pool and every lemming on or near it drowns (idle run: 0 saved, 20 drowned).
- Rockets fly in random curves and can overwrite thin steel corners with their trail (only the landing cell is checked), so steel near them is kept at least 2 thick.

**Solution** (frame numbers are from the first verified run; "Rule" is the condition the scripted player waits for)

1. f612 (10.2 s): basher to a lemming walking right at x 201-205 (between the pit and the gas tank), not before frame 600. It bashes through the tank's dirt wall in about 0.5 s.
2. No further clicks. The gas drifts the few cells to the rocket floor (trial 0: first rocket lit at ~f785; 12 trials: f680-785) and the chain reaction empties the whole pit ~1.5 s later (trial 0: ~f880; 12 trials: f775-880). Lemmings on the floor drop 40 cells to the exit; the rest walk in after them. Trial 0 is done at f2363 (39 s).
- Spare basher: when two lemmings overlap on one cell a click can land on the wrong one; the second basher covers that.

**Reliability**

- Window: bashing at 5-50 s saves 20/20 (2-3 streams per time); 60 s saves 14-18; 70 s saves 0 (the water lights the floor first at 58-73 s; idle: 0 saved, 20 drowned).
- The rockets' flight paths are random (seeded RNG, so different in every browser play), but the result is not: a packed pile chain-reacts completely (0 rockets left in every stream tested), the gas trails are harmless, and no steel was chipped in 36 streams.
- Gas is the lightest material in the browser wind sim, but this level has no heat source, so winds stay calm.

