import {abrirDiario,registrar,proximoRelato} from './legado.js';
import {awardStamp,travelMap} from './passaporte.js';
import {handFinish} from './bancada.js';
import {atmosphere,layTiles,surface} from './ambiente.js';
import {titleMenu} from './titulo.js';
import {makePerson,dressChef} from './atelier.js';
import {buildDistrict} from './bairros.js';
import {casas,districtGuest} from './casas.js';
import {circuitTask,circuitDelivery,showCircuit} from './regional.js';
import {BOOKINGS,openOffice,officeDelivery,scoreCup,stockSnapshot} from './management.js';
import {graphicsQuality,textureQuality,applyInterface,actionKey,caption,speak} from './preferences.js';
import {openSettings,cancelDisplayPreview} from './settings-panel.js';
import {buildFloors} from './pavimentos.js';
import {chefs} from './brigada.js';
import {STORY_CHAPTERS,SERVICES,restoreService,currentService,startService,serviceOrder,recordService,serviceProgress} from './service.js';
import {CHAPTERS,CONTRACTS,currentContract,campaignEvent,campaignMarkup} from './campaign.js';
import {Tutorial,LESSONS} from './tutorial.js';
import {art,installArtFallback} from './illustrations.js';
import {RestaurantAudio} from './audio.js';
import {DAILY_GOALS,ensureDaily,recordDaily,nearestUnlock,specialCustomer,specialBonus,comboBonus,eventAt} from './progression.js';
import {storePizza, takePizza, findReadyPizza} from './counter.js';
import * as T from 'three';

import {recipeAvailable,recipeRequirement,RECIPES,UPGRADES,MISSIONS,fresh,restore,level,cost,buy,claim,missionValue,reward,canStand,route} from './core.js';
const settingsStyle=document.createElement('link');settingsStyle.rel='stylesheet';settingsStyle.href='./settings.css';document.head.append(settingsStyle);
const $=s=>document.querySelector(s),KEY='pizza-empire-v1';
let state, hasSession=false;
try {
  const raw=localStorage.getItem(KEY);
  if(raw!==null && JSON.parse(raw)?.version!==1)throw Error();
  state=restore(raw);
  if(raw)hasSession=JSON.parse(raw)?.opened!==false;
} catch { throw new Error("Não foi possível ler o progresso salvo. O original foi preservado. Confira o acesso ao armazenamento deste navegador."); }
state.service=restoreService(state.service);
let paused=false,started=false,time=0,spawnClock=0,combo=0,selected=null,serial=1,hand=[],ovens=[],shelf=[],customers=[],work=null,toastTime=0,uiClock=0,rush=false,nearest=null,heldIndex=0;
const keys={},obstacles=[],labels=[],models={},stations=[];
function save(){try{localStorage.setItem(KEY,JSON.stringify({...stockSnapshot(state,[...hand,...ovens,...shelf,...roberto.carrying,...(officeActors.courier?.carrying||[])]),opened:hasSession}));}catch{toast('Salvamento indisponível neste navegador.');}}
function toast(t){if(toastTime>0){if(!notices.includes(t)&&notices.length<1)notices.push(t);return;}$('#toast').textContent=t;$('#toast').style.opacity=1;toastTime=3.5;}
function tickNotices(dt){toastTime-=dt;if(toastTime<=0){$('#toast').style.opacity=0;if(notices.length)toast(notices.shift());}}
const music=new RestaurantAudio(()=>state);function sound(kind,delay=0){if(kind==='dough'||kind==='ovenIn'){registrar(state,kind);save();}if(['ovenIn','ovenOut','helperTake'].includes(kind))doorTime=.92;const gesture={dough:'pickup',ovenIn:'insert',ovenOut:'remove',delivery:'give',combo:'celebrate',wrong:'regret',helperTake:'remove',helperDrop:'give',store:'give',take:'pickup'}[kind];if(gesture)(kind.startsWith('helper')?roberto:player).motion.signal(gesture);music.effect(kind,delay);if(state.preferences.captions)caption(kind);advanceTutorial(kind);if(['store','helperDrop','restock'].includes(kind)){if(kind==='helperDrop'&&state.circuit.active!==null){const t=circuitTask(state);if(t?.j.rule.id==='helper')t.p.assisted=true;}recordCampaign(kind);recordService(state,kind);save();}}
let knownLevel=level(state),streak=0,guideRing=null,currentEvent=-1,eventServed=0,eventRecipes=new Set(),eventPaid=false,eventWarned=false,eventStarted=false;
const notices=[];
const tutorial=new Tutorial(state.tutorialProgress);
const motionReduced=()=>state.reducedMotion??matchMedia("(prefers-reduced-motion: reduce)").matches;
let menuMouse=0;addEventListener('pointermove',e=>menuMouse=(e.clientX/innerWidth*2-1)*state.preferences.cameraSensitivity*(state.preferences.invert?-1:1));let introTime=0;let introPizza=null,introGuest=null;
let walkTarget=null,guideStation='dough';
const scene=new T.Scene();scene.background=new T.Color('#e5dcca');scene.fog=new T.Fog('#e5dcca',35,70);
const renderer=new T.WebGLRenderer({canvas:$('#world'),antialias:true});renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const camera=new T.PerspectiveCamera(40,innerWidth/innerHeight,.1,100);
scene.add(new T.HemisphereLight(0xfff1cd,0x617366,2.2));const sun=new T.DirectionalLight(0xffe5b6,3);sun.position.set(-7,15,8);sun.castShadow=true;sun.shadow.camera.left=-15;sun.shadow.camera.right=15;sun.shadow.camera.top=13;sun.shadow.camera.bottom=-13;sun.shadow.normalBias=.04;scene.add(sun);
let renderGraphics=state.preferences.graphics,renderFps=state.fps;
function quality(g=state.preferences.graphics,fps=state.fps){renderGraphics=g;renderFps=fps;graphicsQuality({renderer,camera,scene,sun,ovenLight},g);resize();}
function updateInterface(){applyInterface(state.preferences);document.body.classList.toggle('reduced-motion',motionReduced());}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);
const mats=new Map();function mat(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,...surface(c)}));return mats.get(c);}
function mesh(geo,c,x,y,z,parent=scene){const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,c,x,y,z,p=scene){return mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);}
function cyl(r,h,c,x,y,z,p=scene,r2=r){return mesh(new T.CylinderGeometry(r,r2,h,20),c,x,y,z,p);}
function sphere(r,c,x,y,z,p=scene){return mesh(new T.SphereGeometry(r,12,8),c,x,y,z,p);}
function textSign(text,w,h,bg,fg,x,y,z,parent=scene){let cv=document.createElement('canvas');cv.width=768;cv.height=192;let c=cv.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,768,192);c.fillStyle=fg;c.font='bold 65px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(text,384,96,730);let tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;let m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tx}));m.position.set(x,y,z);parent.add(m);return m;}
function label(obj,text,cls='',height=2.4){let el=document.createElement('div');el.className='label '+cls;el.textContent=text;$('#labels').append(el);let item={obj,el,height};labels.push(item);return item;}
function disposeGroup(group){group.traverse(o=>{if(o.geometry)o.geometry.dispose();});scene.remove(group);}
const ground=box(80,.2,80,0xd9d5bf,0,-.65,0);ground.castShadow=false;
box(18,.5,12,0x675649,0,-.3,0);box(18.5,.15,12.5,0xbfae89,0,-.55,0);
layTiles(scene,mat);
box(18,3.5,.2,0xe8b985,0,1.7,-6);box(.2,3.5,12,0xe8b985,-9,1.7,0);
box(18,.9,.23,0x426659,0,.45,-5.87);box(.23,.9,12,0x426659,-8.87,.45,0);
for(let x=-8.8;x<9;x+=.55)box(.045,.85,.04,0x305344,x,.45,-5.72);
box(18,.09,.12,0xdeb77e,0,.95,-5.7);box(.12,.09,12,0xdeb77e,-8.72,.95,0);
// Cutaway shopfront: striped awning and entry mat keep the room visible.
box(3.2,.025,1.5,0x416453,-.5,.03,4.9);for(let i=0;i<8;i++)box(.4,.04,1.5,i%2?0xf5dfab:0xba4936,-1.9+i*.4,.06,4.9);
const marquee=textSign('FORNO & FORTUNA',5.1,.85,'#923d2a','#ffe6a5',-1,2.65,-5.74);
const updateAtmosphere=atmosphere(scene,marquee);
textSign('FORNO A LENHA  •  DESDE HOJE',3.7,.4,'#e8b985','#84492d',-1,1.98,-5.73);
for(let x of [-6.7,5.7]){box(2.5,1.65,.15,0x6c4935,x,2.15,-5.75);box(2.25,1.4,.16,0x91b6b3,x,2.15,-5.64);box(.08,1.4,.2,0xe8ce9c,x,2.15,-5.5);box(2.3,.07,.2,0xe8ce9c,x,2.15,-5.5);}
function plant(x,z){cyl(.25,.45,0xb96f45,x,.22,z);for(let i=0;i<6;i++){let leaf=sphere(.26,0x50784b,x+Math.sin(i)*.2,.6+i*.06,z+Math.cos(i)*.2);leaf.scale.set(.6,1.5,.7);}}plant(-8,4.7);plant(7.8,-4.9);
const furniture=new T.Group();scene.add(furniture);
function obstacle(x,z,w,d){obstacles.push({x,z,w,d});}
function counter(x,z,w,d,color=0x9a5a35){box(w,1.05,d,color,x,.54,z,furniture);box(w+.15,.12,d+.12,0xecd8ad,x,1.12,z,furniture);for(let dx=-w/2+.3;dx<w/2;dx+=.65){box(.49,.72,.03,0xc1844c,x+dx,.55,z+d/2+.02,furniture);box(.12,.04,.08,0x57422f,x+dx,.79,z+d/2+.07,furniture);}obstacle(x,z,w,d);}
function table(x,z){cyl(.85,.12,0xad6d3f,x,.87,z,furniture);cyl(.11,.8,0x375047,x,.4,z,furniture);cyl(.43,.08,0x375047,x,.06,z,furniture);box(.7,.015,.7,0xf3e2c2,x,.94,z,furniture);cyl(.09,.2,0xc66c46,x,1.05,z,furniture);sphere(.14,0x608443,x,1.23,z,furniture);obstacle(x,z,1.65,1.65);for(let a of [-1,1]){box(.65,.12,.65,0xa84532,x,.45,z+a*1.22,furniture);box(.65,.6,.1,0xad4e39,x,.75,z+a*1.5,furniture);for(let dx of [-.24,.24])for(let dz of [-.24,.24])box(.07,.4,.07,0x483e31,x+dx,.2,z+a*1.22+dz,furniture);obstacle(x,z+a*1.22,.65,.65);}}
const ovenLight=new T.PointLight(0xff8030,12,5);ovenLight.position.set(0,1,-3.5);scene.add(ovenLight);
let ovenGroup,ovenDoor,doorTime=0,expansionWall;
function rebuild(){furniture.traverse(o=>{o.geometry?.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}});furniture.clear();for(let i=0;i<Math.min(6,Math.floor(state.service.index/6));i++){textSign(STORY_CHAPTERS[i].name,1.5,.45,'#a33526','#fff2ac',-5.5+i*1.65,2.65,-5.55,furniture);}obstacles.length=0;if(state.office.cleaner)obstacle(3.45,2.95,.55,.5);if(state.office.host)obstacle(-6.85,2.55,.55,.5);if(state.office.buyer)obstacle(2.75,-4.65,.55,.5);const doughX=state.office.layout?-3.9:-7,benchX=state.office.layout?-7:-3.9;
for(const [id,x] of [['dough',doughX],['bench',benchX]]){
 points[id].x=x;
 stations.find(s=>s.id===id).x=x;
 labels.find(l=>l.el.dataset.station===id).obj.position.x=x;
}
counter(doughX,-4.65,2.4,1.25);counter(benchX,-4.65,2.6,1.25,state.upgrades.bench?0x42695b:0x9a5a35);counter(-5,1.8,4.4,1.1);counter(1.7,-4.65,1.2,1.25);
box(1.8,.03,.8,0xbf8b53,benchX,1.2,-4.65,furniture);for(let i=0;i<4;i++){box(.36,.12,.38,0x647477,benchX-1+i*.6,1.23,-5,furniture);sphere(.12,[0xbd4732,0xf7de85,0x9a4930,0x477d40][i],benchX-1+i*.6,1.34,-5,furniture);}for(let i=0;i<3;i++)cyl(.28,.1,0xf2d29e,doughX-.7+i*.6,1.26,-4.6,furniture);
ovenGroup=new T.Group();furniture.add(ovenGroup);ovenGroup.position.set(-.65,0,-4.55);const ow=2.1+state.upgrades.oven*.13;box(ow,.7,1.55,0x92583d,0,.35,0,ovenGroup);let dome=sphere(1.08,0xb24d33,0,1,0,ovenGroup);dome.scale.set(ow/2,1,.77);box(1.3,.7,.1,0x322a23,0,.91,.82,ovenGroup);ovenDoor=new T.Group();ovenGroup.add(ovenDoor);ovenDoor.position.set(-.65,.91,.91);box(1.3,.12,.12,0x503e32,.65,.28,0,ovenDoor);box(.09,.45,.09,0x503e32,.06,0,0,ovenDoor);box(.09,.45,.09,0x503e32,1.23,0,0,ovenDoor);box(1.3,.08,.1,0x503e32,.65,-.23,0,ovenDoor);box(1.1,.11,.65,0x695048,0,.58,1,ovenGroup);box(.6,1.2,.6,0x6b5142,0,2.15,-.15,ovenGroup);for(let i=0;i<5;i++){const f=sphere(.13,0xffa530,-.4+i*.2,.7,.86,ovenGroup);f.scale.y=1.5+i%2*.8;}obstacle(-.65,-4.55,ow,1.8);
if(state.campaign.complete||state.service.complete){cyl(.24,.4,0xf1bb36,1.7,1.4,-4.65,furniture);sphere(.26,0xf1bb36,1.7,1.75,-4.65,furniture);}for(let i=0;i<3;i++)box(.3,.035,.3,({classica:0xd95d3f,verde:0x45a675,azul:0x28a3b5}[state.appearance]||0xd95d3f),-6+i*.65,1.21,1.8,furniture);table(1,1.3);if(state.upgrades.tables>=1)table(-7.25,-.7);if(state.upgrades.tables>=2)table(1,-1.8);
if(state.upgrades.expand){table(6,1.4);table(6,-2.5);box(.2,1.1,12,0x426659,9,.55,0,furniture);}else{box(.15,.8,12,0x887b61,3.85,.4,0,furniture);for(let z=-5;z<6;z+=1)box(.2,1.2,.15,0x887b61,3.85,.6,z,furniture);textSign('FUTURO SALÃO',3,.6,'#e4cfa4','#715b39',6,1.3,0,furniture);}
for(let i=0;i<state.upgrades.decor+1;i++){box(.8,.95,.12,0x68452e,-7+i*1.3,2,-5.65,furniture);textSign(['BUON APPETITO','FATTO CON AMORE','PIZZA & AMIGOS','CASA CHEIA'][i],.72,.8,'#f4dfac','#b14c35',-7+i*1.3,2,-5.56,furniture);}
if(state.upgrades.bench){box(2.9,.1,.3,0x546d5c,benchX,2,-5.45,furniture);for(let i=0;i<5;i++)cyl(.1,.28,0xd5b271,benchX-1.1+i*.5,2.17,-5.45,furniture);}customers.forEach(c=>c.path=[]);roberto.path=[];for(const actor of [player,roberto,...customers]){if(actor.g.position.y<.1&&!canStand(actor.g.position.x,actor.g.position.z,obstacles,!!state.upgrades.expand)){let spot=null;for(let radius=.3;radius<7&&!spot;radius+=.3){for(let a=0;a<16;a++){let x=actor.g.position.x+Math.cos(a*Math.PI/8)*radius,z=actor.g.position.z+Math.sin(a*Math.PI/8)*radius;if(canStand(x,z,obstacles,!!state.upgrades.expand)){spot={x,z};break;}}}if(spot)actor.g.position.set(spot.x,0,spot.z);}}}
let contactMaterial;
function person(...args){
  const actor=makePerson({scene,box,cyl,sphere},...args);
  if(!contactMaterial){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
    gradient.addColorStop(0,'rgba(37,22,13,.44)');gradient.addColorStop(.48,'rgba(37,22,13,.20)');gradient.addColorStop(1,'rgba(37,22,13,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
    contactMaterial=new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  }
  const shadow=new T.Mesh(new T.PlaneGeometry(.98,.65),contactMaterial);
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.022;shadow.userData.contactShadow=true;shadow.visible=renderGraphics.contact;actor.g.add(shadow);
  return actor;
}
const player=person(chefs[state.chef].color,chefs[state.chef].skin,true);player.g.position.set(-5.7,0,-2.5);dressChef(player,state.chef,{box,cyl,sphere});const ring=mesh(new T.TorusGeometry(.4,.035,8,40),0xf2d58e,0,.03,0,player.g);ring.rotation.x=Math.PI/2;
const roberto=person(0xb34934,0xbf885e,true,true);roberto.g.position.set(-2.6,0,-1.4);label(roberto.g,'ROBERTO','roberto',2.45);
const officeActors = {};
let cookBatch=null;
function updateTeamCook(dt){
 if(!state.office.cook)return;
 const benchX=points.bench.x,target=benchX+.55;
 const chef=officeActors.cook??=person(0x476999,0x986447,true);
 if(!chef.assigned){chef.assigned=true;chef.g.position.set(target,0,-5.4);}
 const distance=target-chef.g.position.x,moving=Math.abs(distance)>.02;
 if(moving){chef.g.position.x+=Math.sign(distance)*Math.min(Math.abs(distance),dt*1.5);chef.g.rotation.y=Math.sign(distance)*Math.PI/2;}
 else chef.g.rotation.y=0;
 if(!cookBatch){
   const c=customers.find(c=>c.status!=='exit'&&c.recipe<3);
   if(c){cookBatch={recipe:c.recipe,remaining:16-3*state.office.cook,visual:pizza({stage:'dough'})};scene.add(cookBatch.visual);}
 }
 const preparing=!!cookBatch&&cookBatch.remaining>0;
 animatePerson(chef,dt,moving,preparing);
 if(!cookBatch)return;
 if(preparing&&!moving){
   cookBatch.remaining=Math.max(0,cookBatch.remaining-dt);
   if(!cookBatch.remaining){
     disposeGroup(cookBatch.visual);
     cookBatch.visual=pizza({stage:'raw',recipe:cookBatch.recipe,quality:1});
     scene.add(cookBatch.visual);
     toast('Jana terminou uma '+RECIPES[cookBatch.recipe].name+'. Retire na bancada com a bandeja livre.');
   }
 }
 cookBatch.visual.position.set(chef.g.position.x,1.26,-4.86);
}
function collectTeamPizza(){
 if(!cookBatch||cookBatch.remaining>0)return false;
 if(hand.length>=1+state.upgrades.tray+Number(state.chef===4))return false;
 hand.push({stage:'raw',recipe:cookBatch.recipe,quality:1});heldIndex=hand.length-1;
 disposeGroup(cookBatch.visual);cookBatch=null;
 sound('prepDone');refreshPizzas();renderUI();return true;
}
function updateTeamCourier(dt){
 if(!state.office.courier)return;
 const courier=officeActors.courier??=person(0xc06628,0xae7352);
 if(!courier.assigned){courier.g.position.set(2.8,0,4.8);courier.assigned=true;}
 courier.pickup??={x:points.counter.x+1.1,z:points.counter.z};
 const speed=1.6+.4*state.office.courier,carried=courier.carrying[0];
 if(carried){
   const c=customers.find(c=>c.id===courier.client&&c.status==='wait'&&c.booking===state.office.page&&state.office.active);
   if(c){
     const z=Math.min(5.17,c.g.position.z+.78);
     if(!courier.drop||Math.hypot(c.g.position.x-courier.drop.x,z-courier.drop.z)>.25)courier.drop={x:c.g.position.x,z};
   }
   const reached=navigate(courier,c?courier.drop:courier.pickup,speed,dt);
   courier.parcel.position.set(courier.g.position.x+Math.sin(courier.g.rotation.y)*.4,1.05,courier.g.position.z+Math.cos(courier.g.rotation.y)*.4);
   if(!reached)return;
   if(c)deliver(c,carried,courier.carrying);
   else shelf.push(courier.carrying.pop());
   disposeGroup(courier.parcel);courier.parcel=null;refreshPizzas();save();return;
 }
 const c=state.office.active&&customers.find(c=>c.booking===state.office.page&&c.status==='wait'&&shelf.some(p=>p.stage==='ready'&&p.recipe===c.recipe));
 if(!c){
   courier.home??={x:2.8,z:4.8};
   navigate(courier,courier.home,speed,dt);return;
 }
 if(!navigate(courier,courier.pickup,speed,dt))return;
 const i=shelf.findIndex(p=>p.stage==='ready'&&p.recipe===c.recipe);
 const [parcel]=shelf.splice(i,1);
 courier.carrying.push(parcel);courier.client=c.id;courier.drop=null;
 courier.parcel=pizza(parcel);scene.add(courier.parcel);
 courier.parcel.position.set(courier.g.position.x,1.05,courier.g.position.z+.4);
 refreshPizzas();sound('helperTake');
}
function updateOfficeTeam(dt){
 updateTeamCourier(dt);
 updateTeamCook(dt);
 for(const [id,shirt,skin,x,z,turn] of [
   ['host',0x218e82,0x966042,-6.85,2.55,.5],
   ['cleaner',0x2c9b98,0xaf7354,3.45,2.95,1.6],
   ['buyer',0x86507e,0xc78d64,2.75,-4.65,-.9]
 ]){
   if(!state.office[id])continue;
   if(!officeActors[id]){
     const actor=person(shirt,skin);
     actor.g.position.set(x,0,z);
     actor.g.rotation.y=turn;
     const card=box(.23,.27,.03,0xf7dda6,.04,-.27,.1,actor.arms[1]);
     card.rotation.x=id==='cleaner'?1.5:.25;
     officeActors[id]=actor;
   }
   const employee=officeActors[id];
   const busy=id==='host'?customers.some(c=>c.status==='enter'):time%8<3;
   animatePerson(employee,dt,false,busy);
 }
}
function pizza(p){const g=new T.Group();cyl(.35,.09,p.quality<.7?0x604132:0xdba65a,0,0,0,g);if(p.stage!=='dough'){cyl(.315,.02,0xbf4330,0,.055,0,g);cyl(.29,.025,0xf1ce6e,0,.072,0,g);for(let i=0;i<8;i++){let a=i*2.399,r=.12+(i%2)*.1;const top=cyl(.055,.025,RECIPES[p.recipe||0].color,Math.cos(a)*r,.098,Math.sin(a)*r,g);if(p.recipe===2)top.scale.set(.65,1,1.5);}}if(p.stage==='ready'){box(.83,.03,.83,0xbd9056,0,-.065,0,g);if(models.pizza&&p.recipe<6){g.children.slice(0).forEach(o=>{if(o.geometry)o.geometry.dispose();});g.clear();let real=models.pizza.clone();g.add(real);box(.83,.03,.83,0xbd9056,0,-.065,0,g);}}return g;}
let shown=[];
const transferTarget=new T.Vector3();
function trayPosition(actor,i,v){
 const angle=actor.g.rotation.y,scale=actor.g.scale.y;
 return v.copy(actor.g.position).addScaledVector(trayOffset.set(Math.sin(angle)*.45,(1+i*.16)*scale,Math.cos(angle)*.45),1);
}
const trayOffset=new T.Vector3();
function refreshPizzas(){
 for(const mesh of shown)disposeGroup(mesh);
 shown=[];
 const groups=[[hand,player],[ovens,null],[shelf,null],[roberto.carrying,roberto]];
 for(const [items,carrier] of groups)items.forEach((p,i)=>{
  const old=p.visual,model=pizza(p),rest=new T.Vector3();
  if(carrier)trayPosition(carrier,i,rest);
  else if(items===ovens)rest.set(-1.15+i*.35,.8,-3.65);
  else rest.set(-6.4+i%4*.93,1.24+Math.floor(i/8)*.16,1.5+Math.floor(i/4)%2*.6);
  const from=old?.position.clone()||rest.clone();
  if(!old&&carrier===player&&p.stage==='dough')from.set(points.dough.x,1.23,points.dough.z-.75);
  model.position.copy(from);scene.add(model);shown.push(model);p.visual=model;
  model.userData.transfer={carrier,i,rest,from,age:0};
 });
}
function updateFoodModels(dt){
 for(const model of shown){
  const tr=model.userData.transfer;
  tr.age=Math.min(.38,tr.age+dt);
  if(tr.carrier)trayPosition(tr.carrier,tr.i,transferTarget);else transferTarget.copy(tr.rest);
  const t=tr.age/.38;
  model.position.lerpVectors(tr.from,transferTarget,t*t*(3-2*t));
  if(t<1)model.position.y+=Math.sin(t*Math.PI)*Math.min(.18,tr.from.distanceTo(transferTarget)*.14);
 }
}
async function loadAssets(){try{const manifest=await (await fetch('./assets/models.json')).json();const key=Object.keys(manifest).find(k=>k.toLowerCase()==='pizza')||Object.keys(manifest).find(k=>/^pizza(?!.*box|.*cutter)/i.test(k));if(!key)return;const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');const gltf=await new GLTFLoader().loadAsync('./'+manifest[key]);const g=gltf.scene;let bounds=new T.Box3().setFromObject(g),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());g.position.sub(center);const wrap=new T.Group();wrap.add(g);wrap.scale.setScalar(.7/Math.max(size.x,size.z));models.pizza=wrap;textureQuality(wrap,renderer,renderGraphics.texture);refreshPizzas();}catch(e){console.info('Food Kit indisponível; visual procedural ativo.',e.message);}}
const points={dough:{x:-7,z:-3.35},bench:{x:-3.9,z:-3.35},oven:{x:-.65,z:-3.1},counter:{x:-5,z:.65},stock:{x:1.7,z:-3.35},bin:{x:-8,z:2.9}};
for(const [id,p]of Object.entries(points)){stations.push({...p,id});let anchor=new T.Object3D();anchor.position.set(p.x,.1,p.z-.65);scene.add(anchor);const stationLabel=label(anchor,{dough:'01 · MASSA',bench:'02 · BANCADA',oven:'03 · FORNO',counter:'04 · BALCÃO',stock:'DESPENSA',bin:'DESCARTAR'}[id],'',1.35);stationLabel.el.dataset.station=id;stationLabel.el.setAttribute('role','button');stationLabel.el.tabIndex=0;stationLabel.el.onclick=()=>goToStation(id);stationLabel.el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goToStation(id);}};}
cyl(.28,.6,0x67766a,-8,.3,2.9);cyl(.3,.06,0x9bada0,-8,.63,2.9);
const ovenLabel=label(ovenLight,'Forno livre','',.4);
const steamMaterial=new T.MeshBasicMaterial({color:0xfff4d7,transparent:true,opacity:.25,depthWrite:false});
const steam=Array.from({length:14},(_,i)=>{const m=new T.Mesh(new T.SphereGeometry(.07,7,5),steamMaterial.clone());m.visible=false;scene.add(m);return m;});
function updateSteam(){let sources=[...(!started?[new T.Vector3(-.65,2.7,-4.55)]:[]),...ovens.filter(p=>p.stage==='ready').map(()=>new T.Vector3(-.65,1.05,-3.65)),...hand.filter(p=>p.stage==='ready'&&p.visual).map(p=>p.visual.position),...shelf.slice(0,2).map((p,i)=>new T.Vector3(-6+i*.7,1.3,1.8))];steam.forEach((m,i)=>{m.visible=!!sources.length&&state.particles&&!motionReduced()&&i<Math.round(steam.length*renderGraphics.smoke);if(!m.visible)return;let t=((started?time:introTime)*.65+i*.19)%1,src=sources[i%sources.length];m.position.copy(src).add(new T.Vector3(Math.sin(i*3+time)*.12,.12+t*.7,Math.cos(i)*.12));m.scale.setScalar(.6+t*1.2);m.material.opacity=(1-t)*.24;});}

function animatePerson(p,dt,moving,working=false){
 const carrying=p===player?hand.length>0:p.carrying.length>0;
 p.motion.update(dt,{moving,running:p===player&&keys.shift,working:working&&!carrying||p===player&&!!work,carrying,reduced:motionReduced()});
}

function actorCanStand(actor,x,z){return canStand(x,z,obstacles,!!state.upgrades.expand)&&![player,roberto,...customers,...(officeActors.courier?[officeActors.courier]:[])].some(a=>a!==actor&&Math.abs(actor.g.position.y-a.g.position.y)<1&&Math.hypot(a.g.position.x-x,a.g.position.z-z)<.49);}
function navigate(p,target,speed,dt){
 if(Math.hypot(p.g.position.x-target.x,p.g.position.z-target.z)<.36){p.blocked=0;animatePerson(p,dt,false);return true;}
 p.retry=Math.max(0,(p.retry||0)-dt);
 if((!p.path.length||p.target!==target)&&!p.retry){p.path=route(p.g.position,target,obstacles,!!state.upgrades.expand);p.target=target;p.retry=.4;}
 const n=p.path[0];if(!n){animatePerson(p,dt,false);return false;}
 const dx=n.x-p.g.position.x,dz=n.z-p.g.position.z,d=Math.hypot(dx,dz),v=Math.min(d,speed*dt);
 if(d<.03){p.path.shift();return false;}
 const nx=p.g.position.x+dx/d*v,nz=p.g.position.z+dz/d*v;
 if(!actorCanStand(p,nx,nz)){p.blocked=(p.blocked||0)+dt;animatePerson(p,dt,false);if(p.blocked>1.1){const others=[player,roberto,...customers,...(officeActors.courier?[officeActors.courier]:[])].filter(a=>a!==p).map(a=>({x:a.g.position.x,z:a.g.position.z,w:.22,d:.22}));p.path=route(p.g.position,target,[...obstacles,...others],!!state.upgrades.expand);p.retry=.6;if(p.blocked>2.5){for(const sign of [-1,1]){const side={x:p.g.position.x+sign*.65,z:p.g.position.z};if(actorCanStand(p,side.x,side.z)){p.path=[side,...p.path];break;}}p.blocked=0;}}return false;}
 p.blocked=0;p.g.position.x=nx;p.g.position.z=nz;p.g.rotation.y=Math.atan2(dx,dz);if(d<.1)p.path.shift();animatePerson(p,dt,true,p.carrying.length>0);return false;
}
const queue=[{x:-5,z:3},{x:-3.8,z:3.65},{x:-2.7,z:4.25},{x:-1.5,z:4.25},{x:0,z:4.25},{x:1.5,z:4.25},{x:4.4,z:4.25},{x:6,z:4.25}];const exit={x:-.5,z:5.1};
function spawn(){if(state.shopOpen===false)return;if(customers.filter(c=>c.status!=='exit').length>=2+state.upgrades.tables+2*state.upgrades.expand)return;if([player,roberto,...customers,...Object.values(officeActors)].some(a=>Math.abs(a.g.position.y)<1&&Math.hypot(a.g.position.x-exit.x,a.g.position.z-exit.z)<.85))return;let r=state.served<3?0:Math.floor(Math.random()*level(state));const directed=serviceOrder(state,customers.filter(c=>c.status!=="exit"&&c.serviceId===state.service.index).reduce((n,c)=>n+c.remaining,0));const contract=currentContract(state);if(state.service.active&&contract?.recipe!==undefined&&RECIPES[contract.recipe].level<=level(state))r=contract.recipe;if(directed)r=directed.recipe;const office=state.office;
const book=office.active&&!state.service.active&&!customers.some(c=>c.booking===office.page&&c.status!=='exit')?BOOKINGS[office.page]:null;
if(book)r=book.recipes[office.stamp];
const tour=state.circuit.active!==null?circuitTask(state):null;
if(tour){if(tour.waiting||customers.some(c=>c.tour===tour.j.id&&c.status!=='exit'))return;r=tour.recipe;}
let special=book||tour?null:directed?.qty===2?{name:'Mesa de '+directed.host,qty:2,patience:260,money:20,xp:15,kind:'family'}:(!directed&&state.casa&&districtGuest(state.casa,serial)||specialCustomer(state.served,serial)),vip=!!special;
let c=person([0x299cab,0xe9b638,0x9c66b2,0x409268,0xd66c45][serial%5],[0xe2af81,0x995f43,0xc78c65][serial%3]);Object.assign(c,{serviceId:directed?state.service.index:null,priority:directed?.priority||false,name:['Sofia','Miguel','Lia','Davi','Clara','Bento','Ana','Caio'][serial%8],id:serial++,recipe:r,qty:special?.qty||1,remaining:special?.qty||1,patience:special?.patience||180,maxPatience:special?.patience||180,status:'enter',vip,special,perfect:true});c.g.position.set(-.5,0,5.1);c.label=label(c.g,RECIPES[r].name,'',2.1);if(state.casa&&serial%3===0&&!directed)c.name=casas[state.casa].host;if(directed?.priority){c.patience=c.maxPatience=115;c.name=directed.host+' · prioritário';}if(book){c.name=book.client+' · retirada';c.booking=office.page;}
if(tour){c.name=tour.j.host;c.tour=tour.j.id;if(tour.j.rule.id==='quick')c.patience=c.maxPatience=110;}
if(office.host){c.maxPatience+=12*office.host;c.patience=c.maxPatience;}
customers.push(c);if(office.coupons&&!state.service.active){office.coupons--;save();}selected??=c.id;sound('arrival');if(special)toast(special.name+' chegou! '+special.qty+' pizza(s) · bônus até R$ '+special.money+'.');}
function removeCustomer(c){spawnClock+=2*state.office.cleaner;scene.remove(c.g);c.g.traverse(o=>o.geometry?.dispose());c.label.el.remove();labels.splice(labels.indexOf(c.label),1);customers.splice(customers.indexOf(c),1);}
function updateCustomers(dt){let active=customers.filter(c=>c.status!=='exit');for(const c of [...customers]){if(c.status==='exit'){if(navigate(c,exit,2,dt))removeCustomer(c);continue;}let target=queue[active.indexOf(c)];if(navigate(c,target,1.5,dt)&&c.status!=='wait'){c.status='wait';c.motion.signal('talk');sound('order');}if(!tutorial.active)c.patience-=dt;if(c.patience<=0){c.motion.signal('regret');c.status='exit';combo=0;streak=0;sound('leave');toast('Um cliente desistiu. Combo encerrado; novos pedidos chegarão.');if(selected===c.id)selected=active.find(x=>x!==c)?.id??null;continue;}c.label.el.innerHTML=`${c.vip?'★ ':''}${c.name} · #${c.id} ${c.remaining}× ${RECIPES[c.recipe].name}<div class="track"><i style="width:${c.patience/c.maxPatience*100}%"></i></div>`;}}
function updateHelper(dt){if(tutorial.active&&!tutorial.done.has('ovenOut'))return;if(!state.upgrades.helper){animatePerson(roberto,dt,false);return;}let speed=1.5+state.upgrades.helper*.6;if(roberto.carrying.length){if(navigate(roberto,points.counter,speed,dt)){shelf.push(...roberto.carrying);roberto.carrying=[];refreshPizzas();sound('helperDrop');toast('Roberto deixou pizzas prontas no balcão.');}return;}if(state.helperWorking===false){animatePerson(roberto,dt,false);return;}if(ovens.some(p=>p.stage==='ready')){if(navigate(roberto,points.oven,speed,dt)){const ready=ovens.filter(p=>p.stage==='ready').slice(0,state.upgrades.helper);roberto.carrying.push(...ready);if(ready.length)sound('helperTake');ovens=ovens.filter(p=>!ready.includes(p));refreshPizzas();}}else animatePerson(roberto,dt,false);}
function checkProgress(){
  for(const m of claim(state)){toast(`Missão concluída: ${m.name}! +R$ ${m.money} · +${m.xp} XP`);sound('mission');}
  for(let n=knownLevel+1;n<=level(state);n++)toast(`Nível ${n}! ${RECIPES[n-1].name} desbloqueada. Escolha na bancada!`);
  if(level(state)>knownLevel){sound('level',.5);showUnlock('Novo sabor desbloqueado',RECIPES[level(state)-1].name,'pizza-'+(level(state)-1));}
  knownLevel=level(state);save();
}
function deliver(c,p,source){
  if(c.status!=='wait')return toast('Espere o cliente chegar ao lugar na fila.');
  if(p.stage!=='ready'||!source.includes(p))return;
  if(c.recipe!==p.recipe){combo=0;streak=0;sound('wrong');return toast('Receita diferente. Combo encerrado. Guarde esta pizza ou refaça o pedido.');}
  source.splice(source.indexOf(p),1);streak++;combo=Math.min(streak,5);
  const fast=c.patience/c.maxPatience>.5;
  c.perfect=c.perfect&&p.quality>=1&&fast;
  const gain=reward(state,p.recipe,c.patience/c.maxPatience,p.quality??1,combo,rush);
  if(p.artisan){
    const prize=awardStamp(state,p);state.money+=6;gain.total+=6+prize;gain.tip+=6;
    if(prize)toast("Carimbo de "+casas[state.casa].name+"! +R$ "+prize);
  }
  if(state.casa){const extra=casas[state.casa].tip;state.money+=extra;gain.total+=extra;gain.tip+=extra;}
  if(state.chef===2&&combo>=2){state.money+=3;gain.tip+=3;gain.total+=3;}
  if(state.chef===6&&p.recipe===2&&p.quality>=1){state.money+=8;gain.tip+=8;gain.total+=8;}
  c.remaining--;
  const finished=!c.remaining;
  if(c.tour!==undefined){
    const receipt=circuitDelivery(state,{id:c.tour,recipe:p.recipe,quality:p.quality??1,fast,shelf:source===shelf});
    if(receipt)toast(receipt);
  }
  const sale=officeDelivery(state,{booking:c.booking,recipe:p.recipe,fast,quality:p.quality??1,source:source===shelf||c.booking!==undefined&&source===officeActors.courier?.carrying?'shelf':'hand',finished});
  gain.total+=sale.extra;
  const trophy=scoreCup(state,{recipe:p.recipe,fast,quality:p.quality??1});if(trophy)toast(trophy);
  if(sale.message)toast(sale.message);
  if(finished){
    const bonus=specialBonus(c.special,c.perfect);
    if(bonus){state.money+=bonus.money;state.xp+=bonus.xp;toast(`${c.special.name}: +R$ ${bonus.money} · +${bonus.xp} XP de bônus!`);}
    else if(c.special)toast('Crítico atendido. O bônus exige pizza no ponto e entrega antes de metade da paciência.');
    c.status='exit';if(selected===c.id)selected=customers.find(x=>x.status!=='exit'&&x!==c)?.id??null;
  }
  player.celebrate=.28;sound('delivery');sound('cash',.3);if(gain.tip)sound('tip',.5);
  toastTime=0;toast(`Entrega concluída! +R$ ${gain.total} (inclui R$ ${gain.tip} de gorjeta) · +${Math.round(22*(p.quality??1))} XP`);
  const streakReward=comboBonus(streak);
  if(streakReward){state.money+=streakReward.money;state.xp+=streakReward.xp;sound('combo',.7);toast(`Sequência de ${streak}! +R$ ${streakReward.money} · +${streakReward.xp} XP`);}
  for(const goal of recordDaily(state,{fast,special:finished&&!!c.special})){toast(`Meta diária: ${goal.title}! +R$ ${goal.money} · +${goal.xp} XP`);sound('mission',.9);}
  recordCampaign('delivery',{recipe:p.recipe,quality:p.quality??1,fast,streak});recordCampaign('tips',{amount:gain.tip});if(finished&&c.special)recordCampaign('special');recordVisit(c,p,finished);if(c.serviceId===state.service.index)serviceFeedback(recordService(state,'delivery',{recipe:p.recipe,quality:p.quality??1,source:source===shelf?'shelf':'hand'}));recordEvent(p.recipe);checkProgress();refreshPizzas();renderUI();
}
function interact(){if(paused||work||!started)return;if(floors.interact())return;const n=nearest;if(!n)return;if(n.id==='roberto'){roberto.motion?.signal('talk');return showRoberto();}if(n.id==='customer'){let p=hand[heldIndex]?.stage==='ready'?hand[heldIndex]:hand.find(p=>p.stage==='ready');return p?deliver(n.customer,p,hand):toast('Leve uma pizza pronta para este cliente.');}if(n.id==='dough'){if(hand.length>=(1+state.upgrades.tray+Number(state.chef===4)))return toast('Bandeja cheia. Guarde uma pizza no balcão para liberar espaço.');hand.push({stage:'dough',recipe:null,quality:1});heldIndex=hand.length-1;sound('dough');refreshPizzas();}if(n.id==='bench'){if(state.office.cook&&!hand.some(p=>p.stage==='dough')&&collectTeamPizza())return;if(!hand.some(p=>p.stage==='dough'))return toast('Primeiro pegue uma massa na estação 01.');showRecipes();}if(n.id==='oven'){const ready=ovens.find(p=>p.stage==='ready');if(ready&&hand.length<(1+state.upgrades.tray+Number(state.chef===4))){ovens.splice(ovens.indexOf(ready),1);hand.push(ready);heldIndex=hand.length-1;refreshPizzas();sound('ovenOut');return;}const p=hand.find(p=>p.stage==='raw');if(!p)return toast(ready?'Sua bandeja está cheia. Use E no balcão para guardar uma pizza.':'Prepare uma pizza na Bancada antes de usar o Forno.');if(ovens.length>=1+state.upgrades.oven)return toast('Forno cheio. Aproveite para atender ou preparar outra massa.');hand.splice(hand.indexOf(p),1);p.stage='baking';p.elapsed=0;p.duration=Math.max(4,10-state.upgrades.oven*2)*(state.chef===5?.8:1);ovens.push(p);refreshPizzas();sound('ovenIn');}if(n.id==='counter')return showCounter();if(n.id==='stock')showStock();if(n.id==='bin'){if(!hand.length)return toast('Suas mãos estão vazias.');hand.splice(Math.min(heldIndex,hand.length-1),1);heldIndex=0;refreshPizzas();toast('Pizza descartada. Pegue outra massa gratuitamente.');}renderUI();}
function showModal(html){cancelDisplayPreview();paused=true;keysReset();$('#modalcontent').innerHTML=html;$('#modal').classList.remove('hidden');if(!started)$('#close').classList.remove('hidden');$('#close').focus();}function closeModal(){cancelDisplayPreview();if(!started){home();return;}paused=false;$('#modal').classList.add('hidden');keysReset();if($('#service-hud'))updateQuietHUD();}$('#close').onclick=closeModal;
function showCounter(){if(hand.some(p=>p.stage==='ready')||shelf.some(p=>p.stage==='ready'))advanceTutorial('counter');
  const describe=p=>(p.stage==='dough'?'Massa':RECIPES[p.recipe].name)+' · '+({dough:'crua',raw:'montada, falta assar',ready:p.quality<1?'pronta, passou do ponto':'pronta'}[p.stage]||'em preparo');
  const index=hand.length?Math.max(0,Math.min(heldIndex,hand.length-1)):0;
  const held=hand[index];
  const client=customers.find(c=>c.id===selected&&c.status==='wait')||customers.find(c=>c.status==='wait');
  const fromHand=client&&findReadyPizza(hand,client.recipe);
  const ready=fromHand||(client&&findReadyPizza(shelf,client.recipe));
  showModal(`<span class="eyebrow">04 / BALCÃO DE APOIO E ENTREGA</span><h2>Um lugar para cada pizza.</h2><p>Guarde sua pizza aqui para liberar a bandeja e retirar outra do forno. Você pode guardar massas, pizzas montadas ou prontas e pegá-las depois.</p>
    <div class="grid"><div class="card"><h4>Deixar no balcão</h4><p>${held?describe(held):'Sua bandeja está vazia.'}</p><button id="store-pizza" ${held?'':'disabled'}>Guardar pizza da mão</button></div>
    <div class="card"><h4>Entregar pedido</h4><p>${client?'#'+client.id+' · '+RECIPES[client.recipe].name:'Aguarde um cliente chegar.'}</p><button id="serve-pizza" ${ready?'':'disabled'}>Entregar ${client?'comanda #'+client.id:'pedido'}</button></div></div>
    <h3>Pizzas no balcão · ${shelf.length}</h3><p>${hand.length}/${(1+state.upgrades.tray+Number(state.chef===4))} espaços ocupados na bandeja. ${hand.length>=(1+state.upgrades.tray+Number(state.chef===4))?'Guarde uma pizza antes de pegar outra.':'Escolha qual pizza deseja pegar.'}</p>
    ${shelf.length?shelf.map((p,i)=>`<div class="recipe"><span>${describe(p)}</span><button data-take-pizza="${i}" ${hand.length>=(1+state.upgrades.tray+Number(state.chef===4))?'disabled':''}>Pegar pizza</button></div>`).join(''):'<p>Nenhuma pizza guardada. Roberto também deixa as pizzas prontas aqui.</p>'}`);
  $('#store-pizza').onclick=()=>{
    if(!storePizza(hand,shelf,index))return;
    heldIndex=Math.max(0,Math.min(index,hand.length-1));
    closeModal();refreshPizzas();renderUI();sound('store');
    toast('Pizza guardada no balcão. Sua bandeja tem espaço para outra!');
  };
  $('#serve-pizza').onclick=()=>{
    if(!client||!ready)return;
    closeModal();deliver(client,ready,fromHand?hand:shelf);
  };
  document.querySelectorAll('[data-take-pizza]').forEach(button=>button.onclick=()=>{
    if(!takePizza(shelf,hand,+button.dataset.takePizza,(1+state.upgrades.tray+Number(state.chef===4))))return;
    heldIndex=hand.length-1;
    closeModal();refreshPizzas();renderUI();sound('take');toast('Pizza retirada do balcão.');
  });
}
function showRecipes(){
  const target=customers.find(c=>c.id===selected);
  const available=[],locked=[];
  for(const [i,r] of RECIPES.entries()){
    if(!recipeAvailable(state,i)){locked.push('<p><b>'+r.name+'</b> · '+recipeRequirement(i)+'</p>');continue;}
    const stocked=i<3||state.stock[i]>0;
    const selectedRecipe=target?.recipe===i;
    const row='<article class="cook-row '+(selectedRecipe?'recommended':'')+'">'+art('pizza-'+i,'🍕')+'<div><b>'+r.name+(selectedRecipe?' · Comanda atual':'')+'</b><p>'+r.ingredients+'</p><small>'+(i<3?'Ingredientes da casa':state.stock[i]+' porções')+'</small></div><div class="cook-actions">'+(stocked?'<button data-recipe="'+i+'">Montar</button><button data-hand="'+i+'">Montar à mão</button>':'<strong>Sem estoque</strong>')+'</div></article>';
    if(selectedRecipe)available.unshift(row);else available.push(row);
  }
  showModal('<span class="eyebrow">Bancada de preparo</span><h2>Abra a massa.</h2><p>Escolha um sabor. Na montagem à mão, acerte a ordem das camadas para ganhar R$ 6 extras na entrega.</p>'+available.join('')+(locked.length?'<details class="recipe-locked"><summary>Receitas para descobrir · '+locked.length+'</summary>'+locked.join('')+'</details>':''));
  function allowed(id){
    if(tutorial.active&&!tutorial.done.has('prepDone')&&target&&id!==target.recipe){toast('Escolha '+RECIPES[target.recipe].name+' para o pedido selecionado.');return false}
    return hand.some(p=>p.stage==='dough')&&recipeAvailable(state,id)&&(id<3||state.stock[id]>0);
  }
  function assemble(id,artisan=false){
    if(!allowed(id))return;
    const pizza=hand.find(p=>p.stage==='dough');
    if(id>=3)state.stock[id]--;
    pizza.recipe=id; pizza.stage='preparing'; pizza.artisan=artisan;
    const duration=(2.5-state.upgrades.bench*.55)*(state.chef===1?.75:1);
    work={pizza,left:duration,total:duration};sound('ingredient');sound('prep',.15);
    closeModal();refreshPizzas();save();
  }
  document.querySelectorAll('[data-recipe]').forEach(b=>b.onclick=()=>assemble(Number(b.dataset.recipe)));
  document.querySelectorAll('[data-hand]').forEach(b=>b.onclick=()=>{
    const id=Number(b.dataset.hand);if(allowed(id))handFinish(id,{show:showModal,back:showRecipes,finish:perfect=>assemble(id,perfect),effect:sound});
  });
}
function showUpgrades(){showModal(`<span class="eyebrow">INVISTA NO SEU SONHO</span><h2>Pequenas melhorias. Grande futuro.</h2><p>Caixa disponível: <b>R$ ${state.money}</b>. Cada compra transforma a pizzaria.</p><div class="grid">`+Object.entries(UPGRADES).map(([k,u])=>{let n=state.upgrades[k],locked=k==='helper'&&state.served<3;return `<div class="card">${art(k==='helper'?'roberto':k,'↗')}<h4>${u.name} <small>ETAPA ${n}/${u.max}</small></h4><p>${u.desc(n)}<br>→ ${n<u.max?u.desc(n+1):'Melhoria completa'}</p><button data-buy="${k}" ${n>=u.max||state.money<cost(state,k)||locked?'disabled':''}>${n>=u.max?'Concluído':locked?'Entregue 3 pizzas':'Melhorar · R$ '+cost(state,k)}</button></div>`;}).join('')+'</div>');document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{if(buy(state,b.dataset.buy)){recordCampaign('upgrade');sound('purchase');if(b.dataset.buy==='expand'){sound('expansion',.3);toast('Novo salão aberto! Duas mesas novas e espaço para mais 2 clientes.');showUnlock('Sua pizzaria cresceu!','Duas mesas novas e espaço para mais 2 clientes.','expand');}else toast(UPGRADES[b.dataset.buy].name+' melhorado! '+UPGRADES[b.dataset.buy].desc(state.upgrades[b.dataset.buy]));checkProgress();rebuild();refreshPizzas();renderUI();showUpgrades();}});}
function showMissions(){const next=nearestUnlock(state);showModal('<details><summary>Clientes do bairro</summary>'+((state.history||[]).map(c=>'<p>'+c.name+' · '+c.visits+' visita(s) · '+RECIPES[c.recipe].name+'</p>').join('')||'<p>Seu histórico aparece depois das primeiras entregas.</p>')+'</details>'+campaignMarkup(state)+art('expand','↗',true)+'<h3>Seu próximo desbloqueio</h3><p>'+next.recipe+'<br>'+next.upgrade+'<br>'+next.expansion+'</p>'+dailyMarkup()+'<span class="eyebrow">A SUA JORNADA</span><h2>O legado da pizzaria.</h2>'+MISSIONS.map((m,i)=>`<div class="card">${art('mission','★')}<h4>${state.claimed.includes(i)?'✓ ':''}${m.name}</h4><p>${m.desc} · ${Math.min(m.goal,missionValue(state,m))}/${m.goal}</p><small>R$ ${m.money} + ${m.xp} XP ${state.claimed.includes(i)?'· RECEBIDOS':''}</small></div>`).join(''));}
function showRoberto(){const memoria=STORY_CHAPTERS[Math.min(5,Math.floor(state.service.index/6))].story;speak(memoria,state.preferences.voiceVolume);advanceTutorial('roberto');recordCampaign('roberto');showModal(`${art('roberto','👨‍🍳',true)}<span class="eyebrow">SEU BRAÇO DIREITO</span><h2>Lembra desta casa?</h2><p>“${memoria}”</p><p>${state.upgrades.helper?'Estou levando as pizzas prontas do forno ao balcão. Você entrega a comanda correta pelo balcão e fica com os lucros.':'Vamos começar: pegue a massa, escolha muçarela na bancada, asse e entregue no balcão. Depois de três pizzas, você pode me contratar.'}</p><div class="dialog-actions"><button id="rm">Ver missões</button><button id="rd">Pedir uma dica</button><button id="ru">Melhorar ajudante</button><button id="rs">Sair</button></div>`);$('#rm').onclick=showMissions;$('#ru').onclick=showUpgrades;$('#rs').onclick=closeModal;$('#rd').onclick=()=>{const tips=['Chefe, essa pizza não vai se entregar sozinha! Selecione a comanda e escolha Entregar no balcão.','Pizzas prontas passam do ponto após 18 segundos. A qualidade cai, mas ainda podem ser entregues.','A primeira melhoria do forno custa R$ 65. Dois bons pedidos já resolvem!','Cinco acertos seguidos dobram as gorjetas. Receita errada ou desistência encerra o combo.','Os ingredientes especiais usam estoque. A despensa repõe oito por R$ 24.'];const line=tips[Math.floor(Math.random()*tips.length)];$('#modalcontent p').textContent='“'+line+'”';speak(line,state.preferences.voiceVolume);};}
function showStock(){showModal('<span class="eyebrow">DESPENSA</span><h2>Sempre de portas abertas.</h2><p>Massa, molho e ingredientes das três primeiras receitas são ilimitados. Ingredientes especiais são liberados no nível 4 e custam R$ 24 por '+(8+2*state.office.buyer)+' porções.</p>'+RECIPES.slice(3).map((r,j)=>`<div class="recipe"><span>${r.name} · ${state.stock[j+3]} porções</span><button data-stock="${j+3}" ${!recipeAvailable(state,j+3)||state.money<24?'disabled':''}>+${8+2*state.office.buyer} · R$ 24</button></div>`).join(''));document.querySelectorAll('[data-stock]').forEach(b=>b.onclick=()=>{let i=+b.dataset.stock;if(state.money>=24&&recipeAvailable(state,i)){state.money-=24;state.stock[i]=Math.min(999,state.stock[i]+8+2*state.office.buyer);save();sound('restock');toast('Fornecedor confirmado. A despensa recebeu a caixa de ingredientes.');showStock();renderUI();}});}
function showPause(){openSettings({state,show:showModal,back:()=>started?showGameMenu():home(),save,display:quality,appearance:rebuild,motionReduced,music,updateInterface,notice:toast,anisotropy:()=>renderer.capabilities.getMaxAnisotropy(),tutorial:()=>{if(!started)startGame();else closeModal();startTutorial(true);}});}
$('#upgrades').onclick=showUpgrades;$('#missions').onclick=showMissions;$('#pause').onclick=showGameMenu;
function renderUI(){updateEnhancementUI();$('#money').textContent=state.money.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});$('#level').textContent=`NÍVEL ${level(state)} · ${['APRENDIZ','PIZZAIOLO','ARTESÃO','CHEF','MESTRE','IMPERADOR'][level(state)-1]}`;$('#xp').style.width=(level(state)===6?100:state.xp%100)+'%';$('#xptext').textContent=level(state)===6?'Todas as receitas liberadas':`${state.xp%100} / 100 XP`;let active=customers.filter(c=>c.status!=='exit');$('#count').textContent=`${active.length}/${2+state.upgrades.tables+2*state.upgrades.expand}`;$('#orderlist').innerHTML=active.length?active.map(c=>`<div class="order ${c.id===selected?'selected':''}" data-order="${c.id}" tabindex="0" role="button" aria-pressed="${c.id===selected}">${art('customer-'+c.id%5,'☺')}<h4>${c.id===selected?'✓ Selecionado · ':''}${c.special?'★ '+c.special.name+' · ':''}${c.name} · #${String(c.id).padStart(2,'0')} · ${RECIPES[c.recipe].name}</h4><p>${RECIPES[c.recipe].ingredients}</p><small>${c.remaining} pizza${c.remaining>1?'s':''} · R$ ${RECIPES[c.recipe].price*c.remaining}${c.special?' + até R$ '+c.special.money+' bônus':''} · ${c.status==='enter'?'chegando':Math.ceil(c.patience)+' s'}</small><div class="track"><i style="width:${c.patience/c.maxPatience*100}%"></i></div></div>`).join(''):'<p class="hint">O próximo cliente já está a caminho.</p>';document.querySelectorAll('[data-order]').forEach(el=>{const select=()=>{selected=+el.dataset.order;advanceTutorial('select');document.body.classList.remove('all-orders');renderUI();};el.onclick=select;el.onkeydown=e=>{if(e.key==='Enter')select();};});const mi=MISSIONS.findIndex((m,i)=>!state.claimed.includes(i)),m=MISSIONS[mi];$('#missiontitle').textContent=m?m.name:'Seu império está vivo!';$('#missiondesc').textContent=m?m.desc:'Todas as missões concluídas. Continue servindo e aperfeiçoando sua pizzaria.';$('#missionbar').style.width=m?Math.min(100,missionValue(state,m)/m.goal*100)+'%':'100%';$('#missionreward').textContent=m?`RECOMPENSA · R$ ${m.money} + ${m.xp} XP`:'JORNADA COMPLETA';$('#inventory').innerHTML='<small>BANDEJA</small>'+Array.from({length:(1+state.upgrades.tray+Number(state.chef===4))},(_,i)=>{let p=hand[i];return `<span class="slot ${heldIndex===i?'active':''}" data-slot="${i}">${p?art(p.stage==='dough'?'dough':'pizza-'+p.recipe,'🍕')+(p.stage==='dough'?'Massa':RECIPES[p.recipe].name)+' · '+({dough:'crua',raw:'montada',preparing:'em preparo',ready:'pronta'}[p.stage]||'assando'):'Vazio'}</span>`;}).join('');document.querySelectorAll('[data-slot]').forEach(el=>el.onclick=()=>{heldIndex=+el.dataset.slot;renderUI();});const contract=currentContract(state);$('#missiontitle').textContent=contract?CHAPTERS[contract.chapter][0]:'Festival concluído!';$('#missiondesc').textContent=contract?contract.title+' · '+state.campaign.count+'/'+contract.goal:'Troféu conquistado · desafios opcionais disponíveis';$('#missionbar').style.width=contract?Math.min(100,state.campaign.count/contract.goal*100)+'%':'100%';$('#missionreward').textContent=contract?'R$ '+contract.money+' · '+contract.xp+' XP':'Gorjetas permanentes +10%';$('#inventory').hidden=!hand.length;$('#combo').style.display=combo?'block':'none';$('#combo').textContent=`✦ ${streak} acertos · gorjetas ×${Math.min(2,1+combo*.2).toFixed(1)}${streak<3?' · bônus em 3':streak<5?' · bônus em 5':' · multiplicador máximo'}`;}
function keysReset(){walkTarget=null;player.path=[];player.vx=player.vz=0;for(let k in keys)keys[k]=false;stick.x=stick.y=0;}
addEventListener('keydown',e=>{if(e.key!=='Escape'&&e.target.closest?.('input,select,textarea'))return;const action=actionKey(state.preferences.bindings,e.key);if(!paused&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(action&&!paused)keys[action]=true;if(e.repeat)return;if(action==='e'&&!paused)interact();if(action==='q'&&!paused&&work){const p=work.pizza;if(p.recipe>=3)state.stock[p.recipe]++;p.stage='dough';p.recipe=null;work=null;$('#work').style.display='none';refreshPizzas();save();toast('Preparo cancelado. Massa e ingredientes recuperados.');}if(e.key==='Escape'){if(!started){if(!$('.casa-menu'))home();return;}paused?closeModal():showGameMenu();}});addEventListener('keyup',e=>{const action=actionKey(state.preferences.bindings,e.key);if(action)keys[action]=false;});addEventListener('blur',()=>{keysReset();if(started&&!paused)showGameMenu();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!paused)showGameMenu();});
const stick={x:0,y:0};$('#joystick').onpointerdown=e=>{$('#joystick').setPointerCapture(e.pointerId);moveStick(e);};function moveStick(e){if(!$('#joystick').hasPointerCapture(e.pointerId))return;let r=$('#joystick').getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/Math.max(1,r.width*.38),y=(e.clientY-r.top-r.height/2)/Math.max(1,r.height*.38),l=Math.max(1,Math.hypot(x,y));stick.x=x/l;stick.y=y/l;$('#joystick i').style.transform=`translate(${stick.x*28}px,${stick.y*28}px)`;}$('#joystick').onpointermove=moveStick;$('#joystick').onpointerup=$('#joystick').onpointercancel=()=>{stick.x=stick.y=0;$('#joystick i').style.transform='';};$('#interact').onclick=interact;
function updatePlayer(dt){
 if(walkTarget&&!work){const manual=keys.w||keys.a||keys.s||keys.d||keys.arrowup||keys.arrowdown||keys.arrowleft||keys.arrowright||stick.x||stick.y;if(manual){walkTarget=null;player.path=[];}else{const target=typeof walkTarget==='string'?points[walkTarget]:walkTarget;if(navigate(player,target,((keys.shift?5:3.1)*(state.chef===3?1.18:1)),dt)){const id=walkTarget;walkTarget=null;if(typeof id==='string'){nearest={...points[id],id};interact();}}advanceTutorial('move');return;}}
 let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+stick.x,z=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+stick.y;
 const len=Math.max(1,Math.hypot(x,z)),speed=((keys.shift?5:3.1)*(state.chef===3?1.18:1));x/=len;z/=len;
 player.vx??=0;player.vz??=0;const smooth=1-Math.exp(-dt*18);
 player.vx+=((work?0:(x*.866+z*.5)*speed)-player.vx)*smooth;player.vz+=((work?0:(-x*.5+z*.866)*speed)-player.vz)*smooth;
 const p=player.g.position,beforeX=p.x,beforeZ=p.z;
 if(actorCanStand(player,p.x+player.vx*dt,p.z))p.x+=player.vx*dt;else player.vx=0;
 if(actorCanStand(player,p.x,p.z+player.vz*dt))p.z+=player.vz*dt;else player.vz=0;
 const moving=Math.hypot(p.x-beforeX,p.z-beforeZ)>.001;if(moving){player.g.rotation.y=Math.atan2(player.vx,player.vz);advanceTutorial('move');}
 animatePerson(player,dt,moving,!!work||hand.length>0);
}
function updatePrompt(){if(floors.upstairs){nearest=null;$('#prompt').style.display='none';return}let list=[...stations,{x:roberto.g.position.x,z:roberto.g.position.z,id:'roberto'},...customers.filter(c=>c.status==='wait').map(c=>({x:c.g.position.x,z:c.g.position.z,id:'customer',customer:c}))];nearest=list.map(n=>({...n,d:Math.hypot(n.x-player.g.position.x,n.z-player.g.position.z)})).filter(n=>n.d<1.4).sort((a,b)=>a.d-b.d)[0];$('#prompt').style.display=nearest&&!paused?'block':'none';if(nearest)$('#prompt').innerHTML='<b>'+state.preferences.bindings.e.toUpperCase()+'</b> '+({dough:'Pegar massa',bench:cookBatch&&!cookBatch.remaining&&!hand.some(p=>p.stage==='dough')?'Retirar pizza de Jana':'Escolher receita e montar',oven:ovens.some(p=>p.stage==='ready')?'Retirar pizza pronta':'Colocar pizza no forno',counter:'Balcão · guardar, pegar ou entregar'+(shelf.length?' · '+shelf.length+' guardada(s)':''),stock:'Repor ingredientes especiais',bin:'Descartar pizza selecionada',roberto:'Conversar com Roberto',customer:'Entregar ao cliente #'+nearest.customer?.id}[nearest.id]);}
function frame(dt){tickNotices(dt);music.setScene({rush,paused,hidden:document.hidden,arrangement:!started?'menu':state.service.complete?'finale':state.casa===6?'festival':rush&&eventAt(time).name?.toLowerCase().includes('festival')?'festival':'salon'});music.tick();if(guideRing)guideRing.scale.setScalar(motionReduced()?1:1+Math.sin(time*3)*.08);if(!started){introTime+=dt;const t=motionReduced()?1:introTime;if(!motionReduced())animatePerson(roberto,dt,false,true);if(introPizza){introPizza.position.copy(roberto.g.position);introPizza.position.y=1.25+(!motionReduced()?Math.sin(t*1.6)*.12:0);introPizza.position.z+=.5;introPizza.rotation.y=motionReduced()?0:t*.5;}if(introGuest){introGuest.g.position.z=5-Math.min(t,5)*.27;animatePerson(introGuest,motionReduced()?0:dt,t<5);}}if(started&&!paused){time+=dt;state.campaign.seconds+=dt;if(state.service.active)state.service.seconds+=dt;const riding=floors.upstairs;floors.update(dt,keys,stick,animatePerson);if(!riding)updatePlayer(dt);else walkTarget=null;updateCustomers(dt);updateHelper(dt);updateOfficeTeam(dt);spawnClock+=dt*(state.office.coupons&&!state.service.active?2:1);if(spawnClock>(state.circuit.active!==null?2:state.service.active?6:rush?8:casas[state.casa].pace)){spawnClock=0;spawn();}for(const p of ovens){p.elapsed+=dt;if(p.stage==='baking'&&p.elapsed>=p.duration){p.stage='ready';sound('ovenReady');toast('Pizza pronta! Retire no forno.');refreshPizzas();}if(p.stage==='ready'&&p.elapsed>p.duration+18+(state.chef===0?6:0)&&p.quality!==.6){p.quality=.6;sound('burn');toast('Uma pizza passou do ponto. Ainda pode ser entregue com valor reduzido.');refreshPizzas();}}if(work){work.left-=dt;$('#work').style.display='block';$('#work span').textContent='Preparando · '+state.preferences.bindings.q.toUpperCase()+' para cancelar';$('#work i').style.width=(1-work.left/work.total)*100+'%';if(work.left<=0){work.pizza.stage='raw';work=null;$('#work').style.display='none';sound('prepDone');toast('Pizza montada. Agora leve ao forno!');}}updateEvent();updatePrompt();uiClock+=dt;if(uiClock>.35){if(currentContract(state)?.event==='upgrade')recordCampaign('check');renderUI();updateQuietHUD();uiClock=0;}}
updateFoodModels(dt);if(ovenDoor){if(!paused)doorTime=Math.max(0,doorTime-dt);ovenDoor.rotation.y+=((doorTime>0?-1.48:0)-ovenDoor.rotation.y)*(1-Math.exp(-dt*12));}ovenLight.intensity=ovens.length?10+Math.sin(time*8)*(motionReduced()?0:state.preferences.flash):5;
ovenLabel.el.innerHTML=ovens.length?ovens.map(p=>`<div>${p.stage==='ready'?(p.quality<1?'Passou do ponto':'Pronta!'):'Assando '+Math.ceil(p.duration-p.elapsed)+' s'}<div class="track"><i style="width:${Math.min(100,p.elapsed/p.duration*100)}%"></i></div></div>`).join(''):'Forno livre';
const focus=new T.Vector3(player.g.position.x*.55,0,player.g.position.z*.45);let dist=(innerWidth<700?25:22)/state.cameraZoom;camera.position.lerp(new T.Vector3(focus.x+dist*.45+(!started&&!motionReduced()?menuMouse*.5:0)+(!started&&!motionReduced()?Math.sin(introTime*.15)*.7:0),dist*.8+player.g.position.y,focus.z+dist*.95),1-Math.exp(-dt*3));camera.lookAt(focus.x,.1+player.g.position.y,focus.z-1);camera.updateMatrixWorld();for(const l of labels){const v=l.obj.getWorldPosition(new T.Vector3());v.y+=l.height;v.project(camera);l.el.style.left=(v.x*.5+.5)*innerWidth+'px';l.el.style.top=(-v.y*.5+.5)*innerHeight+'px';const stationId=l.el.dataset.station;const close=stationId&&Math.hypot(player.g.position.x-points[stationId].x,player.g.position.z-points[stationId].z)<2;const relevant=!!stationId&&(nearest?.id===stationId||state.preferences.highlights&&started&&!paused&&!floors.upstairs);l.el.classList.toggle('hud-near',relevant);l.el.style.display=v.z>1||v.z< -1||!relevant?'none':'block';}updateSteam();updateAtmosphere(started?time:introTime,state.casa,{enabled:state.particles&&!motionReduced()&&renderGraphics.smoke>0,amount:renderGraphics.smoke},!started,state.preferences.flash);renderer.render(scene,camera);}
const district=buildDistrict({scene,sun,box,sphere,cyl,textSign});district.refresh(state.casa);
function showMap(){
 showModal(travelMap(state,RECIPES));
 document.querySelectorAll('[data-casa]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.casa);if(state.served<casas[i].at)return;state.circuit.active=null;state.casa=i;district.refresh(i);save();closeModal();toast(casas[i].name+' · turno aberto.')});
}
const floors=buildFloors({scene,box,cyl,textSign,player,state,showModal,closeModal,showMissions,showStock,showChefs,save,toast});
initEnhancements();rebuild();quality();updateInterface();loadAssets();renderUI();camera.position.set(12,21,25);$('#loading').classList.add('hidden');
showModal(`<span class="eyebrow">BEM-VINDO À SUA NOVA HISTÓRIA</span><h2>Uma massa.<br>Mil possibilidades.</h2><p>Seu pequeno balcão está pronto para virar um império. Roberto está por perto, o forno está quente e o primeiro cliente chega assim que você abrir.</p><div class="grid"><div class="card"><h4>01 · Prepare</h4><p>Pegue massa e monte muçarela na bancada.</p></div><div class="card"><h4>02 · Encante</h4><p>Asse por 10 segundos e entregue no balcão. Cada pedido aproxima você da próxima melhoria.</p></div></div><p>WASD / setas para andar · E para interagir · Shift para correr.</p><button id="start">${state.served||state.purchases||state.tutorialProgress?'Continuar':'Começar'} →</button>`);$('#close').classList.add('hidden');$('#start').onclick=()=>{music.unlock();started=true;hasSession=true;save();if(introPizza){disposeGroup(introPizza);introPizza=null;}if(introGuest){disposeGroup(introGuest.g);introGuest=null;}closeModal();$('#close').classList.remove('hidden');spawn();document.body.classList.add('playing');toast('A pizzaria é sua. Escolha um pedido, prepare receitas ou explore as ações.');};
const startGame=$('#start').onclick;
function showChefs(index){
 const c=chefs[index],available=state.served>=c.at,canWear=available&&(!started||!hand.length);
 showModal('<h2>Escolha seu pizzaiolo</h2><section class="brigada"><canvas width="220" height="260" aria-label="Modelo de '+c.name+'"></canvas><article><small>'+ (available?'Disponível':'Libera com '+c.at+' entregas')+'</small><h3>'+c.name+'</h3><p>'+['Paciente e atento','Precisa e inventiva','Sociável e generoso','Ágil e decidida','Calmo sob pressão','Metódico e experiente','Criativa e acolhedora'][index]+'</p><blockquote>“'+['Se a borda cantar, já está no ponto.','Escuta a massa batendo. É o compasso da casa.','Pode deixar, lembro até quem pediu sem cebola.','Ainda chego antes do queijo derreter!','Só mais uma bandeja. Minha mão aguenta.','Esse forno conhece a minha idade.','Primeiro o perfume, depois o manjericão.'][index]+'”</blockquote><p>'+c.story+'</p><p><b>'+c.perk+'</b></p><nav><button id="prev-chef" aria-label="Anterior">←</button><button id="next-chef" aria-label="Próximo">→</button><button id="wear" '+(canWear?'':'disabled')+'>'+(available&&!canWear?'Esvazie a bandeja':'Escolher')+'</button></nav></article></section>');
 const canvas=$('.brigada canvas'),ctx=canvas.getContext('2d'),stage=new T.Scene(),actor=person(c.color,c.skin,true,index===5);
 dressChef(actor,index,{box,cyl,sphere});actor.motion.signal(["talk","prepare","give","run","carry","insert","celebrate"][index]);stage.add(actor.g,new T.HemisphereLight(0xfff2cb,0x776144,3));stage.background=new T.Color(0xf4d397);
 const eye=new T.PerspectiveCamera(35,220/260,.1,10);eye.position.set(1.4,1.4,3.7);eye.lookAt(0,1,0);
 const target=new T.WebGLRenderTarget(220,260),pixels=new Uint8Array(220*260*4),img=ctx.createImageData(220,260);
 let last=0;function pose(now){if(!canvas.isConnected||$('#modal').classList.contains('hidden')){target.dispose();disposeGroup(actor.g);return}
 if(now-last>65){last=now;actor.g.rotation.y=motionReduced()?0:Math.sin(now/1000)*.25;animatePerson(actor,.065,false,true);renderer.setRenderTarget(target);renderer.render(stage,eye);renderer.readRenderTargetPixels(target,0,0,220,260,pixels);renderer.setRenderTarget(null);for(let y=0;y<260;y++)img.data.set(pixels.subarray((259-y)*880,(260-y)*880),y*880);ctx.putImageData(img,0,0)}requestAnimationFrame(pose)}requestAnimationFrame(pose);
 $('#prev-chef').onclick=()=>showChefs((index+chefs.length-1)%chefs.length);$('#next-chef').onclick=()=>showChefs((index+1)%chefs.length);
 $('#wear').onclick=()=>{if(!canWear)return;const old=chefs[state.chef];player.g.traverse(o=>{if(o.material===mat(old.color))o.material=mat(c.color);else if(o.material===mat(old.skin))o.material=mat(c.skin)});dressChef(player,index,{box,cyl,sphere});state.chef=index;save();started?closeModal():home()};
}
function home(){
  const chapter=(currentService(state)?.chapter??5)+1;
  showModal(titleMenu({resume:hasSession,chef:chefs[state.chef].name,chapter,location:casas[state.casa||0].name}));
  $('#close').classList.add('hidden');
  $('#start').onclick=startGame;
  $('#home-salon').onclick=()=>{
    showModal('<div class="salon-window"><h2>'+casas[state.casa].name+'</h2><button id="salon-back">Voltar à abertura</button></div>');
    $('#salon-back').onclick=home;$('#salon-back').focus();
  };
  $('#home-chef').onclick=()=>showChefs(state.chef);
  $('#home-story').onclick=showStory;
  $('#home-diary').onclick=()=>abrirDiario(state,showModal,save);
  $('#home-recipes').onclick=showRecipeBook;
  $('#home-settings').onclick=showPause;
  $('#home-help').onclick=showHelp;
  $('#home-credits').onclick=()=>showModal('<h2>Créditos da casa</h2><p>Ilustração de abertura da versão original criada com ImageGen. Retratos e receitas vetoriais, personagens articulados, mobiliário, efeitos e música produzidos para o projeto.</p><p>Motor 3D Three.js, licença MIT. Pizzas e ingredientes da instalação atual são procedurais. Os movimentos atuais foram criados localmente.</p><a href="./vendor/LICENSE-three.txt" target="_blank">Licença do Three.js</a><a href="./CREDITOS.md" target="_blank">Créditos completos</a><p><button id="credit-back">Voltar</button></p>');
  if($('#home-new'))$('#home-new').onclick=()=>{showModal('<h2>Começar outra pizzaria?</h2><p>Confirmar substitui a campanha, o caixa e as melhorias deste navegador. Suas configurações serão mantidas.</p><button id="keep-save">Manter minha pizzaria</button> <button id="replace-save">Começar de novo</button>');$('#keep-save').onclick=home;$('#replace-save').onclick=()=>{
    const next=fresh();for(const key of ['preferences','quality','fps','cameraZoom','reducedMotion','particles','musicVolume','sfxVolume','volume','sfxMuted','musicMuted'])next[key]=state[key];
    next.chef=chefs[state.chef].at===0?state.chef:0;state=next;hasSession=false;save();location.reload();
  };};
  $('#start').focus();
}
document.addEventListener('click',event=>{if(event.target.id==='credit-back')home();if(event.target.id==='title-return'){save();location.reload();}});
introPizza=pizza({stage:'raw',recipe:0,quality:1});scene.add(introPizza);introGuest=person(0x299cab,0xd99d70);introGuest.g.position.set(-.5,0,5);home();
let previous=performance.now();renderer.setAnimationLoop(now=>{const elapsed=now-previous;if(renderFps&&elapsed+0.6<1000/renderFps)return;let dt=Math.min(.1,elapsed/1000);previous=now;frame(dt);});setInterval(save,10000);addEventListener('pagehide',save);

function initEnhancements(){
  ensureDaily(state);installArtFallback();
const lesson=document.createElement('div');lesson.id='tutorial';lesson.hidden=true;lesson.innerHTML='<div id="tutorial-progress"></div><strong id="tutorial-title"></strong><p id="tutorial-confirmation" role="status"></p><button id="tutorial-stop">Pular tutorial</button>';document.body.append(lesson);$('#tutorial-stop').onclick=()=>{tutorial.active=false;tutorial.skipped=true;state.tutorialProgress=tutorial.snapshot();save();lesson.hidden=true;};
const unlock=document.createElement('div');unlock.id='unlock-card';unlock.hidden=true;document.body.append(unlock);
const guide=document.createElement('div');guide.id='guide';guide.innerHTML='<small>PRÓXIMO PASSO</small><strong id="guide-title"></strong><span id="guide-detail"></span><button id="guide-action">Ir à estação</button>';document.body.append(guide);
  const progress=document.createElement('div');progress.id='next-unlock';$('#mission').append(progress);
  const controls=document.createElement('div');controls.id='view-controls';controls.innerHTML='<button id="zoom-out" aria-label="Afastar câmera">−</button><span>Câmera</span><button id="zoom-in" aria-label="Aproximar câmera">+</button><button id="help-game">Como jogar</button>';document.body.append(controls);
  const badge=document.createElement('button');badge.id='audio-status';badge.onclick=showPause;document.body.append(badge);
  $('#zoom-in').onclick=()=>changeZoom(.1);$('#zoom-out').onclick=()=>changeZoom(-.1);$('#help-game').onclick=showHelp;$('#guide-action').onclick=()=>{const lesson=tutorial.active?LESSONS[tutorial.step]?.[0]:null;if(lesson==='purchase')return showUpgrades();if(lesson==='roberto')return showRoberto();if(lesson==='select'){document.body.classList.add('all-orders');$('#orderlist').querySelector('[data-order]')?.focus();return;}goToStation(guideStation);};
  addEventListener('pointerdown',()=>{music.unlock();},{capture:true});
  addEventListener('keydown',()=>{music.unlock();},{capture:true});
  document.addEventListener('visibilitychange',()=>music.setScene({rush,paused,hidden:document.hidden}));
  guideRing=mesh(new T.TorusGeometry(.48,.055,8,40),0xf6b83e,0,.06,0);guideRing.rotation.x=Math.PI/2;guideRing.visible=false;
  for(const x of [-5,1,6]){cyl(.035,.6,0x53432d,x,3.3,-2);const shade=mesh(new T.ConeGeometry(.4,.3,20,1,true),0x497362,x,2.88,-2);const bulb=sphere(.13,0xffe3a0,x,2.8,-2);bulb.material=new T.MeshStandardMaterial({color:0xffe2a0,emissive:0xffb554,emissiveIntensity:.8});}
  updateEnhancementUI();
}
function changeZoom(amount){state.cameraZoom=Math.max(.8,Math.min(1.5,Math.round((state.cameraZoom+amount)*100)/100));save();}
function showHelp(){showModal(`<span class="eyebrow">SEU GUIA RÁPIDO</span><h2>Uma pizza, quatro passos.</h2><div class="help-steps"><p><b>1 · Massa</b> Vá ao círculo dourado e aperte E para pegar uma massa.</p><p><b>2 · Preparo</b> Na bancada, escolha a receita da comanda. Aguarde a montagem.</p><p><b>3 · Forno</b> Aperte E para colocar. Quando ouvir o aviso, aperte E para retirar.</p><p><b>4 · Balcão</b> Aperte E e escolha Entregar comanda. Também é possível guardar e pegar pizzas.</p></div><p>Selecione uma comanda à esquerda. O quadro “Próximo passo” e o círculo dourado ajudam a encontrar a estação. WASD ou setas movem, Shift corre e Esc pausa.</p><p>Use + e − para aproximar a câmera. Em Configurações, música e efeitos têm volume e silêncio separados.</p><p><b>5 · Melhorias</b> Use o dinheiro dos pedidos em Melhorar pizzaria.</p><p><b>Você decide:</b> use Ações para escolher uma estação ou clique no chão para andar. Meu jeito permite suspender novos clientes, pausar Roberto e ligar sugestões. Em Pedidos, escolha quem atender ou recuse uma comanda. A campanha é opcional.</p><button id="tutorial-start">Iniciar tutorial interativo</button><button id="help-back">Voltar ao jogo</button>`);$('#help-back').onclick=closeModal;$('#tutorial-start').onclick=()=>{if(!started)startGame();else closeModal();startTutorial(true);};}
function dailyMarkup(){const d=ensureDaily(state);return '<h3>Metas de hoje</h3><p>Recompensas automáticas, uma vez por dia. Seu avanço fica salvo.</p>'+DAILY_GOALS.map((g,i)=>`<div class="card daily"><b>${d.claimed.includes(i)?'✓ ':''}${g.title}</b><p>${g.desc} ${Math.min(g.goal,d[g.key])}/${g.goal}</p><small>+R$ ${g.money} · +${g.xp} XP ${d.claimed.includes(i)?'· RECEBIDOS':''}</small></div>`).join('');}
function updateEnhancementUI(){
  if(!$('#guide'))return;
  const next=nearestUnlock(state),d=ensureDaily(state),goal=DAILY_GOALS.find((g,i)=>!d.claimed.includes(i));
  $('#next-unlock').innerHTML=`<small>LOGO ALI</small><p>${next.recipe}</p><p>${next.upgrade}</p><p>${next.expansion}</p><small>META DE HOJE</small><p>${goal?goal.desc+' '+Math.min(goal.goal,d[goal.key])+'/'+goal.goal:'✓ Todas as metas de hoje concluídas!'}</p>`;
  const mutedMusic=state.musicMuted||state.musicVolume===0,mutedEffects=state.sfxMuted||state.sfxVolume===0;
  $('#audio-status').textContent=mutedMusic&&mutedEffects?'Áudio silenciado':mutedMusic?'Música silenciada':mutedEffects?'Efeitos silenciados':'♫ Som e música';
  $('#audio-status').title='Abrir configurações de música e efeitos';
  $('#zoom-in').disabled=state.cameraZoom>=1.5;$('#zoom-out').disabled=state.cameraZoom<=.8;
  const c=customers.find(c=>c.id===selected&&c.status!=='exit');
  let station='dough',title='01 · Pegue uma massa',detail='Aproxime-se da estação iluminada e aperte E.';
  const matching=hand.find(p=>p.recipe===c?.recipe),p=matching||hand[heldIndex]||hand[0];
  if(work){station='bench';title='Montando sua pizza…';detail='Um instante: o molho e os ingredientes estão sendo adicionados.';}
  else if(ovens.some(p=>p.stage==='ready')&&hand.length>=(1+state.upgrades.tray+Number(state.chef===4))){station='counter';title='Libere espaço na bandeja';detail='E no balcão → Guardar pizza da mão. Depois retire a pizza do forno.';}
  else if(ovens.some(p=>p.stage==='ready')){station='oven';title='Sua pizza está pronta!';detail='Aperte E junto ao forno para retirar antes de passar do ponto.';}
  else if(p?.stage==='dough'){station='bench';title='02 · Monte a receita';detail=c?'E na bancada → '+RECIPES[c.recipe].name:'Abra a bancada com E e escolha uma receita.';}
  else if(p?.stage==='raw'){station='oven';title='03 · Leve ao forno';detail='Aperte E perto do forno para assar '+RECIPES[p.recipe].name+'.';}
  else if(p?.stage==='ready'){station='counter';title='04 · Leve ao Balcão';const recipient=customers.find(x=>x.status!=='exit'&&x.recipe===p.recipe);detail=recipient?'Carregando '+RECIPES[p.recipe].name+'. Selecione o pedido #'+recipient.id+' e entregue no Balcão.':'Sem pedido para '+RECIPES[p.recipe].name+'. Guarde no Balcão ou descarte na Lixeira para refazer.';}
  else if(c&&findReadyPizza(shelf,c.recipe)){station='counter';title='A comanda já está no balcão';detail='E no balcão → Entregar comanda #'+c.id+'.';}
  else if(ovens.length){station='oven';title='Assando… '+Math.max(0,Math.ceil(ovens[0].duration-ovens[0].elapsed))+' s';detail='Espere o aviso do forno. Você também pode preparar o próximo pedido.';}
  else if(!c){title='Sua pizzaria está aberta';detail='Prepare uma massa enquanto espera o próximo cliente.';}
  if(tutorial.active){const step=tutorial.step;$('#tutorial').hidden=false;$('#tutorial-progress').textContent='COM ROBERTO · '+(step+1)+' / '+LESSONS.length;$('#tutorial-title').textContent=LESSONS[step][1];$('#tutorial-confirmation').textContent=tutorial.confirmation;if(LESSONS[step][0]==='purchase'){const available=Object.keys(UPGRADES).filter(k=>state.upgrades[k]<UPGRADES[k].max&&(k!=='helper'||state.served>=3));if(!available.length){advanceTutorial('purchase');}else{const cheapest=Math.min(...available.map(k=>cost(state,k)));detail=state.money>=cheapest?'Você já pode investir! Clique em Melhorar pizzaria.':'Faltam R$ '+(cheapest-state.money)+'. Prepare e entregue mais pedidos. '+detail;}}}
 guideStation=station;document.querySelectorAll('[data-station]').forEach(el=>el.classList.toggle('station-target',(state.guideEnabled||tutorial.active)&&el.dataset.station===station));$('#upgrades').classList.toggle('tutorial-target',tutorial.active&&LESSONS[tutorial.step]?.[0]==='purchase');$('#guide-action').textContent=station==='dough'?'Clique aqui para pegar uma massa':'Ir à '+({bench:'Bancada',oven:'Forno',counter:'Balcão',bin:'Lixeira'}[station]||'estação');$('#guide-action').disabled=!started||!!work;
if(tutorial.active){title=LESSONS[tutorial.step][1];detail=LESSONS[tutorial.step][2]+(tutorial.step>=2&&tutorial.step<=7?' '+detail:'');}$('#guide-title').textContent=title;$('#guide-detail').textContent=detail;if(tutorial.active){const lesson=LESSONS[tutorial.step][0];if(['select','purchase','roberto'].includes(lesson))$('#guide-action').textContent={select:'Escolher pedido',purchase:'Ver melhorias',roberto:'Conversar com Roberto'}[lesson];}
  if(guideRing){guideRing.visible=started&&(state.guideEnabled||tutorial.active)&&!(tutorial.active&&['move','select','purchase','roberto'].includes(LESSONS[tutorial.step][0]))&&Math.hypot(player.g.position.x-points[station].x,player.g.position.z-points[station].z)>1.1;guideRing.position.set(points[station].x,.065,points[station].z);}
}
function updateEvent(){
  const ev=eventAt(time);
  if(currentEvent!==ev.id){currentEvent=ev.id;eventServed=0;eventRecipes.clear();eventPaid=false;eventWarned=false;eventStarted=false;}
  rush=ev.active;
  if(ev.warning&&!eventWarned){eventWarned=true;sound('event');toast(`${ev.name} em 15 segundos! ${ev.type==='rush'?'Entregue 2 pizzas':'Sirva 2 receitas diferentes'} para ganhar +R$ 20 e +10 XP.`);}
  if(ev.active&&!eventStarted){eventStarted=true;sound('event');toast(ev.name+' começou! Gorjetas +50% por 30 segundos.');}
  $('#event').style.display=ev.warning||ev.active?'block':'none';
  $('#event').textContent=ev.active?`${ev.name} · ${ev.remaining}s · ${ev.type==='rush'?eventServed:eventRecipes.size}/2 · ${eventPaid?'bônus recebido':'bônus R$ 20 + 10 XP'}`:`${ev.name} em ${ev.remaining}s`;
}
function recordEvent(recipe){
  const ev=eventAt(time);if(!ev.active)return;
  eventServed++;eventRecipes.add(recipe);
  if(!eventPaid&&(ev.type==='rush'?eventServed:eventRecipes.size)>=ev.goal){eventPaid=true;recordCampaign('event');state.money+=20;state.xp+=10;toast('Evento concluído! +R$ 20 · +10 XP');sound('mission');}
}

function goToStation(id){if(!started||paused||work||!points[id])return;const path=route(player.g.position,points[id],obstacles,!!state.upgrades.expand);if(!path.length&&Math.hypot(player.g.position.x-points[id].x,player.g.position.z-points[id].z)>.4)return toast('Aproxime-se usando WASD, setas ou joystick.');player.path=[];walkTarget=id;}
function startTutorial(restart=false){state.shopOpen=true;tutorial.start(restart);if(restart)state.tutorialComplete=false;state.tutorialProgress=tutorial.snapshot();save();if(!customers.some(c=>c.status!=='exit'))spawn();selected=customers.find(c=>c.status!=='exit')?.id??null;$('#tutorial').hidden=!tutorial.active;toast('Tutorial iniciado. Entrada aberta; seus pedidos esperam enquanto você aprende.');renderUI();}
function advanceTutorial(event){if(!tutorial.record(event))return;state.tutorialProgress=tutorial.snapshot();save();if(!tutorial.active){state.tutorialComplete=true;save();$('#tutorial').hidden=true;toast('Tutorial concluído! Você já sabe preparar, entregar e investir.');}else if($('#tutorial-confirmation'))$('#tutorial-confirmation').textContent=tutorial.confirmation;}
function showUnlock(title,detail,icon){player.celebrate=.45;const el=$('#unlock-card');if(!el)return;el.hidden=false;el.innerHTML=art(icon,'★')+'<div><strong>'+title+'</strong><p>'+detail+'</p></div><button aria-label="Fechar novidade">×</button>';el.querySelector('button').onclick=()=>el.hidden=true;}

function recordCampaign(event,data={}){registrar(state,event,data);const result=campaignEvent(state,event,data);save();if(!result)return;toast('✓ '+result.title+' · +R$ '+result.money+' · +'+result.xp+' XP');if(state.campaign.complete){rebuild();showUnlock('Contratos do bairro concluídos','A campanha de serviços continua no Menu.','mission');}else if(currentContract(state).chapter!==result.chapter)showUnlock('Capítulo '+(currentContract(state).chapter+1),CHAPTERS[currentContract(state).chapter][2],'roberto');}

const ordersToggle=document.createElement('button');ordersToggle.textContent='Trocar pedido';ordersToggle.onclick=()=>document.body.classList.toggle('all-orders');$('#orders').append(ordersToggle);
document.body.classList.toggle('reduced-motion',motionReduced());
addEventListener('keydown',e=>{if(e.key==='Tab'&&paused){const items=[...$('#modal').querySelectorAll('button:not([disabled]),input,select,a[href]')].filter(x=>!x.classList.contains('hidden'));const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});

const stationPicker=new T.Raycaster(),pointer=new T.Vector2();
$('#world').addEventListener('pointerup',e=>{if(!started||paused||work)return;pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);stationPicker.setFromCamera(pointer,camera);const p=stationPicker.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-player.g.position.y),new T.Vector3());if(!p)return;if(floors.upstairs){floors.walkTo(p.x,p.z);return}const st=stations.map(s=>({...s,d:Math.hypot(s.x-p.x,s.z-p.z)})).sort((a,b)=>a.d-b.d)[0];if(st?.d<1.1)goToStation(st.id);else goToPoint(p);});

const robertoHelp=document.createElement('button');robertoHelp.id='roberto-help';robertoHelp.textContent='Roberto · ajuda';robertoHelp.onclick=showRoberto;$('#mission').append(robertoHelp);

function recordVisit(c,p,finished){state.history??=[];if(finished){const entry=state.history.find(x=>x.name===c.name);if(entry){entry.visits++;entry.recipe=p.recipe;}else state.history.push({name:c.name,visits:1,recipe:p.recipe});state.history=state.history.slice(-12);}}

// A single HUD reads existing gameplay state instead of creating another simulation.
const quiet=document.createElement('section');quiet.id='service-hud';quiet.setAttribute('aria-label','Atendimento atual');quiet.innerHTML='<div class="hud-heading"><span id="hud-caption">PEDIDO ATUAL</span><button id="hud-switch">Trocar</button></div><div id="hud-customer"></div><p id="hud-order"></p><p id="hud-action" aria-live="polite"></p><p id="hud-states"></p><div class="hud-choices"><button id="hud-actions">Ações</button><button id="hud-freedom">Meu jeito</button></div><button id="hud-do">Continuar</button><p id="hud-progress"></p><p id="hud-notice" role="status"></p>';document.body.append(quiet);
$('#hud-switch').onclick=showOrders;$('#hud-actions').onclick=showActions;$('#hud-freedom').onclick=showFreedom;
$('#hud-do').onclick=()=>{if(!tutorial.active&&!state.guideEnabled){if(work)return cancelPrep();if(nearest)return interact();return showActions();}const lesson=tutorial.active?LESSONS[tutorial.step]?.[0]:null;if(lesson==='select')return showOrders();if(lesson==='purchase')return showUpgrades();if(lesson==='roberto')return showRoberto();if(work)return cancelPrep();if(nearest&&nearest.id===guideStation)return interact();$('#guide-action').click();};
function updateQuietHUD(){
 const c=customers.find(x=>x.id===selected&&x.status!=='exit'),sp=serviceProgress(state),svc=currentService(state);
 $('#hud-customer').textContent=c?c.name:'Portas abertas';$('#hud-order').textContent=c?c.remaining+' × '+RECIPES[c.recipe].name+(c.priority?' · prioridade':''):state.service.active?'O próximo pedido já está chegando.':state.shopOpen===false?'Novos clientes suspensos. Prepare a casa ou atenda quem já chegou.':'Você escolhe: atender, preparar ou melhorar a casa.';
 $('#hud-action').textContent=$('#guide-title').textContent;if(state.service.active&&sp&&hand.length===0&&!ovens.length&&!work&&currentService(state)?.mode==="sequence")$('#hud-action').textContent='Prepare '+RECIPES[sp.recipe].name+' para esta rodada.';
 const held=hand[heldIndex]||hand[0],ready=ovens.filter(p=>p.stage==='ready').length;
 const oven=ready?'✓ Forno: '+ready+' pronta(s)':ovens.length?'◷ Forno: '+Math.max(0,Math.ceil(ovens[0].duration-ovens[0].elapsed))+' s':'';
 const tray=held?'Bandeja: '+(held.stage==='dough'?'massa':RECIPES[held.recipe].name)+' · '+({ready:'pronta',raw:'montada',preparing:'em preparo'}[held.stage]||'crua')+(hand.length>1?' +'+(hand.length-1):''):'';
 $('#hud-states').textContent=[tray,oven].filter(Boolean).join(' · ');
 $('#hud-progress').textContent=sp?(state.service.active?'Cap. '+(svc.chapter+1)+' · '+sp.title+' · '+sp.count+'/'+sp.goal:'Campanha · próximo: '+sp.title):'✓ Festival concluído · desafios livres';
 if(!state.service.active && proximoRelato(state))$('#hud-progress').textContent=proximoRelato(state);
 if(state.circuit.active!==null){const t=circuitTask(state);if(t)$('#hud-progress').textContent=t.j.name+' · '+t.p.portions+'/'+(t.j.size*2)+' · '+(t.waiting?'Visite '+(t.desk===1?'o escritório':'a horta'):RECIPES[t.recipe].name);}
 $('#hud-notice').textContent=toastTime>0?$('#toast').textContent:'';
 const event=eventAt(time);if(!$('#hud-notice').textContent&&(event.active||event.warning))$('#hud-notice').textContent=event.active?event.name+' · '+event.remaining+' s':event.name+' em '+event.remaining+' s';
 $('#hud-do').textContent=work?'Cancelar preparo':nearest?.id===guideStation?'E · '+({dough:'Pegar massa',bench:'Escolher receita',oven:ready?'Retirar pizza':'Colocar no forno',counter:'Abrir Balcão'}[guideStation]||'Interagir'):'Ir à estação';
 if(tutorial.active){const lesson=LESSONS[tutorial.step][0];$('#hud-caption').textContent='COM ROBERTO · '+(tutorial.step+1)+'/10';if(['select','purchase','roberto'].includes(lesson))$('#hud-do').textContent={select:'Escolher pedido',purchase:'Ver melhorias',roberto:'Conversar com Roberto'}[lesson];}else $('#hud-caption').textContent='PEDIDO ATUAL';
 if(!tutorial.active&&!state.guideEnabled){
  $('#hud-caption').textContent=state.service.active?'SERVIÇO DA CAMPANHA':'ATENDIMENTO LIVRE';
  $('#hud-action').textContent=work?'Preparando pizza · você pode cancelar':nearest?({dough:'Massa à mão',bench:'Bancada de receitas',oven:'Forno',counter:'Balcão de apoio e entregas',stock:'Despensa',bin:'Lixeira',roberto:'Roberto',customer:'Cliente por perto'}[nearest.id]||'Explore a pizzaria'):'O próximo passo é seu.';
  $('#hud-do').textContent=work?'Cancelar preparo':nearest?'E · '+({dough:'Pegar massa',bench:'Escolher receita',oven:ready?'Retirar pizza':'Colocar no forno',counter:'Abrir balcão',stock:'Repor estoque',bin:'Descartar pizza',roberto:'Conversar',customer:'Entregar pizza'}[nearest.id]||'Interagir'):'Escolher ação';
  if(!state.service.active)$('#hud-progress').textContent=(state.shopOpen===false?'Entrada suspensa':'Recebendo clientes')+' · Roberto '+(!state.upgrades.helper?'não contratado':state.helperWorking===false?'em pausa':'trabalhando');
 }
 $('#hud-do').disabled=!started;
}
function cancelPrep(){if(!work)return;const p=work.pizza;if(p.recipe>=3)state.stock[p.recipe]++;p.stage='dough';p.recipe=null;work=null;$('#work').style.display='none';refreshPizzas();save();renderUI();updateQuietHUD();}
function showOrders(){
 const active=customers.filter(c=>c.status!=='exit');
 showModal('<h2>Você escolhe quem atender</h2><p>Atenda em qualquer ordem. Recusar encerra sua sequência, sem multa. As pizzas continuam com você.</p>'+(active.length?active.map(c=>'<div class="service-card"><b>'+c.name+'</b><p>'+c.remaining+' × '+RECIPES[c.recipe].name+' · '+Math.ceil(c.patience)+' s</p><div class="dialog-actions"><button data-quiet-order="'+c.id+'">'+(c.id===selected?'✓ Selecionado':'Atender')+'</button><button data-refuse-order="'+c.id+'">Recusar pedido</button></div></div>').join(''):'<p>Nenhum pedido agora. Você pode preparar pizzas e guardá-las no balcão.</p>'));
 document.querySelectorAll('[data-quiet-order]').forEach(b=>b.onclick=()=>{selected=+b.dataset.quietOrder;advanceTutorial('select');renderUI();closeModal();});
 document.querySelectorAll('[data-refuse-order]').forEach(b=>b.onclick=()=>{refuseOrder(+b.dataset.refuseOrder);showOrders();});
}
function refuseOrder(id){
 const c=customers.find(x=>x.id===id&&x.status!=='exit');if(!c)return false;
 c.status='exit';c.path=[];combo=0;streak=0;
 if(selected===id)selected=customers.find(x=>x.status!=='exit')?.id??null;
 renderUI();toast('Pedido recusado. Você pode escolher outro cliente.');return true;
}
function goToPoint(p){
 if(!started||paused||work||!canStand(p.x,p.z,obstacles,!!state.upgrades.expand))return false;
 const target={x:p.x,z:p.z},path=route(player.g.position,target,obstacles,!!state.upgrades.expand);
 if(!path.length)return false;
 player.path=path;player.target=target;player.retry=0;player.vx=player.vz=0;walkTarget=target;return true;
}
function showActions(){
 if(floors.upstairs){showModal('<h2>'+['Elevador','Mezanino','Terraço'][floors.floor]+'</h2><button id="floor-access">Ir ao elevador</button><button id="floor-desk">'+(floors.floor===1?'Ir ao escritório':'Ir à horta')+'</button>');$('#floor-access').onclick=()=>{closeModal();floors.walkTo(floors.entry.x,floors.entry.z)};$('#floor-desk').onclick=()=>{closeModal();floors.walkTo(floors.entry.x+4,floors.entry.z-1.8)};return}
 const choices=[['dough','Pegar massa','Comece uma pizza quando quiser.'],['bench','Escolher receita','Prepare qualquer sabor desbloqueado.'],['oven','Usar o forno','Asse ou retire suas pizzas.'],['counter','Ir ao balcão','Guarde, pegue ou entregue.'],['stock','Repor estoque','Abasteça os sabores especiais.'],['bin','Descartar pizza','Libere espaço na bandeja.']];
 showModal('<h2>O que você quer fazer?</h2><p>Escolha seu destino. WASD ou joystick interrompem o caminho; clique no chão para andar livremente.</p><div class="menu-grid">'+choices.map(([id,title,desc])=>'<button data-action-station="'+id+'"><b>'+title+'</b><small>'+desc+'</small></button>').join('')+'</div><div class="dialog-actions"><button id="actions-lift">Ir ao elevador</button><button id="actions-orders">Escolher cliente</button><button id="actions-tray">Selecionar pizza</button><button id="actions-upgrades">Investir na casa</button></div>');
 document.querySelectorAll('[data-action-station]').forEach(b=>b.onclick=()=>{const id=b.dataset.actionStation;closeModal();goToStation(id);});
 $('#actions-lift').onclick=()=>{closeModal();goToPoint(floors.entry)};$('#actions-orders').onclick=showOrders;$('#actions-tray').onclick=showTray;$('#actions-upgrades').onclick=showUpgrades;
}
function playFreely(){
 if(!started)startGame();
 state.service.active=false;state.circuit.active=null;tutorial.active=false;tutorial.skipped=true;state.tutorialProgress=tutorial.snapshot();state.guideEnabled=false;$('#tutorial').hidden=true;
 save();renderUI();closeModal();toast('Atendimento livre. Você decide o próximo passo.');
}
function showFreedom(){
 showModal('<span class="eyebrow">SUAS ESCOLHAS</span><h2>Sua pizzaria, seu jeito</h2><p>Escolha seu ritmo. Os clientes que já chegaram continuam esperando quando você suspende a entrada.</p><div class="service-card"><h3>Direção da partida</h3><p>'+(state.service.active?'Um serviço da campanha está ativo.':'Atendimento livre: atenda na ordem que preferir.')+'</p><button id="freedom-free">Jogar livre</button><button id="freedom-story">Escolher campanha</button></div><div class="menu-grid"><button id="freedom-guide" aria-pressed="'+!!state.guideEnabled+'">Sugestões: '+(state.guideEnabled?'ligadas':'desligadas')+'</button><button id="freedom-open" aria-pressed="'+state.shopOpen+'">'+(state.shopOpen?'Suspender novos clientes':'Receber novos clientes')+'</button><button id="freedom-helper" '+(!state.upgrades.helper?'disabled':'')+' aria-pressed="'+state.helperWorking+'">'+(!state.upgrades.helper?'Contrate Roberto em Melhorias':state.helperWorking?'Pausar Roberto':'Roberto: voltar ao trabalho')+'</button><button id="freedom-learn">Aprender com Roberto</button></div><p>Roberto termina de guardar o que está carregando antes da pausa. Você pode mudar essas escolhas a qualquer momento.</p><button id="freedom-back">Voltar ao jogo</button>');
 $('#freedom-free').onclick=playFreely;$('#freedom-story').onclick=showStory;
 for(const [id,key]of [['guide','guideEnabled'],['open','shopOpen'],['helper','helperWorking']])$('#freedom-'+id).onclick=()=>{state[key]=!state[key];save();renderUI();showFreedom();};
 $('#freedom-learn').onclick=()=>{closeModal();startTutorial(true);};$('#freedom-back').onclick=closeModal;
}

function showGameMenu(){showModal('<span class="eyebrow">FORNO & FORTUNA</span><h2>Sua pizzaria</h2><p>O jogo está pausado.</p><div class="menu-ledger"><section><h3>Atendimento</h3><div class="menu-grid"><button id="menu-orders">Pedidos</button><button id="menu-actions">Ações livres</button><button id="menu-tray">Bandeja</button><button id="menu-recipes">Receitas</button><button id="menu-stock">Estoque</button></div></section><section><h3>Administração</h3><div class="menu-grid"><button id="menu-office">Caderno da casa</button><button id="menu-upgrades">Melhorias</button><button id="menu-map">Mapa dos restaurantes</button><button id="menu-freedom">Meu jeito</button></div></section><section><h3>História</h3><div class="menu-grid"><button id="menu-diary">Missões secundárias</button><button id="menu-story">História principal</button><button id="menu-circuit">Volta das Sete Casas</button><button id="menu-contracts">Metas e histórico</button><button id="menu-roberto">Roberto</button></div></section><section><h3>Jogo</h3><div class="menu-grid"><button id="menu-help">Como jogar</button><button id="menu-settings">Configurações</button></div></section><button id="title-return">Voltar à abertura</button></div><button id="menu-resume">Voltar ao jogo</button><button id="menu-skip">Pular tutorial</button>');const handlers={diary:()=>abrirDiario(state,showModal,save),circuit:showRegionalTour,map:showMap,office:showOffice,freedom:showFreedom,actions:showActions,story:showStory,orders:showOrders,upgrades:showUpgrades,tray:showTray,stock:showStock,recipes:showRecipeBook,contracts:showMissions,settings:showPause,help:showHelp,roberto:showRoberto,resume:closeModal};for(const [key,fn]of Object.entries(handlers))$('#menu-'+key).onclick=fn;$('#menu-skip').hidden=!tutorial.active;$('#menu-skip').onclick=()=>{$('#tutorial-stop').click();closeModal();};}
function showRegionalTour(){showCircuit({state,recipes:RECIPES,show:showModal,save,back:showGameMenu,
 changeHouse:id=>{if(state.casa!==id){state.casa=id;district.refresh(id);}},
 begin:()=>{save();closeModal();spawn();toast('Reserva em andamento. Consulte a Volta das Sete Casas para ver o objetivo.');}});}
function showOffice(){openOffice({state,recipes:RECIPES,level:()=>level(state),show:showModal,save,sound,refresh:()=>{rebuild();renderUI();},back:showGameMenu,spawn});}
function showTray(){showModal('<h2>Sua bandeja</h2><p>Selecione qual pizza você quer guardar ou entregar. Use E perto do Balcão para guardar e recuperar.</p>'+hand.map((p,i)=>'<button data-held="'+i+'">'+(i===heldIndex?'✓ ':'')+(p.stage==='dough'?'Massa':RECIPES[p.recipe].name)+' · '+p.stage+'</button>').join(''));document.querySelectorAll('[data-held]').forEach(b=>b.onclick=()=>{heldIndex=+b.dataset.held;renderUI();closeModal();});}
function showStory(){const t=currentService(state),p=state.service,sp=serviceProgress(state);if(!t)return showModal('<h2>O festival é nosso!</h2><p>Você concluiu os 36 serviços da história.</p><p>'+Math.floor(p.seconds/60)+' minutos em serviços · '+state.served+' pizzas entregues.</p><p>Recompensa: R$ 750, faixa do festival e gorjetas +10%. Metas diárias, VIPs e contratos continuam disponíveis no Menu.</p>');const ch=STORY_CHAPTERS[t.chapter];showModal('<span class="eyebrow">CAPÍTULO '+(t.chapter+1)+' DE 6</span><h2>'+ch.name+'</h2><p>Roberto: “'+ch.story+'”</p><p>Investigue o documento deste capítulo no escritório do mezanino. Páginas recuperadas: '+state.paginas.length+'/6.</p><div class="service-card"><h3>'+t.title+'</h3><p>'+t.host+': '+t.text+'</p><p>Rodada '+(p.wave+1)+'/4 · '+sp.count+'/'+sp.goal+' pizzas · próximo sabor: '+RECIPES[sp.recipe].name+'</p><p>Recompensa: R$ '+t.money+' + '+(30+t.chapter*5)+' XP</p><p>Próximo marco: '+sp.next+'</p></div><button id="story-begin">'+(p.active?'Retomar serviço':'Começar / continuar serviço')+'</button><button id="story-free">Atendimento livre</button>');$('#story-begin').onclick=()=>{if(!started)startGame();if(t.requires==='helper'&&!state.upgrades.helper){showUpgrades();return;}state.shopOpen=true;state.circuit.active=null;startService(state);save();closeModal();if(t.id===0&&state.served===0&&!state.tutorialComplete&&!state.tutorialProgress?.skipped)startTutorial();spawnClock=7;toast('Serviço iniciado: '+t.title+'. '+t.text);};$('#story-free').onclick=playFreely;}
function serviceFeedback(result){if(!result)return;if(result.hint){const hint=result.hint.replace(/sabor é (\d)/,(_,r)=>'sabor é '+RECIPES[+r].name);toast(hint);}if(result.wave)toast('✓ Rodada concluída. Próxima combinação liberada.');if(result.finished){sound('mission');toast('✓ '+result.service.title+' concluído! +R$ '+result.service.money);if(result.chapter){rebuild();showStory();}}save();}
$('#pause').textContent='Menu';$('#pause').setAttribute('aria-label','Abrir menu da pizzaria');updateQuietHUD();

function showRecipeBook(){showModal('<h2>Receitas da casa</h2>'+RECIPES.map((r,i)=>'<div class="service-card">'+art('pizza-'+i,'🍕')+'<b>'+(recipeAvailable(state,i)?'✓ ':'▣ ')+r.name+'</b><p>'+r.ingredients+'</p><p>'+(recipeAvailable(state,i)?'Disponível na Bancada':recipeRequirement(i))+'</p></div>').join(''));}
