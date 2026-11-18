"""Atomic file replacement for the workspace's Windows ACL configuration."""
from pathlib import Path
import os
root=Path(__file__).resolve().parent.parent
def replace(name,old,new):
    p=root/name
    text=p.read_text(encoding='utf-8')
    assert old in text, name
    tmp=p.with_suffix(p.suffix+'.tmp')
    tmp.write_text(text.replace(old,new),encoding='utf-8')
    os.replace(tmp,p)
replace('server.mjs',"const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\\/(\\w:)/,'$1'));", "const root=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname.replace(/^\\/(\\w:)/,'$1'))).replaceAll('/',path.sep);")
replace('game.js',"d=Math.hypot(dx,dz),v=Math.min(d,speed*dt);", "d=Math.hypot(dx,dz),v=Math.min(d,speed*dt);if(d<.001){p.path.shift();return false;}")
replace('game.js',"customers.forEach(c=>c.path=[]);roberto.path=[];", "customers.forEach(c=>c.path=[]);roberto.path=[];for(const actor of [player,roberto,...customers]){if(!canStand(actor.g.position.x,actor.g.position.z,obstacles,!!state.upgrades.expand)){let spot=null;for(let radius=.3;radius<7&&!spot;radius+=.3){for(let a=0;a<16;a++){let x=actor.g.position.x+Math.cos(a*Math.PI/8)*radius,z=actor.g.position.z+Math.sin(a*Math.PI/8)*radius;if(canStand(x,z,obstacles,!!state.upgrades.expand)){spot={x,z};break;}}}if(spot)actor.g.position.set(spot.x,0,spot.z);}}")
replace('game.js',"toast(`Entrega perfeita! +R$", "toast(`Entrega concluída! +R$")
print('Correções aplicadas atomicamente.')
