from pathlib import Path
import os
root=Path(__file__).resolve().parent.parent
p=root/'game.js'
s=p.read_text(encoding='utf-8')
s=s.replace("const ovenLabel=label(ovenLight,'Forno livre','',.4);", """const ovenLabel=label(ovenLight,'Forno livre','',.4);
const steamMaterial=new T.MeshBasicMaterial({color:0xfff4d7,transparent:true,opacity:.25,depthWrite:false});
const steam=Array.from({length:14},(_,i)=>{const m=new T.Mesh(new T.SphereGeometry(.07,7,5),steamMaterial.clone());m.visible=false;scene.add(m);return m;});
function updateSteam(){let sources=[...ovens.filter(p=>p.stage==='ready').map(()=>new T.Vector3(-.65,1.05,-3.65)),...hand.filter(p=>p.stage==='ready'&&p.visual).map(p=>p.visual.position),...shelf.slice(0,2).map((p,i)=>new T.Vector3(-6+i*.7,1.3,1.8))];steam.forEach((m,i)=>{m.visible=!!sources.length&&state.quality!=='baixa';if(!m.visible)return;let t=(time*.65+i*.19)%1,src=sources[i%sources.length];m.position.copy(src).add(new T.Vector3(Math.sin(i*3+time)*.12,.12+t*.7,Math.cos(i)*.12));m.scale.setScalar(.6+t*1.2);m.material.opacity=(1-t)*.24;});}
""")
s=s.replace("renderer.render(scene,camera);}","updateSteam();renderer.render(scene,camera);}")
s=s.replace("g.gain.setValueAtTime(state.volume*.12,t);", "g.gain.setValueAtTime(Math.max(.0001,state.volume*.12),t);")
t=p.with_suffix('.polish.tmp');t.write_text(s,encoding='utf-8');os.replace(t,p)
print('Vapor e ajustes de áudio aplicados.')
