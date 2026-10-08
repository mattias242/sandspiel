// Pixel-art lemmings drawn on a 2D canvas on top of the sand.
// Sprites are 8 x 16 "pixels", where one pixel is half a sand cell, so a
// lemming is 4 cells wide and 8 tall. They face right and are mirrored
// when walking left. The feet sit on the bottom row.

const PALETTE = {
  g: "#1fd01f", // hair
  h: "#0c860c", // hair shade
  s: "#f7d4c6", // skin
  b: "#3d48f2", // robe
  d: "#2329a8", // robe shade
  w: "#ffffff",
  t: "#dc9a52", // wooden brick
  k: "#7a4a24", // handle
  p: "#b9bec9", // steel
  r: "#e8423b",
};

const HEAD = [
  "........",
  "..ggg...",
  ".ggggh..",
  ".gggss..",
  "..gsss..",
  "...ss...",
];

const HEAD_FRONT = [
  "........",
  "..gggg..",
  ".gggggg.",
  ".gsssshg",
  "..ssss..",
  "...ss...",
];

const LEGS_STRIDE = [
  "..bbdb..",
  "..b..b..",
  ".b....b.",
  ".b....b.",
  "ss....ss",
];
const LEGS_MID = [
  "..bbd...",
  "..b.b...",
  "..b..b..",
  "..b..b..",
  "..ss.ss.",
];
const LEGS_TOGETHER = [
  "...bd...",
  "...bd...",
  "...bd...",
  "...bd...",
  "...sss..",
];
const LEGS_APART = [
  "..bddb..",
  "..b..b..",
  "..b..b..",
  "..b..b..",
  ".ss..ss.",
];
const LEGS_KNEEL = [
  "..bbbbb.",
  "..b...b.",
  "..b...b.",
  ".bb...b.",
  "ss....ss",
];

const sprite = (...parts) => [].concat(...parts);

const WALK = [
  sprite(HEAD, ["...bb...", "..bbbb..", "..bbbbs.", "..bbbb..", "..bdbb.."], LEGS_STRIDE),
  sprite(HEAD, ["...bb...", "..bbbb..", "..bbbb..", "..bbbs..", "..bdbb.."], LEGS_MID),
  sprite(HEAD, ["...bb...", "..bbbb..", "..bbbb..", "..sbbb..", "..bdbb.."], LEGS_TOGETHER),
  sprite(HEAD, ["...bb...", "..bbbb..", "..bbbb..", "..bbbs..", "..bdbb.."], LEGS_MID),
];

const FALL = [
  sprite(
    ["s......s", "s.ggg..s", "sggggh.s", "bgggssb.", ".bgsssb.", "..bss.b."],
    ["...bb...", "..bbbb..", "..bbbb..", "..bbbb..", "..bdbb.."],
    LEGS_TOGETHER
  ),
  sprite(
    [".s....s.", ".sggg.s.", ".ggggh..", "bgggssb.", "b.gsss.b", "...ss..."],
    ["..bbb...", "..bbbb..", "..bbbb..", "..bbbb..", "..bdbb.."],
    LEGS_APART
  ),
];

const FLOAT = [
  sprite(
    ["......s.", "..ggg.s.", ".ggggh.s", ".gggss.b", "..gsssb.", "...ssb.."],
    ["...bb...", "..bbbb..", "..bbbb..", "..bbbb..", "..bdbb.."],
    LEGS_TOGETHER
  ),
];

const CLIMB = [
  sprite(
    ["......s.", "...ggg.s", "..gggg.b", "..gggg.b", "..ggggb.", "...gg.b."],
    ["...bbbb.", "...bbb..", "...bbb..", "...bdb..", "...bbb.."],
    ["...bb...", "...b.b..", "...b..b.", "...b..ss", "...ss..."]
  ),
  sprite(
    ["........", "...ggg.s", "..gggg.b", "..ggggb.", "..ggggb.", "...ggbb."],
    ["...bbb..", "...bbb..", "...bbb..", "...bdb..", "...bbb.."],
    ["...bb...", "....b...", "....b...", "....bs..", "....ss.."]
  ),
];

const BLOCK = [
  sprite(
    HEAD_FRONT,
    ["s.bbbb.s", "sbbbbbbs", "..bbbb..", "..bbbb..", "..bddb.."],
    LEGS_APART
  ),
  sprite(
    HEAD_FRONT,
    ["..bbbb..", "sbbbbbbs", "s.bbbb.s", "..bbbb..", "..bddb.."],
    LEGS_APART
  ),
];

const BUILD = [
  sprite(
    ["........", "........", "........", "...ggg..", "..ggggh.", "..gggss."],
    ["...gsss.", "..bbbb..", "..bbbbbs", "..bbbb.t", "..bdbb.."],
    LEGS_KNEEL
  ),
  sprite(
    ["........", "........", "........", "........", "...ggg..", "..ggggh."],
    ["..gggss.", "...gsss.", "..bbbb..", "..bbbbbs", "..bdbbtt"],
    LEGS_KNEEL
  ),
];

const SHRUG = [
  sprite(
    ["........", "..ggg...", ".ggggh..", "sgggss.s", "s.gsss.s", "b..ss..b"],
    ["bbbbbbbb", "..bbbb..", "..bbbb..", "..bbbb..", "..bdbb.."],
    LEGS_TOGETHER
  ),
];

const BASH = [
  sprite(HEAD, ["...bb...", "s.bbbb..", "sbbbbb..", "..bbbb..", "..bdbb.."], LEGS_STRIDE),
  sprite(HEAD, ["...bb...", "..bbbbbs", "..bbbbbs", "..bbbb..", "..bdbb.."], LEGS_STRIDE),
];

const MINE = [
  sprite(
    ["....kpp.", "..gggk.p", ".ggggk..", ".gggssk.", "..gssss.", "...ss..."],
    ["...bb...", "..bbbb..", "..bbbb..", "..bbbb..", "..bdbb.."],
    LEGS_STRIDE
  ),
  sprite(
    HEAD,
    ["...bb...", "..bbbb..", "..bbbbs.", "..bbbbbk", "..bdbb.k"],
    ["..bbdb.k", "..b..bpp", ".b....bp", ".b....b.", "ss....ss"]
  ),
];

const DIG = [
  sprite(
    ["........", "........", "..gggg..", ".gggggg.", ".gsssshg", "s.ssss.s"],
    ["sbbbbbbs", "kbbbbbbk", "k.bbbb.k", "k.bddb.k", "pb....bp"],
    ["pbb..bbp", "..b..b..", "..b..b..", "..b..b..", ".ss..ss."]
  ),
  sprite(
    ["........", "........", "........", "..gggg..", ".gggggg.", ".gsssshg"],
    ["s.ssss.s", "sbbbbbbs", "kbbbbbbk", "k.bddb.k", "k.b..b.k"],
    ["pbb..bbp", "pb....bp", "..b..b..", "..b..b..", ".ss..ss."]
  ),
];

const SPLAT = [
  sprite(
    Array(11).fill("........"),
    ["...g....", ".ggbgg..", "gbbbbbsg", "rbbsbbbr", "rrrrrrrr"]
  ),
];

function mirror(rows) {
  return rows.map((r) => r.split("").reverse().join(""));
}

const cache = new Map();
function frames(name, list) {
  if (!cache.has(name)) {
    cache.set(name, {
      right: list,
      left: list.map(mirror),
    });
  }
  return cache.get(name);
}

const SPRITES = {
  walk: WALK,
  fall: FALL,
  float: FLOAT,
  climb: CLIMB,
  block: BLOCK,
  build: BUILD,
  shrug: SHRUG,
  bash: BASH,
  mine: MINE,
  dig: DIG,
  splat: SPLAT,
};

function drawRows(ctx, rows, left, top, px, tint, alpha) {
  ctx.globalAlpha = alpha;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === ".") continue;
      ctx.fillStyle = tint ? tint(ch, r, c) : PALETTE[ch];
      ctx.fillRect(
        Math.floor(left + c * px),
        Math.floor(top + r * px),
        Math.ceil(px),
        Math.ceil(px)
      );
    }
  }
  ctx.globalAlpha = 1;
}

// Draws one sprite frame with its feet on cell (x, y).
function drawSprite(ctx, name, frame, x, y, dir, cell, opts = {}) {
  const set = frames(name, SPRITES[name]);
  const list = dir < 0 ? set.left : set.right;
  const rows = list[frame % list.length];
  const px = (cell / 2) * (opts.scale || 1);
  const left = (x + 0.5) * cell - 4 * px;
  const top = (y + 1) * cell - 16 * px + (opts.dy || 0) * cell;
  drawRows(ctx, opts.clip ? rows.slice(0, opts.clip) : rows, left, top, px, opts.tint, opts.alpha ?? 1);
}

function drawUmbrella(ctx, x, y, dir, cell, t) {
  const cx = (x + 0.5 + dir * 1) * cell;
  const top = (y - 11) * cell;
  const w = 3.5 * cell;
  const sway = Math.sin(t / 10) * 0.15;
  ctx.save();
  ctx.translate(cx, top + 2 * cell);
  ctx.rotate(sway);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, w, Math.PI + (i * Math.PI) / 4, Math.PI + ((i + 1) * Math.PI) / 4);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? "#ffffff" : "#e8423b";
    ctx.fill();
  }
  ctx.fillStyle = "#7a4a24";
  ctx.fillRect(-cell * 0.15, 0, cell * 0.3, cell * 4.5);
  ctx.restore();
}

const STATE_SPRITES = {
  Walking: ["walk", 4],
  Falling: ["fall", 3],
  Floating: ["float", 8],
  Climbing: ["climb", 4],
  Blocking: ["block", 12],
  Building: ["build", 8],
  Shrugging: ["shrug", 8],
  Bashing: ["bash", 2],
  Mining: ["mine", 3],
  Digging: ["dig", 5],
};

// `l` is { x, y, dir, state (name), timer, fuse, flags }.
export function drawLemming(ctx, l, cell, frameCount) {
  const { x, y, dir, timer } = l;
  switch (l.state) {
    case "Exiting": {
      const k = Math.min(1, timer / 24);
      drawSprite(ctx, "walk", 2, x, y, dir, cell, {
        alpha: 1 - k,
        scale: 1 - k * 0.5,
      });
      return;
    }
    case "Splatting":
      drawSprite(ctx, "splat", 0, x, y, dir, cell, { alpha: 1 - timer / 30 });
      return;
    case "Drowning":
      drawSprite(ctx, "fall", Math.floor(timer / 6), x, y, dir, cell, {
        dy: timer / 8,
        clip: Math.max(0, 16 - Math.floor(timer / 2.5)),
        alpha: 1 - timer / 50,
      });
      return;
    case "Burning":
    case "Dissolving": {
      const burning = l.state === "Burning";
      const flicker = Math.floor(timer / 3) % 2;
      drawSprite(ctx, "fall", flicker, x, y, dir, cell, {
        alpha: 1 - timer / 45,
        clip: 16,
        tint: (ch, r) => {
          if (burning) return r < 6 + flicker ? "#ffd23b" : flicker ? "#ff7a1a" : "#e8423b";
          return r % 2 ? "#d7f04a" : "#9be03a";
        },
        dy: burning ? 0 : timer / 12,
      });
      return;
    }
  }

  const [name, speed] = STATE_SPRITES[l.state] || ["walk", 4];
  let frame = Math.floor(timer / speed);
  if (l.state === "Walking") frame = Math.floor(x / 1) % 4;
  if (l.state === "Floating") drawUmbrella(ctx, x, y, dir, cell, frameCount);
  drawSprite(ctx, name, frame, x, y, dir, cell);

  if (l.fuse > 0) {
    ctx.font = `${cell < 4 ? 16 : 32}px ChiKareGo, Inconsolata, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.lineWidth = Math.max(2, cell * 0.8);
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#fff";
    const tx = (x + 0.5) * cell;
    const ty = (y - 8.5) * cell;
    ctx.strokeText(String(l.fuse), tx, ty);
    ctx.fillText(String(l.fuse), tx, ty);
  }
}

// A square around the lemming under the cursor, like the original.
export function drawSelection(ctx, l, cell) {
  const size = 10 * cell;
  const left = (l.x + 0.5) * cell - size / 2;
  const top = (l.y - 3) * cell - size / 2;
  const w = Math.max(1, Math.round(cell * 0.5));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(left, top, size, w);
  ctx.fillRect(left, top + size - w, size, w);
  ctx.fillRect(left, top, w, size);
  ctx.fillRect(left + size - w, top, w, size);
}

// Green crosshair cursor, drawn in cell units with a gap in the middle.
export function drawCursor(ctx, x, y, cell) {
  const w = Math.max(1, Math.round(cell * 0.5));
  ctx.fillStyle = "#26e026";
  for (let i = 2; i <= 4; i++) {
    const d = i * cell * 0.75;
    ctx.fillRect(x + d - w / 2, y - w / 2, w, w);
    ctx.fillRect(x - d - w / 2, y - w / 2, w, w);
    ctx.fillRect(x - w / 2, y + d - w / 2, w, w);
    ctx.fillRect(x - w / 2, y - d - w / 2, w, w);
  }
}

// A wooden trapdoor box; the doors swing down as it opens.
export function drawHatch(ctx, x, y, cell, open) {
  const w = 14;
  const left = (x - w / 2 + 0.5) * cell;
  const top = (y - 14) * cell;
  const c = cell;
  ctx.fillStyle = "#4a2a0e";
  ctx.fillRect(left - 2 * c, top - 2 * c, (w + 4) * c, 8 * c);
  ctx.fillStyle = "#b8742e";
  ctx.fillRect(left - 1.5 * c, top - 1.5 * c, (w + 3) * c, 7 * c);
  ctx.fillStyle = "#e3a65a";
  ctx.fillRect(left - 1.5 * c, top - 1.5 * c, (w + 3) * c, c);
  ctx.fillStyle = "#7a4718";
  for (let i = 0; i < w + 3; i += 4) ctx.fillRect(left - 1.5 * c + i * c, top - 0.5 * c, 0.6 * c, 5.5 * c);
  // The opening, with a glimpse of the waiting crowd.
  ctx.fillStyle = "#06061c";
  ctx.fillRect(left, top + c, w * c, 4 * c);
  ctx.fillStyle = "#1a7a1a";
  for (let i = 1; i < w - 1; i += 3) ctx.fillRect(left + i * c, top + 1.5 * c, 1.5 * c, c);
  ctx.fillStyle = "#2a32a8";
  for (let i = 1; i < w - 1; i += 3) ctx.fillRect(left + i * c, top + 2.5 * c, 1.5 * c, 1.5 * c);
  const flap = (w / 2) * c;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side < 0 ? left : left + w * c, top + 5 * c);
    ctx.rotate(-side * open * Math.PI * 0.45);
    ctx.fillStyle = "#4a2a0e";
    ctx.fillRect(side < 0 ? 0 : -flap, 0, flap, c * 1.4);
    ctx.fillStyle = "#c98840";
    ctx.fillRect(side < 0 ? 0 : -flap, 0, flap, c * 0.9);
    ctx.restore();
  }
}

// A golden arch with a blue doorway and two burning torches.
export function drawExit(ctx, x, y, cell, t) {
  const c = cell;
  const cx = (x + 0.5) * c;
  const bottom = (y + 1) * c;
  const half = 8 * c;
  const height = 15 * c;
  ctx.fillStyle = "#6b4512";
  ctx.beginPath();
  ctx.moveTo(cx - half - c, bottom);
  ctx.lineTo(cx - 2.5 * c, bottom - height - c);
  ctx.lineTo(cx + 2.5 * c, bottom - height - c);
  ctx.lineTo(cx + half + c, bottom);
  ctx.fill();
  ctx.fillStyle = "#f0b53c";
  ctx.beginPath();
  ctx.moveTo(cx - half, bottom);
  ctx.lineTo(cx - 2 * c, bottom - height);
  ctx.lineTo(cx + 2 * c, bottom - height);
  ctx.lineTo(cx + half, bottom);
  ctx.fill();
  ctx.fillStyle = "#ffe08a";
  ctx.beginPath();
  ctx.moveTo(cx - half + c, bottom);
  ctx.lineTo(cx - 2 * c, bottom - height + c);
  ctx.lineTo(cx - 1 * c, bottom - height + c);
  ctx.lineTo(cx - half + 3 * c, bottom);
  ctx.fill();
  // Doorway
  ctx.fillStyle = "#6b4512";
  ctx.beginPath();
  ctx.moveTo(cx - 3.5 * c, bottom);
  ctx.lineTo(cx - 3.5 * c, bottom - 5 * c);
  ctx.arc(cx, bottom - 5 * c, 3.5 * c, Math.PI, 0);
  ctx.lineTo(cx + 3.5 * c, bottom);
  ctx.fill();
  ctx.fillStyle = "#2434e8";
  ctx.beginPath();
  ctx.moveTo(cx - 2.5 * c, bottom);
  ctx.lineTo(cx - 2.5 * c, bottom - 5 * c);
  ctx.arc(cx, bottom - 5 * c, 2.5 * c, Math.PI, 0);
  ctx.lineTo(cx + 2.5 * c, bottom);
  ctx.fill();
  ctx.fillStyle = "#6f7dff";
  ctx.fillRect(cx - 1.5 * c, bottom - 6 * c, c, 6 * c);
  // Torches on the shoulders.
  for (const side of [-1, 1]) {
    const tx = cx + side * 5.5 * c - 0.5 * c;
    const ty = bottom - 10 * c;
    ctx.fillStyle = "#4a2a0e";
    ctx.fillRect(tx, ty, c, 4 * c);
    const h = 2.5 + Math.sin(t / 3 + side) * 0.7 + Math.random() * 0.6;
    ctx.fillStyle = "#ff5a14";
    ctx.fillRect(tx - 0.5 * c, ty - h * c, 2 * c, h * c);
    ctx.fillStyle = "#ffe14a";
    ctx.fillRect(tx, ty - (h - 0.8) * c, c, (h - 0.8) * c);
  }
}

// Small icon for a skill button, drawn on its own canvas.
const ICONS = {
  climber: ["climb", 0],
  floater: ["float", 0],
  bomber: ["walk", 2],
  blocker: ["block", 0],
  builder: ["build", 0],
  basher: ["bash", 1],
  miner: ["mine", 0],
  digger: ["dig", 0],
};

export function drawIcon(canvas, skill) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cell = canvas.height / 9.5;
  const [name, frame] = ICONS[skill];
  const x = canvas.width / cell / 2 - 0.5;
  const y = 8.2;
  if (skill === "floater") drawUmbrella(ctx, x - 0.5, y + 2.5, 1, cell * 0.8, 0);
  drawSprite(ctx, name, frame, x, y, 1, cell);
  if (skill === "bomber") {
    ctx.font = "16px ChiKareGo, Inconsolata, monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText("5", (x + 0.5) * cell, cell * 1.6);
  }
}

// Pixel icons for the panel's other buttons.
const PANEL_ICONS = {
  minus: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".gggggggggggggg.",
    ".gggggggggggggg.",
    ".hhhhhhhhhhhhhh.",
    "................",
  ],
  plus: [
    "................",
    "................",
    "......gggg......",
    "......gggg......",
    "......gggg......",
    ".gggggggggggggg.",
    ".gggggggggggggg.",
    ".hhhhhggggghhhh.",
    "......gggg......",
    "......gggg......",
    "......hhhh......",
  ],
  pause: [
    "..........ww.ww.",
    ".........ww.ww..",
    "..ww.ww...wwwww.",
    ".ww.ww...wwwwww.",
    "..wwwww..wwwww..",
    ".wwwwww...www...",
    ".wwwww..........",
    "..www...........",
    "................",
    "................",
    "................",
  ],
  fast: [
    "................",
    "................",
    ".yy.....yy......",
    ".yyyy...yyyy....",
    ".yyyyyy.yyyyyy..",
    ".yyyyyyyyyyyyyy.",
    ".yyyyyy.yyyyyy..",
    ".yyyy...yyyy....",
    ".yy.....yy......",
    "................",
    "................",
  ],
  nuke: [
    "....oooooooo....",
    "..oooyyyyyyooo..",
    ".ooyyyyyyyyyyoo.",
    ".oyyywwwwwwyyyo.",
    "..ooyyyyyyyyoo..",
    "....ooyyyyoo....",
    "......oyyo......",
    "......oyyo......",
    ".....ooyyoo.....",
    "...ooyyyyyyoo...",
    "..rrrrrrrrrrrr..",
  ],
};
const PANEL_COLORS = {
  g: "#2fe02f",
  h: "#0c860c",
  w: "#ffffff",
  y: "#ffe14a",
  o: "#ff7a1a",
  r: "#c8321e",
};

export function drawPanelIcon(canvas, name) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const rows = PANEL_ICONS[name];
  const px = canvas.width / 16;
  const top = (canvas.height - rows.length * px) / 2;
  drawRows(ctx, rows, 0, top, px, (ch) => PANEL_COLORS[ch], 1);
}
