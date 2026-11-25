'use strict';
// Colonie Noire · effets : particules, projectiles (acide, graines), explosions, secousses
const FX = { projs: [], shake: 0 };
(() => {
  const VS = `attribute float size; attribute float alpha; attribute vec3 color; uniform float uScale; varying vec3 vC; varying float vA;
    void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = size * uScale / max(.1, -mv.z); gl_Position = projectionMatrix * mv; }`;
  const FS = `uniform sampler2D map; varying vec3 vC; varying float vA;
    void main(){ vec4 t = texture2D(map, gl_PointCoord); float a = t.a * vA; if (a < .01) discard; gl_FragColor = linearToOutputTexel(vec4(vC, a)); }`;
  class PSys {
    constructor(max, blending) {
      this.max = max; this.idx = 0;
      this.p = new Float32Array(max * 3); this.c = new Float32Array(max * 3); this.s = new Float32Array(max); this.a = new Float32Array(max);
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(this.p, 3).setUsage(T.DynamicDrawUsage));
      g.setAttribute('color', new T.BufferAttribute(this.c, 3).setUsage(T.DynamicDrawUsage));
      g.setAttribute('size', new T.BufferAttribute(this.s, 1).setUsage(T.DynamicDrawUsage));
      g.setAttribute('alpha', new T.BufferAttribute(this.a, 1).setUsage(T.DynamicDrawUsage));
      this.g = g;
      this.d = []; for (let i = 0; i < max; i++) this.d.push({ life: 0, max: 1, vx: 0, vy: 0, vz: 0, g: 0, drag: 0, size: 0, grow: 0, a0: 1 });
      this.mat = new T.ShaderMaterial({ uniforms: { map: { value: TEX.glow }, uScale: { value: 500 } }, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending });
      this.pts = new T.Points(g, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = 5;
    }
    spawn(x, y, z, vx, vy, vz, life, size, col, o = {}) {
      const i = this.idx; this.idx = (this.idx + 1) % this.max; const d = this.d[i];
      d.life = d.max = life; d.vx = vx; d.vy = vy; d.vz = vz; d.size = size; d.grow = o.grow || 0; d.g = o.g || 0; d.drag = o.drag || 0; d.a0 = o.a === undefined ? 1 : o.a;
      this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z; this.c[i * 3] = col.r; this.c[i * 3 + 1] = col.g; this.c[i * 3 + 2] = col.b;
    }
    update(dt) {
      for (let i = 0; i < this.max; i++) {
        const d = this.d[i];
        if (d.life <= 0) { this.a[i] = 0; continue; }
        d.life -= dt; const k = Math.max(0, d.life / d.max);
        d.vy -= d.g * dt; const dr = Math.max(0, 1 - d.drag * dt); d.vx *= dr; d.vy *= dr; d.vz *= dr;
        this.p[i * 3] += d.vx * dt; this.p[i * 3 + 1] += d.vy * dt; this.p[i * 3 + 2] += d.vz * dt;
        this.s[i] = d.size * (1 + d.grow * (1 - k)); this.a[i] = d.life > 0 ? d.a0 * Math.min(1, k * 2.5) : 0;
      }
      for (const n of ['position', 'size', 'alpha', 'color']) this.g.attributes[n].needsUpdate = true;
    }
    clear() { for (const d of this.d) d.life = 0; }
  }

  const C = c => new T.Color(c);
  const COL = { acid: C('#a6ff3d'), eacid: C('#ffb43a'), fire: C('#ffa040'), spark: C('#ffd38a'), dust: C('#6b5136'), hemo: C('#c8d24a'), pollen: C('#ffe9a8'), spore: C('#6dffd6'), white: C('#ffffff') };
  FX.COL = COL;
  let projGeo, mats;

  FX.init = scene => {
    FX.scene = scene;
    FX.glow = new PSys(1800, T.AdditiveBlending); FX.dust = new PSys(900, T.NormalBlending);
    scene.add(FX.glow.pts, FX.dust.pts);
    FX.light = new T.PointLight('#ffb060', 0, 22, 1.6); scene.add(FX.light);
    projGeo = new T.SphereGeometry(1, 10, 8);
    mats = {
      acid: new T.MeshBasicMaterial({ color: '#c8ff6a' }),
      eacid: new T.MeshBasicMaterial({ color: '#ffc04a' }),
      seed: new T.MeshStandardMaterial({ color: '#7a4f24', roughness: .5 }),
    };
  };
  FX.setScale = (h, fov) => { const s = h / (2 * Math.tan(fov * Math.PI / 360)); FX.glow.mat.uniforms.uScale.value = s; FX.dust.mat.uniforms.uScale.value = s; };
  FX.clear = () => { FX.glow.clear(); FX.dust.clear(); for (const p of FX.projs) FX.scene.remove(p.m); FX.projs = []; FX.light.intensity = 0; };

  FX.fire = (type, pos, vel, owner, dmg) => {
    const m = new T.Mesh(projGeo, mats[type]);
    if (type === 'seed') { m.scale.set(.17, .12, .12); m.castShadow = true; } else m.scale.setScalar(type === 'acid' ? .07 : .13);
    m.position.copy(pos); FX.scene.add(m);
    FX.projs.push({ type, pos: pos.clone(), vel: vel.clone(), owner, dmg, life: type === 'seed' ? 1.9 : 2.4, m });
  };

  FX.splash = (p, col, n, sp = 3) => {
    for (let i = 0; i < n; i++) FX.glow.spawn(p.x, p.y, p.z, rand(-sp, sp), rand(0, sp * 1.2), rand(-sp, sp), rand(.2, .45), rand(.08, .18), col, { g: 9, drag: 2 });
  };
  FX.hemo = p => { for (let i = 0; i < 7; i++) FX.dust.spawn(p.x, p.y, p.z, rand(-2, 2), rand(0, 3), rand(-2, 2), rand(.3, .6), rand(.08, .16), COL.hemo, { g: 12 }); };

  FX.explode = (p, R, dmg) => {
    const dc = cam.position.distanceTo(p);
    SFX.boom(dc); FX.shake = Math.max(FX.shake, clamp(1.3 - dc / 22, 0, 1.3));
    FX.light.position.copy(p).y += 1; FX.light.intensity = 9;
    for (let i = 0; i < 34; i++) { const a = rand(0, 6.28), s = rand(2, 9); FX.glow.spawn(p.x, p.y + .3, p.z, Math.cos(a) * s, rand(1, 7), Math.sin(a) * s, rand(.35, .8), rand(.6, 1.6), COL.fire, { grow: 1.2, drag: 3 }); }
    for (let i = 0; i < 24; i++) FX.glow.spawn(p.x, p.y + .3, p.z, rand(-10, 10), rand(3, 12), rand(-10, 10), rand(.5, 1.1), rand(.08, .16), COL.spark, { g: 16 });
    for (let i = 0; i < 40; i++) { const a = rand(0, 6.28), s = rand(1, 5); FX.dust.spawn(p.x, p.y + .4, p.z, Math.cos(a) * s, rand(.5, 4), Math.sin(a) * s, rand(1.2, 2.4), rand(.9, 2.2), COL.dust, { grow: 1.6, drag: 1.8, g: -.3, a: .75 }); }
    EN.radial(p, R, dmg);
    const pd = Math.hypot(P.pos.x - p.x, P.pos.y + .4 - p.y, P.pos.z - p.z);
    if (pd < R) P.damage(dmg * .3 * (1 - pd / R), p);
  };

  const chest = new T.Vector3();
  FX.update = dt => {
    FX.glow.update(dt); FX.dust.update(dt);
    FX.shake = Math.max(0, FX.shake - dt * 2.2);
    if (FX.light.intensity > 0) FX.light.intensity = Math.max(0, FX.light.intensity - dt * 25);
    for (let i = FX.projs.length - 1; i >= 0; i--) {
      const pr = FX.projs[i], p = pr.pos, v = pr.vel, seed = pr.type === 'seed';
      pr.life -= dt; v.y -= (seed ? 18 : pr.type === 'acid' ? 4 : 7) * dt;
      p.addScaledVector(v, dt);
      let hit = false;
      if (!seed) FX.glow.spawn(p.x, p.y, p.z, 0, 0, 0, .22, pr.type === 'acid' ? .14 : .26, pr.type === 'acid' ? COL.acid : COL.eacid);
      const f = world.floorAt(p.x, p.z), cl = world.ceilAt(p.x, p.z);
      if (p.y < f) { if (seed) { p.y = f + .01; v.y = Math.abs(v.y) * .35; v.x *= .6; v.z *= .6; } else hit = true; }
      if (p.y > cl) { if (seed) { p.y = cl - .01; v.y = -Math.abs(v.y) * .3; } else hit = true; }
      if (world.wAt(p.x, p.z) > .85) { if (seed) { p.addScaledVector(v, -dt); v.x *= -.4; v.z *= -.4; } else hit = true; }
      for (const c of world.near(p.x, p.z)) if (p.y < c.top && p.y > c.bot && (p.x - c.x) ** 2 + (p.z - c.z) ** 2 < c.r * c.r) {
        if (seed) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz) || 1; p.x = c.x + dx / d * c.r * 1.01; p.z = c.z + dz / d * c.r * 1.01; const dot = (v.x * dx + v.z * dz) / d; v.x -= 1.5 * dot * dx / d; v.z -= 1.5 * dot * dz / d; }
        else hit = true;
        break;
      }
      if (!hit && pr.owner === 'p' && !seed) {
        const h = EN.hitTest(p, .1);
        if (h) { G.stats.ahits++; EN.damage(h.e, pr.dmg, h.head, p); FX.hemo(p); hit = true; }
      }
      if (!hit && pr.owner === 'e') {
        chest.set(P.pos.x, P.pos.y + .35, P.pos.z);
        if (p.distanceToSquared(chest) < .36) { P.damage(pr.dmg, p); hit = true; }
      }
      pr.m.position.copy(p); if (seed) { pr.m.rotation.x += dt * 9; pr.m.rotation.y += dt * 7; }
      if (seed && (pr.life <= 0 || (EN.hitTest(p, .15)))) { FX.explode(p, 5.5, 130); hit = true; }
      else if (seed) hit = false;
      if (hit || pr.life <= 0) {
        if (!seed) FX.splash(p, pr.type === 'acid' ? COL.acid : COL.eacid, 7);
        FX.scene.remove(pr.m); FX.projs.splice(i, 1);
      }
    }
  };

  // poussière ambiante autour de la caméra
  FX.motes = (dt, cave) => {
    const n = Math.random() < dt * 25 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const x = cam.position.x + rand(-12, 12), z = cam.position.z + rand(-12, 12), y = cam.position.y + rand(-2, 4);
      FX.glow.spawn(x, y, z, rand(-.3, .3), rand(-.1, .25), rand(-.3, .3), rand(4, 7), cave ? .07 : .05, cave ? COL.spore : COL.pollen, { a: cave ? .8 : .6 });
    }
  };
})();
