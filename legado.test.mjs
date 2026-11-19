import assert from 'node:assert/strict';
import {fresh,restore} from './core.js';
import {relatos,registrar} from './legado.js';
import {lerPagina} from './caderno.js';
const base=fresh();delete base.relatos;delete base.paginas;delete base.floor;
base.served=22;base.money=417;base.chef=3;base.casa=2;
const s=restore(JSON.stringify(base));
assert.equal(s.money,417);assert.equal(s.chef,3);assert.equal(s.casa,2);
assert.deepEqual(s.relatos,Array(8).fill(null));
for(let i=0;i<relatos.length;i++)for(let rota=0;rota<2;rota++){
 const player=restore(JSON.stringify(s));
 player.relatos[i]={rota,etapa:0};
 function step(event){registrar(player,['basil','perfect'].includes(event)?'delivery':event,{quality:1,recipe:2});}
 step(relatos[i][rota?5:3][0]);assert.equal(player.relatos[i].etapa,1);
 step(relatos[i][6][0]);step(relatos[i][6][0]);
 assert.equal(player.money,462);assert.equal(player.xp,25);
 assert.deepEqual(restore(JSON.stringify(player)).relatos,player.relatos);
}
const answers=[0,1,2].map(n=>({dataset:{resposta:n}}));
globalThis.document={querySelector:()=>({}),querySelectorAll:()=>answers};
lerPagina(s,()=>{},()=>{},()=>{},0);answers[0].onclick();assert.equal(s.paginas.length,0);answers[1].onclick();answers[1].onclick();assert.deepEqual(s.paginas,[0]);assert.equal(s.xp,35);
s.floor=2;assert.equal(restore(JSON.stringify(s)).floor,2);
console.log('PASS: save anterior, 16 rotas, arquivo, andar e recompensas únicas.');
