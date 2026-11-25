# Colonie Noire

FPS 3D jouable dans le navigateur : une soldate fourmi noire affronte la colonie rouge pour reprendre trois cocons volés.

## Jouer
Ouvre `colonie-noire/index.html` dans un navigateur (ou via GitHub Pages : `/vortex/colonie-noire/`). Three.js (r128) est chargé depuis un CDN.

Contrôles : ZQSD / WASD pour bouger, souris pour viser, clic pour attaquer, 1 · 2 · 3 ou molette pour changer d'arme, Maj pour courir, Espace pour sauter, Échap pour la pause. Version tactile sur mobile.

## Contenu (v0.1)
- 3 chapitres : La Prairie (surface), Les Galeries (terriers, 3 cocons à retrouver), La Chambre royale (boss Major Ignis)
- 3 armes : mandibules, acide formique, graine explosive
- 4 ennemis : éclaireuse, soldate, cracheuse, boss
- Fourmis anatomiques animées, ombres en temps réel, sons synthétisés, dialogues et récit

## Structure
```
index.html        page, interface, écrans
css/style.css     styles
js/util.js        maths, bruit, textures procédurales
js/audio.js       sons (Web Audio)
js/ant.js         modèle de fourmi et animation
js/world.js       terrain, galeries, décor, collisions, navigation
js/fx.js          particules, projectiles, explosions
js/enemies.js     IA des fourmis rouges et du boss
js/player.js      joueuse, armes, vue à la première personne, objets
js/hud.js         interface et commandes
js/levels.js      chapitres, histoire, scripts
js/main.js        rendu, états du jeu, boucle principale
```
