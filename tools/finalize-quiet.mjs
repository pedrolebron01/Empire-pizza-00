import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),write=(p,s)=>fs.writeFileSync(new URL(p,root),s);
let s=read('game.js');
s=s.replace("<button id=\"menu-tray\">Bandeja</button>","<button id=\"menu-tray\">Bandeja</button><button id=\"menu-stock\">Estoque</button><button id=\"menu-recipes\">Receitas</button>");
s=s.replace("tray:showTray,contracts:","tray:showTray,stock:showStock,recipes:showRecipeBook,contracts:");
s=s.replace("<button id=\"menu-resume\">Voltar ao jogo</button>","<button id=\"menu-resume\">Voltar ao jogo</button><button id=\"menu-skip\">Pular tutorial</button>");
s=s.replace("for(const [key,fn]of Object.entries(handlers))$('#menu-'+key).onclick=fn;", "for(const [key,fn]of Object.entries(handlers))$('#menu-'+key).onclick=fn;$('#menu-skip').hidden=!tutorial.active;$('#menu-skip').onclick=()=>{$('#tutorial-stop').click();closeModal();};");
s+=`\nfunction showRecipeBook(){showModal('<h2>Receitas da casa</h2>'+RECIPES.map(r=>'<div class="service-card"><b>'+(level(state)>=r.level?'✓ ':'▣ ')+r.name+'</b><p>'+r.ingredients+'</p><p>'+(level(state)>=r.level?'Disponível na Bancada':'Desbloqueia no nível '+r.level)+'</p></div>').join(''));}
`;
write('game.js',s);
const p=JSON.parse(read('package.json'));if(!p.scripts.test.includes('service.test.mjs'))p.scripts.test+=' && node service.test.mjs';write('package.json',JSON.stringify(p,null,2)+'\n');
const files=['index.html','startup.js','style.css','quiet-hud.css','game.js','core.js','counter.js','audio.js','progression.js','tutorial.js','campaign.js','service.js','illustrations.js','TECHNICAL-REFERENCES.md','CAMPAIGN-PLAN.md'];
for(const f of files){if(fs.existsSync(new URL(f,root)))fs.copyFileSync(new URL(f,root),new URL('dist/'+f,root));}
fs.mkdirSync(new URL('dist/assets/audio/',root),{recursive:true});for(const f of fs.readdirSync(new URL('assets/audio/',root)))fs.copyFileSync(new URL('assets/audio/'+f,root),new URL('dist/assets/audio/'+f,root));
console.log('Quiet UI, campaign, sound assets and dist synchronized.');
