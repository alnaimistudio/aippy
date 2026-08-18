const PARTS=4;
const base=new URL('.',import.meta.url);
try{
  const sources=await Promise.all(Array.from({length:PARTS},(_,i)=>fetch(new URL(`game56/part-${i}.txt?v=56`,base),{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error(`game part ${i}: ${r.status}`);return r.text()})));
  const blob=new Blob([sources.join('')],{type:'text/javascript'});
  const url=URL.createObjectURL(blob);
  await import(url);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}catch(error){
  console.error('Forest Stalker V5.6 load failed',error);
  const b=document.querySelector('#start'); if(b){b.disabled=false;b.textContent='RETRY';b.onclick=()=>location.reload();}
}
