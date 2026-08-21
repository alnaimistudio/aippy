import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL='https://cdn.jsdelivr.net/gh/Quaternius/TestGltfAssets@master/Deer/Deer.glb';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function waitForGame(){
  for(let i=0;i<240;i++){
    const api=window.__forestStalker;
    if(api?.deer?.length)return api;
    await sleep(50);
  }
  throw new Error('Forest Stalker deer API not ready');
}

try{
  const [api,gltf]=await Promise.all([waitForGame(),new GLTFLoader().loadAsync(MODEL)]);
  const clips=gltf.animations||[];
  const death=clips.find(c=>/death|die/i.test(c.name));
  const locomotion=clips.find(c=>/deeranimations|walk|run|gallop|move/i.test(c.name)&&c!==death)||clips.find(c=>c!==death);
  if(!locomotion)throw new Error('No deer locomotion animation clip in GLB');
  const controllers=new Map();
  for(const d of api.deer){
    d.rig=Object.create(null);d.base=Object.create(null);
    const mixer=new THREE.AnimationMixer(d.model);
    const move=mixer.clipAction(locomotion,d.model);
    move.enabled=true;move.setLoop(THREE.LoopRepeat,Infinity);move.clampWhenFinished=false;move.play();
    let deathAction=null;
    if(death){deathAction=mixer.clipAction(death,d.model);deathAction.enabled=true;deathAction.setLoop(THREE.LoopOnce,1);deathAction.clampWhenFinished=true;}
    controllers.set(d,{mixer,move,death:deathAction,deadPlayed:false});
  }
  let last=performance.now(),acc=0;
  function tick(now){
    requestAnimationFrame(tick);
    const dt=Math.min(.05,(now-last)/1000);last=now;acc+=dt;
    if(acc<1/30)return;
    const step=acc;acc=0;
    for(const d of api.deer){
      const c=controllers.get(d);if(!c)continue;
      const state=d.state||'wander';
      if(state==='dead'){
        if(!c.deadPlayed){c.deadPlayed=true;c.move.stop();if(c.death)c.death.reset().fadeIn(.05).play();}
      }else{
        if(c.deadPlayed){c.deadPlayed=false;c.death?.stop();c.move.reset().play();}
        c.move.paused=false;c.move.timeScale=state==='run'?1.75:.72;if(!c.move.isRunning())c.move.play();
      }
      c.mixer.update(step);
    }
  }
  requestAnimationFrame(tick);
  window.__forestAnim59={version:'59',clips:clips.map(c=>c.name),locomotion:locomotion.name,death:death?.name||null,controllers};
  console.info('[Forest Stalker] anim59 active',{clips:clips.map(c=>c.name),locomotion:locomotion.name,death:death?.name});
}catch(err){console.error('[Forest Stalker] anim59 failed',err);}
