"""Configure the browser to load pinned Three.js modules directly from jsDelivr."""
from pathlib import Path
import os
import zipfile

root = Path(__file__).resolve().parent.parent
page = root / 'index.html'
html = page.read_text(encoding='utf-8')
start = html.index('<script type="module">')
end = html.index('</script>', start) + len('</script>')
bootstrap = '''<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"}}
</script>
<script type="module">
try {
  await import('./game.js');
} catch (error) {
  const loading = document.querySelector('#loading');
  loading.classList.remove('hidden');
  loading.querySelector('p').textContent = 'Não foi possível iniciar o jogo. Confira sua conexão e o acesso a cdn.jsdelivr.net, depois recarregue a página. Detalhe: ' + error.message;
  console.error('Pizza Empire: falha na inicialização', error);
}
</script>'''
html = html[:start] + bootstrap + html[end:]

def write_atomic(path, content):
    temporary = path.with_name(path.name + '.cdn.tmp')
    temporary.write_text(content, encoding='utf-8')
    os.replace(temporary, path)

write_atomic(page, html)
write_atomic(root / 'dist/index.html', html)
readme = root / 'README.md'
text = readme.read_text(encoding='utf-8')
begin = text.index('Após instalar, o jogo funciona')
finish = text.index('## Primeiro pedido', begin)
text = text[:begin] + '''**Three.js via CDN:** o jogo carrega Three.js 0.180.0 e GLTFLoader diretamente do jsDelivr usando um import map. Não é necessário instalar Three.js, npm ou executar setup.py para abrir o jogo. É necessária conexão à internet e acesso HTTPS a `cdn.jsdelivr.net`.

`setup.py` continua disponível para baixar o pacote Kenney e gerar o inventário local de modelos. Ele também baixa uma cópia do Three.js, mas a configuração atual da página usa o CDN.

**Limitação de verificação:** os downloads pelo terminal do ambiente de implementação foram bloqueados pelo proxy. Os binários Kenney não estão incluídos; até instalar o pacote, o jogo usa pizzas procedurais. A renderização e o ciclo completo no navegador ainda precisam de validação. Não houve publicação online.

''' + text[finish:]
write_atomic(readme, text)
archive = root.parent / 'Pizza-Empire.zip'
temporary = archive.with_suffix('.cdn.tmp')
with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED) as z:
    for name in ['index.html','style.css','game.js','core.js','package.json','server.mjs','setup.py','tests.mjs','JOGAR.bat','README.md','assets/models.json']:
        z.write(root / name, 'pizza-empire/' + name)
os.replace(temporary, archive)
print('CDN configurado em index.html, dist/index.html, README e ZIP.')
