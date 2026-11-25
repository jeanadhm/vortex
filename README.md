# Vortex City

Jeu 3D jouable dans le navigateur : tu contrôles un vortex qui avale une ville low-poly, face à 9 adversaires, en parties de 2 minutes.

## Jouer
Ouvre `index.html` dans un navigateur. Il n'y a rien à installer : Three.js (r128) est chargé depuis un CDN.

Contrôles : souris, doigt (joystick virtuel) ou flèches/ZQSD/WASD.

## Structure du projet
```
index.html        page, menu, écran de fin, interface
css/style.css     styles
js/core.js        moteur 3D : rendu, scène, lumière, ombres, constantes
js/city.js        génération de la ville (sol, blocs, décor) et des objets à avaler
js/holes.js       vortex, bots et leur IA, niveaux
js/effects.js     particules, onde de choc, combos, texte qui saute
js/input.js       souris, tactile, clavier
js/ui.js          classement, minicarte, notifications, record
js/main.js        état de la partie (menu, jeu, fin) et boucle de jeu
```
Les scripts sont chargés dans cet ordre par `index.html` et partagent leurs variables globales.

## Versions
- **v1.1** : ombres en temps réel, vortex animés, circulation, 6 niveaux, combos, effets, minicarte, détails urbains
- **v1.0** : prototype jouable (ville procédurale, bots, classement, parties de 2 minutes)
