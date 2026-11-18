import assert from 'node:assert/strict';
import {fresh,restore} from './core.js';
import {CONTRACTS,campaignEvent} from './campaign.js';
import {Tutorial,LESSONS} from './tutorial.js';
let s=fresh();const old=restore(JSON.stringify({version:1,money:732,xp:450,served:20,upgrades:{oven:2},volume:.4}));
assert.equal(old.money,732);assert.equal(old.upgrades.oven,2);assert.equal(old.campaign.index,0);
let t=new Tutorial();t.start();t.record('move');t.record('dough');t=new Tutorial(t.snapshot());t.start();assert.equal(LESSONS[t.step][0],'select');assert(t.done.has('dough'));assert(!t.record('dough'));
for(const lesson of LESSONS)t.record(lesson[0]);assert(!t.active);assert.equal(t.step,LESSONS.length);
for(const [index,contract] of CONTRACTS.entries()){
 assert.equal(s.campaign.index,index);const before=s.money;
 let result=null;
 if(contract.event==='upgrade'){s.upgrades[contract.upgrade]=contract.tier;result=campaignEvent(s,'check');}
 else if(contract.event==='variety'){for(let i=0;i<contract.goal;i++)result=campaignEvent(s,'delivery',{recipe:i});}
 else if(contract.event==='streak'){result=campaignEvent(s,'delivery',{streak:contract.goal});}
 else if(contract.event==='tips'){assert.equal(campaignEvent(s,'tips',{amount:0}),null);assert.equal(s.campaign.count,0);result=campaignEvent(s,'tips',{amount:contract.goal});}
 else for(let i=0;i<contract.goal;i++)result=campaignEvent(s,contract.event,{recipe:contract.recipe??0,quality:1,fast:true});
 assert.equal(result.id,contract.id);assert(s.money>before);s=restore(JSON.stringify(s));assert.equal(s.campaign.index,index+1);
}
assert(s.campaign.complete);const paid=s.money;campaignEvent(s,'delivery',{quality:1,fast:true});assert.equal(s.money,paid);
console.log('PASS: 93 contratos alcançáveis, recompensas sem duplicação, gorjeta zero, melhorias prévias, migração e tutorial persistente.');
