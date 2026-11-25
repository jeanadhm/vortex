// Vortex City · particules, combos, niveaux
'use strict';
// --- effects
const parts=[],pGeo=new T.BoxGeometry(.3,.3,.3);
for(let i=0;i<90;i++){const m=new T.Mesh(pGeo,new T.MeshLambertMaterial({color:'#fff'}));m.visible=false;scene.add(m);parts.push({m,life:0,v:new T.Vector3(),h:null})}
function burst(x,z,color,n,h){for(let i=0;i<n;i++){const p=parts.find(p=>p.life<=0);if(!p)return;p.m.material.color.set(color);p.m.position.set(x+(Math.random()-.5)*1.5,.5+Math.random(),z+(Math.random()-.5)*1.5);p.v.set((Math.random()-.5)*6,4+Math.random()*5,(Math.random()-.5)*6);p.life=1;p.h=h;p.m.visible=true}}
const flash=new T.Mesh(new T.RingGeometry(.9,1,64),new T.MeshBasicMaterial({color:'#fff',transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));flash.rotation.x=-Math.PI/2;flash.position.y=.3;flash.visible=false;scene.add(flash);let flashT=0;
let shake=0,combo=0,comboT=0;
function popText(s,x,z,big){v3.set(x,1,z).project(cam);const d=document.createElement('div');d.className='pop';d.textContent=s;d.style.left=((v3.x+1)/2*innerWidth)+'px';d.style.top=((1-v3.y)/2*innerHeight-40)+'px';if(big)d.style.fontSize='34px';document.body.appendChild(d);setTimeout(()=>d.remove(),900)}
function eat(h,o){
  o.t=0;o.h=h;h.R=Math.sqrt(h.R*h.R+o.r*o.r*.6);h.pulse=Math.min(1,h.pulse+.35+o.r*.15);
  if(Math.hypot(o.x-camT.x,o.z-camT.z)<70)burst(o.x,o.z,o.col,Math.min(12,2+Math.round(o.r*4)),h);
  if(!h.me)return;
  combo++;comboT=1.4;if(LABEL[o.type]&&o.r>=.6)popText(LABEL[o.type],h.x,h.z,o.r>=2);
  shake=Math.max(shake,Math.min(1,o.r*.2));
  const lv=levelOf(h.R);if(lv>h.lvl){h.lvl=lv;toast(`Niveau ${lv} : ${LV[lv-1][1]} sont à toi !`,true);flashT=1;shake=1}
}
