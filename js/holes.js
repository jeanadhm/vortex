// Vortex City · vortex, bots et IA
'use strict';
// --- holes
const spiralTex=canvasTex(256,256,(g,s)=>{g.translate(s/2,s/2);g.lineCap='round';for(let a=0;a<5;a++){g.rotate(Math.PI*2/5);let px=0,py=0;for(let i=1;i<=50;i++){const t=i/50,r=t*s/2*.98,an=t*3.4,x=Math.cos(an)*r,y=Math.sin(an)*r;g.strokeStyle=`rgba(255,255,255,${.15+t*.75})`;g.lineWidth=1+t*14;g.beginPath();g.moveTo(px,py);g.lineTo(x,y);g.stroke();px=x;py=y}}});
const depthTex=canvasTex(128,128,(g,s)=>{const gr=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);gr.addColorStop(0,'#000');gr.addColorStop(.6,'#05060c');gr.addColorStop(1,'#272b40');g.fillStyle=gr;g.fillRect(0,0,s,s)});
const glowTex=canvasTex(128,128,(g,s)=>{const gr=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.6,'rgba(255,255,255,0)');gr.addColorStop(.7,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,s,s)});
const discGeo=new T.CircleGeometry(1,48),ringGeo=new T.RingGeometry(1,1.12,48);
const off=u=>({polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:u});
const LV=[[0,''],[1.12,'les voitures'],[2.23,'les bus'],[2.9,'les maisons'],[4.3,'les immeubles'],[6.23,'les tours']];
const levelOf=R=>LV.filter(l=>R>=l[0]).length;
const BOTS=[['Nova','#2f80ff'],['Kiko','#ffb703'],['Zed','#9d4edd'],['Lumi','#06d6a0'],['Rex','#fb5607'],['Mila','#00b4d8'],['Taz','#9ef01a'],['Orbi','#ff70a6'],['Yuki','#f1f1f1']];
function mkHole(name,color,me){
  const g=new T.Group();
  const flat=(geo,mat,y,ro)=>{const m=new T.Mesh(geo,mat);m.rotation.x=-Math.PI/2;m.position.y=y;m.renderOrder=ro;g.add(m);return m};
  flat(discGeo,new T.MeshBasicMaterial({map:depthTex,...off(-4)}),0,1);
  const spiral=flat(discGeo,new T.MeshBasicMaterial({map:spiralTex,color,transparent:true,opacity:.35,depthWrite:false,...off(-6)}),.004,2);
  const ring=flat(ringGeo,new T.MeshBasicMaterial({color,...off(-8)}),.008,3);
  const glow=flat(discGeo,new T.MeshBasicMaterial({map:glowTex,color,transparent:true,opacity:.5,depthWrite:false,blending:T.AdditiveBlending,...off(-10)}),.012,4);glow.scale.set(1.6,1.6,1);
  g.position.y=.06;scene.add(g);
  const tag=document.createElement('div');tag.className='tag'+(me?' me':'');tag.textContent=name;document.body.appendChild(tag);
  return{g,spiral,ring,glow,tag,name,color,me,x:0,z:0,R:1,vis:1,vx:0,vz:0,ix:0,iz:0,tx:0,tz:0,ai:0,dead:0,pulse:0,lvl:1,skill:.82+Math.random()*.15,agg:.4+Math.random()*.5};
}
const bots=BOTS.map(([n,c])=>mkHole(n,c,false));
const me=mkHole('Toi','#ff3d7f',true);me.g.visible=false;me.tag.hidden=true;
let holes=[...bots];
function spawnHole(h){
  let bx=0,bz=0;
  for(let a=0;a<25;a++){bx=(Math.random()*2-1)*(HALF-5);bz=(Math.random()*2-1)*(HALF-5);if(holes.every(o=>o===h||o.dead>0||Math.hypot(o.x-bx,o.z-bz)>14+o.R*2))break}
  Object.assign(h,{x:bx,z:bz,R:1,vis:.2,vx:0,vz:0,dead:0,tx:bx,tz:bz,lvl:1});h.g.visible=true;h.tag.hidden=false;
}
function kill(b,a){b.dead=b.me?2:1.5;b.g.visible=false;b.tag.hidden=true;a.pulse=1;
  if(b.me){toast(`Avalé par ${a.name} !`);me.lvl=1;combo=0}else if(a.me){toast(`Tu as avalé ${b.name} !`);shake=1;burst(b.x,b.z,b.color,14,a)}}
function think(b){
  let prey=null,pd=1e9;
  for(const h of holes){if(h===b||h.dead>0)continue;const d=Math.hypot(h.x-b.x,h.z-b.z);
    if(h.R>b.R*1.2&&d<h.R+10){b.tx=b.x+(b.x-h.x)*2;b.tz=b.z+(b.z-h.z)*2;return}
    if(b.R>h.R*1.25&&d<18+b.R*2&&d<pd){pd=d;prey=h}}
  if(prey&&Math.random()<b.agg){b.tx=prey.x;b.tz=prey.z;return}
  let bs=-1;
  for(let i=0;i<70;i++){const o=objs[Math.floor(Math.random()*objs.length)];if(!o||o.t>=0||o.r>=b.R*.9)continue;const d=Math.hypot(o.x-b.x,o.z-b.z),s=o.r*o.r/(d+4);if(s>bs){bs=s;b.tx=o.x;b.tz=o.z}}
  if(bs<0){b.tx=(Math.random()*2-1)*HALF;b.tz=(Math.random()*2-1)*HALF}
}
