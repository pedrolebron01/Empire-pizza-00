import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as core from './core.js';
import {officeDelivery,scoreCup} from './management.js';
import * as progression from './progression.js';
import {openSettings,cancelDisplayPreview} from './settings-panel.js';
import {GRAPHICS,graphicsQuality} from './preferences.js';
import {Tutorial} from './tutorial.js';
const source=fs.readFileSync(new URL('./game.js',import.meta.url),'utf8');
const elements=new Map();
const element=key=>{if(!elements.has(key))elements.set(key,{style:{},classList:{add(){},remove(){}},textContent:'',value:'',dataset:{},append(){}});return elements.get(key);};
const recipes=core.RECIPES.map((r,i)=>({dataset:{recipe:String(i)}}));
const sounds=[],messages=[];
const context={officeDelivery,scoreCup,floors:{interact:()=>false},...core,...progression,console,Math,Set,tutorial:new Tutorial(),art:()=>'',recordCampaign(){},recordVisit(){},advanceTutorial(){},motionReduced:()=>false,document:{createElement:()=>({append(){}}),querySelectorAll:sel=>sel==='[data-recipe]'?recipes:[]},$:element,
state:core.fresh(),hand:[],shelf:[],ovens:[],customers:[],work:null,heldIndex:0,selected:1,combo:0,streak:0,rush:false,knownLevel:1,started:true,paused:false,nearest:null,dt:0,
sound:(name)=>sounds.push(name),toast:t=>messages.push(t),refreshPizzas(){},renderUI(){},save(){},updateEnhancementUI(){},recordEvent(){},showCounter(){},showStock(){},showRoberto(){},quality(){},
showModal(){context.paused=true;},closeModal(){context.paused=false;},music:{apply(){}},
player:{celebrate:0},roberto:{carrying:[]},points:{counter:{},oven:{}},navigate:()=>true,animatePerson(){}
};
vm.createContext(context);
const oneLine=name=>{const start=source.indexOf('function '+name+'(');const next=source.indexOf('\nfunction ',start+1);let text=source.slice(start,next<0?undefined:next);if(name==='showPause')text=text.slice(0,text.indexOf("\n$('#upgrades')"));return text;};
for(const name of ['interact','showRecipes','updateHelper','showPause'])vm.runInContext(oneLine(name),context);
vm.runInContext(source.slice(source.indexOf('function checkProgress()'),source.indexOf('function interact()')),context);
const frame=source.slice(source.indexOf('function frame(dt)'));
const cook=frame.slice(frame.indexOf('for(const p of ovens)'),frame.indexOf('updateEvent();'));
const tick=dt=>{context.dt=dt;vm.runInContext(cook,context);};
const act=id=>{context.nearest={id};context.interact();};
const count=name=>sounds.filter(x=>x===name).length;
act('dough');assert.equal(context.hand.length,1);assert.equal(count('dough'),1);
act('dough');assert.equal(count('dough'),1,'Full hands must not play pickup sound');
act('bench');recipes[0].onclick();assert.equal(count('prep'),1);assert.equal(count('ingredient'),1);
tick(3);assert.equal(count('prepDone'),1);tick(1);assert.equal(count('prepDone'),1);
act('oven');assert.equal(count('ovenIn'),1);assert.equal(context.hand.length,0);
tick(10);assert.equal(context.ovens[0].stage,'ready');assert.equal(count('ovenReady'),1);tick(.1);assert.equal(count('ovenReady'),1);
act('oven');assert.equal(count('ovenOut'),1);assert.equal(context.hand.length,1);
const customer={id:1,recipe:0,status:'wait',remaining:1,patience:160,maxPatience:180,perfect:true};context.customers=[customer];
const pizza=context.hand[0],before=context.state.money;
context.deliver(customer,pizza,context.hand);assert(context.state.money>before);assert.equal(count('delivery'),1);assert.equal(count('cash'),1);
const paid=context.state.money;context.deliver(customer,pizza,context.hand);assert.equal(context.state.money,paid);assert.equal(count('cash'),1);
context.ovens=[{stage:'baking',recipe:0,quality:1,elapsed:0,duration:10}];tick(30);assert.equal(count('burn'),0);tick(5);assert.equal(count('burn'),1);tick(1);assert.equal(count('burn'),1);
context.state.upgrades.helper=1;context.updateHelper(.1);assert.equal(count('helperTake'),1);context.updateHelper(.1);assert.equal(count('helperDrop'),1);context.updateHelper(.1);assert.equal(count('helperDrop'),1);
// Exercise the four settings categories and their actual event handlers.
const buttons = Object.fromEntries(['graphics','access','audio','controls'].map(k=>[k,{dataset:{tab:k}}]));
const panelElements = new Map();
function inject(html){
  panelElements.clear();
  for(const match of html.matchAll(/<(input|select|button|b|p)[^>]*? id="([^"]+)"([^>]*)>/g)){
    const [,tag,id,attrs]=match;
    panelElements.set(id,{value:attrs.match(/value="([^"]*)"/)?.[1]||'',type:attrs.match(/type="([^"]*)"/)?.[1]||tag,
      nextElementSibling:{},checked:attrs.includes('checked')});
  }
}
globalThis.document={getElementById:id=>panelElements.get(id),querySelectorAll:sel=>sel==='[data-tab]'?Object.values(buttons):[]};
Object.assign(context,{openSettings,showModal:inject,showGameMenu(){},home(){},rebuild(){},updateInterface(){},renderer:{capabilities:{getMaxAnisotropy:()=>8}}});
context.showPause();buttons.audio.onclick();
const control=id=>panelElements.get(id);
control('music-volume').oninput({target:{value:'.65',nextElementSibling:{}}});assert.equal(context.state.musicVolume,.65);assert.equal(context.state.sfxVolume,.35);
control('music-mute').onchange({target:{checked:true}});assert(context.state.musicMuted);assert(!context.state.sfxMuted);
control('sfx-volume').oninput({target:{value:'.2',nextElementSibling:{}}});assert.equal(context.state.sfxVolume,.2);assert.equal(context.state.musicVolume,.65);
control('sfx-mute').onchange({target:{checked:true}});control('music-mute').onchange({target:{checked:false}});assert(!context.state.musicMuted);assert(context.state.sfxMuted);
buttons.access.onclick();control('contrast').onchange({target:{checked:true}});assert(context.state.preferences.contrast);
buttons.controls.onclick();assert(control('reopen-tutorial'));
const applied=[];context.quality=(g,fps)=>applied.push({g,fps});context.showPause();
for(const quality of ['baixa','media','alta']){
  control('quality').value=quality;control('quality').onchange({target:{value:quality}});control('fps').value='30';
  control('apply-display').onclick();assert.equal(applied.at(-1).fps,30);
  control('keep-display').onclick();assert.equal(context.state.preferences.graphics.scale,GRAPHICS[quality].scale);
}
const stored=JSON.stringify(context.state);
control('quality').value='baixa';control('quality').onchange({target:{value:'baixa'}});control('apply-display').onclick();cancelDisplayPreview();
assert.equal(JSON.stringify(context.state),stored);assert.equal(applied.at(-1).g.scale,GRAPHICS.alta.scale);
assert.deepEqual(core.restore(stored).preferences,context.state.preferences);
for(const g of Object.values(GRAPHICS)){
  const renderer={capabilities:{getMaxAnisotropy:()=>8},shadowMap:{},setPixelRatio(n){this.ratio=n;}};
  const sun={shadow:{mapSize:{set(n){this.x=n;}}}},camera={updateProjectionMatrix(){}},scene={fog:{},traverse(){}},ovenLight={};
  graphicsQuality({renderer,camera,scene,sun,ovenLight},g);
  assert.equal(renderer.shadowMap.enabled,Boolean(g.shadows));assert.equal(camera.far,g.distance);assert.equal(ovenLight.visible,g.detailLight);
}
console.log('PASS: ciclo de atendimento, Roberto, quatro categorias, volumes, perfis gráficos, reversão e persistência.');
