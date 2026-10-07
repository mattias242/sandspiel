// Pixel-art lemmings drawn on a 2D canvas on top of the sand.
// Sprites are 8 x 16 "pixels", where one pixel is half a sand cell, so a
// lemming is 4 cells wide and 8 tall. They face right and are mirrored
// when walking left. The feet sit on the bottom row.

const PALETTE = {
  g: "#46d046", // hair
  h: "#2f9a35", // hair shade
  s: "#f3c9a1", // skin
  b: "#4f63ff", // robe
  d: "#3443c4", // robe shade
  w: "#ffffff",
  t: "#c98a4b", // wooden brick
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
    ctx.font = `bold ${Math.max(9, cell * 3.2)}px Inconsolata, monospace`;
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

// Corner brackets around the lemming under the cursor.
export function drawSelection(ctx, l, cell) {
  const left = (l.x - 2.5) * cell;
  const right = (l.x + 3.5) * cell;
  const top = (l.y - 8.5) * cell;
  const bottom = (l.y + 1.5) * cell;
  const len = cell * 1.5;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1, cell * 0.4);
  ctx.beginPath();
  for (const [cx, cy, sx, sy] of [
    [left, top, 1, 1],
    [right, top, -1, 1],
    [left, bottom, 1, -1],
    [right, bottom, -1, -1],
  ]) {
    ctx.moveTo(cx + sx * len, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * len);
  }
  ctx.stroke();
}

export function drawHatch(ctx, x, y, cell, open) {
  const w = 12;
  const left = (x - w / 2 + 0.5) * cell;
  const top = (y - 14) * cell;
  ctx.fillStyle = "#5b5f6b";
  ctx.fillRect(left - 2 * cell, top - cell, (w + 4) * cell, 6 * cell);
  ctx.fillStyle = "#8a8f9c";
  for (let i = 0; i < w + 4; i += 3) {
    ctx.fillRect(left - 2 * cell + i * cell, top - cell, cell, cell);
  }
  ctx.fillStyle = "#16131c";
  ctx.fillRect(left, top + cell, w * cell, 4 * cell);
  // Two trapdoors swing down from the edges as the hatch opens.
  const flap = (w / 2) * cell;
  ctx.fillStyle = "#a0673a";
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side < 0 ? left : left + w * cell, top + 5 * cell);
    ctx.rotate(-side * open * Math.PI * 0.42);
    ctx.fillRect(side < 0 ? 0 : -flap, 0, flap, cell * 1.2);
    ctx.restore();
  }
}

export function drawExit(ctx, x, y, cell, t) {
  const left = (x - 6 + 0.5) * cell;
  const right = (x + 6 + 0.5) * cell;
  const top = (y - 13) * cell;
  const bottom = (y + 1) * cell;
  ctx.fillStyle = "#0b0a0f";
  ctx.beginPath();
  ctx.moveTo(left + 2 * cell, bottom);
  ctx.lineTo(left + 2 * cell, top + 5 * cell);
  ctx.arc((left + right) / 2, top + 5 * cell, (right - left) / 2 - 2 * cell, Math.PI, 0);
  ctx.lineTo(right - 2 * cell, bottom);
  ctx.fill();
  ctx.fillStyle = "#9a8b74";
  ctx.fillRect(left, top + 2 * cell, 2 * cell, bottom - top - 2 * cell);
  ctx.fillRect(right - 2 * cell, top + 2 * cell, 2 * cell, bottom - top - 2 * cell);
  ctx.fillStyle = "#c7b493";
  ctx.fillRect(left - cell, top + cell, right - left + 2 * cell, 1.5 * cell);
  for (const fx of [left, right - 2 * cell]) {
    const h = 2.5 + Math.sin(t / 3 + fx) * 0.8 + Math.random() * 0.6;
    ctx.fillStyle = "#ff8a1a";
    ctx.fillRect(fx, top + cell - h * cell, 2 * cell, h * cell);
    ctx.fillStyle = "#ffe14a";
    ctx.fillRect(fx + 0.5 * cell, top + cell - (h - 1) * cell, cell, (h - 1) * cell);
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
    ctx.font = `bold ${cell * 3}px Inconsolata, monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText("5", (x + 0.5) * cell, cell * 1.6);
  }
}
