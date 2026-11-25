// Vortex City · état de la partie, boucle de jeu
'use strict';
// --- game state
let state='menu',timeLeft=MATCH,result=null;
function start(){
  me.name=($('name').value.trim()||'Toi').slice(0,12);
  try{localStorage.setItem('vc-name',me.name)}catch(e){}
  buildCity();holes=[me,...bots];for(const h of holes){h.dead=0;spawnHole(h)}
  Object.assign(me,{x:0,z:HALF/3,vis:1});combo=0;
  timeLeft=MATCH;state='play';$('menu').hidden=true;$('end').hidden=true;$('top').hidden=false;board();
}
function finish(){
  state='end';const r=ranked(),rank=r.indexOf(me)+1,size=me.R;result={rank,size};
  if(size>best){best=size;try{localStorage.setItem('vc-best',String(best))}catch(e){}showBest()}
  $('rank').textContent='#'+rank;
  $('res').textContent=rank===1?`Victoire ! Tu termines à ${fmt(size)}, niveau ${me.lvl}. Le plus gros trou de Vortex City.`:`Tu termines à ${fmt(size)}, niveau ${me.lvl}. ${r[0].name} gagne avec ${fmt(r[0].R)}.`;
  $('copied').textContent='';$('end').hidden=false;$('top').hidden=true;joy.hidden=true;
}
$('play').onclick=start;$('again').onclick=start;
$('name').addEventListener('keydown',e=>{if(e.key==='Enter')start()});
$('share').onclick=()=>{const s=`🌀 J'ai fini #${result.rank} sur Vortex City avec un trou de ${fmt(result.size)}. Tu fais mieux ?`;
  const ok=()=>$('copied').textContent='Copié !',ko=()=>$('copied').textContent=s;
  try{navigator.clipboard.writeText(s).then(ok,ko)}catch(e){ko()}};


// --- loop
let respawnT=0,boardT=0,miniT=0,ang=.6,shadowS=0,time=0;
function step(dt){
  time+=dt;
  if(state==='play'){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;finish()}
    const s=Math.ceil(timeLeft);$('time').textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;$('time').classList.toggle('low',s<=15)}
  if(state==='play'&&me.dead<=0){[me.ix,me.iz]=readInput()}
  for(const o of objs){if(o.t>=0||!(o.dx||o.dz))continue;o.x+=o.dx*dt;o.z+=o.dz*dt;if(o.x>E)o.x-=2*E;else if(o.x<-E)o.x+=2*E;if(o.z>E)o.z-=2*E;else if(o.z<-E)o.z+=2*E;o.g.position.x=o.x;o.g.position.z=o.z;if(o.type==='person')o.g.position.y=Math.abs(Math.sin(time*8+o.ph))*.08}
  for(const h of holes){
    if(h.dead>0){h.dead-=dt;if(h.dead<=0)spawnHole(h);continue}
    if(!h.me){h.ai-=dt;if(h.ai<=0){h.ai=.25+Math.random()*.2;think(h)}const dx=h.tx-h.x,dz=h.tz-h.z,d=Math.hypot(dx,dz);h.ix=d>.6?dx/d*h.skill:0;h.iz=d>.6?dz/d*h.skill:0;h.lvl=levelOf(h.R)}
    else if(state!=='play'){h.ix=h.iz=0}
    const sp=5.5+h.R*.7,k=Math.min(1,dt*7);h.vx+=(h.ix*sp-h.vx)*k;h.vz+=(h.iz*sp-h.vz)*k;
    h.x=clamp(h.x+h.vx*dt,-HALF,HALF);h.z=clamp(h.z+h.vz*dt,-HALF,HALF);
    h.vis+=(h.R-h.vis)*Math.min(1,dt*5);h.pulse=Math.max(0,h.pulse-dt*2.5);
    h.g.position.x=h.x;h.g.position.z=h.z;h.g.scale.set(h.vis,1,h.vis);
    h.spiral.rotation.z+=dt*(1.6+h.lvl*.45);const pr=1+h.pulse*.14;h.ring.scale.set(pr,pr,1);
    h.glow.material.opacity=Math.min(1,.3+h.lvl*.1+h.pulse*.5+Math.sin(time*4)*.06);h.spiral.material.opacity=.28+h.lvl*.05;
    const R2=h.R*h.R*.92;
    for(const o of objs){if(o.t>=0||o.r>=h.R*.9)continue;const dx=o.x-h.x,dz=o.z-h.z;if(dx*dx+dz*dz<R2)eat(h,o)}
  }
  for(const a of holes)for(const b of holes){if(a===b||a.dead>0||b.dead>0||a.R<=b.R*1.2)continue;if(Math.hypot(a.x-b.x,a.z-b.z)<a.R-b.R*.3){a.R=Math.sqrt(a.R*a.R+b.R*b.R*.5);kill(b,a)}}
  let gone=0;
  for(const o of objs){if(o.t<0)continue;o.t+=dt*1.8;const p=o.g.position,k=Math.min(1,dt*6);p.x+=(o.h.x-p.x)*k;p.z+=(o.h.z-p.z)*k;p.y=-o.t*o.t*(1+o.ht);o.g.rotation.z=o.t*.9;o.g.rotation.y+=dt*4;if(o.t>1){scene.remove(o.g);o.gone=1;gone++}}
  if(gone)objs=objs.filter(o=>!o.gone);
  for(const p of parts){if(p.life<=0)continue;p.life-=dt*1.3;const h=p.h,m=p.m;p.v.x+=(h.x-m.position.x)*dt*6;p.v.z+=(h.z-m.position.z)*dt*6;p.v.y-=14*dt;m.position.addScaledVector(p.v,dt);m.rotation.x+=dt*6;m.rotation.y+=dt*5;const s=Math.max(.01,p.life);m.scale.set(s,s,s);if(p.life<=0||m.position.y<-1){p.life=0;m.visible=false}}
  if(flashT>0){flashT-=dt*1.4;flash.visible=flashT>0;const s=me.vis*(1+(1-flashT)*2.5);flash.scale.set(s,s,1);flash.position.x=me.x;flash.position.z=me.z;flash.material.opacity=Math.max(0,flashT);flash.material.color.set('#ffd60a')}
  for(const c of clouds){c.position.x+=dt*2.5;if(c.position.x>220)c.position.x=-220}
  respawnT-=dt;if(respawnT<=0){respawnT=.35;if(objs.length<small0*.8){seed=(seed+Math.floor(Math.random()*9999))%2147483646+1;for(let n=0;n<3;n++){const k=rnd(),o=street(k<.4?'car':k<.75?'person':'cone');if(state==='play'&&Math.hypot(o.x-me.x,o.z-me.z)<12){scene.remove(o.g);objs.pop()}}}}
  boardT-=dt;if(boardT<=0){boardT=.25;board()}
  miniT-=dt;if(miniT<=0&&state==='play'){miniT=.1;drawMini()}
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on')}
  const cb=$('combo');if(comboT>0){comboT-=dt;if(combo>=3){const txt=`Combo x${combo}`;if(cb.textContent!==txt){cb.textContent=txt;cb.classList.add('bump');setTimeout(()=>cb.classList.remove('bump'),120)}cb.hidden=false}if(comboT<=0){combo=0;cb.hidden=true}}
  // camera + shadows
  let ss;
  if(state==='play'){const f=me,H=12+f.vis*5.5,D=9+f.vis*4.5;camT.set(f.x,0,f.z);camP.lerp(v3.set(f.x,H,f.z+D),Math.min(1,dt*4));ss=Math.round(28+f.vis*6)}
  else{ang+=dt*.07;camT.set(0,0,0);camP.lerp(v3.set(Math.sin(ang)*100,62,Math.cos(ang)*100),Math.min(1,dt*1.5));ss=125}
  shake=Math.max(0,shake-dt*2.5);
  cam.position.copy(camP);if(shake>0){const a=shake*shake*.5;cam.position.x+=(Math.random()-.5)*a;cam.position.y+=(Math.random()-.5)*a;cam.position.z+=(Math.random()-.5)*a}
  cam.lookAt(camT);
  sun.position.set(camT.x+50,110,camT.z+35);sun.target.position.copy(camT);sun.target.updateMatrixWorld();
  if(ss!==shadowS){shadowS=ss;sc.left=sc.bottom=-ss;sc.right=sc.top=ss;sc.updateProjectionMatrix()}
}
function tags(){
  const w=innerWidth,hh=innerHeight;
  for(const h of holes){if(h.dead>0){h.tag.hidden=true;continue}v3.set(h.x,.5,h.z+h.vis*.9).project(cam);
    if(v3.z>1||Math.abs(v3.x)>1.1||Math.abs(v3.y)>1.1){h.tag.hidden=true;continue}
    h.tag.hidden=false;h.tag.style.transform=`translate(${(v3.x+1)/2*w}px,${(1-v3.y)/2*hh}px) translate(-50%,0)`}
}
buildCity();for(const h of bots)spawnHole(h);
for(let i=0;i<240;i++)step(1/30);
let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);tags();renderer.render(scene,cam);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
