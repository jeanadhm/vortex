'use strict';
// Colonie Noire · fourmis rouges : types, IA (patrouille, alerte, poursuite, attaque, crachat), boss
const ETYPES = {
  scout:   { name: 'Éclaireuse', hp: 45,   speed: 5.4, dmg: 8,  reach: 1.7, cd: .85, scale: .92, sight: 28, body: '#6e1608', gaster: '#2e0904', head: .95, legLen: 1.12 },
  soldier: { name: 'Soldate',    hp: 130,  speed: 3.7, dmg: 17, reach: 2.2, cd: 1.2, scale: 1.3, sight: 24, body: '#8a200d', gaster: '#3a0d06', head: 1.45 },
  spitter: { name: 'Cracheuse',  hp: 65,   speed: 3.5, dmg: 10, reach: 1.7, cd: 1.8, scale: 1.02, sight: 32, body: '#94300f', gaster: '#c96a1c', ranged: true },
  boss:    { name: 'Major Ignis', hp: 1800, speed: 4.4, dmg: 28, reach: 3.9, cd: 1.3, scale: 3.2, sight: 90, body: '#7a1309', gaster: '#250603', head: 1.6, boss: true },
};
const EN = { list: [], flowT: 0 };
(() => {
  const V1 = new T.Vector3(), V2 = new T.Vector3(), V3 = new T.Vector3();

  EN.clear = () => { for (const e of EN.list) { scene.remove(e.ant.root); e.ant.mats.forEach(m => m.dispose()); } EN.list = []; };
  EN.spawn = (type, x, z, o = {}) => {
    const d = ETYPES[type], a = buildAnt({ body: d.body, gaster: d.gaster, head: d.head, legLen: d.legLen });
    a.root.scale.setScalar(d.scale); scene.add(a.root);
    const y = world.groundAt(x, z, 99);
    const e = Object.assign({
      type, d, ant: a, pos: new T.Vector3(x, y, z), vel: new T.Vector3(), yaw: Math.random() * 6.28, hp: d.hp, max: d.hp,
      alert: false, pend: 0, seen: false, losT: Math.random() * .3, cd: rand(.4, 1.4), atk: 0, home: new T.Vector3(x, y, z), wander: null, wait: 0,
      dead: false, deadT: 0, flash: 0, stun: 0, strafe: Math.random() < .5 ? 1 : -1, strafeT: 0, lastX: x, lastZ: z, b: null,
    }, o);
    a.root.position.copy(e.pos); a.root.rotation.y = e.yaw;
    EN.list.push(e); return e;
  };
  EN.alive = () => EN.list.filter(e => !e.dead);

  EN.alert = e => {
    if (e.alert || e.dead) return;
    e.alert = true; e.cd = Math.max(e.cd, .35);
    SFX.chitter(e.pos.distanceTo(P.pos));
    for (const o of EN.list) if (!o.alert && !o.dead && o.pend <= 0 && o.pos.distanceTo(e.pos) < 14) o.pend = rand(.3, .9);
    G.event('alert');
  };
  EN.noise = (p, r) => { for (const e of EN.list) if (!e.alert && !e.dead && e.pos.distanceTo(p) < r) e.pend = e.pend > 0 ? e.pend : rand(.2, .6); };

  EN.hitTest = (p, r) => {
    for (const e of EN.list) {
      if (e.dead) continue; const s = e.d.scale;
      if (Math.abs(p.x - e.pos.x) > 1.6 * s + r || Math.abs(p.z - e.pos.z) > 1.6 * s + r) continue;
      e.ant.root.updateMatrixWorld();
      for (const h of e.ant.hit) { V3.copy(h.p).applyMatrix4(e.ant.root.matrixWorld); if (V3.distanceToSquared(p) < (h.r * s + r) ** 2) return { e, head: h.head }; }
    }
    return null;
  };
  EN.damage = (e, amt, head, from) => {
    if (e.dead) return;
    if (head) amt *= 2; if (e.stun > 0) amt *= 1.5;
    e.hp -= amt; e.flash = 1; G.stats.hits++;
    HUD.hit(head);
    if (!e.alert) EN.alert(e);
    if (from && !e.d.boss) { const kx = e.pos.x - from.x, kz = e.pos.z - from.z, k = Math.hypot(kx, kz) || 1; e.vel.x += kx / k * 3; e.vel.z += kz / k * 3; }
    if (e.d.boss) HUD.boss(e.d.name, Math.max(0, e.hp / e.max));
    if (e.hp <= 0) EN.kill(e, head);
  };
  EN.kill = (e, head) => {
    e.dead = true; e.deadT = 0; e.hp = 0; e.ant.setOpen(.5);
    SFX.kill(); G.stats.kills++; if (head) G.stats.heads++;
    HUD.feed(e.d.name + (head ? ' · tir à la tête' : ''));
    if (!e.d.boss) { const r = Math.random(); if (r < .3) PK.spawn('heal', e.pos.x, e.pos.z); else if (r < .42) PK.spawn('seed', e.pos.x, e.pos.z); else if (r < .5) PK.spawn('armor', e.pos.x, e.pos.z); }
    G.event('kill', e);
  };
  EN.radial = (p, R, dmg) => {
    for (const e of EN.list) {
      if (e.dead) continue; const s = e.d.scale;
      const d = Math.hypot(e.pos.x - p.x, e.pos.y + .4 * s - p.y, e.pos.z - p.z), rr = R + .5 * s;
      if (d < rr) { EN.damage(e, dmg * (1 - d / rr) + 10, false, p); if (!e.d.boss) { const k = Math.hypot(e.pos.x - p.x, e.pos.z - p.z) || 1; e.vel.x += (e.pos.x - p.x) / k * 8; e.vel.z += (e.pos.z - p.z) / k * 8; } }
    }
  };

  const mouth = (e, out) => { e.ant.root.updateMatrixWorld(); return out.set(0, .42, .62).applyMatrix4(e.ant.root.matrixWorld); };
  function spitAt(e, speed, spread, dmg) {
    const m = mouth(e, V1), t = m.distanceTo(P.pos) / speed;
    V2.set(P.pos.x + P.vel.x * t * .6, P.pos.y + .35, P.pos.z + P.vel.z * t * .6).sub(m).normalize();
    V2.x += rand(-spread, spread); V2.y += rand(-spread, spread) * .5; V2.z += rand(-spread, spread);
    V2.normalize().multiplyScalar(speed); V2.y += 3.5 * t;
    FX.fire('eacid', m, V2, 'e', dmg); SFX.spit(e.pos.distanceTo(P.pos));
  }

  function pathDir(e, dist) {
    if (e.seen && dist < 10) return [P.pos.x - e.pos.x, P.pos.z - e.pos.z];
    const s = world.nextStep(e.pos.x, e.pos.z);
    if (s) return [s[0] - e.pos.x, s[1] - e.pos.z];
    return [e.lastX - e.pos.x, e.lastZ - e.pos.z];
  }

  function boss(e, dt, dist, dx, dz, out) {
    const b = e.b || (e.b = { spit: 3, charge: 6, mode: 'chase', t: 0, p1: false, p2: false, stuns: 0 });
    b.t -= dt;
    if (!b.p1 && e.hp < e.max * .6) { b.p1 = true; G.event('boss60', e); }
    if (!b.p2 && e.hp < e.max * .3) { b.p2 = true; G.event('boss30', e); }
    if (e.stun > 0) { e.stun -= dt; e.ant.setOpen(.05); out.spd = 0; out.face = false; return; }
    if (b.mode === 'wind') {
      out.spd = 0; out.face = true; e.ant.setOpen(.75);
      if (b.t <= 0) { b.mode = 'charge'; b.t = 1.15; const k = Math.hypot(dx, dz) || 1; b.dx = dx / k; b.dz = dz / k; b.hitP = false; }
      return;
    }
    if (b.mode === 'charge') {
      out.tx = b.dx; out.tz = b.dz; out.spd = 17; out.face = false; out.charge = true; e.ant.setOpen(.6);
      if (!b.hitP && dist < 3.4) { b.hitP = true; P.damage(34, e.pos); P.vel.x += b.dx * 14; P.vel.z += b.dz * 14; P.vel.y = 4; FX.shake = 1; }
      if (b.t <= 0) b.mode = 'chase';
      return;
    }
    out.face = dist < 9;
    const [px, pz] = pathDir(e, dist); out.tx = px; out.tz = pz; out.spd = e.d.speed;
    if (dist < e.d.reach) { out.spd = 0; out.face = true; if (e.atk <= 0 && e.cd <= 0) { e.atk = .45; e.ant.setOpen(.8); } }
    b.spit -= dt; b.charge -= dt;
    if (b.spit <= 0 && e.seen && dist > 6) { b.spit = b.p2 ? 3.2 : 4.5; for (let i = -2; i <= 2; i++) { const sp = .05; spitAt(e, 20, sp, 12); V2.applyAxisAngle(new T.Vector3(0, 1, 0), i * .14); FX.projs[FX.projs.length - 1].vel.copy(V2); } }
    if (b.charge <= 0 && e.seen && dist > 9) { b.charge = b.p2 ? 5.5 : 7.5; b.mode = 'wind'; b.t = .9; SFX.roar(); }
  }

  const out = { tx: 0, tz: 0, spd: 0, face: false, charge: false };
  EN.update = (dt, passive) => {
    if (!passive) { EN.flowT -= dt; if (EN.flowT <= 0) { EN.flowT = .4; world.flow(P.pos.x, P.pos.z); } }
    const pe = V1.set(P.pos.x, P.pos.y + .6, P.pos.z);
    for (let i = EN.list.length - 1; i >= 0; i--) {
      const e = EN.list[i], a = e.ant, s = e.d.scale;
      if (e.dead) {
        e.deadT += dt; const k = Math.min(1, e.deadT / .35);
        a.root.rotation.z = k * Math.PI; a.root.position.y = e.pos.y + .78 * s * k - Math.max(0, e.deadT - 7) * .4 * s;
        a.setCurl(Math.min(1, e.deadT / 1.2)); a.anim(dt, Math.max(0, 1.5 - e.deadT) * 3);
        for (const m of a.mats) m.emissive.setRGB(0, 0, 0);
        if (e.deadT > 10) { scene.remove(a.root); a.mats.forEach(m => m.dispose()); EN.list.splice(i, 1); }
        continue;
      }
      e.flash = Math.max(0, e.flash - dt * 5); for (const m of a.mats) m.emissive.setRGB(e.flash * .9, e.flash * .25, 0);
      e.cd -= dt; e.losT -= dt;
      const dx = P.pos.x - e.pos.x, dz = P.pos.z - e.pos.z, dist = Math.hypot(dx, dz);
      if (passive) e.seen = false;
      else if (e.losT <= 0) {
        e.losT = .2 + Math.random() * .2;
        e.seen = !P.dead && dist < e.d.sight && world.los(V2.set(e.pos.x, e.pos.y + .5 * s, e.pos.z), pe);
        if (e.seen) { e.lastX = P.pos.x; e.lastZ = P.pos.z; }
      }
      if (e.pend > 0) { e.pend -= dt; if (e.pend <= 0) EN.alert(e); }
      if (!passive && !e.alert && e.seen && (dist < e.d.sight * .6 || e.d.boss)) EN.alert(e);

      out.tx = 0; out.tz = 0; out.spd = 0; out.face = false; out.charge = false;
      if (e.d.boss && !passive) boss(e, dt, dist, dx, dz, out);
      else if (!e.alert || passive || P.dead) {
        e.wait -= dt;
        if (!e.wander || Math.hypot(e.wander[0] - e.pos.x, e.wander[1] - e.pos.z) < .8) {
          if (!e.wander || e.wait <= 0) {
            for (let k = 0; k < 6; k++) { const a2 = rand(0, 6.28), r = rand(2, 9), x = e.home.x + Math.cos(a2) * r, z = e.home.z + Math.sin(a2) * r; if (world.walkable(x, z, e.pos.y + 2, 3)) { e.wander = [x, z]; break; } }
            e.wait = rand(1, 4);
          }
        } else { out.tx = e.wander[0] - e.pos.x; out.tz = e.wander[1] - e.pos.z; out.spd = e.d.speed * .3; }
      } else if (e.d.ranged && e.seen && dist < e.d.sight) {
        out.face = true; e.strafeT -= dt; if (e.strafeT <= 0) { e.strafeT = rand(1, 2.5); e.strafe *= -1; }
        const k = dist || 1, fx = dx / k, fz = dz / k;
        if (dist > 15) { out.tx = fx; out.tz = fz; out.spd = e.d.speed; }
        else if (dist < 7) { out.tx = -fx; out.tz = -fz; out.spd = e.d.speed * .9; }
        else { out.tx = -fz * e.strafe; out.tz = fx * e.strafe; out.spd = e.d.speed * .6; }
        if (e.cd <= 0) { e.cd = e.d.cd * rand(.85, 1.2); e.lift = 1.1; spitAt(e, 22, .03, e.d.dmg); }
      } else {
        if (dist < e.d.reach) { out.face = true; if (e.atk <= 0 && e.cd <= 0) { e.atk = .3; a.setOpen(.75); } }
        else { const [px, pz] = pathDir(e, dist); out.tx = px; out.tz = pz; out.spd = e.d.speed; out.face = e.seen && dist < 4; }
      }
      // morsure
      if (e.atk > 0) {
        e.atk -= dt; out.spd = Math.min(out.spd, .5);
        if (e.atk <= 0) {
          a.setOpen(.05); e.cd = e.d.cd;
          if (!P.dead && dist < e.d.reach + .5 && Math.abs(P.pos.y - e.pos.y) < 1.5 * s) { P.damage(e.d.dmg, e.pos); SFX.bite(); }
          setTimeout(() => a.setOpen(.12), 150);
        }
      }
      // mouvement
      const k = Math.hypot(out.tx, out.tz);
      const tvx = k > 1e-3 ? out.tx / k * out.spd : 0, tvz = k > 1e-3 ? out.tz / k * out.spd : 0;
      const acc = out.charge ? 20 : 7;
      e.vel.x += (tvx - e.vel.x) * Math.min(1, dt * acc); e.vel.z += (tvz - e.vel.z) * Math.min(1, dt * acc);
      for (const o of EN.list) {
        if (o === e || o.dead) continue;
        const ox = e.pos.x - o.pos.x, oz = e.pos.z - o.pos.z, d = Math.hypot(ox, oz), m = (s + o.d.scale) * .5;
        if (d < m && d > 1e-3) { e.pos.x += ox / d * (m - d) * .5; e.pos.z += oz / d * (m - d) * .5; }
      }
      if (!passive && dist < .45 + .45 * s && dist > 1e-3) { e.pos.x -= dx / dist * (.45 + .45 * s - dist); e.pos.z -= dz / dist * (.45 + .45 * s - dist); }
      const ox = e.pos.x, oz = e.pos.z;
      world.move(e.pos, e.vel.x * dt, e.vel.z * dt, .4 * s, .7 * s);
      if (out.charge) { const moved = Math.hypot(e.pos.x - ox, e.pos.z - oz); if (moved < out.spd * dt * .3) { e.stun = 2.2; e.b.mode = 'chase'; e.b.stuns++; FX.shake = Math.max(FX.shake, .9); SFX.boom(dist); G.event('bossStun', e); } }
      const gy = world.groundAt(e.pos.x, e.pos.z, e.pos.y + .4 * s);
      e.pos.y += (gy - e.pos.y) * Math.min(1, dt * 12);
      const sp = Math.hypot(e.vel.x, e.vel.z);
      const faceYaw = out.face ? Math.atan2(dx, dz) : sp > .3 ? Math.atan2(e.vel.x, e.vel.z) : e.yaw;
      e.yaw = angLerp(e.yaw, faceYaw, dt * (out.charge ? 2 : 8));
      const fx = Math.sin(e.yaw) * .5 * s, fz = Math.cos(e.yaw) * .5 * s;
      const pitch = Math.atan2(world.floorAt(e.pos.x + fx, e.pos.z + fz) - world.floorAt(e.pos.x - fx, e.pos.z - fz), s);
      a.root.position.copy(e.pos); a.root.rotation.y = e.yaw; a.root.rotation.x = angLerp(a.root.rotation.x, -pitch, dt * 6);
      e.lift = Math.max(0, (e.lift || 0) - dt * 2.5); a.setLift(e.lift);
      a.anim(dt, sp / s);
    }
  };
})();
