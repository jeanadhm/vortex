// Vortex City · moteur 3D, scène, lumière, constantes
'use strict';
const T=THREE,$=id=>document.getElementById(id);
const cv=$('c'),renderer=new T.WebGLRenderer({canvas:cv,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);return t}
scene.background=canvasTex(4,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3f9cff');gr.addColorStop(.55,'#9fd4ff');gr.addColorStop(1,'#ffd9b0');g.fillStyle=gr;g.fillRect(0,0,w,h)});
scene.fog=new T.Fog('#cfe3f5',90,230);
const cam=new T.PerspectiveCamera(55,1,.1,600);
scene.add(new T.HemisphereLight('#cfe8ff','#c99a72',.75));
const sun=new T.DirectionalLight('#ffe2b8',1.05);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0006;sun.shadow.normalBias=.02;
const sc=sun.shadow.camera;sc.near=1;sc.far=320;scene.add(sun,sun.target);
function resize(){renderer.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();

let seed=7;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
const pick=a=>a[Math.floor(rnd()*a.length)],clamp=(v,a,b)=>v<a?a:v>b?b:v;
const N=6,CELL=30,HALF=N*CELL/2,E=HALF+4,MATCH=120;
const mats={},M=c=>mats[c]||(mats[c]=new T.MeshLambertMaterial({color:c}));
const G={cone:new T.ConeGeometry(.22,.6,8),box:new T.BoxGeometry(1,1,1),cyl:new T.CylinderGeometry(1,1,1,12),ico:new T.IcosahedronGeometry(1,0),sph:new T.SphereGeometry(1,12,9),roof:new T.ConeGeometry(1,1,4),plane:new T.PlaneGeometry(1,1)};

// shared scratch vectors: camera target and projection helper
const v3=new T.Vector3(),camT=new T.Vector3(),camP=new T.Vector3(0,80,90);
