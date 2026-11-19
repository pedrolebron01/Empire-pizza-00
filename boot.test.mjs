import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const listeners=new Map(),shots=[];
const no=()=>{};
let loop,checkpoints=0,now=performance.now();
const context={fillRect:no,fillText:no,putImageData:no,createRadialGradient:()=>({addColorStop:no}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})};
class Element {
 constructor(tag='div'){
  this.tag=tag;this.children=[];this.dataset={};this.style={setProperty:no};this.attributes={};this.className='';this.id='';this.textContent='';
  this.classList={contains:k=>this.className.split(' ').includes(k),add:(...ks)=>{this.className=[...new Set([...this.className.split(' '),...ks])].join(' ')},remove:(...ks)=>{this.className=this.className.split(' ').filter(k=>!ks.includes(k)).join(' ')},toggle:(k,force)=>{(force??!this.classList.contains(k))?this.classList.add(k):this.classList.remove(k)}};
 }
 append(...nodes){for(const n of nodes){n.parentElement=this;this.children.push(n)}}
 get isConnected(){return this===document.documentElement||!!this.parentElement?.isConnected}
 get nextElementSibling(){const sibs=this.parentElement.children;return sibs[sibs.indexOf(this)+1]}
 get innerHTML(){return this.html||''}
 set innerHTML(value){for(const n of this.children)n.parentElement=null;this.children=[];this.html=value;const stack=[this];
  for(const match of String(value).matchAll(/<(\/?)([\w-]+)([^>]*)>|([^<]+)/g)){
   const [,end,tag,attrs,content]=match;if(content){stack.at(-1).textContent+=content;continue}
   if(end){const idx=stack.findLastIndex(n=>n.tag===tag);if(idx>0)stack.length=idx;continue}
   const n=new Element(tag);for(const a of attrs.matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g))n.setAttribute(a[1],a[2]??a[3]??'');
   stack.at(-1).append(n);
   if(!['input','img','br','hr','meta','link','source'].includes(tag))stack.push(n);
  }
 }
 setAttribute(k,v){this.attributes[k]=v;if(k==='class')this.className=v;else if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-(\w)/g,(_,c)=>c.toUpperCase())]=v;else this[k]=['disabled','checked','hidden'].includes(k)?true:v}
 matches(s){if(s.startsWith('#'))return this.id===s.slice(1);if(s.startsWith('.'))return this.classList.contains(s.slice(1));if(s.startsWith('[')){const [,attr,value]=s.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/)||[];return attr in this.attributes&&(value===undefined||value===this.attributes[attr])}return this.tag===s}
 querySelectorAll(selector){const parts=selector.trim().split(/\s+/);const all=[];function visit(n){for(const child of n.children){let parent=child;let ok=parent.matches(parts.at(-1));for(let i=parts.length-2;i>=0&&ok;i--){parent=parent.parentElement;while(parent&&!parent.matches(parts[i]))parent=parent.parentElement;ok=!!parent}if(ok)all.push(child);visit(child)}}visit(this);return all}
 querySelector(s){return this.querySelectorAll(s)[0]||null}
 addEventListener(k,f){this['on'+k]=f} focus(){document.activeElement=this}
 remove(){if(!this.parentElement)return;this.parentElement.children=this.parentElement.children.filter(c=>c!==this);this.parentElement=null}
 getContext(){return context}
 click(){if(this.disabled)return;this.onclick?.({target:this});listeners.get('document:click')?.({target:this})}
}
const root=new Element('html'),head=new Element('head'),body=new Element('body');root.append(head,body);
const doc={documentElement:root,head,body,hidden:false,createElement:t=>new Element(t),getElementById:id=>root.querySelector('#'+id),querySelector:s=>root.querySelector(s),querySelectorAll:s=>root.querySelectorAll(s),addEventListener:(k,f)=>listeners.set('document:'+k,f)};
const html=await fs.readFile(new URL('./index.html',import.meta.url),'utf8');body.innerHTML=html.split(/<body[^>]*>/)[1].split('</body>')[0].replace(/<script[^>]*>[\s\S]*?<\/script>/g,'');
const saved=new Map();
Object.assign(globalThis,{document:doc,window:globalThis,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},matchMedia:()=>({matches:false}),devicePixelRatio:1,innerWidth:1366,innerHeight:768,addEventListener:(k,f)=>listeners.set(k,f),requestAnimationFrame:f=>shots.push(f),setInterval:()=>1,fetch:async()=>({json:async()=>({})})});
globalThis.TestRenderer=class {
 constructor(){this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>8}}
 setSize(){} setPixelRatio(){} setRenderTarget(){} readRenderTargetPixels(){}
 render(scene,camera){assert.ok(scene.isScene&&camera.isCamera);scene.updateMatrixWorld();checkpoints++}
 setAnimationLoop(f){loop=f}
};
const work=await fs.mkdtemp(path.join(tmpdir(),'pizza-boot-'));
const base=new URL('./',import.meta.url);
try{
 await fs.writeFile(path.join(work,'package.json'),'{"type":"module"}');
 const sourceUrl=new URL('./vendor/three.module.js',base).href;
 await fs.writeFile(path.join(work,'renderer.js'),"export * from '"+sourceUrl+"'; export const WebGLRenderer=globalThis.TestRenderer;");
 for(const name of ['game.js','atelier.js','bairros.js','pavimentos.js','ambiente.js']){
  const source=await fs.readFile(new URL(name,base),'utf8');
  const resolved=source.replaceAll("from 'three'","from './renderer.js'").replace(/from '(\.\/[\w.-]+)'/g,(match,dep)=>['./renderer.js','./atelier.js','./bairros.js','./pavimentos.js','./ambiente.js'].includes(dep)?match:"from '"+new URL(dep,base).href+"'");
  await fs.writeFile(path.join(work,name),resolved);
 }
 await import(pathToFileURL(path.join(work,'game.js')).href);
 const tick=n=>{for(let i=0;i<n;i++){now+=100;loop(now);for(const f of shots.splice(0))f(now)}};
 const click=selector=>{const n=doc.querySelector(selector);assert.ok(n,'Controle esperado '+selector);assert.ok(!n.disabled,'Controle ativo '+selector);n.click()};
 tick(2);
 const joystick=doc.querySelector('#joystick');
 joystick.getBoundingClientRect=()=>({left:20,top:30,width:80,height:80});
 joystick.setPointerCapture=id=>{joystick.captured=id};
 joystick.hasPointerCapture=id=>joystick.captured===id;
 joystick.onpointerdown({pointerId:1,clientX:60,clientY:70});
 assert.equal(doc.querySelector('#joystick i').style.transform,'translate(0px,0px)');
 joystick.onpointermove({pointerId:1,clientX:100,clientY:70});
 assert.equal(doc.querySelector('#joystick i').style.transform,'translate(28px,0px)');
 joystick.onpointercancel();assert.equal(doc.querySelector('#joystick i').style.transform,'');
 click('#home-diary');assert.equal(doc.querySelectorAll('[data-relato]').length,12);doc.querySelector('[data-relato]').onclick();click('#close');click('#home-recipes');click('#close');click('#home-salon');click('#salon-back');click('#home-chef');
for(let i=0;i<7;i++){tick(3);assert.ok(doc.querySelector('.brigada canvas'));click('#next-chef')}
 click('#prev-chef');assert.equal(doc.querySelector('.brigada h3').textContent,'Isa');click('#wear');assert.equal(JSON.parse(saved.get('pizza-empire-v1')).chef,6);
 click('#home-credits');click('#credit-back');click('#home-settings');
 for(const tab of ['access','audio','controls','graphics'])click('[data-tab="'+tab+'"]');
 click('#close');click('#home-story');click('#story-begin');tick(35);
 click('#pause');click('#menu-map');assert.equal(doc.querySelectorAll('[data-casa]').length,7);click('#close');
 click('#hud-actions');click('[data-action-station="dough"]');tick(70);
 click('#hud-actions');click('[data-action-station="bench"]');tick(90);click('[data-hand="0"]');click('[data-topping="molho"]');click('[data-topping="muçarela"]');click('#finish-hand');tick(30);
 click('#hud-actions');click('[data-action-station="oven"]');tick(180);
 click('#hud-actions');click('[data-action-station="oven"]');tick(20);
 click('#hud-actions');click('[data-action-station="counter"]');tick(120);click('#serve-pizza');tick(5);
 listeners.get('pagehide')();assert.ok(JSON.parse(saved.get('pizza-empire-v1')).served>=1);
 assert.deepEqual(JSON.parse(saved.get('pizza-empire-v1')).stamps,[0]);
 click('#hud-actions');click('#actions-lift');tick(100);
 click('.floor-badge');click('[data-floor="1"]');tick(35);assert.match(doc.querySelector('.floor-badge').textContent,/Mezanino/);
 click('.floor-badge');click('[data-floor="2"]');tick(35);assert.match(doc.querySelector('.floor-badge').textContent,/Terraço/);
 click('.floor-badge');click('[data-floor="0"]');tick(45);assert.match(doc.querySelector('.floor-badge').textContent,/Térreo/);
 assert.ok(checkpoints>400);
 console.log('PASS: game.js inteiro, menu, sete previews, categorias, campanha e primeiro pedido com movimento, Three.js real e renderer/DOM simulados.');
}finally{await fs.rm(work,{recursive:true,force:true})}

