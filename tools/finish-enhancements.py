from pathlib import Path
import os,zipfile,json
root=Path(__file__).resolve().parent.parent
def write(p,s):
    t=p.with_name(p.name+'.finish.tmp');t.write_text(s,encoding='utf-8');os.replace(t,p)
p=root/'style.css';write(p,p.read_text(encoding='utf-8')+'\n'+(root/'tools/readability.css').read_text(encoding='utf-8'))
p=root/'core.js';s=p.read_text(encoding='utf-8');s=s.replace("*(1+s.upgrades.decor*.2));const total=Math.round(base*quality+tip*(rush?1.5:1))", "*(1+s.upgrades.decor*.2)*(rush?1.5:1));const total=Math.round(base*quality+tip)");write(p,s)
p=root/'game.js';s=p.read_text(encoding='utf-8').replace("c.special.name+' · ':''", "c.special.name+' · ':''")
s=s.replace("function showMissions(){showModal(dailyMarkup()+", "function showMissions(){showModal(dailyMarkup()+")
# Keep updated guide text consistent with the new counter actions.
s=s.replace('Selecione a comanda e entregue no balcão.', 'Selecione a comanda e escolha Entregar no balcão.')
write(p,s)
p=root/'package.json';data=json.loads(p.read_text());data['scripts']['test']='node tests.mjs && node counter.test.mjs && node enhancements.test.mjs';write(p,json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Interface ampliada e comando de testes atualizados.')
