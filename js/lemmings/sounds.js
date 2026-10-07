// Tiny WebAudio blips, so the game needs no audio files.

let ctx = null;
let muted = false;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
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

export const sounds = {
  unlock: () => audio(),
  muted: () => muted,
  setMuted: (m) => {
    muted = m;
  },
  select: () => tone(660, 0.05, { volume: 0.03 }),
  assign: () => tone(880, 0.07, { slide: 1.5 }),
  saved: () => tone(1046, 0.12, { type: "triangle", volume: 0.08, slide: 1.25 }),
  die: () => tone(220, 0.18, { type: "sawtooth", volume: 0.04, slide: 0.4 }),
  boom: () => noise(0.5),
  ohno: () => {
    tone(392, 0.2, { type: "triangle", volume: 0.08 });
    tone(330, 0.3, { type: "triangle", volume: 0.08, delay: 0.2 });
  },
  letsgo: () => {
    tone(523, 0.1, { type: "triangle", volume: 0.07 });
    tone(784, 0.15, { type: "triangle", volume: 0.07, delay: 0.1 });
  },
  win: () =>
    [523, 659, 784, 1046].forEach((f, i) =>
      tone(f, 0.18, { type: "triangle", volume: 0.07, delay: i * 0.11 })
    ),
  lose: () =>
    [392, 330, 262].forEach((f, i) =>
      tone(f, 0.22, { type: "triangle", volume: 0.07, delay: i * 0.15 })
    ),
};
