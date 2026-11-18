import fs from 'node:fs';
let file,src;
function open(f){file=f;src=fs.readFileSync(f,'utf8')}
function sub(a,b){if(!src.includes(a))throw Error(a);src=src.replaceAll(a,b)}
function write(){fs.writeFileSync(file,src)}
open('core.js');src="import {restoreChef} from './brigada.js';\n"+src;sub('version:1,guideEnabled','version:1,chef:0,fps:60,guideEnabled');sub("d.quality=['baixa'","d.chef=restoreChef(s.chef,d.served);d.fps=[0,30,60,90,120].includes(s.fps)?s.fps:60;d.quality=['baixa'");write();
open('index.html');sub('</head>','<link rel="stylesheet" href="./salao.css"></head>');write();
open('game.js');src="import {chefs} from './brigada.js';\n"+src;
sub('person(0xeae6d5,0xd99d70,true)','person(chefs[state.chef].color,chefs[state.chef].skin,true)');
sub('1+state.upgrades.tray','(1+state.upgrades.tray+Number(state.chef===4))');
sub('keys.shift?5:3.1','((keys.shift?5:3.1)*(state.chef===3?1.18:1))');
sub('2.5-state.upgrades.bench*.55','(2.5-state.upgrades.bench*.55)*(state.chef===1?.75:1)');
sub('p.duration=Math.max(4,10-state.upgrades.oven*2)','p.duration=Math.max(4,10-state.upgrades.oven*2)*(state.chef===5?.8:1)');
sub('p.duration+18','p.duration+18+(state.chef===0?6:0)');
sub('  c.remaining--;','  if(state.chef===2&&combo>=2){state.money+=3;gain.tip+=3;gain.total+=3;}\n  c.remaining--;');
sub('let dt=Math.min(.05,(now-previous)/1000);previous=now;', 'const elapsed=now-previous;if(state.fps&&elapsed+0.6<1000/state.fps)return;let dt=Math.min(.1,elapsed/1000);previous=now;');
sub("$('#quality').value=state.quality;",`const fps=document.createElement('label');fps.innerHTML='Limite de quadros <select>'+[30,60,90,120,0].map(n=>'<option value="'+n+'">'+(n?n+' FPS':'Sem limite')+'</option>').join('')+'</select>';$('#quality').parentElement.after(fps);fps.lastElementChild.value=state.fps;fps.lastElementChild.onchange=e=>{state.fps=Number(e.target.value);save()};$('#quality').value=state.quality;`);
sub("showModal('<span class=\"eyebrow\">DO BALCÃO AO IMPÉRIO", "showModal('<section class=\"casa-menu\"><span class=\"eyebrow\">DO BALCÃO AO IMPÉRIO");
sub('<p>Escolha quem atender, o que preparar e quando investir. A campanha e o tutorial ficam à sua escolha.</p><button id="start">','<p>Forno de bairro · Pizzaiolo '+ "'+chefs[state.chef].name+'" +'</p><nav><button id="start">');
sub('</button><div class="dialog-actions"><button id="home-help">','</button><button id="home-chef">Escolher pizzaiolo</button><button id="home-story">Campanha</button><button id="home-help">');
sub("Nova partida</button></div>');","Nova partida</button></nav></section>');$('#home-chef').onclick=()=>showChefs(state.chef);$('#home-story').onclick=()=>{startGame();showStory()};");
sub('function home(){',`function showChefs(index){
 const c=chefs[index],available=state.served>=c.at;
 showModal('<h2>Escolha seu pizzaiolo</h2><section class="brigada"><canvas width="220" height="260" aria-label="Modelo de '+c.name+'"></canvas><article><small>'+ (available?'Disponível':'Libera com '+c.at+' entregas')+'</small><h3>'+c.name+'</h3><p>'+c.story+'</p><p><b>'+c.perk+'</b></p><nav><button id="prev-chef" aria-label="Anterior">←</button><button id="next-chef" aria-label="Próximo">→</button><button id="wear" '+(available?'':'disabled')+'>Escolher</button></nav></article></section>');
 const canvas=$('.brigada canvas'),ctx=canvas.getContext('2d'),stage=new T.Scene(),actor=person(c.color,c.skin,true,index===5);
 stage.add(actor.g,new T.HemisphereLight(0xfff2cb,0x776144,3));stage.background=new T.Color(0xf4d397);
 const eye=new T.PerspectiveCamera(35,220/260,.1,10);eye.position.set(1.4,1.4,3.7);eye.lookAt(0,1,0);
 const target=new T.WebGLRenderTarget(220,260),pixels=new Uint8Array(220*260*4),img=ctx.createImageData(220,260);
 let last=0;function pose(now){if(!canvas.isConnected){target.dispose();disposeGroup(actor.g);return}
 if(now-last>65){last=now;actor.g.rotation.y=motionReduced()?0:Math.sin(now/1000)*.25;animatePerson(actor,.065,false,true);renderer.setRenderTarget(target);renderer.render(stage,eye);renderer.readRenderTargetPixels(target,0,0,220,260,pixels);renderer.setRenderTarget(null);for(let y=0;y<260;y++)img.data.set(pixels.subarray((259-y)*880,(260-y)*880),y*880);ctx.putImageData(img,0,0)}requestAnimationFrame(pose)}requestAnimationFrame(pose);
 $('#prev-chef').onclick=()=>showChefs((index+5)%6);$('#next-chef').onclick=()=>showChefs((index+1)%6);
 $('#wear').onclick=()=>{if(!available)return;const old=chefs[state.chef];player.g.traverse(o=>{if(o.material===mat(old.color))o.material=mat(c.color);else if(o.material===mat(old.skin))o.material=mat(c.skin)});state.chef=index;save();home()};
}
function home(){`);
write();for(const f of ['game.js','core.js','index.html','brigada.js','salao.css'])fs.copyFileSync(f,'dist/'+f);
