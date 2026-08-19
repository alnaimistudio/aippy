(() => {
  const VERSION='57';
  const SPRITE='audio/sfx-sprite.mp3?v=57';
  const CUES={
    reload:{start:0,dur:1.50,volume:.86},
    shot:{start:1.662,dur:1.55,volume:1.0},
    impact:{start:3.379,dur:1.04,volume:.82},
    snort:{start:4.585,dur:2.0,volume:.42},
    grunt:{start:6.775,dur:2.0,volume:.48}
  };

  function wavURL(samples,sr){
    const n=samples.length, buf=new ArrayBuffer(44+n*2), v=new DataView(buf);
    const str=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
    str(0,'RIFF'); v.setUint32(4,36+n*2,true); str(8,'WAVE'); str(12,'fmt ');
    v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,sr,true);
    v.setUint32(28,sr*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true); str(36,'data'); v.setUint32(40,n*2,true);
    for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.max(-32767,Math.min(32767,Math.round(samples[i]*32767))),true);
    return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));
  }
  function makeNature(){
    const sr=12000,dur=12,n=sr*dur,a=new Float32Array(n); let seed=17491,lp=0,lp2=0;
    const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1};
    for(let i=0;i<n;i++){
      const t=i/sr,w=rand(); lp+=.018*(w-lp); lp2+=.09*(w-lp2);
      const wind=.55+.18*Math.sin(t*.44)+.11*Math.sin(t*.83+1.3);
      a[i]=(lp*2.0+(lp2-lp)*.16)*wind*.22;
    }
    const birds=[[1.6,2100,2850],[4.5,1750,2450],[7.2,2700,2050],[10.1,1950,3050]];
    for(const [st,f0,f1] of birds){
      const len=Math.floor(sr*.19),at=Math.floor(st*sr); let ph=0;
      for(let j=0;j<len&&at+j<n;j++){
        const q=j/len,f=f0+(f1-f0)*q; ph+=Math.PI*2*f/sr;
        const env=Math.sin(Math.PI*q)**2; a[at+j]+=Math.sin(ph)*env*.045;
      }
    }
    return wavURL(a,sr);
  }
  function makeTone(kind){
    const sr=16000,dur=kind==='click'?.09:.34,n=Math.floor(sr*dur),a=new Float32Array(n);
    for(let i=0;i<n;i++){
      const t=i/sr;
      if(kind==='click') a[i]=(Math.sin(Math.PI*2*900*t)*Math.exp(-t*43)+.32*Math.sin(Math.PI*2*1450*t)*Math.exp(-t*60))*.23;
      else {
        const p1=(Math.sin(Math.PI*2*660*t)+.5*Math.sin(Math.PI*2*990*t))*Math.exp(-t*7.6)*.12;
        const u=Math.max(0,t-.12),p2=t>.12?Math.sin(Math.PI*2*880*u)*Math.exp(-u*11)*.075:0; a[i]=p1+p2;
      }
    }
    return wavURL(a,sr);
  }

  const bank={}; let unlocked=false,started=false,deerTimer=0,lastImpact=0,lastNotify='';
  const make=(src,volume=1,loop=false)=>{const a=new Audio(src);a.preload='auto';a.playsInline=true;a.volume=volume;a.loop=loop;return a};
  for(const [name,c] of Object.entries(CUES))bank[name]=make(SPRITE,c.volume,false);
  bank.nature=make(makeNature(),.21,true); bank.click=make(makeTone('click'),.30,false); bank.notify=make(makeTone('notify'),.36,false);

  async function unlock(){
    if(unlocked)return true; unlocked=true;
    await Promise.all(Object.entries(bank).map(async([name,a])=>{
      try{const v=a.volume;a.muted=true;a.currentTime=0;await a.play();a.pause();a.currentTime=0;a.muted=false;a.volume=v}
      catch(e){a.muted=false;console.warn('[audio57] unlock',name,e)}
    }));
    return true;
  }
  function playSimple(name,volume){if(!unlocked)return;const a=bank[name];if(!a)return;try{a.pause();a.currentTime=0;if(volume!=null)a.volume=volume;a.play().catch(()=>{})}catch{}}
  function playCue(name,volume){
    if(!unlocked)return;const a=bank[name],c=CUES[name];if(!a||!c)return;clearTimeout(a.__stopTimer);
    try{a.pause();a.currentTime=c.start;a.volume=volume??c.volume;a.play().catch(e=>console.warn('[audio57] cue',name,e));a.__stopTimer=setTimeout(()=>{try{a.pause();a.currentTime=c.start}catch{}},Math.max(120,(c.dur-.03)*1000))}catch(e){console.warn('[audio57] cue failed',name,e)}
  }
  function duckNature(ms=900){const a=bank.nature;if(!a)return;a.volume=.09;clearTimeout(duckNature.t);duckNature.t=setTimeout(()=>a.volume=.21,ms)}
  function startNature(){if(!unlocked)return;started=true;bank.nature.loop=true;bank.nature.volume=.21;bank.nature.play().catch(e=>console.warn('[audio57] nature',e));scheduleDeer()}
  function scheduleDeer(){clearTimeout(deerTimer);if(!started)return;deerTimer=setTimeout(()=>{if(document.visibilityState==='visible'&&!document.querySelector('#shop')?.classList.contains('open'))playCue(Math.random()<.58?'snort':'grunt',.34+Math.random()*.12);scheduleDeer()},7000+Math.random()*6500)}

  document.addEventListener('pointerdown',e=>{
    const id=e.target?.id;
    if(id==='start'){unlock().then(()=>{playSimple('click');startNature()});return}
    if(!unlocked)return;
    if(id==='fire'){duckNature(1100);playCue('shot');return}
    if(id==='reload'){duckNature(1650);playCue('reload');return}
    if(e.target?.closest?.('button,.rifle'))playSimple('click');
  },true);

  const dmg=document.querySelector('#dmg');
  if(dmg)new MutationObserver(()=>{
    if(!dmg.classList.contains('show')||!dmg.textContent.trim())return;const now=performance.now();if(now-lastImpact<180)return;lastImpact=now;
    duckNature(700);playCue('impact');setTimeout(()=>playCue('grunt',.42),100)
  }).observe(dmg,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});

  const msg=document.querySelector('#msg');
  if(msg)new MutationObserver(()=>{
    const text=msg.textContent.trim();if(!msg.classList.contains('show')||!text||text===lastNotify)return;lastNotify=text;
    if(/BAG FULL|DEER SOLD|PURCHASE|EQUIPPED|SHOT BLOCKED|DEER DOWN|READY/i.test(text))playSimple('notify');
    setTimeout(()=>{if(lastNotify===text)lastNotify=''},1200)
  }).observe(msg,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});

  document.addEventListener('visibilitychange',()=>{if(!unlocked)return;if(document.visibilityState==='hidden')bank.nature.pause();else if(started)bank.nature.play().catch(()=>{})});
  window.__forestAudio57={version:VERSION,unlock,startNature,playCue,status:()=>({unlocked,started,naturePaused:bank.nature.paused,natureReady:bank.nature.readyState})};
  console.info('[Forest Stalker] audio57 ready');
})();
