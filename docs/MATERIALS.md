# Material rules

What every material in the cellular automaton actually does, read from the
source. Line numbers refer to `crate/src/species.rs` unless another file is
named; `lib.rs` is `crate/src/lib.rs` and `lemmings.rs` is
`crate/src/lemmings.rs`. Rates marked "measured" come from headless runs of
`crate/pkg-node` with calm winds. When this document and the code disagree,
the code wins.

## How a tick works

- **Cells.** Each cell has a `species`, two state bytes `ra` and `rb`, and a
  `clock`. `ra` is per-cell randomness (colour, lifetime, flow direction);
  `rb` holds state such as burn timers or a cloner's species. `fill_rect`
  (what levels use) sets `ra` to 100–149 and `rb` to 0 (lib.rs 288).
- **Two passes per tick** (lib.rs 181).
  1. *Wind:* every non-empty cell may be pushed one cell by the fluid wind,
     only into an Empty cell, when the wind is strictly above the species'
     threshold. Sand, water, lava, acid, mite, dust, oil and rocket jump 2
     cells when pushed upward, if the cell 2 up is also Empty (lib.rs 388).
  2. *Update:* every cell runs its species rule, scanning x left to right
     and y top to bottom. A cell written earlier in the same pass is skipped
     (lib.rs 470). The code means to alternate the x direction every tick,
     but `generation` is always odd during this pass, so the scan is always
     left to right (lib.rs 203).
- **Neighbour sampling.**
  - `rand_vec` returns one of 9 offsets: the 8 neighbours or (0,0) itself,
    each about 1/9; (1,1) and (1,0) are very slightly favoured (lib.rs 141).
  - `rand_vec_8` returns one of the 8 neighbours.
  - `rand_dir` returns −1, 0 or +1, with −1 very slightly favoured;
    `rand_dir_2` returns ±1.
  - Reading outside the grid returns Wall on every side; writing outside is
    ignored.
- **Randomness.**
  - Almost every rule draws from the universe's seeded RNG (lib.rs 358), so
    a headless run is deterministic for one stream.
  - The browser reuses one universe, so every attempt gets a different
    stream.
  - JS `Math.random` (never deterministic) is used only by `Cell::new`
    (rocket trails, seeds spawned in water), plant vines, seed petals and
    fungus outward growth.
- **Headless runs.** They must call `calm_winds()` (lib.rs 311).
  `Universe::new` zero-fills the wind, and zero reads as a full up-left gale.
- **Fluid coupling (browser only).** Rules write impulses into `burns`
  with `set_fluid`; the GPU fluid sim reads them as bytes (value/255).
  - *Velocity:* `velocity.yx += burns.xy × −25` (`js/glsl/gradientSubtract.glsl`).
    The swizzle undoes the fluid grid being the transposed world, so fire's
    `dy: 150` pushes about 14.7 upward per frame, and lava's and burning
    oil's `dy: 10` about 1.
  - *Pressure:* each frame pressure becomes `0.8 × (old + (burns.z/255 ×
    512)²)` (`js/glsl/clear.glsl`), followed by 25 Jacobi passes that ignore
    cell type. So pressure passes through walls; only velocity is stopped by
    Wall and Cloner.
  - *Readback:* rules read the result with `get_fluid`. Pressure comes back
    as `clamp(p, −250, 250) / 500 × 255`, so "pressure > 120" needs p > ~236.
  - *Pressure bursts:* a burst of `burns` pressure 80 (bomb, fire igniting
    gas or dust, dust exploding) injects about 20,600, far over the
    threshold. Burning oil (10) injects about 322, and fire alone (1) next to
    nothing.
  - *Frame-rate dependence:* `burns` is cleared every tick, but the fluid
    sim reads it once per animation frame, and the game can run several
    ticks per frame (3 in fast mode). A burst only reaches the fluid sim if
    it happened in the frame's last tick, so explosion side effects depend
    on frame rate.
  - *Velocity damping:* steel stops the wind. Empty, gas and fire let it
    through at full strength; every other cell damps it ×0.95.
- **Wind thresholds** (wind needed to move a cell, strictly above; lib.rs
  398): fire, gas 5 · dust 10 · sand, mite, rocket 30 · seed 35 · water,
  acid 40 · oil 50 · fungus 54 · lava, ice, plant 60 · stone, wood 70 ·
  dirt, wall, cloner never.

## What lemmings feel (lemmings.rs)

| | Materials |
|---|---|
| **Not solid** (lemmings fall through them and sink to the bottom of liquids) | Empty, Water, Oil, Acid, Lava, Gas, Fire, Mite (lemmings.rs 127) |
| **Solid** (walk on it, bump into it, dig/bash/mine it) | everything else: Wall, Dirt, Sand, Stone, Ice, Wood, Plant, Fungus, Seed, Dust, Cloner, Rocket |
| **Steel** (cannot be dug, bashed, mined or blown up) | Wall, Cloner (lemmings.rs 142) |
| **Burns** | Fire or Lava at the feet, 3 up, 6 up, or 1 left/right 3 up (lemmings.rs 640) |
| **Dissolves** | Acid at those same points |
| **Drowns** | Water or Oil 5 cells above the feet, so liquid up to 5 deep is safe to wade and 6 drowns |
| **Buried** | a solid cell in the lemming's feet cell lifts it 1 cell if there is room 8 up; otherwise it is crushed after 45 frames (lemmings.rs 576). Skipped while digging, bashing, mining or climbing |

- **World edges.**
  - Lemmings treat x outside the world and y < 0 as Wall, but y ≥ height as
    Empty (lemmings.rs 146).
  - The bottom of the world is a pit: a lemming that digs or falls through it
    dies once it is 8 below the edge.
- **Bomber's blast** (lemmings.rs 597).
  - It is centred 4 cells above the feet, so the crater is only about 4–5
    cells deep.
  - It empties every non-steel cell within radius 9 and writes a pressure-80
    burst.
  - It turns about 40% of the Dirt and Stone in the ring out to radius 12
    into Sand.
  - It makes 14 tries to place Fire in empty spots: about 10 fires on
    average.
  - The lemmings' RNG is reseeded on every level setup, so a blast is the
    same on every attempt.
- **Builder.** It lays ordinary Wood (lemmings.rs 759): flammable, edible to
  mites and fungus, and plants spread from it.

## Materials

### Empty, Wall, Dirt
- **Tick:** no rule (line 43).
- **Wall:**
  - steel for lemmings;
  - acid cannot eat it;
  - wind never moves it.
  - Plant growth and rocket trails can still overwrite it (see Plant,
    Rocket).
- **Dirt:**
  - static, diggable;
  - acid eats it;
  - a blast crumbles it to sand;
  - plant growth and rocket trails can overwrite it.

### Sand (line 71)
- **Moves:**
  - falls straight down into Empty;
  - otherwise slides one cell diagonally down into Empty, picking a random
    side;
  - otherwise stays.
- **Density:** if the cell below is Water, Gas, Oil or Acid, it swaps with
  it and sinks.
- **Reactions:** none of its own. Acid eats it. Seeds germinate on it. A
  rocket that touches it draws sand trails.
- **Lemmings:** solid; piles onto and buries lemmings.

### Water (line 169)
- **Moves:**
  - falls into Empty or Oil below, swapping, so water sinks under oil;
  - else falls diagonally into Empty or Oil toward a random side (no
    diagonal when the roll is 0), else to the other diagonal if it is Empty;
  - else flows sideways in its own direction (`ra` parity): 2 cells if both
    are Empty, 1 if Empty or Oil;
  - when blocked it may turn around;
  - neighbouring water copies its direction.
  - Net effect: it levels out and drains through any opening fast.
- **Reactions (coded in the other materials):**
  - lava + water → that lava cell becomes Stone and that water cell is
    removed;
  - fire next to water dies;
  - ice turns touching water into ice;
  - burning wood, oil, plant and fungus are put out by water;
  - sand, stone, seed and rocket sink through it, dust sinks through it;
  - plants grow into it, removing it;
  - mites die in it;
  - acid destroys it.
- **Lemmings:** not solid; drowns at 6+ deep.

### Stone (line 132)
- **Arch rule first:** a cell with Stone both up-left and up-right never
  moves, and skips even the pressure check.
- **Moves:** falls straight down into Empty only. It never slides
  diagonally, so it piles in vertical columns.
- **Undercut slabs:** in practice an undercut slab unzips from its free
  edges, column by column, and falls. Measured over 600 ticks: free slabs of
  1–3 rows fell, as did a 1-row slab held at both ends and a 2-row slab held
  at one end (except the held column). Only a slab at least 2 rows thick
  resting on supports at both ends stays up as a bridge.
- **Browser only:** fluid pressure > 120 turns it into Sand.
- **Density:** sinks through Water, Gas, Oil and Acid.
- **Made by:** lava touching water.
- **Lemmings:** solid; a blast crumbles part of it to sand.

### Ice (line 757)
- **Static:** never falls (wind above 60 can push it).
- **Each tick** it samples one neighbour (9 options):
  - Fire or Lava → this ice cell becomes Water;
  - Water → with 7% chance that water cell becomes Ice. Measured: a single
    seed freezes a radius of 50 in 15 s (about 3 cells/s), and ice freezes
    upward through water at about 2.5 rows/s.
- **Browser only:** pressure > 120 → Water.
- **Lemmings:** solid; can be dug, bashed or mined.

### Fire (line 593)
- **Lifetime:** each tick `ra` drops by 1–3; it dies when `ra` < 5. So fire
  lives as long as its starting `ra` allows. Measured:

  | Source | Lifetime (ticks) |
  |---|---|
  | `fill_rect` | 44–77 |
  | Burning wood | 13–43 |
  | Burning oil or plant | 8–23 |
  | Burning fungus | 3–8 |
  | Gas or dust flash | 63–83 |
  | Bomb | 53–83 |
  | Burning seed | 1–2 |

- **Moves:** random walk. It steps to the sampled neighbour if that cell is
  Empty.
- **Reactions:**
  - sampled Water → the fire dies;
  - sampled Gas or Dust → that cell becomes Fire, with a pressure-80
    burst: a flash.
  - It does not ignite anything else directly. Wood, oil, plant, fungus and
    seed catch fire when *they* sample a Fire neighbour; ice melts; mites
    die.
- **Wind:** pushes the fluid upward every tick (an updraft in the browser).
- **Lemmings:** burns them.

### Lava (line 634)
- **Each tick** it samples one neighbour:
  - Gas or Dust → that cell becomes Fire (no pressure burst);
  - Water → this lava becomes Stone and the water cell becomes Empty.
- **Moves:** falls into Empty below, else diagonally down toward the sampled
  side (not when that roll is 0), else 1 cell sideways toward it. It never
  swaps.
- **Ignites:** unlit wood, oil, plant, fungus and seed next to it; melts
  ice. Acid eats it.
- **Wind:** weak upward push.
- **Lemmings:** burns them.

### Gas (line 372)
- **Moves:** random walk (9 options) into Empty.
  - A fresh cell (`rb` 0) that neither moves nor merges gets `rb` 5.
  - A cell with `rb` ≥ 3 that moves splits in two, leaving a cell of `rb` 1
    behind.
  - Thin cells (`rb` < 4) merge on contact.
  - Splits and merges conserve the total, so a cloud spreads slowly instead
    of multiplying. A fresh 20×20 block becomes about 236 cells after one
    tick and about 366 after 20 s.
- **Buoyancy:** none in the rule. Headless it just diffuses; in the browser
  any wind carries it (threshold 5).
- **Reactions:**
  - Fire turns touching gas into Fire with a pressure burst; lava does too,
    without a burst.
  - A dense, fresh cloud flashes almost completely (400 → 14 cells in 2 s).
  - A cloud that has diffused for a while burns only partly (255 of 369
    cells).
- **Lemmings:** not solid, harmless.

### Oil (line 286)
- **Moves:** only into Empty — down, diagonally down, then sideways. It
  never displaces anything; water sinks through it, so oil floats on water.
- **Ignition:** only unlit oil (`rb` 0) can be lit, by a neighbour that is
  Fire, Lava, or burning Oil in its last 18 ticks (`rb` 2–19). The code
  tests the condition for burning oil too, but the burn countdown overwrites
  it.
- **Burning:** `rb` 50, counting down by 1 per tick. On 3 of every 4 ticks
  it puts Fire into the sampled neighbour if that is Empty, so a burning
  pool throws lots of fire. Water puts it out. At `rb` 1 the oil becomes
  Empty.
- **Burn speed:** a pool burns away as a wave from where it was lit; each
  cell must burn about 31 ticks before it can light its neighbours.
  Measured: a 160×56 pool takes 40–45 s.
- **Lemmings:** not solid; drowns like water.

### Acid (line 1176)
- **Moves:** falls into Empty. Otherwise it picks dx from −1/0/+1 and moves
  sideways into (dx,0) or (−dx,0) if Empty.
- **Eats:** if it didn't move — which includes about a third of the time,
  when dx is 0, even with empty space beside it — it replaces with weakened
  acid:
  - the cell below if that is not Wall or Acid;
  - else the cell beside;
  - else the cell above, if it is not Empty.
  It eats any species except Wall and Acid, including Dirt, Stone, Ice,
  Wood, Water, Lava and Cloner. So acid bores straight down where it lands.
- **Strength:** weakened acid has `ra` − 60; below 80 it becomes Empty
  instead. Fresh acid (`ra` 100–149) therefore destroys 1 cell, or 2 if
  `ra` ≥ 140, and is spent. That includes water or lava it lands on: 200
  acid cells on a pool removed about 240 water cells and were all used up.
- **Lemmings:** not solid; dissolves them.

### Wood (line 682)
- **Static** solid (wind above 70 can push it).
- **Ignition:** only unlit wood (`rb` 0) is lit, by a Fire or Lava
  neighbour. The code tests lava for burning wood too, but the burn
  countdown overwrites it.
- **Burning:** `rb` 90, counting down by 1 per tick. On every 4th tick it
  puts Fire into the sampled neighbour if that is Empty. Water puts it out
  (`rb` 0, plus a steam puff of fluid density). At `rb` 1 it becomes Empty,
  about 1.5 s after lighting (91 ticks measured).
- **Spread:** fire reaches other wood only through Fire cells in Empty
  neighbours, so wooden structures burn from their exposed surfaces inward.
  Measured: a 40×3 wood slab lying on lava was gone by tick 600.
- **Other materials:** mites eat it, plants spread from it, fungus can eat
  into it (see Fungus).
- **Lemmings:** solid; the builder's bricks are wood.

### Plant (line 804)
- **Static** solid.
- **Each tick** it samples one neighbour:
  - **Fire or Lava** → unlit plant ignites (`rb` 20). Burning lasts 20
    ticks, puts Fire into the sampled neighbour every tick if that is
    Empty, and water puts it out. Then it becomes Empty.
  - **Wood** → grows a Plant cell into a random Empty neighbour.
  - **Water** (or Fungus, under conditions), with 19% chance → writes a
    Plant cell there and sets the cell on the opposite side (−dx, same dy)
    to Empty, whatever it is, even Wall or Dirt (7 of 10 wall cells removed
    in a test). If dx = 0 both writes hit the same cell, so the water is
    simply deleted.
- **Vines:** a plant with `ra` > 50 and no plant diagonally below grows
  downward into Empty (JS random). If the cell below is not Empty it
  instead writes itself back with `ra` − 1 — with its *old* `rb`.
- **Fire-proof quirk:** that last write undoes the same tick's ignition, burn
  countdown and extinguishing. So `fill_rect` plants resting on something,
  with no plant diagonally below, are fire-proof for their first 50–99
  ticks.
- **Other materials:** mites eat it; seeds germinate on it.
- **Lemmings:** solid, diggable.

### Seed (line 932)
- **Fire or Lava neighbour** → it becomes Fire.
- **Falling** (`rb` 0):
  - moves like sand and sinks through Water, Gas, Oil and Acid;
  - germinates (`rb` = random 1–253) only when the cell below (straight or
    diagonal) is Sand, Plant or Fungus — never on Dirt or Wall;
  - once germinated it never falls again.
- **Stem** (`ra` > 60):
  - with 24% chance per tick, moves one cell up into Empty, Sand or Seed
    (random −1/0/+1 x), leaving Plant behind; `ra` drops 0–9 per step;
  - if blocked it vanishes;
  - measured stalk heights: median 12, range 4–25.
- **Petals** (`ra` 41–60): spread around the tip (JS random), a flower.
- **Spent** (`ra` ≤ 40): spawns new Seeds into touching water.
- **Lemmings:** solid.

### Fungus (line 1048)
- **Ignition:** unlit fungus ignites (`rb` 10) on Fire or Lava. It burns 10
  ticks, puts Fire into an Empty neighbour, water puts it out, then it
  becomes Empty.
- **Creeping:** if the sampled neighbour is anything but Empty, Fungus, Fire
  or Ice, it grows a new fungus cell into a random Empty neighbour. Fungus
  therefore creeps along every surface as a coating. It narrows tunnels and
  can grow into a lemming's body cells, burying it.
- **Ice** only fails to trigger growth: fungus touching ice and also dirt,
  wall or the world edge still spreads.
- **Eats wood** when all of these hold: a 90% roll; the sampled cell is Wood;
  the cells at (−dx,dy) and (dx,−dy) are Wood; and that wood's `ra` % 4 ≠
  0. About a quarter of `fill_rect` wood is immune.
- **Outward growth:** cells with `ra` > 120 also grow outward (JS random)
  regardless of neighbours.
- **Lemmings:** solid.

### Dust (line 93)
- **Browser only:** pressure > 120 turns it into Fire, with its own burst,
  so a dust pile can chain-detonate.
- **Moves:** falls into Empty; sinks through Water only; else diagonally
  (random −1/0/+1) into Empty.
- **Reactions:** fire or lava turn it into Fire instantly, a flash. Mites
  eat it (20% of the time they multiply instead).
- **Lemmings:** solid — walkable, but it vanishes in a flash.

### Mite (line 1220)
- **Moves:** falls, sometimes hops up and sideways, slides on ice.
- **Each tick** it samples one neighbour:
  - Fire, Lava, Water or Oil → the mite dies;
  - Plant, Wood or Seed → with 20% chance it moves into it, eating it;
  - Dust → eats it (20% chance to multiply).
- **Crowding:** a mite with mites left, right and above vanishes.
- **Lemmings:** not solid, harmless; mites burrow through wood (including
  builder bricks) and plants like termites.

### Cloner (line 430)
- **Unset** (`rb` 0): adopts the species of a touching cell that is not
  Empty, Cloner or Wall. Its scan breaks out of each column at the first
  match, so the topmost match in the rightmost column with a match wins. It
  adopts on its first tick, so a cloner embedded in Dirt becomes a Dirt
  cloner.
- **Set:** each tick it walks its neighbour columns and, with 9% chance per
  Empty neighbour, emits its species there — at most one per column per
  tick. Measured: about 35–38 cells/s in open air. It never stops.
- **Output:** emitted cells have `ra` 80–175, not 100–149, which changes
  acid strength, fire life and seed height.
- **Lemmings:** steel. Emitted material behaves normally.

### Rocket (line 475)
- **Unset:** a fresh rocket becomes unset (`rb` 100) and falls like sand.
- **Launch:** when it samples a neighbour that is not Empty, Rocket, Wall or
  Cloner, it stores that species. A rocket touching only those never
  launches. It then picks a random 8-direction, reversed if that cell is
  occupied.
- **Flight:** each tick it moves by (dx, 2·dy) — 2 cells vertically, 1
  horizontally. It writes new cells of the stored species at its old cell
  and at (0, dy), the cell it jumps over; with dy = 0 that is one trail
  cell. It turns left or right on 40% of steps and vanishes when its
  landing cell is not Empty, Fire or Rocket.
- **Breaches steel:** the write at (0, dy) is unconditional, so a rocket
  flying vertically overwrites whatever it jumps over — even Wall. In a test
  60 rockets under a 1-thick Wall ceiling replaced 8 of 600 ceiling cells.
- **Lemmings:** solid while it is a cell.

## Who sinks through what

- **Sand, stone, seed and dormant rocket** swap with Water, Gas, Oil and Acid
  below them.
- **Dust** swaps only with Water.
- **Water** swaps with Oil, so oil floats.
- **Oil, lava, gas, fire and acid** only move into Empty. Acid destroys the
  liquid it lands on instead of sinking.

## Quirks that matter for level design

1. **Ignition only takes on unlit cells.** `rb == 0 && nbr == Fire || nbr
   == Lava` (wood, plant, fungus, oil) parses as `(unlit and fire) or lava`.
   Each rule then rewrites the cell from the `rb` it read on entry, so
   re-lighting a burning cell has no effect.
2. **Fire-proof plants.** Plants resting on something ignore fire for their
   first 50–99 ticks (see Plant).
3. **Plants and rockets break steel.** Plant growth overwrites the cell
   opposite, and a rocket overwrites the cell it jumps over — both even
   Wall.
4. **Stone slabs fall.** They unzip unless they are at least 2 rows thick
   and supported at both ends.
5. **Acid bores down** where it lands and destroys liquids.
6. **Explosions differ in the browser.** Pressure bursts from bombs,
   flashes and dust pass through walls and can turn stone to sand, ice to
   water and dust to fire 15–30 cells away. This depends on frame rate, and
   headless runs never see it.
7. **Fire is passive.** It needs fuel to persist: burning wood or oil, or a
   cloner.
8. **Lava and water** react only cell to cell. Water poured on lava makes a
   one-cell stone crust; the rest of the water then sits on top as water.
9. **The world's bottom edge** is solid for cells but a pit for lemmings.
10. **Scan and bias.** The update scan never alternates direction, and
    `rand_vec` and `rand_dir` are very slightly biased.

The pressure and reach figures for the browser come from a CPU port of the
fluid shaders, not from measuring a GPU; treat them as strong evidence.
