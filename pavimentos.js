import {circuitTask,signCircuit} from './regional.js';
import * as T from 'three';
const names=['Térreo','Mezanino','Terraço'];
const entry={x:-2.65,z:3.65}, height=5;
export function buildFloors({scene,box,cyl,textSign,player,state,showModal,closeModal,showMissions,showStock,showChefs,save,toast}){
 const rooms=[],lift=new T.Group(),furniture=[[],[],[]];
 scene.add(lift);lift.position.set(entry.x,0,entry.z);
 box(1.45,.07,1.45,0xc69d59,0,.045,0,lift);
 for(const x of [-.65,.65])box(.09,2.3,.09,0x875f40,x,1.15,-.65,lift);
 textSign('ELEVADOR',1.5,.38,'#244e44','#fff3ca',0,2.3,-.62,lift);
 let path=[],autoInteract=false;
 let floor=0,destination=null,rideOrigin=null,rideTime=0;
 for(let f=1;f<=2;f++){
  const room=new T.Group();rooms.push(room);scene.add(room);room.position.set(entry.x,height*f,entry.z);room.visible=false;
  const b=(w,h,d,col,x,y,z)=>box(w,h,d,col,x,y,z,room);
  const c=(r,h,col,x,y,z)=>cyl(r,h,col,x,y,z,room);
  b(8,.18,6,f===1?0xb77b50:0xceab79,2,-.1,0);
  b(8,1.25,.15,0x38826c,2,.6,-3);b(.15,1.25,6,0x38826c,-2,.6,0);
  for(let x=-1.8;x<6;x+=.8)b(.06,.72,.06,0x845739,x,.36,2.94);
  b(8,.08,.12,0x95693a,2,.74,2.94);
  textSign(names[f].toUpperCase(),3,.65,'#90382c','#fff5c9',2,1.65,-2.91,room);
  const solid=(x,z,w,d)=>furniture[f].push({x,z,w,d});
  b(2,.88,1,f===1?0x69422d:0x865b36,4,.44,-1.8);solid(4,-1.8,2,1);
  if(f===2){
   for(const x of [1,4]){b(1.6,.55,.8,0x905e41,x,.275,1.6);solid(x,1.6,1.6,.8);for(let i=0;i<4;i++){const sprig=c(.17,.41,0x63a15b,x-.56+i*.37,.65,1.6);sprig.rotation.z=(i%2-.5)*.4}}
   for(let i=0;i<5;i++)c(.18,.45,0x538944,3.2+i*.38,1,-1.8);
   textSign('HORTA',1.3,.35,'#456c43','#fff3c6',4,1.48,-2.05,room);
  }else{
   b(.85,.48,.08,0xf9e7bd,4,1.19,-1.8);
   c(.7,.1,0xc89559,3,.86,1.45);c(.13,.8,0x594735,3,.41,1.45);solid(3,1.45,1.5,1.5);
   for(const x of [1.95,4.05]){b(.54,.5,.58,0xb45c43,x,.25,1.45);solid(x,1.45,.54,.58)}
   textSign('ESCRITÓRIO',1.65,.35,'#45645a','#fff3c6',4,1.52,-2.04,room);
  }
 }
 const badge=document.createElement('button');badge.className='floor-badge';badge.hidden=true;document.body.append(badge);
 const near=(x,z,r)=>Math.hypot(player.g.position.x-entry.x-x,player.g.position.z-entry.z-z)<r;
 const nearLift=()=>near(0,0,1.25),desk=()=>floor&&near(4,-1.8,1.75);
 function choose(){
  showModal('<h2>Elevador da casa</h2>'+names.map((n,i)=>'<button data-floor="'+i+'" '+(floor===i?'disabled':'')+'>'+n+' · '+['Cozinha e salão','Escritório e vestiário','Horta e despensa'][i]+'</button>').join(''));
  document.querySelectorAll('[data-floor]').forEach(b=>b.onclick=()=>{
   path=[];autoInteract=false;destination=Number(b.dataset.floor);rideOrigin=player.g.position.clone();rideTime=0;player.path=[];closeModal();
  });
 }
 function useDesk(){
  const job=circuitTask(state);
  if(job?.waiting&&job.desk===floor){
   showModal('<h2>'+job.j.name+'</h2><p>'+job.j.host+' reservou duas rodadas para o grupo. '+job.j.rule.text+'</p><button id="regional-desk">'+(floor===1?'Assinar ficha da mesa':'Separar ramo aromático')+'</button>');
   document.querySelector('#regional-desk').onclick=()=>{if(signCircuit(state,floor)){save();closeModal();toast('A mesa foi confirmada. As comandas já podem chegar ao térreo.');}};
   return;
  }
  if(floor===1){
   showModal('<h2>Escritório da casa</h2><p>Consulte as metas ou troque de avental. A bandeja precisa estar vazia para a troca.</p><button id="floor-goals">Abrir livro de metas</button><button id="floor-closet">Escolher pizzaiolo</button>');
   document.querySelector('#floor-goals').onclick=showMissions;document.querySelector('#floor-closet').onclick=()=>showChefs(state.chef);return;
  }
  const left=Math.max(0,4-(state.served-state.lastHarvest)),full=state.stock[5]>=999;
  showModal('<h2>Horta do terraço</h2><p>Colha uma porção da mistura de ervas da Especial da casa. A próxima colheita amadurece a cada quatro entregas.</p><button id="floor-harvest" '+(left||full?'disabled':'')+'>'+(full?'Estoque cheio':left?'Faltam '+left+' entregas':'Colher ervas · +1 porção')+'</button><button id="floor-stock">Abrir estoque</button>');
  document.querySelector('#floor-stock').onclick=showStock;document.querySelector('#floor-harvest').onclick=()=>{if(state.served-state.lastHarvest<4||state.stock[5]>=999)return;state.stock[5]++;state.lastHarvest=state.served;save();closeModal();toast('Ervas colhidas · +1 porção para a Especial da casa.')};
 }
 function interact(){if(destination!==null)return true;if(nearLift()){choose();return true}if(desk()){useDesk();return true}return !!floor}
 function valid(x,z){return x>=-1.62&&x<=5.62&&z>=-2.62&&z<=2.62&&!furniture[floor].some(o=>Math.abs(x-o.x)<o.w/2+.23&&Math.abs(z-o.z)<o.d/2+.23)}
 function walkTo(x,z){
  if(!floor||destination!==null)return false;
  x-=entry.x;z-=entry.z;
  const toDesk=Math.hypot(x-4,z+1.8)<1.3,toLift=Math.hypot(x,z)<.85;
  if(toDesk){x=4;z=-.9}else if(toLift){x=0;z=0}
  if(!valid(x,z))return false;
  const p=player.g.position,step=.25,start=[Math.round((p.x-entry.x)/step),Math.round((p.z-entry.z)/step)],end=[Math.round(x/step),Math.round(z/step)];
  const queue=[start],parents=new Map([[start.join(),null]]);
  for(let i=0;i<queue.length;i++){
   const n=queue[i];
   if(n[0]===end[0]&&n[1]===end[1]){
    path=[];for(let node=n;parents.get(node.join());node=parents.get(node.join()))path.unshift({x:node[0]*step,z:node[1]*step});
    path.push({x,z});autoInteract=toDesk||toLift;return true;
   }
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const next=[n[0]+dx,n[1]+dz],key=next.join();if(!parents.has(key)&&valid(next[0]*step,next[1]*step)){parents.set(key,n);queue.push(next)}}
  }
  return false;
 }
 badge.onclick=interact;
 return {entry,walkTo,get floor(){return floor},get upstairs(){return floor!==0||destination!==null},interact,
 update(dt,keys,stick,animate){
  const p=player.g.position;
  if(destination!==null){
   rideTime+=dt;const t=Math.min(1,rideTime/(.32+Math.abs(destination-floor)*1.25)),ease=t*t*(3-2*t);
   p.x=rideOrigin.x+(entry.x-rideOrigin.x)*Math.min(1,rideTime/.32);p.z=rideOrigin.z+(entry.z-rideOrigin.z)*Math.min(1,rideTime/.32);
   p.y=rideOrigin.y+(height*destination-rideOrigin.y)*ease;lift.position.y=p.y;animate(player,dt,false);
   rooms.forEach((r,i)=>r.visible=destination===i+1||floor===i+1);
   if(t===1){floor=destination;destination=null;rooms.forEach((r,i)=>r.visible=floor===i+1)}
  }else if(floor){
   let x=Number(!!(keys.d||keys.arrowright))-Number(!!(keys.a||keys.arrowleft))+stick.x;
   let z=Number(!!(keys.s||keys.arrowdown))-Number(!!(keys.w||keys.arrowup))+stick.y;
   if(x||z){path=[];autoInteract=false}
   else if(path.length){
    const target=path[0],dx=entry.x+target.x-p.x,dz=entry.z+target.z-p.z,d=Math.hypot(dx,dz);
    const step=3.1*(state.chef===3?1.18:1)*dt;
    x=dx/Math.max(step,d);z=dz/Math.max(step,d);
    if(d<=step){path.shift();if(!path.length&&autoInteract){autoInteract=false;interact()}}
   }
   const distance=(keys.shift?5:3.1)*(state.chef===3?1.18:1)*dt/Math.max(1,Math.hypot(x,z));
   const ox=p.x-entry.x,oz=p.z-entry.z;
   if(valid(ox+x*distance,oz))p.x+=x*distance;if(valid(p.x-entry.x,oz+z*distance))p.z+=z*distance;
   if(x||z)player.g.rotation.y=Math.atan2(x,z);animate(player,dt,!!(x||z));
  }
  badge.hidden=!floor&&!nearLift()&&destination===null;badge.textContent=destination!==null?'Elevador · '+names[destination]:names[floor]+' · '+(nearLift()?'Elevador':desk()?(floor===1?'Escritório e vestiário':'Horta e estoque'):'Explore o andar');
  badge.disabled=destination!==null||(!nearLift()&&!desk());
 }};
}
