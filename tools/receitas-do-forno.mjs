import fs from 'node:fs';
const folder=new URL('../assets/ui/',import.meta.url);
const circle=(x,y,r,fill)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const sausage=`<circle r="7" fill="#952f22" stroke="#72271b" stroke-width="1.1"/><circle cy="-.8" r="5.8" fill="#d9532f"/><path d="M-3 -2l2 -1m1 5l2 -1m0 -5l1 1" stroke="#ffaf63" stroke-width="1.6" stroke-linecap="round"/>`;
const basil='<path d="M-8 3Q-6 -6 0 -5L8 -5Q7 3 0 5Z" fill="#34733f" stroke="#245839"/><path d="M-6 3L6 -4" stroke="#83a34d"/>';
const mozzarella='<path d="M-7 -2Q-5 -7 0 -6Q8 -6 8 1Q7 6 1 6Q-6 7 -7 2Z" fill="#fff2b4" stroke="#dda44e"/><path d="M-4 -3L0 -4" stroke="#fffbe5" stroke-width="2"/>';
const tomato='<circle r="6.4" fill="#d64726" stroke="#ac3825"/><path d="M0 0l-3 -2m3 2l3 -2m-3 2v3" stroke="#ffb64d" stroke-width="1.8"/>';
const chicken='<path d="M-7 1L-1 -5L5 -4L8 -1L1 5L-5 4Z" fill="#bb702c" stroke="#985328"/><path d="M-4 1L2 -3M0 3L5 -1" stroke="#f5c474" stroke-width="1.5"/>';
const cheese='<path d="M-7 3L-1 -6L7 -4L4 5Z" fill="#ffe594" stroke="#d79f42"/><circle cx="1" cy="-1" r="1.5" fill="#e2ad55"/>';
const sets=[[mozzarella,basil,mozzarella],[sausage,sausage,basil],[tomato,mozzarella,basil],[chicken,mozzarella,chicken],[cheese,mozzarella,cheese],[sausage,basil,tomato]];
sets.forEach((set,id)=>{
  let food='';
  for(let i=0;i<16;i++){
    const a=i*2.39996,r=7+Math.sqrt(i)*7;
    const x=(48+Math.cos(a)*r).toFixed(1),y=(44+Math.sin(a)*r*.65).toFixed(1);
    food+=`<g transform="translate(${x} ${y}) rotate(${i*43+id*12}) scale(${i%3===1?.53:.77})">${set[(i+id)%3]}</g>`;
  }
  let blisters='';for(let i=0;i<22;i++){let a=i*.285;blisters+=circle((48+39*Math.cos(a)).toFixed(1),(45+29*Math.sin(a)).toFixed(1),i%3===0?1.5:.9,'#b17442')}
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><radialGradient id="cheese"><stop stop-color="#ffdf78"/><stop offset="1" stop-color="#efa83b"/></radialGradient></defs><rect width="96" height="96" rx="20" fill="${['#376354','#633e34','#34736d','#72482f','#556637','#674252'][id]}"/><ellipse cx="49" cy="55" rx="44" ry="33" fill="#202e26" opacity=".45"/><ellipse cx="48" cy="50" rx="44" ry="32" fill="#9d592e" stroke="#693e28" stroke-width="2"/><ellipse cx="48" cy="45" rx="43" ry="32" fill="#edb86a" stroke="#ffd68b" stroke-width="2"/>${blisters}<ellipse cx="48" cy="45" rx="36" ry="26" fill="#b94027"/><ellipse cx="48" cy="45" rx="34" ry="24.5" fill="url(#cheese)"/>${food}<path d="M13 33Q21 20 39 17" stroke="#ffdf9b" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  fs.writeFileSync(new URL('pizza-'+id+'.svg',folder),svg);
});

