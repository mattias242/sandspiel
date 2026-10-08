import "./lemmings.css";
import { Universe, Lemmings, Species, LemState } from "../../crate/pkg";
import { startWebGL } from "../render";
import { startFluid } from "../fluid";
import { LEVELS, SKILLS, SIZE } from "./levels";
import {
  drawLemming,
  drawSelection,
  drawCursor,
  drawHatch,
  drawExit,
  drawIcon,
  drawPanelIcon,
} from "./sprites";
import { sounds } from "./sounds";

const STEP_MS = 1000 / 60;
const HATCH_DELAY = 90;
const STRIDE = 8;
const STATE_NAMES = Object.keys(LemState).filter((k) => isNaN(Number(k)));
const stateName = (n) => STATE_NAMES.find((k) => LemState[k] === n);

const $ = (id) => document.getElementById(id);
const sandCanvas = $("sand-canvas");
const fluidCanvas = $("fluid-canvas");
const lemCanvas = $("lem-canvas");
const lemCtx = lemCanvas.getContext("2d");
const minimap = $("minimap");
const miniCtx = minimap.getContext("2d");
const card = $("card");

const universe = Universe.new(SIZE, SIZE);
const game = Lemmings.new();

const dpr = Math.ceil(window.devicePixelRatio || 1);
sandCanvas.width = SIZE * dpr;
sandCanvas.height = SIZE * dpr;

const fluid = startFluid({ universe });
const drawSand = startWebGL({ canvas: sandCanvas, universe, lemmings: true });

const storage = {
  get(key, fallback) {
    try {
      const v = window.localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  },
};

const state = {
  levelIndex: 0,
  unlocked: Math.min(storage.get("lemmings.unlocked", 0), LEVELS.length - 1),
  playing: false,
  finished: false,
  paused: false,
  fast: false,
  skill: -1,
  hover: null,
  pointer: null,
  nukeArmed: 0,
  particles: [],
  lastFuses: new Map(),
  lastStates: new Map(),
  lastSaved: 0,
  frameCount: 0,
};
state.levelIndex = state.unlocked;

/* ---------- Level setup ---------- */

function level() {
  return LEVELS[state.levelIndex];
}

function loadLevel(index) {
  state.levelIndex = index;
  const lv = level();
  fluid.reset();
  universe.reset();
  universe.calm_winds();
  lv.build(universe, Species);
  const [ex, ey] = lv.entrance;
  const [xx, xy] = lv.exit;
  game.setup(ex, ey, xx, xy, lv.dir, lv.lemmings, lv.releaseRate);
  SKILLS.forEach((name, i) => game.set_skill_count(i, lv.skills[name] || 0));

  state.playing = false;
  state.finished = false;
  state.paused = false;
  state.fast = false;
  state.particles = [];
  state.lastFuses = new Map();
  state.lastStates = new Map();
  state.lastSaved = 0;
  sounds.music(false);
  state.nukeArmed = 0;
  const first = SKILLS.findIndex((name) => lv.skills[name]);
  state.skill = first;

  $("level-name").textContent = `${index + 1}. ${lv.name}`;
  renderSkills();
  updateHud();
}

function startLevel() {
  hideCard();
  state.playing = true;
  sounds.unlock();
  sounds.letsgo();
  sounds.music(true);
}

function finishLevel() {
  state.playing = false;
  state.finished = true;
  sounds.music(false);
  const lv = level();
  const saved = game.saved();
  const won = saved >= lv.save;
  if (won && state.levelIndex + 1 > state.unlocked) {
    state.unlocked = Math.min(state.levelIndex + 1, LEVELS.length - 1);
    storage.set("lemmings.unlocked", state.unlocked);
  }
  const best = storage.get(`lemmings.best.${state.levelIndex}`, 0);
  if (saved > best) storage.set(`lemmings.best.${state.levelIndex}`, saved);
  (won ? sounds.win : sounds.lose)();
  setTimeout(() => showResult(won, saved), 600);
}

/* ---------- Cards ---------- */

const pct = (n, total) => `${Math.round((100 * n) / total)}%`;
const clock = (s, sep = ":") => {
  s = Math.max(0, Math.ceil(s));
  return `${Math.floor(s / 60)}${sep}${String(s % 60).padStart(2, "0")}`;
};
const minutes = (s) => (s % 60 ? clock(s) : `${s / 60} minute${s === 60 ? "" : "s"}`);

function hideCard() {
  card.classList.add("hidden");
  card.innerHTML = "";
}

function showCard(html, actions) {
  card.innerHTML = html;
  card.classList.remove("hidden");
  for (const [selector, fn] of Object.entries(actions)) {
    const el = card.querySelector(selector);
    if (el) el.addEventListener("click", fn);
  }
  const primary = card.querySelector(".primary");
  if (primary) primary.focus();
}

function skillList(lv) {
  return SKILLS.filter((s) => lv.skills[s])
    .map((s) => `<li>${lv.skills[s]} &times; ${s}</li>`)
    .join("");
}

function showIntro() {
  const lv = level();
  const i = state.levelIndex;
  const best = storage.get(`lemmings.best.${i}`, 0);
  const dots = LEVELS.map(
    (_, j) =>
      `<button class="dot${j === i ? " current" : ""}" data-level="${j}" ${
        j > state.unlocked ? "disabled" : ""
      } title="Level ${j + 1}">${j + 1}</button>`
  ).join("");
  showCard(
    `<div class="card-kicker">Level ${i + 1} of ${LEVELS.length}</div>
     <h1>${lv.name}</h1>
     <ul class="facts">
       <li>Number of Lemmings <b>${lv.lemmings}</b></li>
       <li><b>${pct(lv.save, lv.lemmings)}</b> To Be Saved</li>
       <li>Release Rate <b>${lv.releaseRate}</b></li>
       <li>Time <b>${minutes(lv.seconds)}</b></li>
     </ul>
     <p class="hint">${lv.hint}</p>
     <ul class="skills-list">${skillList(lv)}</ul>
     ${best ? `<p class="best">Best: ${best} saved</p>` : ""}
     <button class="primary" id="go">Let's go!</button>
     <nav class="dots">${dots}</nav>`,
    { "#go": startLevel }
  );
  card.querySelectorAll(".dot").forEach((b) =>
    b.addEventListener("click", () => {
      loadLevel(Number(b.dataset.level));
      showIntro();
    })
  );
}

function showResult(won, saved) {
  const lv = level();
  const last = state.levelIndex === LEVELS.length - 1;
  let title;
  if (!won) title = saved === 0 ? "Oh no!" : "Not quite";
  else if (saved === lv.lemmings) title = "Superb!";
  else title = "You did it!";
  const allOut = game.released() === lv.lemmings && game.out() === 0;
  const next = won && !last;
  showCard(
    `<div class="card-kicker">Level ${state.levelIndex + 1}: ${lv.name}</div>
     <h1>${title}</h1>
     <p class="score">${allOut ? "All lemmings accounted for.<br>" : "Your time is up!<br>"}
       You rescued <b>${pct(saved, lv.lemmings)}</b>
       <span>You needed ${pct(lv.save, lv.lemmings)}</span></p>
     ${
       won && last
         ? `<p class="hint">That was the last level. The sand is all yours.</p>`
         : ""
     }
     <div class="buttons">
       ${next ? `<button class="primary" id="next">Next level</button>` : ""}
       <button class="${next ? "" : "primary"}" id="again">${
      won ? "Play again" : "Try again"
    }</button>
       <button id="levels">Levels</button>
     </div>`,
    {
      "#next": () => {
        loadLevel(state.levelIndex + 1);
        showIntro();
      },
      "#again": () => {
        loadLevel(state.levelIndex);
        startLevel();
      },
      "#levels": () => {
        loadLevel(state.levelIndex);
        showIntro();
      },
    }
  );
}

/* ---------- Toolbar ---------- */

const skillButtons = SKILLS.map((name, i) => {
  const b = document.createElement("button");
  b.className = "pbtn skill";
  b.title = `${name} (${i + 1})`;
  b.innerHTML = `<span class="count"></span><canvas width="32" height="32"></canvas>`;
  drawIcon(b.querySelector("canvas"), name);
  b.addEventListener("click", () => selectSkill(i));
  $("skills").appendChild(b);
  return b;
});
// The skills go between the release rate and the tool buttons.
$("panel").insertBefore($("skills"), $("pause"));
for (const [id, icon] of [
  ["rate-down", "minus"],
  ["rate-up", "plus"],
  ["pause", "pause"],
  ["fast", "fast"],
  ["nuke", "nuke"],
]) {
  drawPanelIcon($(id).querySelector("canvas"), icon);
}

const twoDigits = (n) => String(n).padStart(2, "0");

function selectSkill(i) {
  if (!level().skills[SKILLS[i]]) return;
  state.skill = i;
  sounds.select();
  renderSkills();
}

function renderSkills() {
  skillButtons.forEach((b, i) => {
    const count = game.skill_count(i);
    b.querySelector(".count").textContent = count ? twoDigits(count) : "";
    b.classList.toggle("selected", i === state.skill);
    b.classList.toggle("empty", count === 0);
    b.classList.toggle("absent", !level().skills[SKILLS[i]]);
  });
}

function changeRate(delta) {
  game.set_release_rate(game.release_rate() + delta);
  updateHud();
}

function holdRepeat(el, fn) {
  let timer = null;
  const stop = () => {
    clearTimeout(timer);
    timer = null;
  };
  const tick = (delay) => {
    fn();
    timer = setTimeout(() => tick(Math.max(40, delay * 0.8)), delay);
  };
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    stop();
    tick(350);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
    el.addEventListener(ev, stop)
  );
}
holdRepeat($("rate-down"), () => changeRate(-1));
holdRepeat($("rate-up"), () => changeRate(1));

function togglePause() {
  if (!state.playing) return;
  state.paused = !state.paused;
  updateHud();
}

function toggleFast() {
  if (!state.playing) return;
  state.fast = !state.fast;
  updateHud();
}

function restart() {
  loadLevel(state.levelIndex);
  startLevel();
}

function nuke() {
  if (!state.playing || game.nuking()) return;
  const now = performance.now();
  if (now - state.nukeArmed < 1500) {
    game.nuke();
    sounds.ohno();
    state.nukeArmed = 0;
  } else {
    state.nukeArmed = now;
  }
  updateHud();
}

function toggleMusic() {
  sounds.setMusicOn(!sounds.musicOn());
  storage.set("lemmings.music", sounds.musicOn());
  $("music").textContent = sounds.musicOn() ? "music on" : "music off";
}
if (!storage.get("lemmings.music", true)) toggleMusic();

function toggleSound() {
  sounds.setMuted(!sounds.muted());
  storage.set("lemmings.muted", sounds.muted());
  $("sound").textContent = sounds.muted() ? "sound off" : "sound on";
}
if (storage.get("lemmings.muted", false)) toggleSound();

$("pause").addEventListener("click", togglePause);
$("fast").addEventListener("click", toggleFast);
$("restart").addEventListener("click", restart);
$("nuke").addEventListener("click", nuke);
$("sound").addEventListener("click", toggleSound);
$("music").addEventListener("click", toggleMusic);
// Start loading the samples on the first gesture, so they are ready by the
// time the level starts.
["pointerdown", "keydown"].forEach((ev) =>
  document.addEventListener(ev, () => sounds.unlock(), { capture: true, once: true })
);
$("levels").addEventListener("click", () => {
  loadLevel(state.levelIndex);
  showIntro();
});

document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k >= "1" && k <= "8") selectSkill(Number(k) - 1);
  else if (k === "p" || (k === " " && state.playing)) togglePause();
  else if (k === "f") toggleFast();
  else if (k === "r" && state.playing) restart();
  else if (k === "n") nuke();
  else if (k === "m") toggleSound();
  else if (k === "b") toggleMusic();
  else if (k === "-" || k === "_") changeRate(-5);
  else if (k === "+" || k === "=") changeRate(5);
  else if (k === "enter" && !state.playing && !card.classList.contains("hidden")) {
    const primary = card.querySelector(".primary");
    if (primary && document.activeElement !== primary) primary.click();
    else return;
  } else return;
  e.preventDefault();
});

/* ---------- Pointer ---------- */

function cellAt(e) {
  const rect = lemCanvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * SIZE,
    y: ((e.clientY - rect.top) / rect.height) * SIZE,
  };
}

lemCanvas.addEventListener("pointermove", (e) => {
  const { x, y } = cellAt(e);
  const i = game.lemming_at(x, y);
  state.hover = i >= 0 ? i : null;
  state.pointer = e.pointerType === "mouse" ? { x, y } : null;
});

lemCanvas.addEventListener("pointerleave", () => {
  state.hover = null;
  state.pointer = null;
});

lemCanvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (!state.playing || state.skill < 0) return;
  const { x, y } = cellAt(e);
  let i = game.assign(x, y, state.skill);
  if (i < 0 && e.pointerType !== "mouse") {
    // Lemmings are small under a finger: try the nearest one.
    const near = lemmingList()
      .map((l) => ({ l, d: Math.hypot(l.x - x, l.y - 4 - y) }))
      .filter(({ d }) => d < 10)
      .sort((a, b) => a.d - b.d);
    for (const { l } of near) {
      i = game.assign(l.x, l.y - 4, state.skill);
      if (i >= 0) break;
    }
  }
  if (i >= 0) {
    sounds.assign();
    renderSkills();
  }
});

/* ---------- Simulation & drawing ---------- */

function lemmingList() {
  const data = game.data();
  const list = [];
  for (let i = 0; i < data.length; i += STRIDE) {
    list.push({
      x: data[i],
      y: data[i + 1],
      dir: data[i + 2],
      state: stateName(data[i + 3]),
      timer: data[i + 4],
      fuse: data[i + 5],
      flags: data[i + 6],
      index: data[i + 7],
    });
  }
  return list;
}

function step() {
  universe.tick();
  if (!state.playing) return;
  game.tick(universe);
  if (game.frame() === HATCH_DELAY - 45) sounds.hatch();
  if (game.saved() > state.lastSaved) sounds.saved();
  state.lastSaved = game.saved();
}

const DEATHS = ["Splatting", "Drowning", "Burning", "Dissolving"];

function explosionParticles(x, y) {
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 0.4 + Math.random() * 1.2;
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 0.6,
      life: 30 + Math.random() * 30,
      color: ["#46d046", "#4f63ff", "#f3c9a1", "#ffe14a"][i % 4],
    });
  }
}

function drawOverlay(lems) {
  const w = lemCanvas.width;
  const cell = w / SIZE;
  lemCtx.clearRect(0, 0, w, w);
  const lv = level();
  const frame = game.frame();
  const opening = state.playing ? Math.min(1, frame / (HATCH_DELAY - 10)) : 0;
  drawHatch(lemCtx, lv.entrance[0], lv.entrance[1], cell, opening);
  drawExit(lemCtx, lv.exit[0], lv.exit[1], cell, state.frameCount);

  // A lemming that vanished with a lit fuse just exploded.
  const fuses = new Map();
  for (const l of lems) if (l.fuse > 0) fuses.set(l.index, l);
  for (const [index, l] of state.lastFuses) {
    if (!fuses.has(index) && !lems.some((m) => m.index === index)) {
      explosionParticles(l.x, l.y - 4);
      sounds.boom();
    }
  }
  // Like the original: "Oh no!" as a bomber's fuse runs out.
  for (const [index, l] of fuses) {
    const before = state.lastFuses.get(index);
    if (l.fuse === 1 && before && before.fuse > 1) sounds.ohno();
  }
  state.lastFuses = fuses;

  const states = new Map();
  for (const l of lems) {
    states.set(l.index, l.state);
    if (DEATHS.includes(l.state) && state.lastStates.get(l.index) !== l.state) {
      sounds.die(l.state);
    }
  }
  state.lastStates = states;

  // Lemmings walk under a still mouse, so look again every frame.
  if (state.pointer) {
    const i = game.lemming_at(state.pointer.x, state.pointer.y);
    state.hover = i >= 0 ? i : null;
  }
  let hovered = null;
  for (const l of lems) {
    drawLemming(lemCtx, l, cell, state.frameCount);
    if (l.index === state.hover) hovered = l;
  }
  if (hovered) drawSelection(lemCtx, hovered, cell);
  else if (state.pointer) drawCursor(lemCtx, state.pointer.x * cell, state.pointer.y * cell, cell);

  state.particles = state.particles.filter((p) => p.life > 0);
  for (const p of state.particles) {
    if (!state.paused) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= 1;
    }
    lemCtx.fillStyle = p.color;
    lemCtx.fillRect(p.x * cell, p.y * cell, cell * 0.8, cell * 0.8);
  }

  updateHover(hovered);
}

const SKILL_NAMES = {
  Walking: "walker",
  Falling: "faller",
  Floating: "floater",
  Climbing: "climber",
  Blocking: "blocker",
  Building: "builder",
  Shrugging: "builder",
  Bashing: "basher",
  Mining: "miner",
  Digging: "digger",
};

function updateHover(l) {
  let text = "";
  if (l) {
    const tags = [];
    if (l.flags & 1) tags.push("climber");
    if (l.flags & 2) tags.push("floater");
    if (l.fuse) tags.push("bomber");
    text = [SKILL_NAMES[l.state] || "", ...tags].filter(Boolean).join("+");
  }
  const el = $("hover-info");
  if (el.textContent !== text) el.textContent = text;
}

function updateHud() {
  const lv = level();
  $("stat-out").textContent = game.out();
  $("stat-in").textContent = `${twoDigits(Math.round((100 * game.saved()) / lv.lemmings))}%`;
  const left = lv.seconds - game.frame() / 60;
  $("stat-time").textContent = clock(left, "-");
  $("stat-time").classList.toggle("low", state.playing && left < 30);
  $("rate").textContent = twoDigits(game.release_rate());
  $("rate-min").textContent = twoDigits(game.min_release_rate());
  $("pause").classList.toggle("on", state.paused);
  $("fast").classList.toggle("on", state.fast);
  const armed = performance.now() - state.nukeArmed < 1500;
  $("nuke").classList.toggle("armed", armed || game.nuking());
  $("nuke").querySelector(".count").textContent = armed ? "??" : "";
  document.body.classList.toggle("paused", state.paused);
}

let last = performance.now();
let acc = 0;
function loop(now) {
  const dt = Math.min(100, now - last);
  last = now;
  if (!state.paused) {
    acc += dt * (state.fast ? 3 : 1);
    let steps = 0;
    while (acc >= STEP_MS && steps < 8) {
      step();
      acc -= STEP_MS;
      steps++;
    }
    if (steps === 8) acc = 0;
    if (steps > 0) fluid.update();

    if (state.playing) {
      const timeUp = game.frame() / 60 >= level().seconds;
      if (game.done() || timeUp) finishLevel();
    }
  }
  state.frameCount++;
  drawSand();
  const lems = lemmingList();
  drawOverlay(lems);
  drawMinimap(lems);
  updateHud();
  requestAnimationFrame(loop);
}

// The whole level in miniature, with the lemmings as yellow dots.
function drawMinimap(lems) {
  if (!minimap.offsetParent) return;
  miniCtx.drawImage(sandCanvas, 0, 0, minimap.width, minimap.height);
  const k = minimap.width / SIZE;
  miniCtx.fillStyle = "#ffef5a";
  for (const l of lems) miniCtx.fillRect(Math.round(l.x * k) - 1, Math.round((l.y - 4) * k) - 1, 3, 4);
}

/* ---------- Layout ---------- */

function layout() {
  const bars =
    $("topbar").offsetHeight + $("status").offsetHeight + $("toolbar").offsetHeight;
  const avail = Math.min(window.innerWidth - 16, window.innerHeight - bars - 24);
  const size = Math.max(160, Math.floor(avail));
  const stage = $("stage");
  stage.style.width = `${size}px`;
  stage.style.height = `${size}px`;
  const px = Math.round(size * (window.devicePixelRatio || 1));
  if (lemCanvas.width !== px) {
    lemCanvas.width = px;
    lemCanvas.height = px;
  }
  document.documentElement.style.setProperty("--stage", `${size}px`);
}
window.addEventListener("resize", layout);
layout();

loadLevel(state.levelIndex);
showIntro();
requestAnimationFrame(loop);

window.lemmings = { game, universe, loadLevel, startLevel, state };
