'use strict';
// Colonie Noire · chapitres : histoire, cartes, ennemis, scripts
const WHO = { reine: 'Reine Noire', nyx: 'Nyx, éclaireuse', ignis: 'Major Ignis', rouge: 'Reine Rouge' };
const LEVELS = [
  {
    id: 'prairie', chapter: 'Chapitre 1', name: 'La Prairie', type: 'surface', size: 170, seed: 3,
    story: [
      'À l\'aube, la colonie Rouge a franchi le Ruisseau-Sec. Ses soldates ont pillé notre nurserie et emporté trois cocons : la prochaine génération de la colonie Noire.',
      'La Reine t\'a choisie, Sergent Obsidienne. Traverse la prairie, trouve la fourmilière rouge et entre.',
    ],
    start: { x: 0, z: -72, yaw: Math.PI },
    mound: { x: 0, z: 60, r: 21, h: 9 }, exit: { x: 0, z: 60, r: 2.6 },
    clear: [[0, -72, 9], [0, 60, 6]],
    rocks: [[-15, 46, 5], [16, 48, 5.5], [-5, 26, 4], [22, 22, 6], [-26, -4, 7]],
    enemies: [
      ['scout', -15, -42], ['scout', 18, -36], ['scout', -24, -12], ['scout', 6, -16], ['scout', 26, 4], ['scout', -10, 14],
      ['soldier', -9, 36], ['soldier', 11, 38], ['soldier', 2, 44],
      ['spitter', -15, 46], ['spitter', 16, 48], ['spitter', -5, 26],
    ],
    pickups: [['heal', 4, -50], ['seed', -20, -25], ['heal', 20, -5], ['armor', -14, 8], ['seed', 10, 18], ['heal', -24, 34], ['heal', 26, 34]],
    objective: () => 'Atteins l\'entrée de la fourmilière rouge',
    target: L => L.exit,
    events: [
      { at: 1.5, say: ['reine', 'Sergent. Nos cocons sont entre leurs mandibules. Ramène-les-nous.'] },
      { at: 8, say: ['nyx', 'Ici Nyx, éclaireuse. La fourmilière rouge est au nord : suis la flèche en haut de l\'écran.'] },
      { at: 15, run: () => HUD.say(WHO.nyx, IN.touch ? 'Bouton Tir pour cracher l\'acide, Arme pour changer. Pousse le joystick à fond pour courir.' : 'Clic pour cracher l\'acide. 1, 2, 3 pour changer d\'arme. Maj pour courir, Espace pour sauter.') },
      { on: 'alert', say: ['nyx', 'Elles t\'ont repérée ! Vise la tête : l\'acide la ronge deux fois plus vite.'] },
      { on: 'kill', say: ['nyx', 'Belle frappe. Les cadavres laissent parfois du miellat : ça soigne.'] },
      { when: () => P.pos.z > 12, say: ['nyx', 'La butte rouge est droit devant. Des cracheuses guettent depuis les cailloux.'] },
      { when: () => P.pos.z > 40, say: ['reine', 'L\'entrée est au sommet de la butte. Saute dans le trou.'] },
      { when: L => Math.hypot(P.pos.x - L.exit.x, P.pos.z - L.exit.z) < L.exit.r, run: () => G.complete() },
    ],
  },
  {
    id: 'galeries', chapter: 'Chapitre 2', name: 'Les Galeries', type: 'cave', size: 130, seed: 8,
    story: [
      'Sous la butte, la colonie Rouge a creusé un labyrinthe. Il fait noir, l\'air sent l\'acide et la terre humide.',
      'Nos trois cocons sont cachés dans ces chambres. Retrouve-les tous, puis trouve le passage vers la chambre royale.',
    ],
    start: { x: 0, z: -54, yaw: Math.PI },
    shapes: [
      { x: 0, z: -52, r: 8, h: 7 }, { x: 0, z: -8, r: 7, h: 7 }, { x: -38, z: -24, r: 10, h: 8 }, { x: 36, z: -20, r: 10, h: 8 },
      { x: -30, z: 30, r: 12, h: 10 }, { x: 30, z: 32, r: 9, h: 13 }, { x: 0, z: 52, r: 7, h: 7 },
      { a: [0, -52], b: [-4, -30], r: 2.7, h: 4.6 }, { a: [-4, -30], b: [0, -8], r: 2.7, h: 4.6 },
      { a: [0, -52], b: [-20, -44], r: 2.6, h: 4.4 }, { a: [-20, -44], b: [-38, -24], r: 2.6, h: 4.4 },
      { a: [0, -52], b: [20, -42], r: 2.6, h: 4.4 }, { a: [20, -42], b: [36, -20], r: 2.6, h: 4.4 },
      { a: [0, -8], b: [-38, -24], r: 2.5, h: 4.2 }, { a: [0, -8], b: [36, -20], r: 2.5, h: 4.2 },
      { a: [-38, -24], b: [-44, 4], r: 2.6, h: 4.4 }, { a: [-44, 4], b: [-30, 30], r: 2.6, h: 4.4 },
      { a: [36, -20], b: [44, 6], r: 2.6, h: 4.4 }, { a: [44, 6], b: [30, 32], r: 2.6, h: 4.4 },
      { a: [0, -8], b: [-14, 14], r: 2.6, h: 4.4 }, { a: [-14, 14], b: [-30, 30], r: 2.6, h: 4.4 },
      { a: [-30, 30], b: [-16, 48], r: 2.6, h: 4.4 }, { a: [-16, 48], b: [0, 52], r: 2.6, h: 4.4 },
      { a: [30, 32], b: [16, 48], r: 2.6, h: 4.4 }, { a: [16, 48], b: [0, 52], r: 2.6, h: 4.4 },
    ],
    fungus: [
      { x: 0, z: -8, n: 14, color: '#6dffd6', light: true }, { x: -34, z: 26, n: 22, r: 7, color: '#7dff8a', light: true },
      { x: -24, z: 36, n: 16, r: 5, color: '#6dffd6', light: true }, { x: 30, z: 32, n: 14, r: 5, color: '#7fc8ff', light: true },
      { x: 36, z: -20, n: 10, color: '#ffd37a', light: true }, { x: -38, z: -24, n: 10, color: '#c8ff6a', light: true },
      { x: 0, z: 52, n: 10, color: '#ff6a4a' }, { x: 0, z: -50, n: 8, color: '#6dffd6' },
      { x: -4, z: -30, n: 5, r: 1.5 }, { x: 20, z: -42, n: 5, r: 1.5, color: '#ffd37a' }, { x: -44, z: 4, n: 6, r: 1.5, color: '#c8ff6a' },
      { x: 44, z: 6, n: 6, r: 1.5, color: '#7fc8ff' }, { x: -14, z: 14, n: 5, r: 1.5 }, { x: 16, z: 48, n: 5, r: 1.5, color: '#ff6a4a' },
    ],
    seeds: [{ x: -38, z: -24, n: 40, r: 8 }], nursery: [{ x: 36, z: -20, n: 26, r: 7 }],
    enemies: [
      ['scout', -3, -10], ['scout', 4, -6], ['scout', 0, -30],
      ['soldier', -36, -20], ['soldier', -42, -27], ['scout', -30, -30],
      ['soldier', 34, -16], ['spitter', 40, -24], ['scout', 30, -26],
      ['spitter', -28, 26], ['spitter', -36, 34], ['soldier', -24, 30],
      ['spitter', 30, 36], ['soldier', 26, 28], ['soldier', 34, 30],
      ['soldier', -3, 52], ['soldier', 3, 54],
    ],
    pickups: [['heal', 3, -45], ['seed', -4, -12], ['heal', -40, -18], ['seed', -34, -30], ['armor', 38, -14], ['heal', -44, 4], ['heal', 44, 6], ['seed', -30, 34], ['heal', 28, 26], ['armor', -14, 14]],
    cocoons: [[-41, -27], [38, -17], [-33, 33]],
    exit: { x: 0, z: 55, r: 3 },
    objective: G => G.cocoons < 3 ? `Retrouve les cocons volés (${G.cocoons}/3)` : 'Rejoins le passage vers la chambre royale',
    target: (L, G) => {
      if (G.cocoons >= 3) return L.exit;
      let b = null, bd = 1e9; for (const p of PK.list) if (p.type === 'cocoon') { const d = Math.hypot(p.x - P.pos.x, p.z - P.pos.z); if (d < bd) { bd = d; b = p; } }
      return b;
    },
    events: [
      { at: 1, say: ['nyx', 'Tu es dans leurs galeries. Ta glande lumineuse éclaire un peu autour de toi.'] },
      { at: 7, say: ['reine', 'Je sens l\'odeur de nos cocons. Ils sont trois, dans trois chambres différentes.'] },
      { on: 'cocoon', when: (L, G) => G.cocoons === 1, say: ['nyx', 'Un cocon ! Je le ramène à la colonie. Plus que deux.'] },
      { on: 'cocoon', when: (L, G) => G.cocoons === 2, run: () => { HUD.say(WHO.nyx, 'Attention, elles arrivent par les tunnels !'); for (const [x, z] of [[-4, -30], [-2, -32], [-14, 14], [-12, 12]]) EN.alert(EN.spawn('scout', x, z)); } },
      { on: 'cocoon', when: (L, G) => G.cocoons === 3, say: ['reine', 'Les trois cocons sont saufs. Maintenant, la chambre royale : le Major Ignis t\'attend.'] },
      { when: (L, G) => Math.hypot(P.pos.x - L.exit.x, P.pos.z - L.exit.z) < L.exit.r && G.cocoons < 3, repeat: 6, run: () => HUD.notice('Il manque encore des cocons') },
      { when: (L, G) => Math.hypot(P.pos.x - L.exit.x, P.pos.z - L.exit.z) < L.exit.r && G.cocoons >= 3, run: () => G.complete() },
    ],
  },
  {
    id: 'royale', chapter: 'Chapitre 3', name: 'La Chambre royale', type: 'cave', size: 100, seed: 21,
    story: [
      'Nyx ramène les cocons à la maison. Mais tant que le Major Ignis protège la Reine Rouge, les raids recommenceront.',
      'Descends dans la chambre royale. Mets fin à cette guerre.',
    ],
    start: { x: 0, z: -40, yaw: Math.PI },
    shapes: [
      { x: 0, z: -40, r: 6, h: 6 }, { a: [0, -40], b: [3, -27], r: 2.9, h: 5 }, { a: [3, -27], b: [0, -14], r: 2.9, h: 5 },
      { x: 0, z: 8, r: 24, h: 16 },
    ],
    pillars: [{ x: -12, z: -2, r: 3 }, { x: 12, z: -2, r: 3 }, { x: -15, z: 17, r: 3.2 }, { x: 15, z: 17, r: 3.2 }],
    fungus: [
      { x: -16, z: 6, n: 16, r: 4, color: '#ff7a3a', light: true }, { x: 16, z: 6, n: 16, r: 4, color: '#ff7a3a', light: true },
      { x: 0, z: 26, n: 20, r: 6, color: '#ffb05a', light: true }, { x: 0, z: -8, n: 10, r: 4, color: '#ff5a3a', light: true },
      { x: 0, z: -40, n: 8, color: '#6dffd6', light: true }, { x: 3, z: -27, n: 5, r: 1.5, color: '#ff7a3a' },
    ],
    roots: 90,
    enemies: [['scout', 2, -30], ['scout', -1, -24]],
    pickups: [['heal', 2, -38], ['seed', -2, -36], ['seed', 1, -20], ['heal', -18, -4], ['heal', 18, -4], ['armor', 0, -10], ['seed', -20, 14], ['seed', 20, 14]],
    objective: G => G.boss ? (G.boss.dead ? 'La chambre est à toi' : 'Abats le Major Ignis') : 'Entre dans la chambre royale',
    target: (L, G) => G.boss ? (G.boss.dead ? null : G.boss.pos) : { x: 0, z: 4 },
    setup: (L, G) => {
      const q = buildAnt({ body: '#7d1a0c', gaster: '#3a0c06', head: 1.1 });
      q.root.scale.setScalar(4.2); q.gaster.scale.set(1.7, 1.5, 2); q.root.position.set(0, world.floorAt(0, 28), 28); q.root.rotation.y = Math.PI;
      world.group.add(q.root); G.queen = q;
    },
    tick: (dt, G) => { if (G.queen) G.queen.anim(dt, 0); },
    events: [
      { at: 1, say: ['nyx', 'La chambre royale est au bout de ce tunnel. Je n\'ai jamais vu une soldate aussi grosse qu\'Ignis.'] },
      { when: () => P.pos.z > -12, run: G => {
        G.boss = EN.spawn('boss', 0, 12); EN.alert(G.boss); HUD.boss(ETYPES.boss.name, 1); SFX.roar(); FX.shake = 1;
        HUD.say(WHO.ignis, 'Une Noire, ici ? Tu vas nourrir notre couvain.'); HUD.say(WHO.nyx, 'Elle charge en ligne droite : écarte-toi au dernier moment et fais-la percuter un pilier !');
      } },
      { on: 'bossStun', say: ['nyx', 'Elle est sonnée ! Frappe maintenant, elle prend plus de dégâts.'] },
      { on: 'boss60', run: () => { HUD.say(WHO.ignis, 'À moi, mes sœurs !'); for (const [t, x, z] of [['scout', -20, 0], ['scout', 20, 0], ['soldier', -18, 20], ['scout', 18, 20]]) EN.alert(EN.spawn(t, x, z)); } },
      { on: 'boss30', run: () => { HUD.say(WHO.nyx, 'Elle faiblit ! Encore un effort, Sergent !'); for (const [t, x, z] of [['spitter', -20, 12], ['spitter', 20, 12], ['soldier', 0, -6]]) EN.alert(EN.spawn(t, x, z)); } },
      { on: 'kill', when: (L, G, e) => e && e.d.boss, run: G => { HUD.boss(null, null); HUD.say(WHO.rouge, 'Assez ! Mes soldates se retirent. Le Ruisseau-Sec sera votre frontière.'); setTimeout(() => G.complete(), 5200); } },
    ],
  },
];
const EPILOGUE = [
  'Le Major Ignis est tombé. Privée de sa championne, la Reine Rouge a rappelé ses soldates derrière le Ruisseau-Sec.',
  'Dans la nurserie noire, trois cocons s\'ouvrent. La colonie vivra.',
];
