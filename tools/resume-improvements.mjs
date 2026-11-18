import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const write=(p,s)=>fs.writeFileSync(new URL(p,root),s);
let s=read('game.js');
s=s.replace("$('#tutorial-start').onclick=()=>{closeModal();startTutorial(true);};", "$('#tutorial-start').onclick=()=>{if(!started)startGame();else closeModal();startTutorial(true);};");
s=s.replace("tutorial.start(restart);if(!customers", "tutorial.start(restart);if(restart)state.tutorialComplete=false;state.tutorialProgress=tutorial.snapshot();save();if(!customers");
// A resumed lesson accepts completed actions in any order and recovers transient kitchen steps.
s=s.replace("selected=customers.find(c=>c.status!=='exit')?.id??null;$('#tutorial').hidden=false;", "selected=customers.find(c=>c.status!=='exit')?.id??null;$('#tutorial').hidden=!tutorial.active;");
s=s.replace("detail=LESSONS[tutorial.step][2]+' '+detail;", "detail=LESSONS[tutorial.step][2]+(tutorial.step>=2&&tutorial.step<=7?' '+detail:'');");
s=s.replace("if(tutorial.active){title=LESSONS[tutorial.step][1];", "if(tutorial.active){title=LESSONS[tutorial.step][1];");
s=s.replace("const p=hand.find(p=>p.stage==='raw');", "const p=hand.find(p=>p.stage==='raw');");
// Keep incomplete prep reversible; raw pizzas become available only when work finishes.
s=s.replace("p.recipe=r;p.stage='raw';work={left:","p.recipe=r;p.stage='preparing';work={pizza:p,left:");
s=s.replace("if(work.left<=0){work=null;", "if(work.left<=0){work.pizza.stage='raw';work=null;");
s=s.replace("if(e.key.toLowerCase()==='e')interact();", "if(e.key.toLowerCase()==='e')interact();if(e.key.toLowerCase()==='q'&&work){const p=work.pizza;if(p.recipe>=3)state.stock[p.recipe]++;p.stage='dough';p.recipe=null;work=null;$('#work').style.display='none';refreshPizzas();save();toast('Preparo cancelado. Massa e ingredientes recuperados.');}");
s=s.replace("'Espalhando molho e ingredientes…'", "'Preparando · Q para cancelar'");
s=s.replace("raw:'montada',ready:'pronta'", "raw:'montada',preparing:'em preparo',ready:'pronta'");
// Manual velocity uses exponential acceleration; both movement modes share collision checks.
const start=s.indexOf('function updatePlayer(dt)'),end=s.indexOf('function updatePrompt()',start);
s=s.slice(0,start)+`function updatePlayer(dt){
 if(walkTarget&&!work){const manual=keys.w||keys.a||keys.s||keys.d||keys.arrowup||keys.arrowdown||keys.arrowleft||keys.arrowright||stick.x||stick.y;if(manual){walkTarget=null;player.path=[];}else{if(navigate(player,points[walkTarget],3.1,dt)){const id=walkTarget;walkTarget=null;nearest={...points[id],id};interact();}advanceTutorial('move');return;}}
 let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+stick.x,z=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+stick.y;
 const len=Math.max(1,Math.hypot(x,z)),speed=keys.shift?5:3.1;x/=len;z/=len;
 player.vx??=0;player.vz??=0;const smooth=1-Math.exp(-dt*18);
 player.vx+=((work?0:(x*.866+z*.5)*speed)-player.vx)*smooth;player.vz+=((work?0:(-x*.5+z*.866)*speed)-player.vz)*smooth;
 const p=player.g.position,beforeX=p.x,beforeZ=p.z;
 if(actorCanStand(player,p.x+player.vx*dt,p.z))p.x+=player.vx*dt;else player.vx=0;
 if(actorCanStand(player,p.x,p.z+player.vz*dt))p.z+=player.vz*dt;else player.vz=0;
 const moving=Math.hypot(p.x-beforeX,p.z-beforeZ)>.001;if(moving){player.g.rotation.y=Math.atan2(player.vx,player.vz);advanceTutorial('move');}
 animatePerson(player,dt,moving,!!work||hand.length>0);
}
`+s.slice(end);
const navStart=s.indexOf('function navigate('),navEnd=s.indexOf('const queue=',navStart);
s=s.slice(0,navStart)+`function actorCanStand(actor,x,z){return canStand(x,z,obstacles,!!state.upgrades.expand)&&![player,roberto,...customers].some(a=>a!==actor&&Math.hypot(a.g.position.x-x,a.g.position.z-z)<.49);}
function navigate(p,target,speed,dt){
 if(Math.hypot(p.g.position.x-target.x,p.g.position.z-target.z)<.36){p.blocked=0;animatePerson(p,dt,false);return true;}
 p.retry=Math.max(0,(p.retry||0)-dt);
 if((!p.path.length||p.target!==target)&&!p.retry){p.path=route(p.g.position,target,obstacles,!!state.upgrades.expand);p.target=target;p.retry=.4;}
 const n=p.path[0];if(!n){animatePerson(p,dt,false);return false;}
 const dx=n.x-p.g.position.x,dz=n.z-p.g.position.z,d=Math.hypot(dx,dz),v=Math.min(d,speed*dt);
 if(d<.03){p.path.shift();return false;}
 const nx=p.g.position.x+dx/d*v,nz=p.g.position.z+dz/d*v;
 if(!actorCanStand(p,nx,nz)){p.blocked=(p.blocked||0)+dt;animatePerson(p,dt,false);if(p.blocked>1.1){const others=[player,roberto,...customers].filter(a=>a!==p).map(a=>({x:a.g.position.x,z:a.g.position.z,w:.22,d:.22}));p.path=route(p.g.position,target,[...obstacles,...others],!!state.upgrades.expand);p.retry=.6;if(p.blocked>2.5){for(const sign of [-1,1]){const side={x:p.g.position.x+sign*.65,z:p.g.position.z};if(actorCanStand(p,side.x,side.z)){p.path=[side,...p.path];break;}}p.blocked=0;}}return false;}
 p.blocked=0;p.g.position.x=nx;p.g.position.z=nz;p.g.rotation.y=Math.atan2(dx,dz);if(d<.1)p.path.shift();animatePerson(p,dt,true,p.carrying.length>0);return false;
}
`+s.slice(navEnd);
s=s.replace("function keysReset(){for(let k in keys)","function keysReset(){player.vx=player.vz=0;for(let k in keys)");
// Click any visible station in the scene, reusing its route and interaction.
s+=`\nconst stationPicker=new T.Raycaster(),pointer=new T.Vector2();
$('#world').addEventListener('pointerup',e=>{if(!started||paused||work)return;pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);stationPicker.setFromCamera(pointer,camera);const hit=stationPicker.intersectObject(ground)[0];if(!hit)return;const p=hit.point;const st=stations.map(s=>({...s,d:Math.hypot(s.x-p.x,s.z-p.z)})).sort((a,b)=>a.d-b.d)[0];if(st?.d<2)goToStation(st.id);});
`;
// Progress is saved on each qualifying action, even before a contract is complete.
s=s.replace("const result=campaignEvent(state,event,data);if(!result)return;save();", "const result=campaignEvent(state,event,data);save();if(!result)return;");
// Successful delivery is visible immediately even if narrative notices are queued.
s=s.replace("toast(`Entrega concluída!", "toastTime=0;toast(`Entrega concluída!");
// Keep tutorial progress badge compact and a contextual Roberto button available.
s=s.replace("badge.onclick=showPause;", "badge.onclick=showPause;");
s=s.replace("ordersToggle.textContent='Trocar pedido';", "ordersToggle.textContent='Trocar pedido';");
s+=`\nconst robertoHelp=document.createElement('button');robertoHelp.id='roberto-help';robertoHelp.textContent='Roberto · ajuda';robertoHelp.onclick=showRoberto;$('#mission').append(robertoHelp);
`;
write('game.js',s);
let c=read('campaign.js');c=c.replace('c.count+=data.amount||1','c.count+=data.amount??1');c=c.replace("complete:raw?.complete===true", "complete:Math.floor(n(raw?.index))>=CONTRACTS.length");write('campaign.js',c);
// Maintain an integration harness that can read multiline functions.
let t=read('game-integration.test.mjs');t=t.replace("import * as progression from './progression.js';", "import * as progression from './progression.js';\nimport {Tutorial} from './tutorial.js';");
t=t.replace("dataset:{}})","dataset:{},append(){}})");
t=t.replace("console,Math,Set,document:{", "console,Math,Set,tutorial:new Tutorial(),art:()=>'',recordCampaign(){},advanceTutorial(){},motionReduced:()=>false,document:{createElement:()=>({}),");
t=t.replace("const oneLine=name=>source.split('\\n').find(l=>l.startsWith('function '+name+'('));", "const oneLine=name=>{const start=source.indexOf('function '+name+'(');const next=source.indexOf('\\nfunction ',start+1);let text=source.slice(start,next<0?undefined:next);if(name==='showPause')text=text.slice(0,text.indexOf(\"\\n$('#upgrades')\"));return text;};");
write('game-integration.test.mjs',t);
console.log('Movement, action recovery and integration fixes applied.');
