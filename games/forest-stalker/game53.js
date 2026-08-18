import * as THREE from 'three';

const $=s=>document.querySelector(s);
const canvas=$('#g');
const R=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
R.setPixelRatio(Math.min(devicePixelRatio,1.55));R.setSize(innerWidth,innerHeight,false);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.03;
const S=new THREE.Scene();S.background=new THREE.Color(0x8fa08e);S.fog=new THREE.FogExp2(0x718071,.0145);
const C=new THREE.PerspectiveCamera(17.5,innerWidth/innerHeight,.08,240);C.position.set(0,1.72,0);C.rotation.order='YXZ';S.add(C);
S.add(new THREE.HemisphereLight(0xdce7d8,0x253022,1.35));
const sun=new THREE.DirectionalLight(0xffe7bd,2.1);sun.position.set(-30,45,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);S.add(sun);
const ty=(x,z)=>Math.sin(x*.09)*.24+Math.cos(z*.075)*.22+Math.sin((x+z)*.035)*.18;
const gg=new THREE.PlaneGeometry(180,180,70,70);gg.rotateX(-Math.PI/2);for(let i=0;i<gg.attributes.position.count;i++){const x=gg.attributes.position.getX(i),z=gg.attributes.position.getZ(i);gg.attributes.position.setY(i,ty(x,z))}gg.computeVertexNormals();const ground=new THREE.Mesh(gg,new THREE.MeshStandardMaterial({color:0x354a30,roughness:1}));ground.receiveShadow=true;S.add(ground);
let seed=98731;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),dum=new THREE.Object3D();
const trunkG=new THREE.CylinderGeometry(.14,.28,3.8,7),trunkM=new THREE.MeshStandardMaterial({color:0x4b3927}),crownG=new THREE.ConeGeometry(1.25,4.3,8),crownM=new THREE.MeshStandardMaterial({color:0x29452d}),trees=new THREE.InstancedMesh(trunkG,trunkM,210),crowns=new THREE.InstancedMesh(crownG,crownM,210);trees.castShadow=crowns.castShadow=true;
for(let i=0;i<210;i++){const a=rnd()*Math.PI*2,r=10+rnd()*72,x=Math.cos(a)*r,z=Math.sin(a)*r,s=.62+rnd()*1.22,y=ty(x,z);dum.position.set(x,y+1.9*s,z);dum.scale.setScalar(s);dum.rotation.y=rnd()*6.28;dum.updateMatrix();trees.setMatrixAt(i,dum.matrix);dum.position.set(x,y+4.05*s,z);dum.scale.setScalar(s*(.88+rnd()*.22));dum.updateMatrix();crowns.setMatrixAt(i,dum.matrix)}S.add(trees,crowns);
const shrubG=new THREE.IcosahedronGeometry(.45,1),shrubM=new THREE.MeshStandardMaterial({color:0x45613c}),shrubs=new THREE.InstancedMesh(shrubG,shrubM,120);for(let i=0;i<120;i++){const a=rnd()*Math.PI*2,r=8+rnd()*70,x=Math.cos(a)*r,z=Math.sin(a)*r,s=.4+rnd()*.9;dum.position.set(x,ty(x,z)+.18,z);dum.scale.set(s*1.4,s*.65,s);dum.rotation.y=rnd()*6.28;dum.updateMatrix();shrubs.setMatrixAt(i,dum.matrix)}S.add(shrubs);

const SNIPERS=[
{id:0,name:'RANGER .308',price:0,damage:42,mag:5,delay:.72,sway:1,scope:6,desc:'Balanced starter rifle'},
{id:1,name:'HUNTER X',price:600,damage:55,mag:5,delay:.62,sway:.86,scope:7,desc:'Higher damage'},
{id:2,name:'VANGUARD',price:1400,damage:48,mag:7,delay:.48,sway:.82,scope:6,desc:'Fast follow-up shots'},
{id:3,name:'SILVER FOX',price:2600,damage:68,mag:5,delay:.78,sway:.56,scope:8,desc:'Very stable & powerful'},
{id:4,name:'TITAN .50',price:5200,damage:100,mag:3,delay:1.05,sway:.72,scope:10,desc:'One-shot body potential'}];
let save={coins:0,owned:[0],equipped:0,kills:0,bag:0};try{save={...save,...(JSON.parse(localStorage.getItem('forestStalkerV5'))||{})}}catch{}if(!Array.isArray(save.owned)||!save.owned.includes(0))save.owned=[0];if(!save.owned.includes(save.equipped))save.equipped=0;const persist=()=>{try{localStorage.setItem('forestStalkerV5',JSON.stringify(save))}catch{}};

const AUDIO_URL='audio/sfx-sprite.mp3';
const CUES={reload:{start:0,dur:1.512,gain:.74},shot:{start:1.662,dur:1.567,gain:.90},impact:{start:3.379,dur:1.056,gain:.68},snort:{start:4.585,dur:2.04,gain:.42},grunt:{start:6.775,dur:2.04,gain:.46}};
let AC=null,audioBuffer=null,audioPromise=null,master=null,nextDeerCall=performance.now()+3500;
function initAudio(){if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createDynamicsCompressor();master.threshold.value=-15;master.knee.value=12;master.ratio.value=5;master.attack.value=.003;master.release.value=.18;master.connect(AC.destination)}if(AC.state==='suspended')AC.resume().catch(()=>{});if(!audioPromise)audioPromise=fetch(AUDIO_URL).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>AC.decodeAudioData(b)).then(b=>audioBuffer=b).catch(()=>null);return audioPromise}
function playCue(name,{volume=1,rate=1,pan=0,delay=0}={}){if(!AC||!audioBuffer||!master)return;const c=CUES[name];if(!c)return;const src=AC.createBufferSource(),gain=AC.createGain();src.buffer=audioBuffer;src.playbackRate.value=rate;gain.gain.value=Math.max(0,Math.min(1.25,c.gain*volume));if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));src.connect(p);p.connect(gain)}else src.connect(gain);gain.connect(master);try{src.start(AC.currentTime+delay,c.start,Math.min(c.dur,audioBuffer.duration-c.start))}catch{}}
function deerSpatial(d){const local=d.root.position.clone().sub(C.position).applyQuaternion(C.quaternion.clone().invert());const dist=Math.max(1,local.length());return{pan:Math.max(-1,Math.min(1,local.x/Math.max(1,Math.hypot(local.x,local.z)))),volume:Math.max(.14,Math.min(.72,1-dist/85))}}
function deerVoice(d,type='snort',extra=1,delay=0){if(!d?.root?.visible||d.state==='dead')return;const s=deerSpatial(d);playCue(type,{volume:s.volume*extra,pan:s.pan,rate:.96+Math.random()*.08,delay})}

const invisible=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
function makeLeg(fur,dark,x,z,phase){
 const hip=new THREE.Group();hip.position.set(x,.98,z);
 const upper=new THREE.Mesh(new THREE.CylinderGeometry(.075,.105,.72,9),fur);upper.position.y=-.36;upper.castShadow=true;hip.add(upper);
 const knee=new THREE.Group();knee.position.y=-.72;hip.add(knee);
 const lower=new THREE.Mesh(new THREE.CylinderGeometry(.045,.064,.62,8),dark);lower.position.y=-.31;lower.castShadow=true;knee.add(lower);
 const hoof=new THREE.Mesh(new THREE.BoxGeometry(.11,.09,.18),dark);hoof.position.set(0,-.64,.035);hoof.castShadow=true;knee.add(hoof);
 return{hip,knee,phase};
}
function makeDeer(i){
 const root=new THREE.Group(),visual=new THREE.Group();root.add(visual);S.add(root);
 const fur=new THREE.MeshStandardMaterial({color:i%2?0x7a4a2a:0x865433,roughness:.95}),dark=new THREE.MeshStandardMaterial({color:0x34251c,roughness:1}),cream=new THREE.MeshStandardMaterial({color:0xc6ae88,roughness:1}),ant=new THREE.MeshStandardMaterial({color:0x4a3826,roughness:1}),black=new THREE.MeshStandardMaterial({color:0x080908});
 const add=(g,m,p,s=[1,1,1],r=[0,0,0],parent=visual)=>{const q=new THREE.Mesh(g,m);q.position.set(...p);q.scale.set(...s);q.rotation.set(...r);q.castShadow=true;parent.add(q);return q};
 const bodyMesh=add(new THREE.SphereGeometry(1,18,14),fur,[0,1.18,0],[.58,.65,1.3]);
 add(new THREE.SphereGeometry(.72,16,12),fur,[0,1.34,.73],[.68,.82,.72]);
 const neck=new THREE.Group();neck.position.set(0,1.58,.88);neck.rotation.x=-.43;visual.add(neck);add(new THREE.CylinderGeometry(.22,.34,1.12,11),fur,[0,.52,0],[1,1,1],[0,0,0],neck);
 const headPivot=new THREE.Group();headPivot.position.set(0,1.0,.25);neck.add(headPivot);add(new THREE.SphereGeometry(.38,16,12),fur,[0,.06,.27],[.72,.67,1.12],[0,0,0],headPivot);add(new THREE.SphereGeometry(.21,12,9),dark,[0,-.02,.63],[.72,.58,1.15],[0,0,0],headPivot);add(new THREE.SphereGeometry(.07,9,7),black,[0,-.01,.82],[1.2,.7,.7],[0,0,0],headPivot);
 for(const sx of[-1,1]){add(new THREE.ConeGeometry(.13,.38,9),fur,[.22*sx,.35,.1],[1,1,1],[0,0,sx*-.28],headPivot);add(new THREE.SphereGeometry(.042,8,6),black,[.285*sx,.13,.43],[1,1,1],[0,0,0],headPivot)}
 if(i%3!==1){for(const sx of[-1,1]){add(new THREE.CylinderGeometry(.03,.045,.66,7),ant,[.12*sx,.57,.12],[1,1,1],[.08*sx,0,-.14*sx],headPivot);add(new THREE.CylinderGeometry(.023,.034,.42,7),ant,[.20*sx,.85,.12],[1,1,1],[.48*sx,0,-.22*sx],headPivot)}}
 const tail=add(new THREE.ConeGeometry(.17,.52,9),cream,[0,1.42,-1.18],[1,.86,.72],[Math.PI*.62,0,0]);
 const legs=[];for(const [x,z,phase]of[[-.34,.70,0],[.34,.70,Math.PI],[-.34,-.72,Math.PI],[.34,-.72,0]]){const L=makeLeg(fur,dark,x,z,phase);visual.add(L.hip);legs.push(L)}
 const body=new THREE.Mesh(new THREE.SphereGeometry(.86,11,9),invisible);body.scale.set(.72,.78,1.28);body.position.set(0,1.26,.08);const head=new THREE.Mesh(new THREE.SphereGeometry(.37,10,8),invisible);head.position.set(0,2.37,1.43);body.userData={deer:null,zone:'body'};head.userData={deer:null,zone:'head'};visual.add(body,head);
 const d={root,visual,bodyMesh,neck,headPivot,tail,legs,body,head,hp:100,state:'wander',t:rnd()*10,speed:.75+rnd()*.4,dir:rnd()*6.28,respawn:0,idleFor:0,hitKick:0,phase:rnd()*Math.PI*2};body.userData.deer=head.userData.deer=d;root.userData.deer=d;spawnDeer(d,true);return d;
}
const DEER=[];for(let i=0;i<6;i++)DEER.push(makeDeer(i));
function spawnDeer(d,initial=false){const a=rnd()*Math.PI*2,r=initial?24+rnd()*34:28+rnd()*36;d.root.position.set(Math.cos(a)*r,ty(Math.cos(a)*r,Math.sin(a)*r),Math.sin(a)*r);d.root.rotation.set(0,0,0);d.visual.rotation.set(0,0,0);d.visual.position.set(0,0,0);d.hp=100;d.state='wander';d.t=rnd()*4;d.dir=a+Math.PI+(rnd()-.5)*1.8;d.root.rotation.y=-d.dir+Math.PI/2;d.root.visible=true;d.idleFor=0;d.hitKick=0}
function flee(d){if(!d.root.visible||d.state==='dead')return;d.state='run';d.t=0;const away=Math.atan2(d.root.position.z-C.position.z,d.root.position.x-C.position.x);d.dir=away+(rnd()-.5)*.45;d.hitKick=.18}
function animateDeer(d,dt,now){
 if(!d.root.visible){d.respawn-=dt;if(d.respawn<=0)spawnDeer(d);return}
 d.t+=dt;d.hitKick=Math.max(0,d.hitKick-dt*1.8);
 if(d.state==='dead'){
  d.visual.rotation.z=THREE.MathUtils.lerp(d.visual.rotation.z,Math.PI*.48,1-Math.exp(-4.6*dt));
  d.visual.position.y=THREE.MathUtils.lerp(d.visual.position.y,-.16,1-Math.exp(-3*dt));
  d.legs.forEach(L=>{L.hip.rotation.x=THREE.MathUtils.lerp(L.hip.rotation.x,0,1-Math.exp(-5*dt));L.knee.rotation.x=THREE.MathUtils.lerp(L.knee.rotation.x,.45,1-Math.exp(-5*dt))});
  d.respawn-=dt;if(d.respawn<=0){d.root.visible=false;d.respawn=1.5}return;
 }
 if(d.state==='idle'){
  d.idleFor-=dt;if(d.idleFor<=0){d.state='wander';d.t=0}
 }else{
  const speed=d.state==='run'?5.8:d.speed;
  if(d.state==='wander'&&rnd()<.0045)d.dir+=(rnd()-.5)*1.1;
  d.root.position.x+=Math.cos(d.dir)*speed*dt;d.root.position.z+=Math.sin(d.dir)*speed*dt;
  const rr=Math.hypot(d.root.position.x,d.root.position.z);if(rr>70||rr<13)d.dir=Math.atan2(-d.root.position.z,-d.root.position.x)+(rnd()-.5)*.65;
  d.root.position.y=ty(d.root.position.x,d.root.position.z);d.root.rotation.y=-d.dir+Math.PI/2;
  if(d.state==='wander'&&rnd()<.0013){d.state='idle';d.idleFor=1.2+rnd()*2.4;d.t=0}
  if(d.state==='run'&&d.t>4.4){d.state='wander';d.t=0}
 }
 const running=d.state==='run',idle=d.state==='idle';const f=running?11.2:idle?1.35:4.5,A=running?.78:idle?.035:.28,p=now*.001*f+d.phase;
 d.legs.forEach((L,i)=>{const s=Math.sin(p+L.phase)*A;L.hip.rotation.x=s;L.knee.rotation.x=(running?.18:.08)+Math.max(0,-s)*(running?.86:.58)});
 const bob=idle?Math.sin(p)*.006:Math.abs(Math.sin(p))*(running?.075:.018);
 d.visual.position.y=bob;d.visual.rotation.x=Math.sin(p*2)*(running?.025:.008)-d.hitKick;
 d.neck.rotation.z=Math.sin(p*.5)*(running?.055:idle?.025:.02);d.headPivot.rotation.x=Math.sin(p*.62)*(running?.045:idle?.08:.035);d.headPivot.rotation.y=Math.sin(p*.31)*(idle?.18:running?.03:.07);d.tail.rotation.z=Math.sin(p*.72)*(running?.24:.12);
}

let run=false,shots=SNIPERS[save.equipped].mag,reserve=Infinity,bolting=false,reloading=false,totalShots=0,hits=0,yaw=0,pitch=0,tyaw=0,tpitch=0,recoil=0,last=performance.now();const ray=new THREE.Raycaster();
const ui=()=>{const gun=SNIPERS[save.equipped];$('#ammo').textContent=shots;$('#reserve').textContent='∞';$('#score').textContent=save.kills||0;$('#coins').textContent=save.coins||0;$('#bag').textContent=save.bag||0;$('#gunName').textContent=gun.name;$('#acc').textContent=(totalShots?Math.round(hits/totalShots*100):100)+'%'};
function note(t,ms=700){const m=$('#msg');m.textContent=t;m.classList.add('show');clearTimeout(note.t);note.t=setTimeout(()=>m.classList.remove('show'),ms)}function pop(t,good=true){const e=$('#dmg');e.textContent=t;e.className='dmg show '+(good?'good':'');setTimeout(()=>e.classList.remove('show'),600)}
function shoot(){if(!run||bolting||reloading)return;initAudio();const gun=SNIPERS[save.equipped];if(shots<=0){note('RELOAD');return}shots--;totalShots++;bolting=true;recoil=.052*(1+gun.sway*.12);ui();playCue('shot',{volume:1,rate:.985+Math.random()*.025});setTimeout(()=>bolting=false,gun.delay*1000);ray.setFromCamera(new THREE.Vector2(0,0),C);const targets=[];DEER.forEach(d=>{if(d.root.visible&&d.state!=='dead')targets.push(d.head,d.body)});const h=ray.intersectObjects(targets,false)[0];if(!h){note('MISS',420);DEER.forEach(d=>{if(d.root.visible&&d.state!=='dead'&&d.root.position.distanceTo(C.position)<40)flee(d)});return}hits++;const d=h.object.userData.deer,headshot=h.object.userData.zone==='head',damage=headshot?100:gun.damage;d.hp=Math.max(0,d.hp-damage);pop(headshot?'HEADSHOT · -100':'-'+damage+' DMG');const sp=deerSpatial(d);playCue('impact',{volume:.9,pan:sp.pan,delay:.035});deerVoice(d,'grunt',1.05,.11);if(d.hp<=0){d.state='dead';d.t=0;d.respawn=2.3;save.kills=(save.kills||0)+1;save.bag=(save.bag||0)+1;persist();note('DEER DOWN · +1 HUNT',900)}else{flee(d);note('HIT · '+d.hp+' HP',650)}DEER.forEach(o=>{if(o!==d&&o.root.visible&&o.state!=='dead'&&o.root.position.distanceTo(d.root.position)<16)flee(o)});ui()}
function reload(){if(!run||reloading||bolting)return;initAudio();const gun=SNIPERS[save.equipped];if(shots>=gun.mag)return;reloading=true;note('RELOADING…',Math.round(gun.delay*1000+700));playCue('reload',{volume:1});setTimeout(()=>{shots=gun.mag;reloading=false;ui();note('READY',420)},1250)}
function openShop(){run=false;renderShop();$('#shop').classList.add('open')}function closeShop(){run=true;$('#shop').classList.remove('open')}
function renderShop(){const list=$('#rifles');list.innerHTML='';SNIPERS.forEach(g=>{const owned=save.owned.includes(g.id),equipped=save.equipped===g.id,card=document.createElement('button');card.className='rifle '+(equipped?'equipped':'');card.innerHTML=`<div><strong>${g.name}</strong><small>${g.desc}</small><em>DMG ${g.damage} · MAG ${g.mag} · ${g.scope}× · ${g.delay.toFixed(2)}s</em></div><span>${equipped?'EQUIPPED':owned?'EQUIP':g.price+' 🪙'}</span>`;card.onclick=()=>{if(equipped)return;if(!owned){if((save.coins||0)<g.price){note('NOT ENOUGH COINS');return}save.coins-=g.price;save.owned.push(g.id)}save.equipped=g.id;shots=g.mag;persist();renderShop();ui()};list.appendChild(card)});$('#sellCount').textContent=save.bag||0;$('#sellValue').textContent=(save.bag||0)*90}
$('#sell').onclick=()=>{if(!(save.bag>0))return;save.coins=(save.coins||0)+save.bag*90;save.bag=0;persist();renderShop();ui();note('HUNT SOLD · COINS ADDED',900)};$('#shopBtn').onclick=openShop;$('#closeShop').onclick=closeShop;$('#fire').onpointerdown=e=>{e.preventDefault();shoot()};$('#reload').onpointerdown=e=>{e.preventDefault();reload()};$('#start').onclick=()=>{initAudio();$('#intro').style.display='none';run=true;ui()};
let drag=false,lx=0,ly=0;addEventListener('pointerdown',e=>{if(!run||e.target.closest?.('button'))return;drag=true;lx=e.clientX;ly=e.clientY});addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;const gun=SNIPERS[save.equipped],sens=.00185*(6/gun.scope);tyaw-=dx*sens;tpitch=Math.max(-.62,Math.min(.62,tpitch-dy*sens))});addEventListener('pointerup',()=>drag=false);addEventListener('pointercancel',()=>drag=false);
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.033,(now-last)/1000);last=now;DEER.forEach(d=>animateDeer(d,dt,now));const gun=SNIPERS[save.equipped],sway=(run?gun.sway:0),t=now*.001;yaw=THREE.MathUtils.lerp(yaw,tyaw,1-Math.exp(-16*dt));pitch=THREE.MathUtils.lerp(pitch,tpitch,1-Math.exp(-16*dt));recoil=THREE.MathUtils.lerp(recoil,0,1-Math.exp(-15*dt));C.rotation.y=yaw+Math.sin(t*1.2)*.0011*sway;C.rotation.x=pitch+Math.sin(t*.92)*.0008*sway+recoil;C.fov=105/gun.scope;C.updateProjectionMatrix();let nearest=999;DEER.forEach(d=>{if(d.root.visible&&d.state!=='dead')nearest=Math.min(nearest,C.position.distanceTo(d.root.position))});$('#range').textContent=(nearest<998?Math.round(nearest):'--')+' m';if(run&&audioBuffer&&now>=nextDeerCall){const live=DEER.filter(d=>d.root.visible&&d.state!=='dead');if(live.length){const d=live[Math.floor(Math.random()*live.length)];deerVoice(d,Math.random()<.58?'snort':'grunt',.9)}nextDeerCall=now+4500+Math.random()*6500}R.render(S,C)}requestAnimationFrame(loop);
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight,false);C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix()});

let probeStart=null;setTimeout(()=>{const d=DEER[0];probeStart=d?.legs?.map(L=>L.hip.rotation.x)||[];setTimeout(()=>{const end=d?.legs?.map(L=>L.hip.rotation.x)||[];const delta=end.map((v,i)=>Math.abs(v-(probeStart[i]||0)));window.__fsAnimationCheck={passed:delta.some(v=>v>.03),delta,state:d?.state||'unknown',pivotRig:true};},650)},500);
window.__forestStalker={version:'5.3',deer:DEER,state:()=>({kills:save.kills||0,bag:save.bag||0,coins:save.coins||0,alive:DEER.filter(d=>d.root.visible&&d.state!=='dead').length,animation:window.__fsAnimationCheck||null})};
ui();