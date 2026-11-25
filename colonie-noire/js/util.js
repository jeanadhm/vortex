'use strict';
// Colonie Noire · outils : maths, bruit, textures procédurales
const T = THREE;
// les couleurs hexadécimales sont pensées en sRGB : on les convertit en linéaire pour un rendu correct
{ const sh = T.Color.prototype.setHex, ss = T.Color.prototype.setStyle;
  T.Color.prototype.setHex = function (h) { sh.call(this, h); return this.convertSRGBToLinear(); };
  T.Color.prototype.setStyle = function (s) { if (/^#/.test(s)) { ss.call(this, s); return this.convertSRGBToLinear(); } return ss.call(this, s); }; }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);
const angLerp = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * clamp(t, 0, 1); };
function mkRng(seed) { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }

// Bruit de valeur 2D + fbm
const NOISE = (() => {
  const r = mkRng(1337), perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  const p = new Uint8Array(512); for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const val = new Float32Array(256); for (let i = 0; i < 256; i++) val[i] = r() * 2 - 1;
  const f = t => t * t * (3 - 2 * t);
  function n2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), u = f(x - xi), v = f(y - yi), X = xi & 255, Y = yi & 255;
    const a = val[p[X + p[Y]]], b = val[p[X + 1 + p[Y]]], c = val[p[X + p[Y + 1]]], d = val[p[X + 1 + p[Y + 1]]];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, o = 4) { let s = 0, a = .5, fr = 1; for (let i = 0; i < o; i++) { s += a * n2(x * fr, y * fr); fr *= 2.03; a *= .5; } return s; }
  return { n2, fbm };
})();

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
  t.anisotropy = 8; t.encoding = T.sRGBEncoding;
  return t;
}

const TEX = {};
// grain clair qui se répète sans couture : la couleur vient des sommets
function grainTex(base, blobs, tint) {
  return canvasTex(512, 512, (g, w, h) => {
    const id = g.createImageData(w, h), d = id.data;
    for (let i = 0; i < w * h; i++) { const v = base + Math.random() * (255 - base); d[i * 4] = v * tint[0]; d[i * 4 + 1] = v * tint[1]; d[i * 4 + 2] = v * tint[2]; d[i * 4 + 3] = 255; }
    g.putImageData(id, 0, 0);
    for (let i = 0; i < blobs; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 1.5 + Math.random() ** 3 * 14, l = 140 + Math.random() * 115;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        g.fillStyle = 'rgba(30,18,8,.16)'; g.beginPath(); g.ellipse(x + ox + r * .25, y + oy + r * .3, r, r * .75, 0, 0, 7); g.fill();
        g.fillStyle = `rgb(${l * tint[0] | 0},${l * tint[1] | 0},${l * tint[2] | 0})`; g.beginPath(); g.ellipse(x + ox, y + oy, r, r * .75, 0, 0, 7); g.fill();
      }
    }
  }, true);
}
function makeTextures() {
  TEX.soil = grainTex(185, 300, [1, .95, .88]);
  TEX.rock = grainTex(165, 160, [1, 1, 1]);
  TEX.leaf = canvasTex(256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#c4d48c'); gr.addColorStop(.5, '#ffffff'); gr.addColorStop(1, '#c4d48c');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,225,.9)'; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 0); g.stroke();
    g.lineWidth = 2.5;
    for (let y = 50; y < h; y += 34) { g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w * .3, y - 20, 4, y - 54); g.moveTo(w / 2, y); g.quadraticCurveTo(w * .7, y - 20, w - 4, y - 54); g.stroke(); }
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(30,40,0,${Math.random() * .09})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  });
  TEX.glow = canvasTex(128, 128, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
  TEX.glow.encoding = T.LinearEncoding;
}
