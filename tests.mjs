import assert from 'node:assert/strict';
import {fresh,restore,buy,cost,claim,level,reward,route,canStand} from './core.js';
const s=fresh();assert.equal(buy(s,'oven'),false);assert.equal(s.money,20);
reward(s,0,1,1,1,false);reward(s,0,1,1,2,false);const before=s.money;assert.equal(buy(s,'oven'),true);assert.equal(s.money,before-65);assert.equal(s.upgrades.oven,1);assert.equal(buy(s,'helper'),false);
reward(s,0,1,1,3,false);let rewards=claim(s);assert(rewards.length>=2);let balance=s.money;assert.deepEqual(claim(s),[]);assert.equal(s.money,balance);s.money+=100;assert(buy(s,'helper'));assert.equal(s.upgrades.helper,1);
const roundtrip=restore(JSON.stringify(s));assert.deepEqual(roundtrip,s);assert.deepEqual(restore('{corrupted'),fresh());assert.equal(restore('{"version":1,"money":-8}').money,20);
const obs=[{x:-7,z:-4.65,w:2.4,d:1.25},{x:-3.9,z:-4.65,w:2.6,d:1.25},{x:-.65,z:-4.55,w:2.1,d:1.8},{x:1.7,z:-4.65,w:1.2,d:1.25},{x:-5,z:1.8,w:4.4,d:1.1},{x:1,z:1.3,w:1.65,d:1.65},{x:1,z:.08,w:.65,d:.65},{x:1,z:2.52,w:.65,d:.65}];
const paths=[[{x:-.5,z:5.1},{x:-5,z:3}],[{x:-.65,z:-3.1},{x:-5,z:.65}],[{x:-2.6,z:-1.4},{x:-.65,z:-3.1}],[{x:-5,z:3},{x:-.5,z:5.1}]];
for(const [a,b]of paths){const path=route(a,b,obs,false);assert(path.length>0,JSON.stringify({a,b}));for(const p of path)assert(canStand(p.x,p.z,obs,false));}
assert(!canStand(5,0,obs,false));assert(canStand(5,0,obs,true));assert(!canStand(-5,1.8,obs,true));
const rich=fresh();rich.money=100000;for(let i=0;i<5;i++)buy(rich,'oven');assert.equal(rich.upgrades.oven,3);assert.equal(buy(rich,'invalid'),false);
const target=fresh();for(let i=0;i<25;i++)reward(target,0,1,1,5,false);assert.equal(level(target),6);assert(target.money>0);
console.log('PASS: economia, dedução, limites de upgrade, contratação, recompensas idempotentes, XP, restauração, colisões e 4 rotas de navegação.');
