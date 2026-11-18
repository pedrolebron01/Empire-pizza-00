import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from './vendor/three.module.js';
import {fresh,restore} from './core.js';
import {chefs} from './brigada.js';
import {casas} from './casas.js';
async function localModule(path){
 const source=(await fs.readFile(new URL(path,import.meta.url),'utf8')).replaceAll("'three'","'"+new URL('./vendor/three.module.js',import.meta.url).href+"'").replaceAll("'./casas.js'","'"+new URL('./casas.js',import.meta.url).href+"'");
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const [{makePerson,dressChef},{buildFloors},{buildDistrict}]=await Promise.all(['./atelier.js','./pavimentos.js','./bairros.js'].map(localModule));
const scene=new T.Scene();scene.background=new T.Color();scene.fog=new T.Fog(0,1,10);
const paint=new T.MeshBasicMaterial();
function mesh(geo,x,y,z,parent=scene){const obj=new T.Mesh(geo,paint);obj.position.set(x,y,z);parent.add(obj);return obj}
const api={scene,sun:new T.DirectionalLight(),box:(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),x,y,z,p),sphere:(r,c,x,y,z,p)=>mesh(new T.SphereGeometry(r),x,y,z,p),cyl:(r,h,c,x,y,z,p)=>mesh(new T.CylinderGeometry(r,r,h),x,y,z,p),textSign:(t,w,h,b,f,x,y,z,p)=>mesh(new T.PlaneGeometry(w,h),x,y,z,p)};
for(const [i,chef] of chefs.entries()){
 const actor=makePerson(api,chef.color,chef.skin,true);dressChef(actor,i,api);
 assert.ok(actor.accessories.children.length);
 for(const cue of ['pickup','prepare','insert','remove','give','celebrate','regret','talk']){
  actor.motion.signal(cue);
  for(let n=0;n<12;n++)actor.motion.update(1/60,{moving:false,carrying:false});
  assert.ok(actor.arms.some(a=>Math.abs(a.rotation.x)>.02),chef.name+' '+cue);
 }
}
const district=buildDistrict(api);
for(let i=0;i<casas.length;i++){district.refresh(i);assert.equal(scene.background.getHex(),casas[i].sky);assert.equal(restore(JSON.stringify({...fresh(),served:70,casa:i})).casa,i)}
const player=makePerson(api,0,0,true),state=fresh(),buttons=[0,1,2].map(i=>({dataset:{floor:String(i)}})),nodes=new Map();
globalThis.document={createElement:()=>({}),body:{append(){}},querySelectorAll:()=>buttons,querySelector:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id)}};
const floors=buildFloors({...api,player,state,showModal(){},closeModal(){},showMissions(){},showStock(){},showChefs(){},save(){},toast(){}});
player.g.position.set(-2.65,0,3.65);
for(const f of [1,2,0]){floors.interact();buttons[f].onclick();for(let i=0;i<180;i++)floors.update(1/60,{}, {x:0,y:0},()=>{});assert.equal(floors.floor,f);assert.equal(player.g.position.y,5*f);
 if(f===2){assert.ok(floors.walkTo(floors.entry.x+4,floors.entry.z-1.8));for(let n=0;n<240;n++)floors.update(1/60,{}, {x:0,y:0},()=>{});assert.ok(nodes.has('#floor-harvest'));const count=state.stock[5];nodes.get('#floor-harvest').onclick();nodes.get('#floor-harvest').onclick();assert.equal(state.stock[5],count+1);player.g.position.set(-2.65,10,3.65)}
}
assert.equal(floors.upstairs,false);
console.log('PASS: seis modelos articulados, 48 gestos no mixer Three.js, sete cenários, restauração do mapa, elevador 0→1→2→0 e colheita única.');
