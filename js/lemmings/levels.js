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
];
