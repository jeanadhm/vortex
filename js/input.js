// Vortex City · souris, tactile, clavier
'use strict';
// --- input
let ptr=null,mouse=null;const keys={},KM={ArrowLeft:'l',KeyA:'l',KeyQ:'l',ArrowRight:'r',KeyD:'r',ArrowUp:'u',KeyW:'u',KeyZ:'u',ArrowDown:'d',KeyS:'d'};
const joy=$('joy'),knob=joy.firstElementChild;
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;ptr={ox:e.clientX,oy:e.clientY,x:e.clientX,y:e.clientY};joy.style.left=e.clientX+'px';joy.style.top=e.clientY+'px';knob.style.transform='';joy.hidden=state!=='play'});
addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){mouse={x:e.clientX,y:e.clientY};return}if(ptr){ptr.x=e.clientX;ptr.y=e.clientY;let dx=ptr.x-ptr.ox,dy=ptr.y-ptr.oy,d=Math.hypot(dx,dy);if(d>40){dx*=40/d;dy*=40/d}knob.style.transform=`translate(${dx}px,${dy}px)`}});
const up=()=>{ptr=null;joy.hidden=true};addEventListener('pointerup',up);addEventListener('pointercancel',up);
addEventListener('keydown',e=>{if(KM[e.code]){keys[KM[e.code]]=1;if(state==='play')e.preventDefault()}});
addEventListener('keyup',e=>{if(KM[e.code])keys[KM[e.code]]=0});
function readInput(){
  let ix=(keys.r||0)-(keys.l||0),iz=(keys.d||0)-(keys.u||0);
  if(ix||iz){const m=Math.hypot(ix,iz);return[ix/m,iz/m]}
  if(ptr){const dx=ptr.x-ptr.ox,dy=ptr.y-ptr.oy,d=Math.hypot(dx,dy);if(d<6)return[0,0];const m=Math.min(1,d/45);return[dx/d*m,dy/d*m]}
  if(mouse){const dx=mouse.x-innerWidth/2,dy=mouse.y-innerHeight/2,d=Math.hypot(dx,dy);if(d<24)return[0,0];const m=Math.min(1,(d-24)/150);return[dx/d*m,dy/d*m]}
  return[0,0];
}
