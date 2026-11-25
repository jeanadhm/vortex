'use strict';
// Colonie Noire · sons synthétisés (Web Audio), aucun fichier externe
const SFX = (() => {
  let ctx = null, master = null, nb = null, ambGain = null, ambFilter = null, ambKind = '', ambT = 0;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = .6; master.connect(ctx.destination);
    nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = nb; src.loop = true;
    ambFilter = ctx.createBiquadFilter(); ambFilter.type = 'lowpass'; ambFilter.frequency.value = 400;
    ambGain = ctx.createGain(); ambGain.gain.value = 0;
    src.connect(ambFilter); ambFilter.connect(ambGain); ambGain.connect(master); src.start();
    if (ambKind) api.ambient(ambKind);
  }
  function env(g, t, a, peak, dur) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur); }
  function noise(dur, freq, q, gain, type = 'bandpass', delay = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + delay, s = ctx.createBufferSource(); s.buffer = nb; s.playbackRate.value = .8 + Math.random() * .4;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); env(g, t, .004, gain, dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + .05);
  }
  function tone(f0, f1, dur, gain, type = 'sine', delay = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, .005, gain, dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  const vol = d => d === undefined ? 1 : clamp(1 - d / 45, 0, 1);
  const api = {
    init,
    acid() { noise(.1, 2400, 1, .2); noise(.06, 5500, .7, .07); },
    spit(d) { const v = vol(d); if (v > 0) noise(.16, 1300, 2, .22 * v); },
    bite() { tone(900, 260, .05, .25, 'square'); tone(700, 220, .06, .2, 'square', .06); },
    hit(head) { tone(head ? 1900 : 1100, head ? 2600 : 800, .07, .15, 'triangle'); },
    kill() { tone(520, 120, .25, .18, 'sawtooth'); },
    boom(d) { const v = vol(d) * .85 + .15; noise(1.2, 500, .4, .9 * v, 'lowpass'); tone(110, 30, .7, .8 * v); },
    hurt() { tone(170, 60, .22, .35, 'sawtooth'); noise(.18, 500, 1, .3, 'lowpass'); },
    step() { noise(.035, 2800 + Math.random() * 1800, 4, .04); },
    chitter(d) { const v = vol(d); if (v <= 0) return; for (let i = 0; i < 5; i++) tone(2200 + Math.random() * 900, 1400, .03, .06 * v, 'square', i * .035); },
    pick() { tone(600, 1200, .12, .2, 'triangle'); tone(900, 1800, .14, .16, 'triangle', .09); },
    throwIt() { noise(.18, 700, 1, .15); },
    roar() { tone(140, 45, 1.3, .5, 'sawtooth'); noise(1.1, 300, .8, .4, 'lowpass'); },
    ambient(kind) {
      ambKind = kind; if (!ctx) return;
      ambFilter.frequency.value = kind === 'cave' ? 170 : 520;
      ambGain.gain.setTargetAtTime(kind ? (kind === 'cave' ? .12 : .05) : 0, ctx.currentTime, .5);
    },
    tick(dt) {
      if (!ctx || !ambKind) return;
      ambT -= dt; if (ambT > 0) return;
      if (ambKind === 'cave') { ambT = 1.5 + Math.random() * 4; const f = 1100 + Math.random() * 900; tone(f, f * .55, .12, .05); }
      else { ambT = 2 + Math.random() * 5; const f = 2600 + Math.random() * 1500, n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) tone(f, f * 1.3, .07, .025, 'sine', i * .11); }
    },
  };
  return api;
})();
