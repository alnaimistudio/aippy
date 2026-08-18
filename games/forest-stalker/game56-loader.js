const PARTS=['code/game56-1.b64','code/game56-2.b64','code/game56-3.b64','code/game56-4.b64','code/game56-5.b64'];
try{
  const chunks=await Promise.all(PARTS.map(async p=>{
    const r=await fetch(p+'?v=56',{cache:'no-store'});
    if(!r.ok)throw new Error(`${p} ${r.status}`);
    return (await r.text()).trim();
  }));
  const raw=atob(chunks.join('').replace(/\s/g,''));
  const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  const source=new TextDecoder().decode(bytes);
  const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  await import(url);
  URL.revokeObjectURL(url);
}catch(err){
  console.error('Forest Stalker V5.6 load failed',err);
  const b=document.querySelector('#start');
  if(b){b.disabled=false;b.textContent='RETRY';b.onclick=()=>location.reload();}
}
