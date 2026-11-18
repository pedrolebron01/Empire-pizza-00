import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as core from './core.js';
import {Tutorial} from './tutorial.js';

const state=core.fresh();
assert.equal(state.guideEnabled,false);
assert.equal(state.shopOpen,true);
assert.equal(state.helperWorking,true);
state.money=234;state.xp=120;state.upgrades.helper=1;
state.guideEnabled=true;state.shopOpen=false;state.helperWorking=false;
const restored=core.restore(JSON.stringify(state));
for(const key of ['guideEnabled','shopOpen','helperWorking','money','xp'])assert.equal(restored[key],state[key]);
assert.equal(restored.upgrades.helper,1);
const legacy={...state};delete legacy.guideEnabled;delete legacy.shopOpen;delete legacy.helperWorking;
const migrated=core.restore(JSON.stringify(legacy));
assert.equal(migrated.shopOpen,true);assert.equal(migrated.helperWorking,true);assert.equal(migrated.money,234);

const source=fs.readFileSync(new URL('./game.js',import.meta.url),'utf8');
const elements=new Map();
const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',style:{}});return elements.get(id);};
const messages=[];
const context={...core,console,Math,state:restored,tutorial:new Tutorial(),$:el,
 officeActors:{},exit:{x:-.5,z:5.1},started:true,paused:false,work:null,walkTarget:null,heldIndex:0,combo:4,streak:4,selected:1,spawnClock:0,
 customers:[{id:1,status:'wait',path:[{}]},{id:2,status:'wait',path:[]}],hand:[{stage:'ready',recipe:0}],ovens:[{stage:'ready',recipe:0}],shelf:[],
 player:{g:{position:{x:-6,z:0},rotation:{}},path:[],carrying:[]},roberto:{g:{position:{x:-2.6,y:0,z:-1.4}},carrying:[],path:[]},points:{counter:{x:-5,z:.65},oven:{x:-.65,z:-3.1}},obstacles:[],keys:{},stick:{x:0,y:0},
 renderUI(){},save(){},refreshPizzas(){},sound(){},animatePerson(){},advanceTutorial(){},
 closeModal(){context.paused=false;},toast:t=>messages.push(t),navigate:()=>true,actorCanStand:()=>true,interact(){context.interactions++;},interactions:0
};
vm.createContext(context);
function load(name){const start=source.indexOf('function '+name+'(');assert(start>=0,name);const end=source.indexOf('\nfunction ',start+1);vm.runInContext(source.slice(start,end<0?undefined:end),context);}
for(const name of ['spawn','updateHelper','refuseOrder','goToPoint','playFreely','updatePlayer'])load(name);

// Closed doors block arrivals, without removing existing customers.
context.spawn();assert.equal(context.customers.length,2);

// Optional contracts cannot force the flavors of free-play customers.
context.serviceOrder=()=>null;context.currentContract=()=>({recipe:0});context.specialCustomer=()=>null;
context.person=()=>({g:{position:{set(){}}}});context.label=()=>({el:{}});context.serial=1;
context.state.shopOpen=true;context.state.served=10;context.state.xp=200;context.customers=[];
context.Math=Object.create(Math);context.Math.random=()=>.9;
context.spawn();assert.equal(context.customers[0].recipe,2);
context.customers=[{id:1,status:'wait',path:[{}]},{id:2,status:'wait',path:[]}];

// Refusal cannot pay or happen twice, and keeps prepared pizzas.
const money=context.state.money;
assert(context.refuseOrder(1));assert.equal(context.selected,2);assert.equal(context.combo,0);
assert.equal(context.refuseOrder(1),false);assert.equal(context.state.money,money);assert.equal(context.hand.length,1);

// A paused helper leaves the oven alone but safely drops pizzas already carried.
context.updateHelper(.1);assert.equal(context.ovens.length,1);
context.roberto.carrying.push({stage:'ready',recipe:1});context.updateHelper(.1);
assert.equal(context.roberto.carrying.length,0);assert.equal(context.shelf.length,1);
assert.equal(context.ovens.length,1);

// Walking to an arbitrary floor point never triggers a station interaction.
assert(context.goToPoint({x:-4,z:0}));assert.equal(context.walkTarget.x,-4);
context.updatePlayer(.1);assert.equal(context.walkTarget,null);assert.equal(context.interactions,0);
assert.equal(context.goToPoint({x:100,z:0}),false);
assert(context.goToPoint({x:-3,z:0}));context.keys.w=true;
context.updatePlayer(.1);assert.equal(context.walkTarget,null);

// Free play preserves the current campaign checkpoint and economy.
context.state.service.active=true;context.state.service.wave=2;context.state.service.served=3;
context.tutorial.start();context.playFreely();
assert.equal(context.state.service.active,false);assert.equal(context.state.service.wave,2);
assert.equal(context.state.service.served,3);assert.equal(context.state.money,money);
assert.equal(context.state.guideEnabled,false);assert.equal(context.tutorial.active,false);
assert.equal(context.state.tutorialProgress.skipped,true);

// The actual HUD and preference handlers expose the player's choices.
context.serviceProgress=()=>({title:'Próximo serviço',count:0,goal:20});
context.currentService=()=>({chapter:0,mode:'sequence'});
context.eventAt=()=>({active:false,warning:false});context.toastTime=0;context.time=0;context.nearest=null;context.guideStation='dough';
context.customers=[];context.showStory=()=>{};context.showModal=html=>{context.modalHTML=html;context.paused=true;};
for(const name of ['updateQuietHUD','showFreedom','startTutorial'])load(name);
context.updateQuietHUD();assert.equal(el('#hud-action').textContent,'O próximo passo é seu.');
assert.equal(el('#hud-do').textContent,'Escolher ação');
context.showFreedom();el('#freedom-guide').onclick();assert.equal(context.state.guideEnabled,true);
const wasOpen=context.state.shopOpen;el('#freedom-open').onclick();assert.equal(context.state.shopOpen,!wasOpen);
el('#freedom-helper').onclick();assert.equal(context.state.helperWorking,true);
context.state.shopOpen=false;context.updateQuietHUD();assert.match(el('#hud-order').textContent,/suspensos/);
context.startTutorial(true);assert.equal(context.state.shopOpen,true);assert.equal(context.tutorial.active,true);
console.log('PASS: escolhas persistentes, migração, entrada suspensa, recusa sem pagamento, pausa segura de Roberto, movimento livre e campanha preservada.');
