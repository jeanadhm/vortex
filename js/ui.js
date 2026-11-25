// Vortex City · interface, classement, minicarte
'use strict';
// --- ui
const fmt=v=>(v*2).toFixed(1).replace('.',',')+' m';
let toastT=0;function toast(s,lv){const t=$('toast');t.textContent=s;t.classList.toggle('lv',!!lv);t.classList.add('on');toastT=2.4}
function ranked(){return holes.slice().sort((a,b)=>b.R-a.R)}
function board(){
  const r=ranked(),i=r.indexOf(me),rows=r.slice(0,5).map((h,k)=>[h,k]);if(i>4)rows.push([me,i]);
  $('list').innerHTML=rows.map(([h,k])=>`<li class="${h.me?'me':''}"><span class="r">${k+1}</span><span class="dot" style="background:${h.color}"></span><span class="n"></span><span class="v">${fmt(h.R)}</span></li>`).join('');
  [...$('list').querySelectorAll('.n')].forEach((el,k)=>el.textContent=(k===0?'♛ ':'')+rows[k][0].name);
  for(const h of holes)h.tag.textContent=(h===r[0]?'♛ ':'')+h.name;
  if(state==='play'){$('size').innerHTML=`${fmt(me.R)}<small>#${i+1} sur ${holes.length}</small>`;$('lvl').textContent=`Niveau ${me.lvl}`}
}
const mini=$('mini'),mg=mini.getContext('2d'),mbg=document.createElement('canvas');mbg.width=mbg.height=240;
{const g=mbg.getContext('2d'),q=v=>(v+E)/(2*E)*240;g.fillStyle='#3d4456';g.fillRect(0,0,240,240);for(const b of blocks){g.fillStyle=b.type==='park'?'#74c365':b.type==='res'?'#9fd47f':'#d9d4cc';g.fillRect(q(b.cx-12),q(b.cz-12),24/(2*E)*240,24/(2*E)*240)}}
function drawMini(){const q=v=>(v+E)/(2*E)*240;mg.drawImage(mbg,0,0);for(const h of holes){if(h.dead>0)continue;const r=Math.max(4,h.vis/(2*E)*240*1.4);mg.beginPath();mg.arc(q(h.x),q(h.z),r,0,7);mg.fillStyle='#0b0c12';mg.fill();mg.lineWidth=h.me?5:3;mg.strokeStyle=h.color;mg.stroke()}}
let best=0;try{best=+localStorage.getItem('vc-best')||0;const n=localStorage.getItem('vc-name');if(n)$('name').value=n}catch(e){}
const showBest=()=>{$('best').textContent=best?`Ton record : ${fmt(best)}`:''};showBest();
