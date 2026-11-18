import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fresh,restore} from './core.js';
import {BOOKINGS,canBook,officeDelivery,scoreCup,stockSnapshot,train} from './management.js';

const legacy=fresh();
delete legacy.office;
legacy.money=524;
let state=restore(JSON.stringify(legacy));
assert.equal(state.money,524);
assert.equal(state.office.specialty,-1);
assert.equal(train(state,'host'),false);
state.served=60;
assert(train(state,'host'));
assert.equal(state.money,469);
assert.equal(train(state,'not-a-role'),false);
for(const book of BOOKINGS){
  const booking=state.office.page;
  assert(canBook(state,6));
  state.office.active=true;
  const before=state.money;
  for(const recipe of book.recipes){
    const sale={booking,recipe,fast:true,quality:1,source:'shelf',finished:true};
    const progress=state.office.stamp;
    officeDelivery(state,{...sale,booking:-1});
    officeDelivery(state,{...sale,fast:false,quality:.6,source:'hand'});
    assert.equal(state.office.stamp,progress);
    officeDelivery(state,sale);
    state=restore(JSON.stringify(state));
  }
  assert.equal(state.office.page,booking+1);
  assert.equal(state.money,before+book.reward);
  assert.equal(state.office.active,false);
}
assert.equal(state.office.reviews.length,8);
const cup=state.office.cup;
cup.active=true;
for(let i=0;i<12;i++)scoreCup(state,{recipe:i%3,fast:true,quality:1});
assert.equal(cup.best,600);
assert.equal(cup.active,false);
const snapshot=stockSnapshot(state,[{stage:'raw',recipe:4},{stage:'ready',recipe:4},{stage:'dough',recipe:null}]);
assert.equal(snapshot.stock[4],state.stock[4]+2);
assert.deepEqual(restore(JSON.stringify(snapshot)).stock,snapshot.stock);
assert.equal(state.stock[4],8);

// Exercise the same pickup and handoff handlers that run in the scene.
const game=fs.readFileSync(new URL('./game.js',import.meta.url),'utf8');
const makeObject=()=>({position:{x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});}},rotation:{y:0}});
const kitchen=fresh();
kitchen.office.cook=1;kitchen.office.courier=1;kitchen.office.active=true;
const order={id:1,booking:0,status:'wait',recipe:1,g:makeObject()};
const context=vm.createContext({state:kitchen,customers:[order],officeActors:{},cookBatch:null,
  points:{bench:{x:-3.9},counter:{x:-5,z:.65}},hand:[],shelf:[],heldIndex:0,
  person:()=>({g:makeObject(),carrying:[]}),pizza:makeObject,scene:{add(){}},RECIPES:[{name:'A'},{name:'B'}],
  animatePerson(){},disposeGroup(){},toast(){},sound(){},refreshPizzas(){},renderUI(){},save(){},navigate:()=>false,
  deliver(c,p,items){assert.equal(c.id,1);items.splice(items.indexOf(p),1);c.status='exit';}});
for(const name of ['updateTeamCook','collectTeamPizza','updateTeamCourier']){
 const start=game.indexOf('function '+name+'('),end=game.indexOf('\nfunction ',start+1);
 vm.runInContext(game.slice(start,end),context);
}
context.updateTeamCook(1);
assert.equal(context.collectTeamPizza(),false);
context.updateTeamCook(15);
assert.equal(context.collectTeamPizza(),true);
assert.equal(context.hand[0].stage,'raw');
assert.equal(context.collectTeamPizza(),false);
context.shelf.push({stage:'ready',recipe:1});
context.updateTeamCourier(1);
assert.equal(context.shelf.length,1,'Pickup requires arrival');
context.navigate=()=>true;
context.updateTeamCourier(1);
assert.equal(context.shelf.length,0);
assert.equal(context.officeActors.courier.carrying.length,1);
context.updateTeamCourier(1);
assert.equal(order.status,'exit');
assert.equal(context.officeActors.courier.carrying.length,0);
order.status='wait';context.shelf.push({stage:'ready',recipe:1});
context.updateTeamCourier(1);order.status='exit';context.updateTeamCourier(1);
assert.equal(context.shelf.length,1,'Unclaimed pizzas return to the counter');
console.log('PASS: migração do caderno, contratação, sete encomendas, pagamento único, taça, avaliações e devolução de ingredientes.');
