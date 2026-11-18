import * as T from 'three';
export function buildFloors({scene,box,cyl,textSign,player,state,showModal,closeModal,showMissions,showStock}){
 const names=['Térreo','Mezanino','Terraço'],height=5,entry={x:-7,z:.1},rooms=[],lift=new T.Group();
 scene.add(lift);box(1.45,.07,1.45,0xc69d59,0,.03,0,lift);
 for(const x of [-.65,.65])box(.09,2.3,.09,0x875f40,x,1.15,-.65,lift);
 textSign('ELEVADOR',1.5,.38,'#244e44','#fff3ca',0,2.3,-.62,lift);
 lift.position.set(entry.x,0,entry.z);
 let floor=0,destination=null;
 for(let f=1;f<=2;f++){
  const g=new T.Group();rooms.push(g);scene.add(g);g.position.set(entry.x,height*f,entry.z);g.visible=false;
  box(8,.18,6,f===1?0xb77b50:0xceab79,2,-.1,0,g);
  box(8,1.25,.15,0x38826c,2,.6,-3,g);box(.15,1.25,6,0x38826c,-2,.6,0,g);
  textSign(names[f].toUpperCase(),3,.65,'#90382c','#fff5c9',2,1.65,-2.91,g);
  box(2,.88,1,f===1?0x69422d:0x865b36,4,.44,-1.8,g);
  if(f===2)for(let i=0;i<5;i++)cyl(.18,.45,0x538944,3.2+i*.38,1,-1.8,g);
  else box(.85,.48,.08,0xf9e7bd,4,1.19,-1.8,g);
 }
 const badge=document.createElement('button');badge.className='floor-badge';badge.hidden=true;document.body.append(badge);
 function choose(){showModal('<h2>Elevador da casa</h2>'+names.map((n,i)=>'<button data-floor="'+i+'" '+(floor===i?'disabled':'')+'>'+n+'</button>').join(''));document.querySelectorAll('[data-floor]').forEach(b=>b.onclick=()=>{destination=Number(b.dataset.floor);player.path=[];closeModal()})}
 function nearLift(){return Math.hypot(player.g.position.x-entry.x,player.g.position.z-entry.z)<1.25}
 function desk(){return floor&&Math.hypot(player.g.position.x-entry.x-4,player.g.position.z-entry.z+1.8)<1.65}
 function interact(){if(destination!==null)return true;if(nearLift()){choose();return true}if(desk()){(floor===1?showMissions:showStock)();return true}return !!floor}
 badge.onclick=interact;
 return {get floor(){return floor},get upstairs(){return floor!==0||destination!==null},interact,
 update(dt,keys,stick,animate){const p=player.g.position;
 if(destination!==null){const goal=height*destination,delta=goal-p.y;p.x=entry.x;p.z=entry.z;p.y+=Math.sign(delta)*Math.min(Math.abs(delta),dt*4);lift.position.y=p.y;
 rooms.forEach((r,i)=>r.visible=destination===i+1||floor===i+1);if(p.y===goal){floor=destination;destination=null;rooms.forEach((r,i)=>r.visible=floor===i+1)}}
 else if(floor){let x=Number(!!(keys.d||keys.arrowright))-Number(!!(keys.a||keys.arrowleft))+stick.x,z=Number(!!(keys.s||keys.arrowdown))-Number(!!(keys.w||keys.arrowup))+stick.y;const scale=dt*(keys.shift?5:3.1)*(state.chef===3?1.18:1)/Math.max(1,Math.hypot(x,z));let nx=T.MathUtils.clamp(p.x+(x*.866+z*.5)*scale,entry.x-1.6,entry.x+5.6),nz=T.MathUtils.clamp(p.z+(z*.866-x*.5)*scale,entry.z-2.6,entry.z+2.6);if(!(Math.abs(nx-entry.x-4)<1.3&&Math.abs(nz-entry.z+1.8)<.8)){if(x||z)player.g.rotation.y=Math.atan2(nx-p.x,nz-p.z);p.x=nx;p.z=nz}animate(player,dt,!!(x||z))}
 badge.hidden=!floor&&!nearLift()&&destination===null;badge.textContent=names[floor]+' · '+(nearLift()?'Elevador':desk()?(floor===1?'Livro de metas':'Estoque de ingredientes'):'Volte ao elevador para descer');badge.disabled=destination!==null||(!nearLift()&&!desk());
 }};
}
