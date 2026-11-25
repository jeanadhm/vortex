'use strict';
// Colonie Noire · modèle de fourmi anatomique (tête, mésosome, pétiole, gastre, 6 pattes articulées, antennes coudées)
const ANT = { geo: {}, sph: new T.SphereGeometry(1, 22, 16) };
ANT.sph.userData.keep = true;
function limbGeo(len, r) {
  const k = len.toFixed(3) + '_' + r.toFixed(3);
  if (!ANT.geo[k]) { const g = new T.CylinderGeometry(r * .6, r, len, 8, 1); g.rotateZ(-Math.PI / 2); g.translate(len / 2, 0, 0); g.userData.keep = true; ANT.geo[k] = g; }
  return ANT.geo[k];
}
function chitinMat(color, rough = .3) {
  return new T.MeshPhysicalMaterial({ color, roughness: rough, metalness: .08, clearcoat: 1, clearcoatRoughness: .18 });
}
const X_AXIS = new T.Vector3(1, 0, 0);
function aim(obj, dir) { obj.quaternion.setFromUnitVectors(X_AXIS, dir.clone().normalize()); }

// o: { body, gaster, legs, head (taille relative), legLen }
function buildAnt(o) {
  const root = new T.Group(), body = new T.Group(); root.add(body); root.rotation.order = 'YXZ';
  const mB = chitinMat(o.body), mG = chitinMat(o.gaster, .22), mL = chitinMat(o.legs || o.body, .42);
  const mE = new T.MeshPhysicalMaterial({ color: '#060606', roughness: .05, clearcoat: 1 });
  const hs = o.head || 1, ll = o.legLen || 1;
  const blob = (m, sx, sy, sz, x, y, z, p = body) => { const s = new T.Mesh(ANT.sph, m); s.scale.set(sx, sy, sz); s.position.set(x, y, z); s.castShadow = true; p.add(s); return s; };

  // gastre (abdomen) avec ses segments
  const gaster = new T.Group(); gaster.position.set(0, .36, -.2); gaster.rotation.x = -.3; body.add(gaster);
  blob(mG, .3, .26, .4, 0, 0, -.3, gaster);
  for (let i = 0; i < 3; i++) { const dz = .16 - i * .17, k = Math.sqrt(Math.max(0, 1 - (dz / .4) ** 2)); blob(mG, .3 * k + .012, .26 * k + .01, .035, 0, 0, -.3 + dz, gaster); }
  blob(mB, .07, .075, .08, 0, .33, -.12);                   // pétiole
  blob(mB, .12, .12, .27, 0, .37, .07).rotation.x = .18;     // mésosome
  blob(mB, .105, .1, .11, 0, .42, .2);                        // pronotum
  const head = new T.Group(); head.position.set(0, .44, .36); head.scale.setScalar(hs); body.add(head);
  blob(mB, .2, .165, .2, 0, 0, .07, head);
  for (const s of [-1, 1]) blob(mE, .05, .065, .07, s * .165, .03, .1, head);

  const mand = [];
  for (const s of [-1, 1]) {
    const p = new T.Group(); p.position.set(s * .08, -.07, .22); head.add(p);
    const m = new T.Mesh(limbGeo(.2, .035), mL); m.castShadow = true; aim(m, new T.Vector3(-s * .45, -.1, .9)); p.add(m);
    mand.push(p);
  }
  const antn = [];
  for (const s of [-1, 1]) {
    const a = new T.Group(); a.position.set(s * .07, .1, .2); head.add(a);
    const d1 = new T.Vector3(s * .45, .75, .5).normalize();
    const sc = new T.Mesh(limbGeo(.3, .018), mL); aim(sc, d1); a.add(sc);
    const el = new T.Group(); el.position.copy(d1).multiplyScalar(.3); a.add(el);
    const fu = new T.Mesh(limbGeo(.36, .016), mL); aim(fu, new T.Vector3(s * .25, -.15, 1)); el.add(fu);
    antn.push(el);
  }
  const legs = [], zs = [.17, .07, -.03], yaw0 = [.75, .05, -.7];
  for (const s of [-1, 1]) {
    const side = new T.Group(); side.scale.x = s; body.add(side);
    for (let i = 0; i < 3; i++) {
      const hip = new T.Group(); hip.position.set(.07, .31, zs[i]); side.add(hip);
      const fem = new T.Group(); hip.add(fem);
      const f = new T.Mesh(limbGeo(.3 * ll, .032), mL); f.castShadow = true; fem.add(f);
      const knee = new T.Group(); knee.position.x = .3 * ll; knee.rotation.z = -1.7; fem.add(knee);
      const tb = new T.Mesh(limbGeo(.42 * ll, .024), mL); tb.castShadow = true; knee.add(tb);
      const ank = new T.Group(); ank.position.x = .42 * ll; ank.rotation.z = .9; knee.add(ank);
      ank.add(new T.Mesh(limbGeo(.18 * ll, .014), mL));
      legs.push({ hip, fem, i, grp: (i + (s > 0 ? 0 : 1)) % 2 });
    }
  }
  body.position.y = (ll - 1) * .25;

  let ph = Math.random() * 6, tw = Math.random() * 6, open = 0, openT = .12, curl = 0, lift = 0;
  return {
    root, body, head, gaster, legs, mats: [mB, mG, mL],
    hit: [
      { p: new T.Vector3(0, .44, .36 + .07 * hs), r: .2 * hs, head: true },
      { p: new T.Vector3(0, .37, .08), r: .19 },
      { p: new T.Vector3(0, .3, -.5), r: .3 },
    ],
    setOpen(v) { openT = v; },
    setCurl(v) { curl = v; },
    setLift(v) { lift = v; },
    anim(dt, speed) {
      ph += dt * speed * 7; tw += dt;
      const amp = Math.min(1, speed * .45);
      for (const L of legs) {
        const p = ph + L.grp * Math.PI;
        L.hip.rotation.y = -(yaw0[L.i] + Math.sin(p) * .32 * amp) * (1 - curl * .6);
        L.fem.rotation.z = .55 + Math.max(0, Math.cos(p)) * .45 * amp + curl * 1.1;
      }
      body.position.y = (ll - 1) * .25 + Math.abs(Math.sin(ph * 2)) * .012 * amp;
      for (let k = 0; k < 2; k++) { antn[k].rotation.y = Math.sin(tw * 3 + k * 2) * .15; antn[k].rotation.z = Math.sin(tw * 2.3 + k) * .12; }
      open += (openT - open) * Math.min(1, dt * 18);
      mand[0].rotation.y = -open; mand[1].rotation.y = open;
      gaster.rotation.x = -.3 + lift + Math.sin(tw * 1.5) * .03;
    },
  };
}
