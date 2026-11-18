from pathlib import Path
import os,zipfile,shutil,json
root=Path(__file__).resolve().parent.parent
p=root/'game.js';s=p.read_text(encoding='utf-8').replace('p.g.position.z-target.z)<.28','p.g.position.z-target.z)<.36').replace('table(-7,0)','table(-7.25,-.7)')
t=p.with_suffix('.finish.tmp');t.write_text(s,encoding='utf-8');os.replace(t,p)
dist=root/'dist';dist.mkdir(exist_ok=True)
files=['index.html','style.css','game.js','core.js']
for f in files:shutil.copyfile(root/f,dist/f)
(dist/'assets').mkdir(exist_ok=True)
shutil.copyfile(root/'assets/models.json',dist/'assets/models.json')
with zipfile.ZipFile(root.parent/'Pizza-Empire.zip','w',zipfile.ZIP_DEFLATED) as z:
    for name in files+['package.json','server.mjs','setup.py','tests.mjs','JOGAR.bat','README.md','assets/models.json']:
        z.write(root/name,'pizza-empire/'+name)
print('Projeto empacotado: Pizza-Empire.zip')
