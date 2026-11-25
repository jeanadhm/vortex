'use strict';
// Colonie Noire · moteur de rendu, états du jeu (titre, histoire, jeu, pause, mort, fin) et boucle principale
const canvas = $('c');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.autoClear = false;
const scene = new T.Scene();
const cam = new T.PerspectiveCamera(74, 1, .04, 700);
makeTextures();

// ciel et éclairage
const SUN_DIR = new T.Vector3(.45, .55, .7).normalize();
const skyMat = new T.ShaderMaterial({
  uniforms: { top: { value: new T.Color('#3f7fd0') }, mid: { value: new T.Color('#a9d3ee') }, bot: { value: new T.Color('#e9dcc0') }, sun: { value: SUN_DIR.clone() } },
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform vec3 top, mid, bot, sun; varying vec3 vD;
    void main(){ float y = vD.y; vec3 c = y > 0. ? mix(mid, top, pow(y, .6)) : mix(mid, bot, min(1., -y * 3.));
      float s = max(0., dot(vD, sun)); c += vec3(1., .85, .6) * (pow(s, 700.) * 5. + pow(s, 8.) * .28); gl_FragColor = linearToOutputTexel(vec4(c, 1.)); }`,
  side: T.BackSide, depthWrite: false, fog: false,
});
const sky = new T.Mesh(new T.SphereGeometry(500, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
// carte de reflets en cube (dégradé de ciel), sans PMREM pour rester compatible avec tous les GPU
function envFrom(top, mid, bot, sunOn) {
  const ct = new T.Color(top), cm = new T.Color(mid), cb = new T.Color(bot), N = 32, faces = [];
  const dirs = [(u, v) => [1, -v, -u], (u, v) => [-1, -v, u], (u, v) => [u, 1, v], (u, v) => [u, -1, -v], (u, v) => [u, -v, 1], (u, v) => [-u, -v, -1]];
  for (const f of dirs) {
    const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), id = g.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = f((x + .5) / N * 2 - 1, (y + .5) / N * 2 - 1), l = Math.hypot(...d), dy = d[1] / l;
      const col = dy > 0 ? cm.clone().lerp(ct, Math.pow(dy, .6)) : cm.clone().lerp(cb, Math.min(1, -dy * 3));
      if (sunOn) { const s = Math.max(0, (d[0] * SUN_DIR.x + d[1] * SUN_DIR.y + d[2] * SUN_DIR.z) / l); const k = Math.pow(s, 24) * 1.5; col.r += k; col.g += k * .9; col.b += k * .7; }
      const i = (y * N + x) * 4; id.data[i] = Math.min(255, col.r * 255); id.data[i + 1] = Math.min(255, col.g * 255); id.data[i + 2] = Math.min(255, col.b * 255); id.data[i + 3] = 255;
    }
    g.putImageData(id, 0, 0); faces.push(c);
  }
  const t = new T.CubeTexture(faces); t.encoding = T.LinearEncoding; t.needsUpdate = true; return t;
}
const ENV = { day: envFrom('#3f7fd0', '#a9d3ee', '#6b5a40', true), cave: envFrom('#4a3524', '#1c140d', '#0a0604', false) };
const hemi = new T.HemisphereLight('#cfe4ff', '#5e4a2e', .6); scene.add(hemi);
const sun = new T.DirectionalLight('#fff0d6', 2.3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
{ const sc = sun.shadow.camera; sc.near = 1; sc.far = 220; sc.left = sc.bottom = -36; sc.right = sc.top = 36; }
sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; scene.add(sun, sun.target);
const lamp = new T.PointLight('#ffd7a0', 0, 24, 1.5); scene.add(lamp);

const world = new World(scene);
FX.init(scene); P.initVM();

const G = { state: 'boot', li: 0, L: null, lt: 0, time: 0, fired: new Set(), cool: {}, cocoons: 0, boss: null, queen: null, unlocked: 1, target: null, stats: {} };
const resetStats = () => { G.stats = { kills: 0, heads: 0, shots: 0, hits: 0, ahits: 0, time: 0, deaths: 0 }; };
resetStats();

function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  cam.aspect = w / h; cam.updateProjectionMatrix(); VM.cam.aspect = w / h; VM.cam.updateProjectionMatrix();
  FX.setScale(h * renderer.getPixelRatio(), cam.fov);
}
addEventListener('resize', resize); resize();

function loadLevel(i) {
  const L = LEVELS[i]; Object.assign(G, { li: i, L, lt: 0, fired: new Set(), cool: {}, cocoons: 0, boss: null, queen: null });
  EN.clear(); PK.clear(); FX.clear(); HUD.boss(null, null); HUD.clearSay();
  world.build(L);
  const cave = L.type === 'cave';
  sky.visible = !cave; scene.background = cave ? new T.Color('#030201') : null;
  scene.fog = cave ? new T.FogExp2('#0b0806', .04) : new T.FogExp2('#c4d6dc', .0105);
  sun.visible = !cave; hemi.color.set(cave ? '#6a5440' : '#cfe4ff'); hemi.groundColor.set(cave ? '#120c08' : '#5e4a2e'); hemi.intensity = cave ? .34 : .6;
  lamp.intensity = cave ? 1.6 : 0;
  scene.environment = cave ? ENV.cave : ENV.day; VM.scene.environment = scene.environment;
  renderer.toneMappingExposure = cave ? 1.2 : .95;
  for (const [t, x, z] of L.enemies) EN.spawn(t, x, z);
  for (const [t, x, z] of L.pickups || []) PK.spawn(t, x, z);
  for (const [x, z] of L.cocoons || []) PK.spawn('cocoon', x, z);
  if (L.setup) L.setup(L, G);
  P.spawn(L); world.flow(P.pos.x, P.pos.z);
  G.target = () => L.target(L, G);
  HUD.level(L.chapter, L.name); HUD.objective(L.objective(G));
  SFX.ambient(L.type);
}

// --- scripts de chapitre
function fireEv(k, ev, data) {
  if (ev.repeat) G.cool[k] = ev.repeat; else G.fired.add(k);
  if (ev.say) HUD.say(WHO[ev.say[0]], ev.say[1]);
  if (ev.run) ev.run(G, data);
}
G.event = (name, data) => {
  if (G.state !== 'play' || !G.L) return;
  G.L.events.forEach((ev, k) => { if (ev.on === name && !G.fired.has(k) && (!ev.when || ev.when(G.L, G, data))) fireEv(k, ev, data); });
};
function runEvents(dt) {
  G.L.events.forEach((ev, k) => {
    if (G.fired.has(k) || ev.on || G.state !== 'play') return;
    if (ev.repeat && G.cool[k] > 0) { G.cool[k] -= dt; return; }
    if (ev.at !== undefined ? G.lt >= ev.at : ev.when && ev.when(G.L, G)) fireEv(k, ev);
  });
}

// --- écrans
const screens = ['title', 'story', 'pause', 'dead', 'end'];
function show(id) { for (const s of screens) $(s).hidden = s !== id; document.body.classList.toggle('playing', !id); }
function save() { try { localStorage.setItem('cn-unlocked', String(G.unlocked)); } catch (e) {} }
function chapterButtons() {
  $('chapters').innerHTML = LEVELS.map((L, i) => `<button class="chap" data-i="${i}" ${i >= G.unlocked ? 'disabled' : ''}><b>${L.chapter}</b><span>${i < G.unlocked ? L.name : 'Verrouillé'}</span></button>`).join('');
  for (const b of $('chapters').querySelectorAll('button')) b.onclick = () => { SFX.init(); resetStats(); P.reset(); story(+b.dataset.i); };
}
function titleScreen() {
  G.state = 'title'; HUD.show(false); show('title'); chapterButtons();
  if (!G.L || G.li !== 0) loadLevel(0);
  SFX.ambient('surface');
}
function story(i) {
  G.state = 'story'; HUD.show(false); show('story');
  const L = LEVELS[i];
  $('sChap').textContent = L.chapter; $('sName').textContent = L.name;
  $('sText').innerHTML = ''; for (const t of L.story) { const p = document.createElement('p'); p.textContent = t; $('sText').append(p); }
  const b = $('bStart'); b.disabled = true; b.textContent = 'Chargement…';
  setTimeout(() => { loadLevel(i); b.disabled = false; b.textContent = 'Commencer'; b.focus(); }, 60);
}
function play() {
  SFX.init(); G.state = 'play'; show(null); HUD.show(true); HUD.lock();
  if (IN.noLock && !IN.touch) HUD.notice('Souris libre : Échap ou P pour la pause', 3);
}
G.pause = () => { if (G.state !== 'play') return; G.state = 'pause'; IN.fire = false; IN.k = {}; show('pause'); HUD.show(false); if (document.pointerLockElement) document.exitPointerLock(); };
G.die = () => {
  G.state = 'dead'; G.stats.deaths++; IN.fire = false; HUD.show(false);
  setTimeout(() => { if (document.pointerLockElement) document.exitPointerLock(); show('dead'); $('deadMsg').textContent = ['Les Rouges t\'ont submergée.', 'Ta chitine a cédé.', 'La colonie compte encore sur toi.'][G.stats.deaths % 3]; }, 900);
};
G.complete = () => {
  if (G.state !== 'play') return;
  G.state = 'done'; HUD.show(false); if (document.pointerLockElement) document.exitPointerLock();
  G.unlocked = Math.max(G.unlocked, Math.min(LEVELS.length, G.li + 2)); save();
  if (G.li + 1 < LEVELS.length) { P.reset(); story(G.li + 1); }
  else {
    show('end'); $('eText').innerHTML = ''; for (const t of EPILOGUE) { const p = document.createElement('p'); p.textContent = t; $('eText').append(p); }
    const s = G.stats, m = Math.floor(s.time / 60), sec = Math.floor(s.time % 60);
    const acc = s.shots ? Math.min(100, Math.round(s.ahits / s.shots * 100)) : 0;
    $('eStats').innerHTML = [['Temps', `${m} min ${String(sec).padStart(2, '0')}`], ['Fourmis rouges abattues', s.kills], ['Tirs à la tête', s.heads], ['Précision de l\'acide', acc + ' %'], ['Chutes', s.deaths]]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  }
};
$('bPlay').onclick = () => { SFX.init(); resetStats(); P.reset(); story(0); };
$('bStart').onclick = play;
$('bResume').onclick = () => { G.state = 'play'; show(null); HUD.show(true); HUD.lock(); };
$('bRestart').onclick = () => { P.reset(); loadLevel(G.li); play(); };
$('bRetry').onclick = () => { P.reset(); loadLevel(G.li); play(); };
for (const id of ['bMenu', 'bMenu2', 'bMenu3']) $(id).onclick = () => { G.L = null; titleScreen(); };
$('sens').oninput = e => { P.sens = +e.target.value; try { localStorage.setItem('cn-sens', e.target.value); } catch (er) {} };

// --- caméra du titre : travelling au ras du sol, entre les brins d'herbe
function titleCam() {
  const t = G.time * .045, cx = 0, cz = -26, r = 17;
  const x = cx + Math.sin(t) * r, z = cz + Math.cos(t) * r;
  cam.position.set(x, world.floorAt(x, z) + 2.4, z);
  const lx = cx + Math.sin(t + .5) * r * .45, lz = cz + Math.cos(t + .5) * r * .45;
  cam.lookAt(lx, world.floorAt(lx, lz) + 2.6, lz);
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now; G.time += dt;
  if (G.state === 'play') {
    G.lt += dt; G.stats.time += dt;
    P.update(dt); EN.update(dt, false); PK.update(dt); FX.update(dt); runEvents(dt);
    if (G.L.tick) G.L.tick(dt, G);
    if (G.state === 'play') HUD.objective(G.L.objective(G));
    HUD.update(dt); SFX.tick(dt); FX.motes(dt, world.cave);
  } else if (G.state === 'title' || G.state === 'story') {
    if (G.state === 'title' && G.li === 0) titleCam();
    EN.update(dt, true); FX.update(dt); FX.motes(dt, world.cave); if (G.L && G.L.tick) G.L.tick(dt, G);
  } else if (G.state === 'dead' || G.state === 'done') { FX.update(dt); EN.update(dt, true); }
  if (world.windU) world.windU.value = G.time;
  sun.target.position.set(Math.round(cam.position.x), 0, Math.round(cam.position.z));
  sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 100); sun.target.updateMatrixWorld();
  lamp.position.copy(cam.position); lamp.position.y += .3;
  sky.position.copy(cam.position);
  renderer.clear(); renderer.render(scene, cam);
  if (G.state === 'play' || G.state === 'pause') { renderer.clearDepth(); renderer.render(VM.scene, VM.cam); }
}

// démarrage
function boot(d) {
  let u = 1; try { u = +localStorage.getItem('cn-unlocked') || 1; const s = localStorage.getItem('cn-sens'); if (s) { P.sens = +s; $('sens').value = s; } } catch (e) {}
  G.unlocked = clamp(Math.max(u, (d && d.unlocked) || 1), 1, LEVELS.length);
  titleScreen();
  requestAnimationFrame(frame);
}
if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ unlocked: G.unlocked }));
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(boot); else boot(window.claude && window.claude.hot && window.claude.hot.data || {});
