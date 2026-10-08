# Material rules

What every material in the cellular automaton actually does, read from the
source. Line numbers refer to `crate/src/species.rs` unless another file is
named; `lib.rs` is `crate/src/lib.rs` and `lemmings.rs` is
`crate/src/lemmings.rs`. When this document and the code disagree, the code
wins.

## How a tick works

- **Cells.** Each cell has a `species`, two state bytes `ra` and `rb`, and a
  `clock`. `ra` is per-cell randomness (colour, lifetime, flow direction);
  `rb` holds state such as burn timers or a cloner's species. `fill_rect`
  (what levels use) sets `ra` to 100–149 and `rb` to 0 (lib.rs 288).
- **Two passes per tick** (lib.rs 181).
  1. *Wind:* every non-empty cell may be pushed one cell by the fluid wind,
     only into an Empty cell. Sand, water, lava, acid, mite, dust, oil and
     rocket jump 2 cells when pushed upward (lib.rs 388).
  2. *Update:* every cell runs its species rule, scanning x left to right
     and y top to bottom. A cell written earlier in the same pass is skipped
     (lib.rs 470). The code means to alternate the x direction every tick,
     but `generation` is always odd during this pass, so the scan is always
     left to right (lib.rs 203).
- **Neighbour sampling.**
  - `rand_vec` returns one of 9 offsets: the 8 neighbours or (0,0) itself,
    each about 1/9 (lib.rs 141).
  - `rand_vec_8` returns one of the 8 neighbours.
  - `rand_dir` returns −1, 0 or +1; `rand_dir_2` returns ±1.
  - Reading outside the grid returns Wall; writing outside is ignored.
- **Randomness.**
  - Almost every rule draws from the universe's seeded RNG (lib.rs 358), so
    a headless run is deterministic for one stream.
  - The browser reuses one universe, so every attempt gets a different
    stream.
  - JS `Math.random` (never deterministic) is used only by `Cell::new`
    (rocket trails, seeds spawned in water), plant vines, seed petals and
    fungus outward growth.
- **Fluid coupling.**
  - Rules write impulses into `burns` with `set_fluid`. The browser's GPU
    fluid sim adds `burns.xy × −25` to its velocity and `(burns.z × 512)²`
    to its pressure (`js/glsl/gradientSubtract.glsl`, `js/glsl/clear.glsl`).
    The fluid grid is the transposed world, so fire's `dy: 150` is an
    upward push in the world.
  - Rules read the result with `get_fluid`. Pressure comes back as
    `clamp(p, −250, 250) / 500 × 255`, so "pressure > 120" needs p > ~235.
    That only happens after an explosion or ignition burst (`burns`
    pressure 80).
  - Steel (Wall, Cloner) stops the wind. Empty, gas and fire let it through
    at full strength, and every other cell damps it.
  - Headless (`calm_winds`, lib.rs 311) there is no wind and pressure is
    always 0.
- **Wind thresholds** (|wind| needed to move a cell; lib.rs 398): fire, gas 5
  · dust 10 · sand, mite, rocket 30 · seed 35 · water, acid 40 · oil 50 ·
  fungus 54 · lava, ice, plant 60 · stone, wood 70 · dirt, wall, cloner
  never.

## What lemmings feel (lemmings.rs)

| | Materials |
|---|---|
| **Not solid** (lemmings fall through, wade or swim) | Empty, Water, Oil, Acid, Lava, Gas, Fire, Mite (lemmings.rs 127) |
| **Solid** (walk on it, bump into it, dig/bash/mine it) | everything else: Wall, Dirt, Sand, Stone, Ice, Wood, Plant, Fungus, Seed, Dust, Cloner, Rocket |
| **Steel** (cannot be dug, bashed, mined or blown up) | Wall, Cloner (lemmings.rs 142) |
| **Burns** | Fire or Lava at the feet, 3 up, 6 up, or 1 left/right 3 up (lemmings.rs 640) |
| **Dissolves** | Acid at those same points |
| **Drowns** | Water or Oil 5 cells above the feet, so liquid up to 5 deep is safe to wade |
| **Buried** | a solid cell in the lemming's feet cell lifts it 1 cell if there is room 8 up; otherwise it is crushed after 45 frames (lemmings.rs 576) |

A bomber's blast (lemmings.rs 597) does the following:

- empties every non-steel cell within radius 9 and writes a pressure-80
  burst into `burns`;
- turns about 40% of the Dirt and Stone in the ring out to radius 12 into
  Sand;
- puts about 14 Fire cells into empty spots.

The builder lays Wood (lemmings.rs 759).

## Materials

### Empty, Wall, Dirt
- **Tick:** no rule (line 43). They never change by themselves.
- **Wall:**
  - steel for lemmings;
  - acid cannot eat it;
  - wind never moves it.
- **Dirt:**
  - static, diggable;
  - acid eats it;
  - the only things that change it are a blast (crumbles it to sand) and
    plant growth overwriting it (see Plant).

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
  - else falls diagonally into Empty or Oil, else to the other diagonal;
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
  - acid eats it.
- **Lemmings:** not solid; drowns at 6+ deep.

### Stone (line 132)
- **Arch rule first:** if the cells up-left and up-right are both Stone,
  the cell never moves. Undercut stone therefore keeps hanging as an arch,
  and only unsupported edge columns drop.
- **Browser only:** fluid pressure > 120 (an explosion or ignition burst
  nearby) turns it into Sand.
- **Moves:** falls straight down into Empty only. It never slides
  diagonally, so it piles in vertical columns.
- **Density:** sinks through Water, Gas, Oil and Acid.
- **Made by:** lava touching water.
- **Lemmings:** solid; the outer ring of a blast crumbles it to sand.

### Ice (line 757)
- **Static:** never falls.
- **Each tick** it samples one neighbour (9 options):
  - Fire or Lava → this ice cell becomes Water;
  - Water → with 7% chance that water cell becomes Ice. Ice grows through
    any water it touches, about 1–2 cells per second.
- **Browser only:** pressure > 120 → Water.
- **Lemmings:** solid; can be dug, bashed or mined. Fungus does not grow
  next to it.

### Fire (line 593)
- **Lifetime:** each tick `ra` drops by 1–3; it dies when `ra` < 5. Fire
  made by `fill_rect` lives about 0.5–1.2 s.
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
  - Gas or Dust → that cell becomes Fire;
  - Water → this lava becomes Stone and the water cell becomes Empty.
- **Moves:** falls into Empty below, else diagonally down, else 1 cell
  sideways (towards the sampled side). It never swaps, so it rests on top
  of liquids, slowly.
- **Ignites:** wood, oil, plant, fungus and seed next to it, and melts ice.
  Because of the precedence quirk below, wood, oil, plant and fungus next to
  lava keep getting re-lit and never burn out while the lava stays.
- **Wind:** weak upward push.
- **Lemmings:** burns them.

### Gas (line 372)
- **Moves:** random walk (9 options) into Empty. A cell that didn't move
  gets `rb` 5. A cell with `rb` ≥ 3 that moves splits in two, so gas expands
  to fill space. Touching thin cells (`rb` < 4) merge.
- **Buoyancy:** none in the rule. Headless it just diffuses; in the browser
  any wind carries it (threshold 5).
- **Reactions:** fire or lava turn it into Fire with a pressure burst. A gas
  cloud plus a spark is a flash fire through the whole cloud.
- **Lemmings:** not solid, harmless.

### Oil (line 286)
- **Moves:** only into Empty — down, diagonally down, then sideways. It
  never displaces anything; water sinks through it, so oil floats on water.
- **Ignition:** `rb = 50` when its sampled neighbour is any of:
  - Fire (while unlit),
  - Lava (always),
  - burning Oil in its last 18 ticks.
- **Burning:** `rb` −1 per tick. On 3 of every 4 ticks it puts Fire into the
  sampled neighbour if that is Empty, so a burning pool throws lots of fire.
  Water puts it out. At `rb` 1 the oil becomes Empty. A pool burns away as a
  wave from where it was lit; a 160×56 pool takes about 30 s.
- **Lemmings:** not solid; drowns like water.

### Acid (line 1176)
- **Moves:** falls into Empty, else sideways into Empty (random side first).
- **Eats:** when it can't move, it replaces the cell below — else beside,
  else above if that cell is not Empty — with weakened acid. It eats any
  species except Wall and Acid, including Dirt, Stone, Ice, Wood, Water,
  Lava and Cloner. Weakened acid has `ra` − 60; below 80 it becomes Empty
  instead. Fresh acid (`ra` 100–149) therefore eats 1 cell, or 2 if `ra` ≥
  140, and is spent.
- **Density:** it never swaps, but by eating liquids below it, it ends up
  under them.
- **Lemmings:** not solid; dissolves them.

### Wood (line 682)
- **Static** solid.
- **Ignition:** `rb = 90` when its sampled neighbour is Fire (while unlit)
  or Lava (always).
- **Burning:** `rb` −1 per tick. On every 4th tick it puts Fire into the
  sampled neighbour if that is Empty. Water puts it out (`rb` 0, plus a
  steam puff of fluid density). At `rb` 1 it becomes Empty, about 1.5 s
  after lighting. Fire reaches other wood only through Fire cells in Empty
  neighbours, so wooden structures burn from their exposed surfaces inward.
- **Next to lava:** wood is re-lit to 90 about every 9 ticks, so it burns
  forever, a permanent torch, and never disappears.
- **Other materials:** mites eat it, plants spread from it, fungus can eat
  into it.
- **Lemmings:** solid; the builder's bricks are wood.

### Plant (line 804)
- **Static** solid.
- **Each tick** it samples one neighbour:
  - **Fire** (while unlit) **or Lava** → `rb = 20`. Burning lasts 20 ticks,
    puts Fire into the sampled neighbour every tick if that is Empty, and
    water puts it out. Then it becomes Empty.
  - **Wood** → grows a Plant cell into a random Empty neighbour.
  - **Water** (or Fungus, under conditions), with 19% chance → writes a
    Plant cell there and sets the cell on the opposite side (−dx, same dy)
    to Empty, whatever it is, even Wall or Dirt. If dx = 0 both writes hit
    the same cell, so the water is simply deleted. Plants eat their way
    through water and can punch holes in what lies opposite.
- **Vines:** a plant with `ra` > 50 and no plant diagonally below grows
  downward into Empty (JS random); otherwise its `ra` decays.
- **Other materials:** mites eat it; seeds germinate on it.
- **Lemmings:** solid, diggable.

### Seed (line 932)
- **Fire or Lava neighbour** → it becomes Fire.
- **Falling** (`rb` 0):
  - moves like sand and sinks through Water, Gas, Oil and Acid;
  - if the cell below (straight or diagonal) is Sand, Plant or Fungus, it
    germinates (`rb` = random 1–253).
- **Stem** (`ra` > 60):
  - with 24% chance per tick, moves one cell up into Empty, Sand or Seed
    (random −1/0/+1 x), leaving Plant behind; `ra` drops 0–9 per step;
  - if blocked it vanishes;
  - fill_rect seeds grow stalks about 9–19 cells tall.
- **Petals** (`ra` 41–60): spread around the tip (JS random), a flower.
- **Spent** (`ra` ≤ 40): spawns new Seeds into touching water.
- **Lemmings:** solid.

### Fungus (line 1048)
- **Ignition:** `rb = 10` on Fire (while unlit) or Lava. It burns 10 ticks,
  puts Fire into an Empty neighbour, water puts it out, then it becomes
  Empty.
- **Creeping:** if the sampled neighbour is anything but Empty, Fungus, Fire
  or Ice, it grows a new fungus cell into a random Empty neighbour. Fungus
  therefore creeps along every surface as a coating. It narrows tunnels and
  can grow into a lemming's body cells, burying it. Ice stops it.
- **Wood:** eats into wood whose surrounding cells are wood.
- **Outward growth:** cells with `ra` > 120 also grow outward (JS random).
- **Lemmings:** solid.

### Dust (line 93)
- **Browser only:** pressure > 120 turns it into Fire, with its own burst.
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
- **Lemmings:** not solid, harmless; mites burrow through wood and plants
  like termites.

### Cloner (line 430)
- **Unset** (`rb` 0): adopts the species of a touching cell that is not
  Empty, Cloner or Wall. The last match in its scan order wins.
- **Set:** each tick it walks its neighbour columns and, with 9% chance per
  Empty neighbour, emits its species there — at most one per column per
  tick, about 20–40 cells per second while there is room. It never stops.
- **Lemmings:** steel. Emitted material behaves normally.

### Rocket (line 475)
- **Unset:** a fresh rocket becomes unset (`rb` 100) and falls like sand.
- **Launch:** when it samples a neighbour that is not Empty, Rocket, Wall or
  Cloner, it stores that species. It then picks a random 8-direction,
  reversed if that cell is occupied.
- **Flight:** each tick it moves by (dx, 2·dy) — 2 cells vertically, 1
  horizontally. It leaves new cells of the stored species in its old cell
  and in the cell dy beside it, and turns left or right on 40% of steps. It
  vanishes when its next cell is not Empty, Fire or Rocket. Rockets draw
  random lines of material.
- **Lemmings:** solid while it is a cell.

## Who sinks through what

- **Sand, stone, seed and dormant rocket** swap with Water, Gas, Oil and Acid
  below them.
- **Dust** swaps only with Water.
- **Water** swaps with Oil, so oil floats.
- **Oil, lava, gas, fire and acid** only move into Empty. Acid gets under
  liquids by eating them.

## Quirks that matter for level design

1. **Precedence.** `rb == 0 && nbr == Fire || nbr == Lava` (wood, plant,
   fungus, oil) parses as `(unlit and fire) or lava`. Lava keeps re-lighting
   them, so they never burn out while lava touches them.
2. **Plant overwrites.** Plant growth into water overwrites the cell on the
   opposite side, even steel.
3. **Scan direction.** The update scan never alternates direction (always
   left to right).
4. **Explosions in the browser.** Pressure bursts from bombs, flashes and
   dust convert stone to sand, ice to water and dust to fire around them.
   Headless runs never see this.
5. **Fire is passive.** It needs fuel to persist: burning wood or oil, wood
   or oil touching lava, or a cloner.
6. **Lava and water.** They only react cell-to-cell. Water poured on lava
   makes a one-cell stone crust; the rest of the water then sits on top as
   water.
7. **Bias.** `rand_vec` slightly favours (1,1) and (1,0) (2000 mod 9 = 2),
   and `rand_dir` slightly favours −1.
