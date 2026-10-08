// Lemmings levels. Each level paints its terrain into a sandspiel Universe
// and describes the lemmings, skills and goal.
//
// Kept free of imports so the same file runs in the browser and in
// `verify.mjs` under node.

// The world is 4:3, like the original game's screen.
export const WIDTH = 320;
export const HEIGHT = 240;

export const SKILLS = [
  "climber",
  "floater",
  "bomber",
  "blocker",
  "builder",
  "basher",
  "miner",
  "digger",
];

const rect = (u, x, y, w, h, s) =>
  u.fill_rect(Math.round(x), Math.round(y), Math.round(w), Math.round(h), s);

// Filled circle that overwrites whatever is there.
const disc = (u, cx, cy, r, s) => {
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy));
    rect(u, cx - w, cy + dy, 2 * w + 1, 1, s);
  }
};

// One column per x, from top(x) down to `bottom`.
const terrain = (u, x0, x1, top, bottom, s) => {
  for (let x = x0; x < x1; x++) {
    const t = Math.round(top(x));
    rect(u, x, t, 1, bottom - t, s);
  }
};

export const LEVELS = [
  {
    name: "Just dig!",
    hint: "Give a lemming the digger skill and it will dig straight down.",
    music: "just-dig",
    lemmings: 10,
    save: 5,
    releaseRate: 50,
    seconds: 180,
    entrance: [120, 78],
    exit: [262, 165],
    dir: 1,
    skills: { digger: 10 },
    build(u, S) {
      terrain(u, 0, WIDTH, (x) => 166 + 2 * Math.sin((x - 40) / 11), HEIGHT, S.Dirt);
      rect(u, 0, 228, WIDTH, 12, S.Wall);
      rect(u, 70, 120, 180, 30, S.Dirt);
      rect(u, 70, 96, 6, 24, S.Wall);
      rect(u, 244, 96, 6, 24, S.Wall);
      // A dune of loose sand on top.
      terrain(u, 170, 230, (x) => 112 + 8 * Math.pow((x - 200) / 30, 2), 120, S.Sand);
    },
  },
  {
    name: "Bash on through",
    hint: "Bashers punch a tunnel straight ahead. Steel stops them.",
    music: "bash-on-through",
    lemmings: 15,
    save: 12,
    releaseRate: 60,
    seconds: 150,
    entrance: [80, 138],
    exit: [245, 179],
    dir: 1,
    skills: { basher: 5 },
    build(u, S) {
      terrain(u, 0, WIDTH, (x) => 180 + 2 * Math.sin((x - 40) / 9), HEIGHT, S.Dirt);
      terrain(u, 135, 195, (x) => 70 + 12 * Math.pow((x - 165) / 30, 2), 181, S.Dirt);
      disc(u, 165, 110, 12, S.Wall);
      // A sand cap that has nowhere to go.
      terrain(u, 144, 186, (x) => 64 + 10 * Math.pow((x - 165) / 21, 2), 75, S.Sand);
    },
  },
  {
    name: "Mind the gap",
    hint:
      "Builders lay a staircase of twelve wooden steps. Wood burns, so stay well clear of the lava.",
    music: "mind-the-gap",
    lemmings: 10,
    save: 9,
    releaseRate: 1,
    seconds: 180,
    entrance: [60, 105],
    exit: [245, 139],
    dir: 1,
    skills: { builder: 3 },
    build(u, S) {
      rect(u, 0, 150, 128, 90, S.Dirt);
      rect(u, 150, 140, 170, 100, S.Dirt);
      rect(u, 128, 205, 22, 35, S.Lava);
      rect(u, 0, 236, WIDTH, 4, S.Wall);
    },
  },
  {
    name: "Up and over",
    hint:
      "Climbers scale walls. Floaters open an umbrella when they fall. A lemming can be both.",
    music: "up-and-over",
    lemmings: 10,
    save: 8,
    releaseRate: 50,
    seconds: 240,
    entrance: [80, 155],
    exit: [240, 199],
    dir: 1,
    skills: { climber: 10, floater: 10 },
    build(u, S) {
      terrain(u, 0, WIDTH, (x) => 200 + 2 * Math.sin((x - 40) / 7), HEIGHT, S.Dirt);
      rect(u, 150, 60, 16, 142, S.Wall);
    },
  },
  {
    name: "Going out with a bang",
    hint:
      "A bomber counts down from five, then explodes. Sometimes one has to go for the rest to live.",
    music: "going-out-with-a-bang",
    lemmings: 10,
    save: 8,
    releaseRate: 50,
    seconds: 150,
    entrance: [160, 115],
    exit: [255, 199],
    dir: 1,
    skills: { bomber: 2 },
    build(u, S) {
      rect(u, 0, 200, WIDTH, 40, S.Wall);
      rect(u, 110, 96, 6, 68, S.Wall);
      rect(u, 204, 96, 6, 68, S.Wall);
      rect(u, 116, 160, 88, 4, S.Dirt);
      terrain(u, 60, 100, (x) => 192 + 6 * Math.cos((x - 80) / 7), 200, S.Sand);
    },
  },
  {
    name: "Mine, all mine",
    hint:
      "Miners dig down at an angle. Steel plates lie under the left side, and the cave is far to the right.",
    music: "mine-all-mine",
    lemmings: 12,
    save: 10,
    releaseRate: 40,
    seconds: 180,
    entrance: [70, 50],
    exit: [265, 164],
    dir: 1,
    skills: { miner: 3 },
    build(u, S) {
      rect(u, 0, 90, WIDTH, 150, S.Dirt);
      rect(u, 0, 100, 190, 8, S.Wall);
      rect(u, 230, 125, 45, 40, S.Empty);
      rect(u, 0, 232, WIDTH, 8, S.Wall);
      disc(u, 100, 150, 14, S.Water);
      disc(u, 160, 190, 10, S.Lava);
    },
  },
  {
    name: "Sandspiel",
    hint:
      "Bridge the lava, bash the wall, dig down to the cave. Sand doesn't stay where you leave it.",
    music: "sandspiel",
    lemmings: 20,
    save: 16,
    releaseRate: 20,
    seconds: 300,
    entrance: [70, 66],
    exit: [255, 144],
    dir: 1,
    skills: { builder: 2, basher: 2, digger: 2, floater: 2 },
    build(u, S) {
      rect(u, 0, 110, 130, 130, S.Dirt);
      rect(u, 150, 100, 170, 140, S.Dirt);
      rect(u, 130, 200, 20, 40, S.Lava);
      rect(u, 0, 236, WIDTH, 4, S.Wall);
      rect(u, 190, 30, 14, 70, S.Dirt);
      rect(u, 210, 120, 65, 25, S.Empty);
      terrain(u, 212, 272, (x) => 84 + 0.012 * Math.pow(x - 242, 2), 100, S.Sand);
    },
  },
  {
    name: "Let it flow",
    material: "Water",
    music: "water",
    hint:
      "Lemmings can wade through shallow water, but deep water drowns them. Water that runs onto lava turns it to stone.",
    lemmings: 15,
    save: 12,
    releaseRate: 50,
    seconds: 120,
    entrance: [136, 58],
    exit: [288, 124],
    dir: -1,
    skills: { blocker: 1, basher: 2 },
    build(u, S) {
      rect(u, 0, 232, WIDTH, 8, S.Wall);
      // Deep lake on the left, behind a low ridge.
      rect(u, 0, 60, 6, 172, S.Dirt);
      rect(u, 6, 140, 38, 92, S.Dirt);
      rect(u, 6, 100, 38, 40, S.Water);
      rect(u, 44, 100, 10, 132, S.Dirt);
      // Shallow lagoon (3 deep) where the lemmings land, held by a dirt dam.
      rect(u, 54, 103, 96, 129, S.Dirt);
      rect(u, 54, 100, 96, 3, S.Water);
      rect(u, 150, 56, 16, 176, S.Dirt);
      // A gentle slope down to a lava moat that is flush with its banks.
      terrain(u, 166, 214, (x) => 103 + ((x - 166) * 22) / 48, HEIGHT - 8, S.Dirt);
      rect(u, 214, 145, 50, 87, S.Dirt);
      rect(u, 214, 125, 50, 20, S.Lava);
      // The exit bank, and a sump on the far right for the overflow.
      rect(u, 264, 125, 36, 107, S.Dirt);
      rect(u, 300, 200, 16, 32, S.Dirt);
      rect(u, 316, 60, 4, 172, S.Dirt);
    },
  },
  {
    name: "Thin ice",
    material: "Ice",
    music: "ice",
    hint:
      "Ice slowly freezes any water it touches. Lemmings can walk on ice and dig through it, but only where the lake has frozen.",
    lemmings: 12,
    save: 10,
    releaseRate: 50,
    seconds: 120,
    entrance: [52, 66],
    exit: [278, 149],
    dir: 1,
    skills: { basher: 1, digger: 2 },
    build(u, S) {
      rect(u, 0, 232, WIDTH, 8, S.Wall);
      // The pen: back wall and floor.
      rect(u, 0, 30, 14, 202, S.Dirt);
      rect(u, 14, 110, 82, 122, S.Dirt);
      // The ice door, reaching down to the lake bed.
      rect(u, 96, 44, 8, 88, S.Ice);
      // Lake bed and the rock below it.
      rect(u, 96, 132, 224, 100, S.Dirt);
      // The lake: 196 wide, 22 deep, up to the right-hand cliff.
      rect(u, 104, 110, 196, 22, S.Water);
      rect(u, 300, 40, 20, 92, S.Dirt);
      // The exit cave, under the middle of the lake.
      rect(u, 170, 136, 120, 14, S.Empty);
    },
  },
  {
    name: "Rock bottom",
    material: "Stone",
    music: "stone",
    hint: "Stone drops straight down the moment nothing holds it up. It can fill a pit for you, but it fills your tunnels too.",
    lemmings: 20,
    save: 16,
    releaseRate: 50,
    seconds: 180,
    entrance: [45, 112],
    exit: [300, 194],
    dir: 1,
    skills: { basher: 3, digger: 1 },
    build(u, S) {
      // Left meadow with a low hump under the hatch, flat near the pit.
      terrain(u, 0, 153, (x) => 150 - 5 * Math.exp(-Math.pow((x - 45) / 28, 2)), HEIGHT, S.Dirt);
      // The pit (x 153..192, 40 deep). Its floor steps up under the first three
      // columns, where the basher shaves cells off the falling stone, so the
      // block lands flush with the ground.
      rect(u, 153, 190, 40, HEIGHT - 190, S.Dirt);
      rect(u, 153, 179, 1, 11, S.Dirt);
      rect(u, 154, 183, 1, 7, S.Dirt);
      rect(u, 155, 185, 1, 5, S.Dirt);
      // Middle ground up to the cliff, and the low cavern with the exit.
      rect(u, 193, 150, 67, HEIGHT - 150, S.Dirt);
      rect(u, 260, 195, WIDTH - 260, HEIGHT - 195, S.Dirt);
      rect(u, 0, 236, WIDTH, 4, S.Wall);
      // The block: 40 x 40 of stone spanning the pit, resting on a 12-high
      // shoulder on the near side and a 3-high toe on the far side.
      rect(u, 150, 138, 3, 12, S.Stone);
      rect(u, 153, 110, 40, 40, S.Stone);
      rect(u, 193, 147, 3, 3, S.Stone);
      // The boulder: tunnel through it and it sinks into the tunnel.
      terrain(u, 232, 252, (x) => 116 + 4 * Math.pow((x - 241.5) / 10, 2), 150, S.Stone);
    },
  },
  {
    name: "Burning bridges",
    material: "Wood",
    music: "wood",
    hint:
      "Wood makes sturdy bridges and is easy to dig through. But where lava touches it, it catches fire, and the fire eats along the wood.",
    lemmings: 12,
    save: 10,
    releaseRate: 70,
    seconds: 150,
    entrance: [30, 40],
    exit: [298, 117],
    dir: 1,
    skills: { digger: 2, basher: 2 },
    build(u, S) {
      // Lava lake along the bottom, on a steel floor.
      rect(u, 0, 228, WIDTH, 12, S.Wall);
      rect(u, 0, 216, WIDTH, 12, S.Lava);
      // Left cliff under the hatch.
      rect(u, 0, 70, 58, 146, S.Dirt);
      // Right cliff: a pool of lava on top, the exit cave inside.
      rect(u, 268, 98, 52, 118, S.Dirt);
      rect(u, 268, 88, 4, 10, S.Dirt);
      rect(u, 316, 88, 4, 10, S.Dirt);
      rect(u, 272, 92, 44, 6, S.Lava);
      rect(u, 268, 104, 46, 14, S.Empty);
      // Upper wooden bridge; a post at its end stands in the lava.
      rect(u, 58, 70, 244, 5, S.Wood);
      rect(u, 294, 75, 6, 20, S.Wood);
      // Lower wooden walkway, 43 below, into the exit cave, with a rail at its end.
      rect(u, 100, 118, 168, 5, S.Wood);
      rect(u, 100, 110, 3, 8, S.Wood);
      // Wooden door in the cave mouth.
      rect(u, 270, 104, 10, 14, S.Wood);
    },
  },
  {
    name: "Slow burn",
    material: "Fire",
    music: "fire",
    hint:
      "Fire burns wood away and any lemming it touches, then dies out. It creeps along wood too, so watch where the beams lead.",
    lemmings: 12,
    save: 10,
    releaseRate: 75,
    seconds: 150,
    entrance: [50, 112],
    exit: [300, 146],
    dir: 1,
    skills: { basher: 2 },
    build(u, S) {
      rect(u, 0, 232, WIDTH, 8, S.Wall);
      rect(u, 0, 147, WIDTH, 85, S.Dirt);
      // The pen: steel on the left, a dirt wall on the right, a wooden floor.
      rect(u, 0, 90, 8, 57, S.Wall);
      rect(u, 8, 144, 92, 3, S.Wood);
      rect(u, 100, 100, 12, 47, S.Dirt);
      // The barricade, already burning.
      rect(u, 160, 104, 14, 43, S.Wood);
      rect(u, 156, 122, 4, 25, S.Fire);
      rect(u, 174, 122, 4, 25, S.Fire);
      // A wooden beam from the barricade up, across and down into the pen.
      rect(u, 165, 44, 4, 60, S.Wood);
      rect(u, 8, 40, 161, 4, S.Wood);
      rect(u, 8, 44, 4, 100, S.Wood);
    },
  },
  {
    name: "Black gold",
    material: "Oil",
    music: "oil",
    hint:
      "Oil drowns lemmings just like water, but oil burns. Set it alight, keep everyone well back, and the tank will burn itself empty.",
    lemmings: 16,
    save: 13,
    releaseRate: 20,
    seconds: 150,
    entrance: [40, 40],
    exit: [262, 119],
    dir: 1,
    skills: { blocker: 1, bomber: 1, digger: 1 },
    build(u, S) {
      // A hill around the hatch that runs down onto the flat lid of the tank.
      terrain(u, 0, WIDTH, (x) => (x < 96 ? 72 + 18 * Math.pow(Math.max(0, x - 30) / 66, 2) : 90), HEIGHT, S.Dirt);
      rect(u, 0, 228, WIDTH, 12, S.Wall);
      rect(u, 0, 30, 4, 50, S.Wall);
      // The tank under the lid: 19 rows of oil floating on 2 rows of water,
      // with a little air between the oil and the lid.
      rect(u, 94, 96, 6, 28, S.Wall);
      rect(u, 94, 120, 212, 4, S.Wall);
      rect(u, 300, 56, 6, 68, S.Wall);
      rect(u, 100, 96, 200, 3, S.Empty);
      rect(u, 100, 99, 200, 19, S.Oil);
      rect(u, 100, 118, 200, 2, S.Water);
      // Near the far end the lid is steel, with a dry well sunk into the oil:
      // whoever falls in stays there.
      rect(u, 268, 90, 32, 6, S.Wall);
      rect(u, 278, 96, 12, 11, S.Dirt);
      rect(u, 280, 90, 8, 15, S.Empty);
    },
  },
  {
    name: "Firedamp",
    material: "Gas",
    music: "gas",
    hint:
      "Gas is harmless to walk through, but one spark sets the whole cloud ablaze. Anything inside burns, lemmings and wood alike.",
    lemmings: 14,
    save: 11,
    releaseRate: 30,
    seconds: 180,
    entrance: [90, 60],
    exit: [285, 133],
    dir: 1,
    skills: { climber: 1, bomber: 1, digger: 1 },
    build(u, S) {
      rect(u, 0, 100, WIDTH, HEIGHT - 100, S.Dirt);
      rect(u, 0, 228, WIDTH, 12, S.Wall);
      // The pen: a steel wall with a lip on the left, a dirt wall on the right
      // that only a climber can get over.
      rect(u, 40, 70, 6, 30, S.Wall);
      rect(u, 46, 70, 4, 2, S.Wall);
      rect(u, 140, 88, 6, 12, S.Dirt);
      // The cave under a 4-thick dirt roof, walled in steel and full of gas.
      rect(u, 50, 104, 250, 30, S.Gas);
      rect(u, 44, 104, 6, 34, S.Wall);
      rect(u, 44, 134, 262, 4, S.Wall);
      rect(u, 300, 50, 6, 88, S.Wall);
      // Three wooden barricades, each with a gap above it so the gas is one
      // cloud (too narrow and too high for a lemming).
      rect(u, 160, 108, 2, 26, S.Wood);
      rect(u, 205, 108, 2, 26, S.Wood);
      rect(u, 250, 108, 2, 26, S.Wood);
      // A crack in the roof between the second and third barricade: a lemming
      // walking over it drops into the gas.
      rect(u, 228, 100, 1, 4, S.Empty);
    },
  },
  {
    name: "Powder keg",
    material: "Dust",
    music: "dust",
    hint:
      "Dust is solid like sand: lemmings can walk on it and dig through it. But one touch of flame turns a whole heap of dust into fire.",
    lemmings: 12,
    save: 10,
    releaseRate: 40,
    seconds: 180,
    entrance: [80, 60],
    exit: [226, 145],
    dir: 1,
    skills: { digger: 1, basher: 1 },
    build(u, S) {
      rect(u, 0, 100, WIDTH, HEIGHT - 100, S.Dirt);
      rect(u, 0, 228, WIDTH, 12, S.Wall);
      rect(u, 40, 50, 4, 50, S.Wall);
      // The gorge, full of dust, widening under the far bank at the bottom.
      rect(u, 150, 100, 60, 46, S.Dust);
      rect(u, 210, 130, 22, 16, S.Dust);
      rect(u, 150, 146, 82, 4, S.Wall);
      rect(u, 150, 140, 4, 6, S.Wall); // a steel stump at the left end of the floor
      // A tongue of dust under the near bank, and a pocket of lava below it.
      rect(u, 124, 138, 26, 8, S.Dust);
      rect(u, 118, 148, 32, 5, S.Lava);
      // A pit on the far bank that nobody climbs out of.
      rect(u, 236, 100, 36, 16, S.Empty);
      rect(u, 272, 80, 6, 36, S.Wall);
    },
  },
  {
    name: "Acid test",
    material: "Acid",
    music: "acid",
    hint: "Acid eats everything except steel, even solid stone. Drop the pillar in, but keep your bridges out of the acid.",
    lemmings: 20,
    save: 15,
    releaseRate: 1,
    seconds: 200,
    entrance: [25, 88],
    exit: [300, 149],
    dir: 1,
    skills: { builder: 3, basher: 1 },
    build(u, S) {
      // Hatch hill and a ramp down to a pond of acid, flush with the ground.
      terrain(u, 0, 60, (x) => 115 - 5 * Math.exp(-Math.pow((x - 25) / 16, 2)), HEIGHT, S.Dirt);
      terrain(u, 60, 90, (x) => 115 + (x - 60) / 2, HEIGHT, S.Dirt);
      rect(u, 90, 130, 1, 16, S.Wall);
      rect(u, 105, 130, 1, 16, S.Wall);
      rect(u, 90, 144, 16, 2, S.Wall);
      rect(u, 91, 130, 14, 14, S.Acid);
      rect(u, 90, 146, 16, HEIGHT - 146, S.Dirt);
      // Lower ground beyond the pond (a 20-high drop, so nobody walks back).
      rect(u, 106, 150, WIDTH - 106, HEIGHT - 150, S.Dirt);
      // A steel vat under the floor: 40 rows of air above 30 rows of acid, so
      // a falling pillar is entirely inside the vat before it reaches the acid.
      rect(u, 167, 155, 42, 72, S.Wall);
      rect(u, 168, 155, 40, 70, S.Empty);
      rect(u, 168, 195, 40, 30, S.Acid);
      rect(u, 183, 150, 5, 5, S.Empty); // the hole in the floor
      // A 30-high stone pillar plugs the hole, resting on a 9-high shoulder
      // (near side) and a 3-high toe (far side).
      rect(u, 180, 141, 3, 9, S.Stone);
      rect(u, 183, 120, 5, 30, S.Stone);
      rect(u, 188, 147, 3, 3, S.Stone);
      rect(u, 0, 236, WIDTH, 4, S.Wall);
    },
  },
  {
    name: "Drink up",
    material: "Plant",
    music: "plant",
    hint: "Plants drink water and grow into it, so give them time. Their vines hang down and block the way, but you can bash through.",
    lemmings: 10, save: 8, releaseRate: 50, seconds: 240,
    entrance: [18, 96], exit: [302, 140], dir: 1,
    skills: { basher: 3 },
    build(u, S) {
      // Ground, a steel bed and a cave roof.
      rect(u, 0, 141, WIDTH, HEIGHT - 141, S.Dirt);
      rect(u, 0, 232, WIDTH, 8, S.Wall);
      rect(u, 0, 0, WIDTH, 60, S.Dirt);
      terrain(u, 0, WIDTH, (x) => 40 + 8 * Math.sin(x / 23) + 3 * Math.sin(x / 7), 60, S.Empty);
      rect(u, 0, 80, 6, 61, S.Wall);
      // The flooded room: dirt walls, water 9 deep, rocks on its floor (they keep a basher
      // going through the leftover plant), a tiny plant in the far corner.
      rect(u, 30, 116, 6, 25, S.Dirt);
      rect(u, 176, 116, 6, 25, S.Dirt);
      rect(u, 36, 132, 140, 9, S.Water);
      for (let x = 40; x < 176; x += 6) rect(u, x, 139, 2, 2, S.Dirt);
      rect(u, 174, 139, 2, 2, S.Plant);
      // A low roof with plant under it: its vines curtain off the path. A thin plant pillar
      // at its left edge reaches the floor, so the curtain always starts at the same spot and
      // a basher cuts every vine (an uncut vine left of the cut could creep down later).
      rect(u, 216, 100, 60, 27, S.Dirt);
      rect(u, 220, 127, 52, 3, S.Plant);
      rect(u, 220, 130, 1, 11, S.Plant);
    },
  },
  {
    name: "Seedbed",
    material: "Seed",
    music: "seed",
    hint: "Seeds that land on sand sprout into tall stalks that stop lemmings like a wall. On dirt they just pile up.",
    lemmings: 10, save: 8, releaseRate: 50, seconds: 180,
    entrance: [190, 105], exit: [16, 140], dir: 1,
    skills: { basher: 2 },
    build(u, S) {
      // Cave roof and ground.
      rect(u, 0, 0, WIDTH, 56, S.Dirt);
      terrain(u, 0, WIDTH, (x) => 34 + 6 * Math.sin(x / 17) + 3 * Math.sin(x / 5), 56, S.Empty);
      rect(u, 0, 150, 272, 82, S.Dirt);
      rect(u, 0, 232, WIDTH, 8, S.Wall);
      rect(u, 272, 205, 48, 27, S.Lava);
      // Seed pocket in the roof over the sand bed at the cliff edge: a fence of stalks.
      rect(u, 228, 24, 40, 24, S.Dirt);
      rect(u, 232, 26, 32, 14, S.Seed);
      for (let x = 240; x <= 258; x += 6) rect(u, x, 40, 1, 8, S.Empty);
      rect(u, 236, 150, 28, 3, S.Sand);
      // A thin pocket that sprinkles seeds onto plain dirt: they just lie there.
      rect(u, 124, 30, 100, 18, S.Dirt);
      rect(u, 128, 34, 92, 2, S.Seed);
      for (let x = 130; x < 220; x += 9) rect(u, x, 36, 1, 12, S.Empty);
      // Low tunnel (exactly 9 rows high, so a basher clears every stalk) to the exit,
      // with a sand floor and seeds lying on it.
      rect(u, 48, 100, 64, 41, S.Dirt);
      rect(u, 66, 150, 36, 3, S.Sand);
      for (let x = 68; x <= 100; x += 4) rect(u, x, 149, 1, 1, S.Seed);
      // Exit platform, 9 high; a pocket above its foot piles seeds up into a ramp.
      rect(u, 0, 141, 30, 9, S.Dirt);
      rect(u, 22, 24, 22, 24, S.Dirt);
      rect(u, 26, 26, 14, 12, S.Seed);
      rect(u, 31, 38, 1, 10, S.Empty);
    },
  },
  {
    name: "Soft landing",
    material: "Fungus",
    music: "fungus",
    hint: "Fungus creeps over dirt and plugs small holes, which can catch a falling lemming or trap it. It cannot grow on ice.",
    lemmings: 10, save: 8, releaseRate: 70, seconds: 240,
    entrance: [20, 86], exit: [282, 204], dir: 1,
    skills: { builder: 2, digger: 2 },
    build(u, S) {
      // Cave roof, ground, steel floor.
      rect(u, 0, 0, WIDTH, 50, S.Dirt);
      const roof = (x) => Math.round(28 + 6 * Math.sin(x / 19) + 3 * Math.sin(x / 6));
      terrain(u, 0, WIDTH, roof, 50, S.Empty);
      // Fungus creeping over the dirt roof, far above the lemmings.
      rect(u, 150, roof(150), 3, 2, S.Fungus);
      rect(u, 262, roof(262), 3, 2, S.Fungus);
      rect(u, 0, 131, WIDTH, HEIGHT - 131, S.Dirt);
      rect(u, 0, 232, WIDTH, 8, S.Wall);
      rect(u, 0, 60, 6, 71, S.Wall);
      // Upper walkway of ice, split by a crack lined with ice: nothing will fill it.
      rect(u, 6, 131, 194, 2, S.Ice);
      rect(u, 117, 131, 9, 94, S.Ice);
      rect(u, 120, 131, 3, 94, S.Empty);
      // A step down to the landing; the landing ends at an ice wall.
      rect(u, 200, 131, 46, 12, S.Empty);
      rect(u, 200, 143, 40, 2, S.Ice);
      rect(u, 240, 96, 6, 47, S.Ice);
      // The deep well: ice-lined, with a dirt collar half way down where fungus grows.
      rect(u, 214, 145, 11, 46, S.Ice);
      rect(u, 214, 178, 11, 6, S.Dirt);
      rect(u, 218, 143, 3, 48, S.Empty);
      rect(u, 218, 180, 1, 2, S.Fungus);
      rect(u, 220, 180, 1, 2, S.Fungus);
      // The exit cave below, lined with ice.
      rect(u, 150, 190, 150, 17, S.Ice);
      rect(u, 152, 191, 146, 14, S.Empty);
      rect(u, 218, 190, 3, 1, S.Empty);
    },
  },
  {
    name: "Termites",
    material: "Mite",
    music: "mite",
    hint:
      "Mites are harmless to lemmings, but they chew through wood: doors, and your builders' steps too. Water kills them.",
    lemmings: 20,
    save: 17,
    releaseRate: 50,
    seconds: 150,
    entrance: [105, 135],
    exit: [296, 182],
    dir: 1,
    skills: { basher: 1, builder: 2 },
    build(u, S) {
      rect(u, 0, 232, WIDTH, 8, S.Wall);
      rect(u, 0, 0, 4, 232, S.Wall);
      rect(u, WIDTH - 4, 0, 4, 232, S.Wall);
      // Start cave (floor y 180); everything right of it is 3 lower (floor y 183).
      rect(u, 4, 180, 140, 52, S.Dirt);
      rect(u, 144, 183, WIDTH - 148, 49, S.Dirt);
      // A pool of water behind a dirt dam, far left.
      rect(u, 4, 175, 60, 5, S.Water);
      rect(u, 64, 160, 6, 20, S.Dirt);
      // Steel wall with a wooden door.
      rect(u, 150, 0, 8, 150, S.Wall);
      rect(u, 150, 150, 8, 33, S.Wood);
      // A dirt fence too high to step over. Water (and mites) can pass the
      // slot under it; lemmings can't.
      rect(u, 242, 178, 6, 3, S.Dirt);
      // Termites, scattered along the corridor.
      for (let i = 0; i < 48; i++) {
        rect(u, 161 + ((i * 37) % 79), 150 + ((i * 11) % 30), 1, 1, S.Mite);
      }
    },
  },
  {
    name: "Two fountains",
    material: "Cloner",
    music: "cloner",
    hint:
      "A cloner copies whatever touches it and never stops until it is buried. One pours sand, one pours water.",
    lemmings: 20,
    save: 17,
    releaseRate: 50,
    seconds: 120,
    entrance: [80, 120],
    exit: [290, 149],
    dir: 1,
    skills: { basher: 2 },
    build(u, S) {
      rect(u, 0, 232, WIDTH, 8, S.Wall);
      rect(u, 0, 0, 4, 232, S.Wall);
      rect(u, WIDTH - 4, 0, 4, 232, S.Wall);
      // Ground on both sides of a deep pit (x 130..153, 81 deep).
      rect(u, 4, 150, 126, 82, S.Dirt);
      rect(u, 154, 150, 162, 82, S.Dirt);
      rect(u, 130, 231, 24, 1, S.Dirt);
      // A hill left of the pen.
      terrain(u, 4, 46, (x) => 150 - 44 * Math.sin(((x - 4) / 42) * 1.5), 150, S.Dirt);
      // The pen: steel walls and roof, a dirt door on the right.
      rect(u, 46, 96, 64, 6, S.Wall);
      rect(u, 46, 102, 4, 48, S.Wall);
      rect(u, 100, 102, 10, 48, S.Dirt);
      // A water cloner in the back wall (it touches one drop). Its water fills a
      // sump behind a low steel sill, then spills over and floods the pen.
      rect(u, 50, 150, 12, 10, S.Empty);
      rect(u, 62, 146, 2, 4, S.Wall);
      rect(u, 49, 119, 2, 1, S.Wall);
      rect(u, 49, 121, 2, 1, S.Wall);
      rect(u, 49, 120, 1, 1, S.Cloner);
      rect(u, 50, 120, 1, 1, S.Water);
      // A sand cloner hanging above the pit (it touches one grain).
      rect(u, 141, 136, 2, 1, S.Cloner);
      rect(u, 141, 135, 1, 1, S.Sand);
    },
  },
  {
    name: "Lift-off",
    material: "Rocket",
    music: "rocket",
    hint:
      "A rocket copies the first thing that touches it and flies off trailing it. Until then, a pit full of rockets is a floor.",
    lemmings: 20,
    save: 17,
    releaseRate: 50,
    seconds: 120,
    entrance: [70, 118],
    exit: [170, 189],
    dir: 1,
    skills: { basher: 2 },
    build(u, S) {
      rect(u, 0, 232, WIDTH, 8, S.Wall);
      rect(u, 0, 0, 4, 232, S.Wall);
      rect(u, WIDTH - 4, 0, 4, 232, S.Wall);
      rect(u, 4, 150, WIDTH - 8, 82, S.Dirt);
      // A steel pit packed with rockets (40 deep); the exit is at its bottom.
      rect(u, 138, 150, 64, 44, S.Wall);
      rect(u, 140, 150, 60, 40, S.Rocket);
      // A tank of gas on the right, closed by a dirt wall.
      rect(u, 206, 114, 38, 6, S.Wall);
      rect(u, 240, 120, 4, 30, S.Wall);
      rect(u, 206, 120, 4, 30, S.Dirt);
      rect(u, 210, 120, 30, 30, S.Gas);
      // Far left: a water cloner (it touched one drop) fills a sump behind a low
      // steel sill; then the water creeps right toward the rockets.
      rect(u, 8, 150, 12, 20, S.Empty);
      rect(u, 20, 146, 2, 4, S.Wall);
      rect(u, 4, 119, 2, 1, S.Wall);
      rect(u, 4, 121, 2, 1, S.Wall);
      rect(u, 4, 120, 1, 1, S.Cloner);
      rect(u, 5, 120, 1, 1, S.Water);
    },
  },
];
