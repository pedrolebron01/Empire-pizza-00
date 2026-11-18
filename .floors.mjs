import fs from 'node:fs';
let s=fs.readFileSync('game.js','utf8');
function rep(a,b){if(!s.includes(a))throw Error(a);s=s.replace(a,b)}
s="import {buildFloors} from './pavimentos.js';\n"+s;
rep('initEnhancements();rebuild();quality();','const floors=buildFloors({scene,box,cyl,textSign,player,state,showModal,closeModal,showMissions,showStock});\ninitEnhancements();rebuild();quality();');
rep('if(paused||work||!started)return;const n=nearest;', 'if(paused||work||!started)return;if(floors.interact())return;const n=nearest;');
rep('updatePlayer(dt);updateCustomers(dt);','const riding=floors.upstairs;floors.update(dt,keys,stick,animatePerson);if(!riding)updatePlayer(dt);else walkTarget=null;updateCustomers(dt);');
rep('function updatePrompt(){let list=',"function updatePrompt(){if(floors.upstairs){nearest=null;$('#prompt').style.display='none';return}let list=");
rep('focus.x+dist*.45','focus.x+dist*.45+(!started&&!motionReduced()?menuMouse*.5:0)');
rep('dist*.8,focus.z','dist*.8+player.g.position.y,focus.z');
rep('camera.lookAt(focus.x,.1,','camera.lookAt(focus.x,.1+player.g.position.y,');
rep('let introTime=0;', "let menuMouse=0;addEventListener('pointermove',e=>menuMouse=e.clientX/innerWidth*2-1);let introTime=0;");
rep('Math.sin(player.g.rotation.y)*.5,1+i*.16','Math.sin(player.g.rotation.y)*.5,1+i*.16');
rep("const fps=document.createElement('label');fps.innerHTML='Limite de quadros <select>'+[30,60,90,120,0].map(n=>'<option value=\"'+n+'\">'+(n?n+' FPS':'Sem limite')+'</option>').join('')+'</select>';$('#quality').parentElement.after(fps);fps.lastElementChild.value=state.fps;fps.lastElementChild.onchange=", "$('#fps').value=state.fps;$('#fps').onchange=");
rep('<label>Qualidade gráfica', '<label>Limite de quadros <select id="fps">'+[30,60,90,120,0].map(n=>'<option value="'+n+'">'+(n?n+' FPS':'Sem limite')+'</option>').join('')+'</select></label><label>Qualidade gráfica');
fs.writeFileSync('game.js',s);
fs.appendFileSync('salao.css','\n.floor-badge{position:fixed;bottom:18%;left:50%;transform:translateX(-50%);z-index:5;background:#285643;color:#fff4db;border:2px solid #f7d594;border-radius:12px;padding:.7rem 1rem}.floor-badge[hidden],body:has(#modal:not(.hidden)) .floor-badge{display:none}');
s=fs.readFileSync('game-integration.test.mjs','utf8').replace('const context={','const context={floors:{interact:()=>false},').replace('tick(30);assert.equal(count(\'burn\'),1);','tick(30);assert.equal(count(\'burn\'),0);tick(5);assert.equal(count(\'burn\'),1);');fs.writeFileSync('game-integration.test.mjs',s);
for(const f of ['game.js','pavimentos.js','salao.css'])fs.copyFileSync(f,'dist/'+f);
