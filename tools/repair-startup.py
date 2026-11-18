from pathlib import Path
import os, zipfile
root=Path(__file__).resolve().parent.parent
def write(path,text):
    temp=path.with_name(path.name+'.repair.tmp')
    temp.write_text(text,encoding='utf-8')
    os.replace(temp,path)
page=root/'index.html'
html=page.read_text(encoding='utf-8')
start=html.index('<script type="module">')
end=html.index('</script>',start)+len('</script>')
html=html[:start]+'<script type="module" src="./startup.js"></script>'+html[end:]
write(page,html)
write(root/'dist/index.html',html)
write(root/'dist/startup.js',(root/'startup.js').read_text(encoding='utf-8'))
# Avoid stale startup files after subsequent fixes.
server=root/'server.mjs'
text=server.read_text(encoding='utf-8')
text=text.replace("res.setHeader('Content-Type',", "res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',")
write(server,text)
files=['index.html','startup.js','style.css','game.js','core.js','package.json','server.mjs','setup.py','tests.mjs','JOGAR.bat','README.md','assets/models.json']
archive=root.parent/'Pizza-Empire.zip'
temp=archive.with_suffix('.repair.tmp')
with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED) as z:
    for name in files:z.write(root/name,'pizza-empire/'+name)
os.replace(temp,archive)
print('Inicialização com diagnóstico, timeout e botão de nova tentativa aplicada.')
