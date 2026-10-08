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
];
