// Vortex City · génération de la ville et des objets
'use strict';
// --- city layout
const blocks=[];seed=11;
for(let i=0;i<N;i++)for(let j=0;j<N;j++){const cx=-HALF+CELL*(i+.5),cz=-HALF+CELL*(j+.5),dc=Math.hypot(cx,cz)/HALF,k=rnd();blocks.push({cx,cz,type:k<.2?'park':(dc<.65&&k<.8)?'down':'res'})}
const S=2048,P=v=>(v+E)/(2*E)*S,U=S/(2*E);
const groundTex=canvasTex(S,S,(g)=>{
  g.fillStyle='#3d4456';g.fillRect(0,0,S,S);
  g.fillStyle='#f4f1ea';
  for(let k=0;k<=N;k++){const l=-HALF+k*CELL;
    for(let s=0;s<N;s++){const a=-HALF+s*CELL+4.5;for(let d=a;d<a+CELL-9;d+=4){g.fillRect(P(l)-.18*U,P(d),.36*U,2*U);g.fillRect(P(d),P(l)-.18*U,2*U,.36*U)}}
    for(let m=0;m<=N;m++){const q=-HALF+m*CELL;for(let t=-2.6;t<=2.4;t+=.9){g.fillRect(P(q+t),P(l+3.3),.5*U,1.4*U);g.fillRect(P(q+t),P(l-4.7),.5*U,1.4*U);g.fillRect(P(l+3.3),P(q+t),1.4*U,.5*U);g.fillRect(P(l-4.7),P(q+t),1.4*U,.5*U)}}}
  for(const b of blocks){const x=P(b.cx-12),z=P(b.cz-12),w=24*U;
    g.fillStyle='#b9b2a6';g.fillRect(x-.3*U,z-.3*U,w+.6*U,w+.6*U);g.fillStyle='#e9e4da';g.fillRect(x,z,w,w);
    if(b.type==='park'){g.fillStyle='#74c365';g.fillRect(x+U,z+U,w-2*U,w-2*U);g.fillStyle='#ead9aa';g.fillRect(P(b.cx-1),z+U,2*U,w-2*U);g.fillRect(x+U,P(b.cz-1),w-2*U,2*U);g.beginPath();g.arc(P(b.cx),P(b.cz),3.4*U,0,7);g.fill();g.fillStyle='#5bbcea';g.beginPath();g.ellipse(P(b.cx+6.5),P(b.cz-6.5),3*U,2*U,.6,0,7);g.fill()}
    else if(b.type==='res'){g.fillStyle='#9fd47f';g.fillRect(x+1.6*U,z+1.6*U,w-3.2*U,w-3.2*U);g.fillStyle='#e9e4da';g.fillRect(P(b.cx-.8),z+1.6*U,1.6*U,w-3.2*U)}
    else{g.strokeStyle='#d3cdc2';g.lineWidth=1;for(let t=1;t<24;t+=2){g.beginPath();g.moveTo(x+t*U,z);g.lineTo(x+t*U,z+w);g.moveTo(x,z+t*U);g.lineTo(x+w,z+t*U);g.stroke()}}}
});
groundTex.anisotropy=renderer.capabilities.getMaxAnisotropy();
const grass=new T.Mesh(G.plane,M('#6cbf62'));grass.scale.set(900,900,1);grass.rotation.x=-Math.PI/2;grass.position.y=-.02;grass.receiveShadow=true;scene.add(grass);
const city=new T.Mesh(G.plane,new T.MeshLambertMaterial({map:groundTex}));city.scale.set(2*E,2*E,1);city.rotation.x=-Math.PI/2;city.receiveShadow=true;scene.add(city);
seed=99;for(let n=0;n<90;n++){const a=rnd()*Math.PI*2,d=E+6+rnd()*40,x=Math.cos(a)*d*1.2,z=Math.sin(a)*d*1.2;if(Math.abs(x)<E+3&&Math.abs(z)<E+3)continue;const s=1+rnd()*1.4,t=new T.Mesh(G.ico,M(pick(['#2f9a4c','#3fb36d','#24813f'])));t.scale.set(1.6*s,2*s,1.6*s);t.position.set(x,2*s,z);t.castShadow=true;scene.add(t)}
const clouds=[];for(let n=0;n<9;n++){const g=new T.Group();for(let k=0;k<4;k++){const m=new T.Mesh(G.sph,M('#ffffff'));m.scale.set(6+rnd()*5,2.5+rnd()*1.5,5+rnd()*4);m.position.set(k*6-9,rnd()*2,rnd()*5-2.5);m.castShadow=true;g.add(m)}g.position.set(rnd()*400-200,95,rnd()*400-200);scene.add(g);clouds.push(g)}

// --- objects
const PAL=['#7ec8e3','#ffd166','#ef476f','#06d6a0','#f4a261','#a29bfe','#90e0ef','#ffadad','#caffbf'];
const SKIN=['#f2c9a0','#c68642','#8d5524','#ffdbac'];
let objs=[];
function part(g,geo,c,sx,sy,sz,x,y,z){const m=new T.Mesh(geo,M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
const LABEL={car:'Voiture',bus:'Bus !',house:'Maison !',building:'Immeuble !',tower:'TOUR !!',tree:'Arbre',fountain:'Fontaine',bench:'Banc'};
function add(type,x,z,rot,mv){
  const g=new T.Group();let r,ht,col;
  if(type==='cone'){col='#ff7a1a';part(g,G.cone,col,1,1,1,0,.3,0);part(g,G.box,'#fff',.36,.07,.36,0,.03,0);r=.3;ht=.6}
  else if(type==='person'){col=pick(PAL);part(g,G.cyl,col,.17,.55,.17,0,.28,0);part(g,G.sph,pick(SKIN),.15,.15,.15,0,.7,0);r=.3;ht=.9}
  else if(type==='bin'){col='#2a9d8f';part(g,G.cyl,col,.24,.6,.24,0,.3,0);part(g,G.cyl,'#1d6f65',.27,.08,.27,0,.62,0);r=.32;ht=.7}
  else if(type==='lamp'){col='#ffe066';part(g,G.cyl,'#39404f',.06,2.4,.06,0,1.2,0);part(g,G.sph,col,.2,.2,.2,0,2.45,0);r=.35;ht=2.6}
  else if(type==='bench'){col='#b5651d';part(g,G.box,col,1.2,.12,.42,0,.42,0);part(g,G.box,col,1.2,.35,.1,0,.65,-.18);part(g,G.box,'#444',1,.4,.3,0,.2,0);r=.6;ht=.8}
  else if(type==='tree'){const s=.8+rnd()*.4;col=pick(['#2d9a4b','#3cb371','#249046']);part(g,G.cyl,'#8b5a2b',.15,1,.15,0,.5,0);part(g,G.ico,col,.8*s,.95*s,.8*s,0,1.5,0);part(g,G.ico,col,.5*s,.6*s,.5*s,.3,2.2*s,.1);r=.85*s;ht=2.6}
  else if(type==='fountain'){col='#5bbcea';part(g,G.cyl,'#cfc8bb',1.5,.5,1.5,0,.25,0);part(g,G.cyl,col,1.3,.08,1.3,0,.5,0);part(g,G.cyl,'#cfc8bb',.25,1.2,.25,0,.8,0);part(g,G.sph,'#bfe9ff',.45,.3,.45,0,1.45,0);r=1.4;ht=1.6}
  else if(type==='car'){col=pick(PAL);part(g,G.box,col,1.8,.5,.9,0,.4,0);part(g,G.box,'#dfe9f5',1,.42,.82,-.1,.86,0);for(const s of[.55,-.55])part(g,G.cyl,'#222',.2,.95,.2,s,.2,0).rotation.x=Math.PI/2;part(g,G.box,'#fff6c2',.05,.14,.7,.91,.45,0);r=1;ht=1.1}
  else if(type==='bus'){col='#ffc300';part(g,G.box,col,4,1.4,1.3,0,.9,0);part(g,G.box,'#25303d',3.6,.42,1.34,0,1.2,0);for(const s of[1.3,-1.3])part(g,G.cyl,'#222',.3,1.36,.3,s,.3,0).rotation.x=Math.PI/2;r=2;ht=1.8}
  else if(type==='house'){col=pick(PAL);part(g,G.box,col,3.5,2.6,3.5,0,1.3,0);part(g,G.roof,pick(['#d1495b','#8c5e58','#3d5a80']),2.8,1.6,2.8,0,3.4,0).rotation.y=Math.PI/4;part(g,G.box,'#5c4033',.8,1.3,.1,0,.65,1.76);for(const s of[-1,1])part(g,G.box,'#cfe8ff',.7,.6,.08,s,1.6,1.76);part(g,G.box,'#9a8c7e',.4,1.2,.4,1,3.8,.6);r=2.6;ht=4.4}
  else if(type==='building'){const h=6+rnd()*9;col=pick(PAL);part(g,G.box,col,5,h,5,0,h/2,0);part(g,G.box,'#ffffff',5.1,1.2,5.1,0,.6,0);for(let y=2.2;y<h-1;y+=1.8)part(g,G.box,'#2b3a55',5.06,.6,4.2,0,y,0);part(g,G.box,'#9aa5b1',5.2,.3,5.2,0,h+.15,0);
    if(rnd()<.5){part(g,G.cyl,'#a0522d',.6,1.2,.6,1.2,h+1.1,1.2);part(g,G.roof,'#6b3a1e',.75,.6,.75,1.2,h+2,1.2)}else{part(g,G.box,'#d0d6dd',1.2,.7,1,-1,h+.6,-1);part(g,G.box,'#d0d6dd',.8,.5,.8,1.2,h+.5,.6)}r=3.6+h*.04;ht=h+2}
  else{const h=20+rnd()*12;col='#cfd8e3';part(g,G.box,col,7,h,7,0,h/2,0);for(let y=2;y<h-1;y+=2.2)part(g,G.box,'#3f72af',7.06,.9,6,0,y,0);part(g,G.box,'#aab7c4',5,2,5,0,h+1,0);part(g,G.cyl,'#e63946',.15,4,.15,0,h+4,0);r=5.6;ht=h+6}
  g.position.set(x,0,z);g.rotation.y=rot||0;scene.add(g);
  const o={g,x,z,r,ht,col,type,t:-1,h:null,dx:0,dz:0,ph:rnd()*6};
  if(mv){o.dx=mv[0];o.dz=mv[1]}
  objs.push(o);return o;
}
function street(type){
  const k=Math.floor(rnd()*(N+1)),l=-HALF+k*CELL,along=-HALF+rnd()*HALF*2,side=rnd()<.5?-1:1,v=rnd()<.5;
  let off,sp=0;
  if(type==='car'||type==='bus'){off=side*1.5;sp=(type==='bus'?3:3.5+rnd()*3)*side*(rnd()<.85?1:0)}
  else if(type==='person'){off=side*(3.4+rnd()*.8);sp=(.6+rnd()*.7)*(rnd()<.5?-1:1)}
  else if(type==='lamp'){off=side*3.5;sp=0}
  else{off=side*(2+rnd()*.8)}
  const x=v?l+off:along,z=v?along:l+off,mv=sp?(v?[0,sp]:[sp,0]):null;
  const rot=v?(sp>=0?-Math.PI/2:Math.PI/2):(sp>=0?0:Math.PI);
  return add(type,x,z,rot,mv);
}
let small0=0;
function buildCity(){
  for(const o of objs)scene.remove(o.g);objs=[];seed=7;
  for(const b of blocks){const{cx,cz,type}=b,R=a=>(rnd()*2-1)*a;
    if(type==='park'){add('fountain',cx,cz);for(let n=0;n<9;n++){let x=cx+R(10),z=cz+R(10);if(Math.abs(x-cx)<2||Math.abs(z-cz)<2)x+=4;add('tree',x,z)}for(let n=0;n<3;n++)add('bench',cx+R(7),cz+(n-1)*5,Math.PI/2);for(let n=0;n<4;n++)add('person',cx+R(10),cz+R(10),rnd()*6);add('bin',cx+2.5,cz+2.5)}
    else if(type==='res'){for(const[a,c]of[[-6,-6],[6,-6],[-6,6],[6,6]])add('house',cx+a,cz+c,Math.floor(rnd()*4)*Math.PI/2);for(let n=0;n<3;n++)add('tree',cx+R(10),cz+R(1));add('bin',cx+11,cz+R(10))}
    else{if(rnd()<.35){add('tower',cx,cz);add('tree',cx-9,cz-9);add('tree',cx+9,cz+9);add('bench',cx-9,cz+9)}else for(const[a,c]of[[-6,-6],[6,-6],[-6,6],[6,6]])add('building',cx+a,cz+c);add('bench',cx,cz+11)}
    add('lamp',cx-11.3,cz-11.3);add('lamp',cx+11.3,cz+11.3);
  }
  for(let n=0;n<240;n++){const k=rnd();street(k<.4?'car':k<.46?'bus':k<.62?'cone':k<.9?'person':'bin')}
  small0=objs.length;
}
