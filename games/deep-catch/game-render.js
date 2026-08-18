(()=>{
'use strict';
const $=id=>document.getElementById(id);
const c=$('c'),ctx=c.getContext('2d');
const W=450,H=800,WATER=172,TAU=Math.PI*2;
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),lerp=(a,b,t)=>a+(b-a)*t;

const ui={
 score:$('score'),combo:$('combo'),best:$('best'),coins:$('coins'),shopCoins:$('shopCoins'),sound:$('soundBtn'),
 rodBadge:$('rodBadge'),rodName:$('rodName'),rodTier:$('rodTier'),rodPassive:$('rodPassive'),rodThumb:$('rodThumb'),
 intro:$('intro'),introRodCard:$('introRodCard'),introRod:$('introRod'),introRodName:$('introRodName'),introTier:$('introTier'),introPassive:$('introPassive'),
 gameRod:$('gameRod'),gameRodImg:$('gameRodImg'),toast:$('toast'),toastTitle:$('toastTitle'),toastSub:$('toastSub'),hint:$('hint'),
 fight:$('fight'),fishName:$('fishName'),safeMark:$('safeMark'),tensionNeedle:$('tensionNeedle'),staminaFill:$('staminaFill'),catchFill:$('catchFill'),
 act:$('act'),depth:$('depthM'),shopQuick:$('shopQuick'),play:$('play'),openShop:$('openShop'),shop:$('shop'),shopGrid:$('shopGrid'),closeShop:$('closeShop'),
 summary:$('summary'),again:$('again'),summaryShop:$('summaryShop'),sumScore:$('sumScore'),sumCoins:$('sumCoins'),sumStreak:$('sumStreak'),sumRare:$('sumRare'),sumTitle:$('sumTitle'),sumSub:$('sumSub'),sumRodImg:$('sumRodImg'),sumRodName:$('sumRodName')
};

const tierColors={Common:'#9ecad5',Uncommon:'#58e2b2',Rare:'#5aa8ff',Epic:'#b478ff',Legendary:'#ffc34b',Mythic:'#ff536c'};
const rods=[
 {id:'driftwood',name:'Driftwood Branch',tier:'Common',price:0,img:ROD_ASSETS.driftwood,passive:'Starter Balance',desc:'A handmade branch rod. Forgiving enough to learn the rhythm of a fight.',stats:{bite:.94,pull:.94,stability:.94,luck:0,coins:1,score:1}},
 {id:'angler',name:'Harbour Classic',tier:'Uncommon',price:300,img:ROD_ASSETS.angler,passive:'Steady Hand',desc:'Wider sweet spot and calmer tension for reliable everyday fishing.',stats:{bite:1,pull:1,stability:1.07,luck:.02,coins:1.02,score:1.02}},
 {id:'voyager',name:'Voyager Tide',tier:'Rare',price:800,img:ROD_ASSETS.voyager,passive:'Deep Scout',desc:'Balanced offshore gear with a meaningful boost to rare-fish encounters.',stats:{bite:1.05,pull:1.07,stability:1.06,luck:.07,coins:1.05,score:1.06}},
 {id:'storm',name:'Storm Pulse',tier:'Epic',price:1500,img:ROD_ASSETS.storm,passive:'Line Guard',desc:'Electrical precision keeps the line stable when strong fish surge.',stats:{bite:1.08,pull:1.12,stability:1.16,luck:.10,coins:1.07,score:1.10}},
 {id:'inferno',name:'Inferno Fang',tier:'Epic',price:2200,img:ROD_ASSETS.inferno,passive:'Power Reel',desc:'Aggressive reeling speed with a higher score ceiling. Less forgiving than Storm Pulse.',stats:{bite:1.10,pull:1.20,stability:1.09,luck:.11,coins:1.10,score:1.17}},
 {id:'void',name:'Void Whisper',tier:'Legendary',price:3200,img:ROD_ASSETS.void,passive:'Deep Lure',desc:'Draws unusual species from the deep and shortens the wait before a bite.',stats:{bite:1.17,pull:1.15,stability:1.14,luck:.19,coins:1.13,score:1.14}},
 {id:'solar',name:'Solar Crown',tier:'Legendary',price:4600,img:ROD_ASSETS.solar,passive:'Treasure Hunter',desc:'Elite all-round control with the best coin return among high-tier rods.',stats:{bite:1.15,pull:1.22,stability:1.22,luck:.20,coins:1.22,score:1.18}},
 {id:'shadow',name:'Shadow Reaper',tier:'Mythic',price:6500,img:ROD_ASSETS.shadow,passive:'Apex Predator',desc:'Endgame equipment with supreme control, rare-fish odds and reward potential.',stats:{bite:1.21,pull:1.27,stability:1.28,luck:.28,coins:1.25,score:1.26}},
];
const rodMap=Object.fromEntries(rods.map(r=>[r.id,r]));

const FISH_ASSETS=Object.fromEntries(Object.entries(window.FISH_ASSETS_DATA||{}).map(([id,src])=>{const img=new Image();img.decoding='async';img.src=src;return[id,img]}));

const species=[
 {id:'yellowfin-jack',n:'YELLOWFIN JACK',v:42,size:.82,speed:47,body:'#5da6a0',accent:'#ffe36e',weight:27,pull:.73,stam:.82,rare:0,sprite:FISH_ASSETS['yellowfin-jack'],spriteScale:1.02},
 {id:'rose-snapper',n:'ROSE SNAPPER',v:68,size:.90,speed:41,body:'#ee7791',accent:'#ffd1d8',weight:23,pull:.86,stam:.94,rare:0,sprite:FISH_ASSETS['rose-snapper'],spriteScale:1.02},
 {id:'reef-glider',n:'REEF GLIDER',v:96,size:.95,speed:52,body:'#2ec0cd',accent:'#ff9c59',weight:18,pull:.97,stam:1.02,rare:0,sprite:FISH_ASSETS['reef-glider'],spriteScale:.98},
 {id:'moon-catfish',n:'MOON CATFISH',v:138,size:1.02,speed:38,body:'#7d6ec4',accent:'#f3afcf',weight:14,pull:1.08,stam:1.12,rare:0,sprite:FISH_ASSETS['moon-catfish'],spriteScale:1.02},
 {id:'sunstripe-runner',n:'SUNSTRIPE RUNNER',v:225,size:1.06,speed:60,body:'#26c5b2',accent:'#ffd948',weight:9,pull:1.28,stam:1.22,rare:1,sprite:FISH_ASSETS['sunstripe-runner'],spriteScale:1.05},
 {id:'spike-puffer',n:'SPIKE PUFFER',v:320,size:.92,speed:56,body:'#8f57ff',accent:'#ffcb52',weight:7,pull:1.22,stam:1.31,rare:1,sprite:FISH_ASSETS['spike-puffer'],spriteScale:.94},
 {id:'aqua-turtle',n:'AQUA TURTLE',v:410,size:1.18,speed:28,body:'#39d8d6',accent:'#9fe7ff',weight:5,pull:1.36,stam:1.40,rare:1,sprite:FISH_ASSETS['aqua-turtle'],spriteScale:1.08},
 {id:'neon-barracuda',n:'NEON BARRACUDA',v:720,size:1.22,speed:73,body:'#135a88',accent:'#7df0ff',weight:3,pull:1.56,stam:1.52,rare:2,sprite:FISH_ASSETS['neon-barracuda'],spriteScale:1.16},
 {id:'leviathan-whale',n:'LEVIATHAN WHALE',v:1050,size:1.42,speed:26,body:'#2f7cff',accent:'#c7f4ff',weight:2,pull:1.68,stam:1.72,rare:2,sprite:FISH_ASSETS['leviathan-whale'],spriteScale:1.52},
 {id:'inferno-fangfish',n:'INFERNO FANGFISH',v:1500,size:1.24,speed:79,body:'#26252c',accent:'#ff8a2a',weight:1,pull:1.88,stam:1.84,rare:3,sprite:FISH_ASSETS['inferno-fangfish'],spriteScale:1.14},
];

let soundOn=true,audio=null,noiseGain=null;
function ensureAudio(){if(!soundOn)return;try{audio||=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume()}catch{}}
function tone(f=440,d=.08,type='sine',vol=.025,slide=0){if(!soundOn)return;try{ensureAudio();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,audio.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),audio.currentTime+d);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch{}}
function haptic(v){try{navigator.vibrate?.(v)}catch{}}
function oceanBed(){if(!soundOn||noiseGain)return;try{ensureAudio();const sr=audio.sampleRate,b=audio.createBuffer(1,sr*2,sr),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.18;const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),g=audio.createGain();filter.type='lowpass';filter.frequency.value=540;g.gain.value=.018;src.buffer=b;src.loop=true;src.connect(filter);filter.connect(g);g.connect(audio.destination);src.start();noiseGain=g}catch{}}
function setSound(on){soundOn=on;ui.sound.classList.toggle('off',!on);ui.sound.textContent=on?'♪':'×';if(on){noiseGain=null;ensureAudio();oceanBed();tone(520,.06,'sine',.018,80)}else if(noiseGain){noiseGain.gain.value=0;noiseGain=null}}

const PROFILE_KEY='deepCatchRodsV3';
function loadProfile(){
 let best=0;try{best=+(localStorage.getItem('deepCatchV2Best')||localStorage.getItem('deepCatchBest')||0)}catch{}
 try{
   const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');
   if(p&&Array.isArray(p.owned)&&p.equipped){
     p.coins=Math.max(0,+p.coins||0);p.best=Math.max(best,+p.best||0);return p;
   }
   const old=JSON.parse(localStorage.getItem('deepCatchRodsV1')||'null');
   if(old&&Array.isArray(old.owned)&&old.equipped){return {coins:Math.max(0,+old.coins||0),best:Math.max(best,+old.best||0),owned:old.owned.filter(id=>rodMap[id]),equipped:rodMap[old.equipped]?old.equipped:'driftwood'};}
 }catch{}
 return {coins:150,best,owned:['driftwood'],equipped:'driftwood'};
}
let profile=loadProfile();
function saveProfile(){try{localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));localStorage.setItem('deepCatchV2Best',String(profile.best))}catch{}}
function rod(){return rodMap[profile.equipped]||rods[0]}

let state='menu',score=0,streak=0,bestStreak=0,catches=0,rareCaught=0,coinsWon=0,hold=false,pointerX=W*.52,last=0,time=0,shake=0,toastTimer=0,hintTimer=0,runDone=false,biteLock=0;
let hook={x:W*.52,y:WATER-1,vy:0,wobble:0},targetFish=null,tension=.28,catchProgress=0,fishStamina=1,fightTime=0,safeTime=0;
let fish=[],bubbles=[],particles=[];const plants=[],rocks=[];
for(let i=0;i<28;i++)plants.push({x:rnd(-5,W+5),h:rnd(20,75),phase:rnd(0,TAU),kind:Math.random()<.76?0:1});
for(let i=0;i<17;i++)rocks.push({x:rnd(-15,W+15),y:H-rnd(8,31),r:rnd(6,18),a:rnd(.25,.75)});

function statPct(v,min=.9,max=1.3){return cl((v-min)/(max-min)*100,8,100)}
function currentColor(){return tierColors[rod().tier]||tierColors.Common}
function applyRodTheme(){
 const r=rod(),color=currentColor();document.documentElement.style.setProperty('--rod',color);document.documentElement.style.setProperty('--rodGlow',color+'66');
 ui.rodName.textContent=r.name;ui.rodTier.textContent=r.tier.toUpperCase();ui.rodPassive.textContent=r.passive;ui.rodThumb.src=r.img;
 ui.introRod.src=r.img;ui.introRodName.textContent=r.name;ui.introTier.textContent=r.tier.toUpperCase()+' ROD';ui.introPassive.textContent=r.passive;
 ui.gameRodImg.src=r.img;ui.gameRod.classList.toggle('legendary',r.tier==='Legendary'||r.tier==='Mythic');
 ui.sumRodImg.src=r.img;ui.sumRodName.textContent=r.name;
}
function updateHUD(){ui.score.textContent=score;ui.combo.textContent='x'+streak;ui.best.textContent=profile.best;ui.coins.textContent=profile.coins;ui.shopCoins.textContent=profile.coins;ui.depth.textContent=Math.round(Math.max(0,(hook.y-WATER)/5.7))+'m';applyRodTheme()}
function showToast(a,b,d=1.35){ui.toastTitle.textContent=a;ui.toastSub.textContent=b;ui.toast.classList.add('show');toastTimer=d}
function showHint(t,d=1.8){ui.hint.textContent=t;ui.hint.classList.add('show');hintTimer=d}
function updateFightUI(){const safeW=cl(20+(rod().stats.stability-.94)*80,20,48);ui.safeMark.style.left=(52-safeW/2)+'%';ui.safeMark.style.width=safeW+'%';ui.tensionNeedle.style.left=`calc(${cl(tension*100,0,100)}% - 4px)`;ui.staminaFill.style.width=cl(fishStamina*100,0,100)+'%';ui.catchFill.style.width=cl(catchProgress*100,0,100)+'%'}

function renderShop(){
 ui.shopGrid.innerHTML='';ui.shopCoins.textContent=profile.coins;
 rods.forEach(r=>{
   const owned=profile.owned.includes(r.id),equipped=profile.equipped===r.id,color=tierColors[r.tier];
   const card=document.createElement('div');card.className='shopCard '+(equipped?'equippedCard ':'')+(owned?'':'lockedCard');card.style.setProperty('--tier',color);
   const statBars=[statPct(r.stats.pull),statPct(r.stats.stability),cl(r.stats.luck/.28*100,4,100),statPct(r.stats.coins,1,1.25)];
   card.innerHTML=`<div class="shopPreview"><img src="${r.img}" alt="${r.name}"></div><div class="shopMeta"><h3>${r.name}</h3><span class="rarity">${r.tier.toUpperCase()}</span><div class="passive">${r.passive}</div><div class="shopDesc">${r.desc}</div><div class="statBars">${statBars.map(v=>`<div class="barStat"><i style="width:${Math.round(v)}%"></i></div>`).join('')}</div><div class="cardFooter">${owned?`<div class="ownedTag">${equipped?'ACTIVE':'OWNED'}</div>`:`<div class="priceTag">🪙 ${r.price}</div>`}<button class="rodBtn ${equipped?'equipped':owned?'equip':'buy'}" ${equipped?'disabled':''}>${equipped?'EQUIPPED':owned?'EQUIP':'BUY'}</button></div></div>`;
   card.querySelector('.rodBtn').addEventListener('click',()=>{
     if(equipped)return;
     if(!owned){
       if(profile.coins<r.price){showToast('NOT ENOUGH COINS',`${r.name} costs ${r.price}`);tone(115,.12,'square',.02,-30);haptic(25);return;}
       profile.coins-=r.price;profile.owned.push(r.id);showToast('ROD UNLOCKED!',r.name,1.6);tone(690,.08,'triangle',.025,240);setTimeout(()=>tone(980,.12,'sine',.02,120),70);haptic([16,22,22]);
     }else{showToast('EQUIPPED',r.name);tone(540,.07,'triangle',.02,100);haptic(14)}
     profile.equipped=r.id;saveProfile();applyRodTheme();updateHUD();updateFightUI();renderShop();
   });
   ui.shopGrid.appendChild(card);
 });
}
function openShop(){if(state==='fight')return;ui.shop.classList.add('open');renderShop();tone(360,.05,'sine',.012,70)}
function closeShop(){ui.shop.classList.remove('open')}

function weightedSpecies(){const luck=rod().stats.luck;return species.map(s=>({s,w:s.weight*(1+(s.rare===1?luck*1.4:s.rare===2?luck*2.2:s.rare>=3?luck*3.2:0))}));}
function pickSpecies(){const list=weightedSpecies();let total=list.reduce((a,o)=>a+o.w,0),r=Math.random()*total;for(const o of list){r-=o.w;if(r<=0)return o.s}return species[0]}
function spawnFish(force=false,specific=null){if(fish.length>=15&&!force)return;const s=specific||pickSpecies(),dir=Math.random()<.5?1:-1,baseY=rnd(WATER+95,H-112);fish.push({s,x:dir>0?-85:W+85,y:baseY,baseY,dir,phase:rnd(0,TAU),speed:s.speed*rnd(.86,1.13),mode:'cruise',interest:0,bite:0,hooked:false,flash:0,life:1})}
function seedWorld(){fish=[];bubbles=[];particles=[];for(let i=0;i<12;i++)spawnFish(true);for(let i=0;i<20;i++)addBubble(rnd(0,W),rnd(WATER,H))}
function addBubble(x=rnd(0,W),y=H+8,small=false){bubbles.push({x,y,r:small?rnd(.8,2.2):rnd(1.2,4.1),v:rnd(12,29),drift:rnd(-8,8),life:1})}
function burst(x,y,col='#dffaff',n=15,force=1){for(let i=0;i<n;i++)particles.push({x,y,vx:rnd(-80,80)*force,vy:rnd(-110,30)*force,r:rnd(1.2,4),life:1,col})}

function resetHook(){Object.assign(hook,{x:W*.52,y:WATER-1,vy:0,wobble:0});targetFish=null;tension=.28;catchProgress=0;fishStamina=1;fightTime=0;safeTime=0;hold=false;biteLock=.35;ui.fight.classList.remove('show');ui.act.className='';ui.act.textContent='CAST';ui.gameRod.classList.remove('fighting');state=runDone?'complete':'ready';updateFightUI();updateHUD()}
function newRun(){score=0;streak=0;bestStreak=0;catches=0;rareCaught=0;coinsWon=0;runDone=false;ui.summary.classList.remove('open');ui.intro.classList.remove('visible');seedWorld();resetHook();oceanBed();showHint('TAP CAST, THEN DRAG TO GUIDE',2.4);tone(470,.07,'triangle',.02,120);setTimeout(()=>tone(710,.1,'triangle',.018,80),70)}
function cast(){if(state!=='ready')return;state='drop';hook.vy=102;ui.act.textContent='GUIDE';ui.gameRod.classList.remove('casting');void ui.gameRod.offsetWidth;ui.gameRod.classList.add('casting');setTimeout(()=>ui.gameRod.classList.remove('casting'),520);showHint('DRAG LEFT / RIGHT TO TEMPT FISH',1.8);tone(220,.11,'triangle',.022,70);haptic(14);burst(W*.52,WATER+1,'#e8fbff',7,.5)}
function bite(f){if(state!=='drop'||biteLock>0)return;targetFish=f;f.hooked=true;f.mode='hooked';state='fight';tension=.31;catchProgress=0;fishStamina=1;fightTime=0;safeTime=0;ui.fight.classList.add('show');ui.act.className='fightBtn';ui.act.textContent='REEL';ui.fishName.textContent=f.s.n;ui.gameRod.classList.add('fighting');showToast('FISH ON!',f.s.n);showHint('HOLD TO REEL • RELEASE BEFORE RED',2.5);tone(610,.07,'square',.024,150);setTimeout(()=>tone(860,.09,'triangle',.02,160),65);haptic([15,24,24]);shake=3.5;burst(hook.x,hook.y,'#e9fbff',12,.75)}
function loseFish(){if(!targetFish)return;const f=targetFish;f.hooked=false;f.mode='escape';f.dir=hook.x>W/2?-1:1;f.speed*=1.45;targetFish=null;streak=0;hold=false;state='cooldown';ui.fight.classList.remove('show');ui.act.classList.remove('hold');ui.gameRod.classList.remove('fighting');showToast('LINE BROKE','Release sooner when tension turns red',1.5);tone(125,.22,'sawtooth',.034,-55);haptic([45,28,70]);shake=9;burst(hook.x,hook.y,'#e9fbff',17,1);updateHUD();setTimeout(resetHook,820)}
function landFish(){
 if(!targetFish)return;const f=targetFish,s=f.s;const perfect=safeTime>fightTime*.56&&fightTime>1.05;const streakBonus=1+Math.min(streak,5)*.09;const perfectBonus=perfect?1.16:1;const gain=Math.round(s.v*streakBonus*perfectBonus*rod().stats.score);const coinBase=Math.max(4,Math.round(s.v*.13));const coinGain=Math.round(coinBase*rod().stats.coins*(s.rare>=2?1.15:1));
 score+=gain;profile.coins+=coinGain;coinsWon+=coinGain;streak++;bestStreak=Math.max(bestStreak,streak);catches++;if(s.rare)rareCaught++;f.hooked=false;f.mode='caught';f.life=1;targetFish=null;hold=false;if(score>profile.best)profile.best=score;saveProfile();state='cooldown';ui.fight.classList.remove('show');ui.gameRod.classList.remove('fighting');
 const title=s.rare>=3?'MYTHIC CATCH!':s.rare>=2?'LEGENDARY!':perfect?'PERFECT REEL!':'NICE CATCH!';showToast(title,`${s.n}  +${gain} · 🪙 ${coinGain}`,1.55);tone(s.rare?920:820,.09,'triangle',.028,240);setTimeout(()=>tone(s.rare?1280:1120,.14,'sine',.022,120),75);haptic([18,20,18]);shake=s.rare?7:4.5;burst(hook.x,WATER+4,s.rare?'#ffd653':'#e9fbff',s.rare?28:20,s.rare?1.2:1);updateHUD();if(catches>=8){runDone=true;setTimeout(showSummary,850)}else setTimeout(resetHook,700)
}
function showSummary(){state='complete';ui.fight.classList.remove('show');ui.hint.classList.remove('show');ui.sumScore.textContent=score;ui.sumCoins.textContent=coinsWon;ui.sumStreak.textContent=bestStreak;ui.sumRare.textContent=rareCaught;ui.sumTitle.textContent=rareCaught>=2?'Epic Fishing Trip!':'Trip Complete';ui.sumSub.textContent=`${rod().name} landed ${catches} fish${rareCaught?` including ${rareCaught} rare catch${rareCaught===1?'':'es'}`:''}.`;ui.summary.classList.add('open');tone(760,.09,'triangle',.02,140);setTimeout(()=>tone(1040,.12,'sine',.018,120),80)}

function updateFish(f,dt){
 if(f.mode==='hooked'&&targetFish===f){const sway=(Math.sin(time*(4.2+f.s.pull)+f.phase)*34+Math.sin(time*8.5+f.phase)*11)*f.s.pull,targetX=hook.x+sway,targetY=hook.y+10;f.x=lerp(f.x,targetX,Math.min(1,dt*8.5));f.y=lerp(f.y,targetY,Math.min(1,dt*8.5));f.dir=sway>=0?1:-1;return}
 if(f.mode==='caught'){f.life-=dt*2;f.y-=dt*95;f.x=lerp(f.x,W*.52,dt*2.5);return}
 if(f.mode==='escape'){f.x+=f.dir*f.speed*dt;f.y+=Math.sin(time*11+f.phase)*18*dt;if(f.x<-100||f.x>W+100){Object.assign(f,{s:pickSpecies(),mode:'cruise',dir:Math.random()<.5?1:-1,baseY:rnd(WATER+95,H-112),interest:0,bite:0});f.x=f.dir>0?-80:W+80}return}
 const dx=hook.x-f.x,dy=hook.y-f.y,dist=Math.hypot(dx,dy),lureActive=state==='drop'&&hook.y>WATER+35;
 if(lureActive&&dist<145*rod().stats.bite&&biteLock<=0){f.interest=cl(f.interest+dt*(1.3*rod().stats.bite+Math.abs(hook.wobble)*.018),0,1.2);if(f.interest>.26){f.mode='approach';const desired=27*f.s.size;f.x+=dx/Math.max(dist,1)*f.speed*dt*.62*rod().stats.bite;f.y+=dy/Math.max(dist,1)*f.speed*dt*.55;f.dir=dx>=0?1:-1;f.y+=Math.sin(time*5+f.phase)*dt*8;if(dist<desired+12){f.bite+=dt*(.65+f.interest*.75)*rod().stats.bite*(1.08-f.s.rare*.05);if(f.bite>.48){bite(f);return}}}}
 else{f.interest=Math.max(0,f.interest-dt*.55);f.bite=Math.max(0,f.bite-dt*1.2);if(f.mode==='approach'&&f.interest<.15)f.mode='cruise'}
 if(f.mode==='cruise'){f.x+=f.dir*f.speed*dt;f.y=f.baseY+Math.sin(time*1.55+f.phase)*9;if((f.dir>0&&f.x>W+95)||(f.dir<0&&f.x<-95)){f.s=pickSpecies();f.speed=f.s.speed*rnd(.86,1.13);f.baseY=rnd(WATER+90,H-112);f.x=f.dir>0?-85:W+85;f.interest=0;f.bite=0}}
}
function update(dt){
 time+=dt;biteLock=Math.max(0,biteLock-dt);if(toastTimer>0&&(toastTimer-=dt)<=0)ui.toast.classList.remove('show');if(hintTimer>0&&(hintTimer-=dt)<=0)ui.hint.classList.remove('show');if(Math.random()<dt*3.1)addBubble();
 bubbles.forEach(b=>{b.y-=b.v*dt;b.x+=Math.sin(time+b.r)*b.drift*dt;if(b.y<WATER+7)b.life-=dt*2});bubbles=bubbles.filter(b=>b.life>0);particles.forEach(p=>{p.vy+=88*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt*1.75});particles=particles.filter(p=>p.life>0);
 for(let i=fish.length-1;i>=0;i--){updateFish(fish[i],dt);if(fish[i].mode==='caught'&&fish[i].life<=0){fish.splice(i,1);spawnFish(true)}}
 if(state==='drop'){const tx=cl(pointerX,28,W-28),prev=hook.x;hook.x=lerp(hook.x,tx,Math.min(1,dt*8));hook.wobble=(hook.x-prev)/Math.max(dt,.001);hook.vy=Math.min(142,hook.vy+22*dt);hook.y+=hook.vy*dt;if(hook.y>H-76){hook.y=H-76;hook.vy=-58}else if(hook.vy<0){hook.vy+=34*dt;if(hook.vy>0)hook.vy=25}updateHUD()}
 if(state==='fight'&&targetFish){
   fightTime+=dt;const s=targetFish.s,burstPhase=Math.sin(time*(2.2+s.pull)+targetFish.phase)*.5+.5,pull=(.045+.13*burstPhase)*s.pull,stability=rod().stats.stability;
   if(hold){catchProgress+=dt*(.145*rod().stats.pull/s.stam);fishStamina-=dt*(.15*rod().stats.pull/s.stam);tension+=dt*(.26+pull-.07*(stability-1));}
   else{fishStamina+=dt*(.06*s.stam);tension-=dt*(.24*stability);catchProgress-=dt*.014;}
   const safeCenter=.52,safeHalf=.11*stability;if(Math.abs(tension-safeCenter)<safeHalf){safeTime+=dt;catchProgress+=dt*.035*rod().stats.pull;fishStamina-=dt*.05;}
   tension+=Math.sin(time*7+targetFish.phase)*dt*.026*s.pull;tension=cl(tension,.04,1.12);fishStamina=cl(fishStamina,0,1);catchProgress=cl(catchProgress,0,1.05);hook.y=(H-92)+(WATER+10-(H-92))*catchProgress;hook.x=cl(hook.x+Math.sin(time*4+targetFish.phase)*dt*27*s.pull,30,W-30);if(tension>.89)shake=Math.max(shake,2.5+(tension-.89)*18);updateFightUI();updateHUD();if(tension>=1.05)loseFish();else if(catchProgress>=1||fishStamina<=0)landFish();
 }
 shake=Math.max(0,shake-dt*20)
}

function drawSky(){let g=ctx.createLinearGradient(0,0,0,WATER);g.addColorStop(0,'#82d9ef');g.addColorStop(.68,'#d8f1dd');g.addColorStop(1,'#f8c86a');ctx.fillStyle=g;ctx.fillRect(0,0,W,WATER+2);ctx.fillStyle='#fff2bd77';ctx.beginPath();ctx.arc(360,52,32,0,TAU);ctx.fill();ctx.fillStyle='#fff8d8dd';ctx.beginPath();ctx.arc(360,52,18,0,TAU);ctx.fill();ctx.fillStyle='#517f7460';ctx.beginPath();ctx.moveTo(0,145);for(let i=0;i<=W;i+=45)ctx.lineTo(i,134+Math.sin(i*.021)*9);ctx.lineTo(W,WATER);ctx.lineTo(0,WATER);ctx.fill()}
function drawWater(){let g=ctx.createLinearGradient(0,WATER,0,H);g.addColorStop(0,'#1599b4');g.addColorStop(.28,'#0b6e92');g.addColorStop(.72,'#06486d');g.addColorStop(1,'#052d4b');ctx.fillStyle=g;ctx.fillRect(0,WATER,W,H-WATER);ctx.strokeStyle='#bfeef644';ctx.lineWidth=2;for(let k=0;k<4;k++){ctx.beginPath();for(let i=-20;i<W+20;i+=8){let y=WATER+8+k*10+Math.sin(i*.045+time*1.9+k)*2.2;i===-20?ctx.moveTo(i,y):ctx.lineTo(i,y)}ctx.stroke()}ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<5;i++){let q=45+i*93+Math.sin(time*.18+i)*22;ctx.fillStyle='#58dfec09';ctx.beginPath();ctx.moveTo(q-20,WATER);ctx.lineTo(q+55,H);ctx.lineTo(q+112,H);ctx.lineTo(q+18,WATER);ctx.fill()}ctx.restore()}
function drawFloor(){ctx.fillStyle='#032843';ctx.beginPath();ctx.moveTo(0,H-26);for(let i=0;i<=W;i+=35)ctx.lineTo(i,H-25+Math.sin(i*.05)*6);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();for(const r of rocks){ctx.globalAlpha=r.a;ctx.fillStyle='#0d3650';ctx.beginPath();ctx.ellipse(r.x,r.y,r.r,r.r*.55,0,0,TAU);ctx.fill()}ctx.globalAlpha=1;for(const p of plants){ctx.save();ctx.translate(p.x,H+2);let w=Math.sin(time*1.2+p.phase)*5;ctx.strokeStyle=p.kind?'#b66a4770':'#12807199';ctx.lineWidth=p.kind?3:4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(w,-p.h*.55,w*.5,-p.h);ctx.stroke();ctx.restore()}}
function drawFish(f){
 const s=f.s,img=s.sprite;
 if(img&&img.complete&&img.naturalWidth){
   const baseW=74*s.size*(s.spriteScale||1),aspect=img.naturalHeight/img.naturalWidth,w=baseW,h=baseW*aspect;
   ctx.save();
   ctx.translate(f.x,f.y);
   ctx.scale(f.dir>=0?-1:1,1);
   if(f.mode==='hooked')ctx.rotate(Math.sin(time*8+f.phase)*0.06);
   if(s.rare>=2){ctx.shadowColor=s.accent;ctx.shadowBlur=s.rare>=3?24:16;}
   ctx.globalAlpha=f.mode==='caught'?Math.max(.28,f.life):1;
   ctx.drawImage(img,-w*.5,-h*.5,w,h);
   if(s.rare>=1&&f.mode!=='caught'){
     ctx.globalCompositeOperation='screen';
     ctx.globalAlpha=.12+(s.rare*.04);
     ctx.fillStyle=s.accent;
     ctx.beginPath();
     ctx.ellipse(0,h*.04,w*.34,h*.18,0,0,TAU);
     ctx.fill();
   }
   ctx.restore();
   return;
 }
 ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.dir*s.size,s.size);if(s.rare>=2){ctx.shadowColor=s.accent;ctx.shadowBlur=14}ctx.fillStyle=s.accent;ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(-45,-18);ctx.quadraticCurveTo(-47,0,-45,18);ctx.closePath();ctx.fill();ctx.fillStyle=s.body;ctx.beginPath();ctx.ellipse(0,0,31,16,0,0,TAU);ctx.fill();ctx.fillStyle=s.accent;ctx.globalAlpha=.75;ctx.beginPath();ctx.ellipse(7,5,20,8,0,0,Math.PI);ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(-8,-13);ctx.lineTo(5,-27);ctx.lineTo(12,-13);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(20,-4,4,0,TAU);ctx.fill();ctx.fillStyle='#09212b';ctx.beginPath();ctx.arc(21,-4,2,0,TAU);ctx.fill();ctx.restore()}
function roundRect(x0,y0,w,h,r){ctx.beginPath();ctx.moveTo(x0+r,y0);ctx.arcTo(x0+w,y0,x0+w,y0+h,r);ctx.arcTo(x0+w,y0+h,x0,y0+h,r);ctx.arcTo(x0,y0+h,x0,y0,r);ctx.arcTo(x0,y0,x0+w,y0,r);ctx.closePath()}
function drawBoat(){ctx.save();ctx.translate(W*.52,WATER-18+Math.sin(time*1.7)*1.5);ctx.fillStyle='#e9ede5';ctx.beginPath();ctx.moveTo(-76,1);ctx.quadraticCurveTo(-63,34,-24,38);ctx.lineTo(53,33);ctx.quadraticCurveTo(72,28,79,1);ctx.closePath();ctx.fill();ctx.fillStyle='#df6a38';ctx.fillRect(-70,4,143,7);ctx.fillStyle='#173b52';ctx.beginPath();ctx.moveTo(-58,12);ctx.quadraticCurveTo(-40,28,-17,29);ctx.lineTo(52,26);ctx.quadraticCurveTo(61,22,67,12);ctx.closePath();ctx.fill();ctx.fillStyle='#f5f0d7';roundRect(-34,-29,64,33,5);ctx.fill();ctx.fillStyle='#5aa6b6';ctx.fillRect(-27,-23,22,14);ctx.fillRect(2,-23,20,14);ctx.strokeStyle='#102a39';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(25,-17);ctx.lineTo(33,-46);ctx.stroke();ctx.fillStyle='#efb371';ctx.beginPath();ctx.arc(33,-55,8,0,TAU);ctx.fill();ctx.fillStyle='#f3d357';ctx.beginPath();ctx.arc(33,-59,10,Math.PI,TAU);ctx.fill();ctx.strokeStyle='#32281f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(31,-38);ctx.quadraticCurveTo(80,-75,103,-31);ctx.stroke();ctx.restore()}
function drawLine(){const rx=W*.52+103,ry=WATER-49;ctx.strokeStyle='#d9f3f5dd';ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(hook.x,hook.y-3);ctx.stroke();if(state!=='ready'&&state!=='menu'){ctx.strokeStyle='#d9e1df';ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(hook.x,hook.y-5);ctx.lineTo(hook.x,hook.y+10);ctx.quadraticCurveTo(hook.x+1,hook.y+20,hook.x+10,hook.y+14);ctx.stroke();ctx.fillStyle='#ff675c';ctx.beginPath();ctx.arc(hook.x,hook.y-5,4.5,0,TAU);ctx.fill();ctx.fillStyle='#fff4c7';ctx.beginPath();ctx.ellipse(hook.x+5,hook.y+7,7,4,.35,0,TAU);ctx.fill()}}
function drawParticles(){for(const b of bubbles){ctx.globalAlpha=b.life*.38;ctx.strokeStyle='#c7f7ff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.stroke()}for(const p of particles){ctx.globalAlpha=p.life;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill()}ctx.globalAlpha=1}
function draw(){ctx.save();if(shake)ctx.translate(rnd(-shake,shake),rnd(-shake,shake));drawSky();drawWater();drawFloor();fish.forEach(drawFish);drawParticles();drawLine();drawBoat();ctx.restore();const v=ctx.createRadialGradient(W/2,H*.45,150,W/2,H*.5,520);v.addColorStop(.55,'transparent');v.addColorStop(1,'#00101f68');ctx.fillStyle=v;ctx.fillRect(0,0,W,H)}
function loop(ms){const dt=Math.min(.033,(ms-last)/1000||.016);last=ms;update(dt);draw();requestAnimationFrame(loop)}

function pointerXFromEvent(e){const r=c.getBoundingClientRect();return cl((e.clientX-r.left)/r.width*W,20,W-20)}
c.addEventListener('pointerdown',e=>{pointerX=pointerXFromEvent(e);if(state==='drop')showHint('MOVE THE LURE NEAR A FISH',.7)});c.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')pointerX=pointerXFromEvent(e)});
ui.act.addEventListener('pointerdown',e=>{e.preventDefault();ensureAudio();if(state==='ready')cast();else if(state==='fight'){hold=true;ui.act.classList.add('hold');tone(150,.04,'sine',.009,15)}});['pointerup','pointercancel','pointerleave'].forEach(k=>ui.act.addEventListener(k,()=>{hold=false;ui.act.classList.remove('hold')}));
ui.play.addEventListener('click',newRun);ui.openShop.addEventListener('click',openShop);ui.shopQuick.addEventListener('click',openShop);ui.closeShop.addEventListener('click',closeShop);ui.summaryShop.addEventListener('click',()=>{ui.summary.classList.remove('open');openShop()});ui.again.addEventListener('click',newRun);ui.sound.addEventListener('click',()=>setSound(!soundOn));window.addEventListener('blur',()=>{hold=false;ui.act.classList.remove('hold')});

if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){
 window.__deepCatchV3={
   state:()=>({state,score,streak,catches,rareCaught,coins:profile.coins,equipped:profile.equipped,owned:[...profile.owned],tension,catchProgress,fishStamina}),
   grantCoins:n=>{profile.coins+=n;saveProfile();updateHUD();renderShop()},openShop,closeShop,start:newRun,cast,
   equip:id=>{if(rodMap[id]){if(!profile.owned.includes(id))profile.owned.push(id);profile.equipped=id;saveProfile();applyRodTheme();updateHUD();renderShop()}},
   forceBite:(name='SNAPPER')=>{const s=species.find(v=>v.n===name)||species[1],f=fish.find(v=>!v.hooked);Object.assign(f,{s,x:hook.x+4,y:hook.y+4,baseY:hook.y+4,mode:'cruise',interest:1,bite:.6});biteLock=0;bite(f)},
   forceLand:()=>targetFish&&landFish(),forceBreak:()=>targetFish&&loseFish(),setCatches:n=>{catches=n},setFight:o=>{if(o.tension!=null)tension=o.tension;if(o.progress!=null)catchProgress=o.progress;if(o.stamina!=null)fishStamina=o.stamina;updateFightUI()},renderShop
 };
}
seedWorld();applyRodTheme();updateHUD();updateFightUI();renderShop();requestAnimationFrame(loop);
})();
