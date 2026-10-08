// Sampled sounds and music (made with ElevenLabs, in assets/sounds), with
// tiny WebAudio blips as a fallback until the samples have loaded.

const BASE = "/assets/sounds/";
const SAMPLES = {
  letsgo: 0.9,
  ohno: 1.0,
  yippee: 0.45,
  hatch: 0.5,
  assign: 0.5,
  select: 1.0,
  boom: 0.6,
  splat: 0.8,
  drown: 0.5,
  burn: 0.45,
  dissolve: 0.45,
  win: 0.5,
  lose: 0.5,
};
const MUSIC_VOLUME = 0.22;

let ctx = null;
let muted = false;
let musicOn = true;
let musicWanted = false;
let musicNode = null;
let musicGain = null;
const buffers = {};
const lastPlayed = {};
let loading = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function decode(ac, data) {
  // Safari only has the callback form.
  return new Promise((resolve, reject) => ac.decodeAudioData(data, resolve, reject));
}

function load(name) {
  const ac = audio();
  if (!ac) return Promise.resolve();
  return fetch(`${BASE}${name}.mp3`)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
    .then((data) => decode(ac, data))
    .then((buffer) => {
      buffers[name] = buffer;
    })
    .catch(() => {});
}

function loadAll() {
  if (!loading) {
    loading = Promise.all([...Object.keys(SAMPLES), "music"].map(load)).then(() => {
      if (musicWanted) startMusic();
    });
  }
  return loading;
}

// Plays a sample if it has loaded. Returns false so callers can fall back.
function sample(name, { gap = 0, rate = 1 } = {}) {
  if (muted) return true;
  const ac = audio();
  const buffer = buffers[name];
  if (!ac || !buffer) return false;
  const now = ac.currentTime;
  if (gap && now - (lastPlayed[name] || -1) < gap) return true;
  lastPlayed[name] = now;
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  src.buffer = buffer;
  src.playbackRate.value = rate;
  gain.gain.value = SAMPLES[name];
  src.connect(gain).connect(ac.destination);
  src.start();
  return true;
}

function tone(freq, duration, { type = "square", volume = 0.06, slide = 0, delay = 0 } = {}) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function noise(duration, volume = 0.25) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const length = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
  }
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  src.buffer = buffer;
  gain.gain.value = volume;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

function startMusic() {
  if (musicNode || muted || !musicOn || !musicWanted) return;
  const ac = audio();
  if (!ac || !buffers.music) return;
  musicGain = ac.createGain();
  musicGain.gain.setValueAtTime(0.0001, ac.currentTime);
  musicGain.gain.exponentialRampToValueAtTime(MUSIC_VOLUME, ac.currentTime + 1.5);
  musicNode = ac.createBufferSource();
  musicNode.buffer = buffers.music;
  musicNode.loop = true;
  musicNode.connect(musicGain).connect(ac.destination);
  musicNode.start();
}

function stopMusic() {
  if (!musicNode) return;
  const ac = audio();
  const node = musicNode;
  musicGain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.3);
  node.stop(ac.currentTime + 1.2);
  musicNode = null;
  musicGain = null;
}

export const sounds = {
  unlock: () => {
    audio();
    loadAll();
  },
  muted: () => muted,
  setMuted: (m) => {
    muted = m;
    if (muted) stopMusic();
    else startMusic();
  },
  musicOn: () => musicOn,
  setMusicOn: (on) => {
    musicOn = on;
    if (musicOn) startMusic();
    else stopMusic();
  },
  music: (play) => {
    musicWanted = play;
    if (play) startMusic();
    else stopMusic();
  },
  select: () => sample("select") || tone(660, 0.05, { volume: 0.03 }),
  assign: () => sample("assign", { gap: 0.05 }) || tone(880, 0.07, { slide: 1.5 }),
  hatch: () => sample("hatch"),
  saved: () =>
    sample("yippee", { gap: 0.35, rate: 0.95 + Math.random() * 0.15 }) ||
    tone(1046, 0.12, { type: "triangle", volume: 0.08, slide: 1.25 }),
  // `how` is the death state: Splatting, Drowning, Burning or Dissolving.
  die: (how) => {
    const name = {
      Splatting: "splat",
      Drowning: "drown",
      Burning: "burn",
      Dissolving: "dissolve",
    }[how];
    if (name && sample(name, { gap: 0.1 })) return;
    tone(220, 0.18, { type: "sawtooth", volume: 0.04, slide: 0.4 });
  },
  boom: () => sample("boom", { gap: 0.08 }) || noise(0.5),
  ohno: () => {
    if (sample("ohno", { gap: 1.5 })) return;
    tone(392, 0.2, { type: "triangle", volume: 0.08 });
    tone(330, 0.3, { type: "triangle", volume: 0.08, delay: 0.2 });
  },
  letsgo: () => {
    if (sample("letsgo")) return;
    // The samples may still be loading on the very first start.
    if (!buffers.letsgo && loading) {
      const t = Date.now();
      loading.then(() => Date.now() - t < 1500 && sample("letsgo"));
      return;
    }
    tone(523, 0.1, { type: "triangle", volume: 0.07 });
    tone(784, 0.15, { type: "triangle", volume: 0.07, delay: 0.1 });
  },
  win: () =>
    sample("win") ||
    [523, 659, 784, 1046].forEach((f, i) =>
      tone(f, 0.18, { type: "triangle", volume: 0.07, delay: i * 0.11 })
    ),
  lose: () =>
    sample("lose") ||
    [392, 330, 262].forEach((f, i) =>
      tone(f, 0.22, { type: "triangle", volume: 0.07, delay: i * 0.15 })
    ),
};
