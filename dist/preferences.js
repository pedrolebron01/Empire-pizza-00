export const GRAPHICS = {
  baixa: {scale:.7, shadows:0, texture:1, distance:37, detailLight:false, smoothing:false, smoke:.25},
  media: {scale:1, shadows:1, texture:2, distance:55, detailLight:true, smoothing:false, smoke:.65},
  alta: {scale:1, shadows:2, texture:8, distance:80, detailLight:true, smoothing:true, smoke:1}
};
export const BINDINGS = {w:'w',a:'a',s:'s',d:'d',shift:'shift',e:'e',q:'q'};
const clamp=(n,min,max,fallback)=>Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
const pick=(value,choices,fallback)=>choices.includes(value)?value:fallback;
export function validKey(value){return typeof value==='string'&&/^(?:[a-z0-9]|shift|control|alt)$/.test(value);}
export function restorePreferences(raw={},preset='media'){
  const s=raw||{},base=GRAPHICS[preset]||GRAPHICS.media,g=s.graphics||{},bindings={...BINDINGS};
  const candidate=Object.keys(bindings).map(id=>s.bindings?.[id]);
  if(candidate.every(validKey)&&new Set(candidate).size===candidate.length)Object.keys(bindings).forEach((id,i)=>bindings[id]=candidate[i]);
  return {
    graphics:{scale:clamp(g.scale,.5,1.5,base.scale),shadows:pick(g.shadows,[0,1,2],base.shadows),
      texture:pick(g.texture,[1,2,4,8],base.texture),distance:clamp(g.distance,35,90,base.distance),
      detailLight:typeof g.detailLight==='boolean'?g.detailLight:base.detailLight,
      contact:typeof g.contact==='boolean'?g.contact:base.contact,
      smoothing:typeof g.smoothing==='boolean'?g.smoothing:base.smoothing,smoke:clamp(g.smoke,0,1,base.smoke)},
    bindings,interfaceScale:clamp(s.interfaceScale,.85,1.25,1),textScale:clamp(s.textScale,1,1.4,1),
    contrast:s.contrast===true,highlights:s.highlights===true,captions:s.captions===true,
    flash:clamp(s.flash,0,1,.65),voiceVolume:clamp(s.voiceVolume,0,1,0),cameraSensitivity:clamp(s.cameraSensitivity,0,2,1),invert:s.invert===true
  };
}
export function actionKey(bindings,key){
  key=key.toLowerCase();
  if(key.startsWith('arrow')||key==='escape')return key;
  return Object.keys(bindings).find(action=>bindings[action]===key);
}
export function textureQuality(root,renderer,requested){
  const aniso=Math.min(renderer.capabilities.getMaxAnisotropy(),requested);
  root.traverse(obj=>{
    for(const m of Array.isArray(obj.material)?obj.material:[obj.material]){
      if(m?.map&&m.map.anisotropy!==aniso){m.map.anisotropy=aniso;m.map.needsUpdate=true;}
    }
  });
}
export function graphicsQuality({renderer,camera,scene,sun,ovenLight},g){
  renderer.setPixelRatio(Math.min(3,Math.min(2,globalThis.devicePixelRatio||1)*g.scale*(g.smoothing?1.35:1)));
  renderer.shadowMap.enabled=g.shadows>0;
  const size=g.shadows===2?2048:768;
  if(sun.shadow.mapSize.x!==size){sun.shadow.mapSize.set(size,size);sun.shadow.map?.dispose();sun.shadow.map=null;}
  camera.far=g.distance;
  camera.updateProjectionMatrix();
  if(scene.fog){scene.fog.far=g.distance;scene.fog.near=g.distance*.66;}
  ovenLight.visible=g.detailLight;
  scene.traverse(obj=>{if(obj.userData?.contactShadow)obj.visible=g.contact;});
  textureQuality(scene,renderer,g.texture);
}
const captions={arrival:'Cliente entrando',order:'Comanda recebida',ovenIn:'Porta do forno abrindo',ovenOut:'Pizza retirada',ovenReady:'Sino do forno',burn:'Pizza passando do ponto',tip:'Gorjeta recebida',mission:'Missão concluída',event:'Evento no salão',leave:'Cliente saindo',prepDone:'Montagem concluída',helperDrop:'Roberto guardou uma pizza',delivery:'Pedido entregue'};
let captionTimer;
export function caption(kind){if(!captions[kind])return;let el=document.getElementById('sound-caption');if(!el){el=document.createElement('output');el.id='sound-caption';el.setAttribute('aria-live','polite');document.body.append(el);}clearTimeout(captionTimer);el.hidden=false;el.textContent='♪ '+captions[kind];captionTimer=setTimeout(()=>el.hidden=true,2000);}
export function localVoice(){return globalThis.speechSynthesis?.getVoices().find(v=>v.localService&&/^pt\b/i.test(v.lang));}
export function speak(line,volume){
  const voice=localVoice();if(!voice||!volume||!globalThis.SpeechSynthesisUtterance)return;
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(line);
  utterance.voice=voice;utterance.lang=voice.lang;utterance.volume=volume;speechSynthesis.speak(utterance);
}
export function applyInterface(p){
  const root=document.documentElement;
  root.style.setProperty('--interface-scale',p.interfaceScale);
  root.style.setProperty('--text-scale',p.textScale);
  document.body.classList.toggle('large-text',p.textScale!==1);
  document.body.classList.toggle('strong-contrast',p.contrast);
  document.body.classList.toggle('show-interactions',p.highlights);
  const el=document.getElementById('sound-caption');if(el&&!p.captions)el.hidden=true;
}

