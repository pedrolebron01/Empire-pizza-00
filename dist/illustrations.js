// Static, original SVG assets. The underlying glyph remains if an image cannot load.
export function art(name, fallback='✦', large=false){
  return `<span class="illustration${large?' portrait':''}" aria-hidden="true"><span>${fallback}</span><img src="./assets/ui/${name}.svg" alt="" width="64" height="64" decoding="async"></span>`;
}
export function installArtFallback(root=document){
  root.addEventListener('error',event=>{
    if(event.target.matches?.('.illustration img'))event.target.style.display='none';
  },true);
}
