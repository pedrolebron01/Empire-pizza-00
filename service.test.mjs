import assert from 'node:assert/strict';
import {fresh,restore} from './core.js';
import {SERVICES,currentService,startService,serviceOrder,recordService,serviceProgress} from './service.js';
let s=fresh(),pizzas=0;
assert.equal(s.service.index,0);assert.equal(serviceOrder(s,0),null);
for(const t of SERVICES){assert.equal(currentService(s).id,t.id);startService(s);assert.equal(serviceOrder(s,0).qty,t.mode==='family'?2:1);
 for(let wave=0;wave<4;wave++){
  const before=s.service.served;
  if(t.mode==='quality'){recordService(s,'delivery',{recipe:0,quality:.6});assert.equal(s.service.served,before);}
  if(t.mode==='counter'){recordService(s,'delivery',{recipe:0,quality:1,source:'hand'});assert.equal(s.service.served,before);}
  if(t.requires==='helper'){recordService(s,'delivery',{recipe:0,quality:1,source:'shelf'});assert.equal(s.service.served,before);recordService(s,'helperDrop');}
  for(let pizza=0;pizza<t.size;pizza++){
   const recipe=serviceProgress(s).recipe,beforeMoney=s.money;
   if(t.mode==='sequence'){recordService(s,'delivery',{recipe:(recipe+1)%6,quality:1});assert.equal(s.service.served,pizza);}
   const result=recordService(s,'delivery',{recipe,quality:1,source:'shelf'});assert(result);pizzas++;
   if(pizza===t.size-1&&wave===3)assert.equal(s.money,beforeMoney+t.money+(t.id===35?750:0));
   const active=s.service.active;s=restore(JSON.stringify(s));assert.equal(s.service.active,false);s.service.active=active;
  }
 }
 assert.equal(s.service.index,t.id+1);assert.equal(s.service.wave,0);
}
assert.equal(pizzas,816);assert(s.service.complete);const money=s.money;recordService(s,'delivery',{quality:1,recipe:0});assert.equal(s.money,money);
console.log('PASS: 36 serviços, 144 rodadas e 816 pizzas; regras de sequência, qualidade, balcão, ajudante, retomada e recompensa única.');
