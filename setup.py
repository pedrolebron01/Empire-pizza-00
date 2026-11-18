"""Downloads pinned dependencies and inventories real Kenney models before use."""
import urllib.request, zipfile, pathlib, json, shutil
ROOT=pathlib.Path(__file__).resolve().parent
def get(url,p):
    p.parent.mkdir(parents=True,exist_ok=True)
    print('Obtendo',url)
    urllib.request.urlretrieve(url,p)
# The engine is already included. Optional loaders must match its revision.
for name in ['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js']:
    get('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/'+name,ROOT/'vendor'/name)
archive=ROOT/'assets/food-kit.zip'
get('https://kenney.nl/media/pages/assets/food-kit/83086fa91c-1719418518/kenney_food-kit.zip',archive)
folder=ROOT/'assets/food'
with zipfile.ZipFile(archive) as z:
    for item in z.infolist():
        target=(folder/item.filename).resolve()
        if not target.is_relative_to(folder.resolve()): raise ValueError('Caminho inválido')
    z.extractall(folder)
models=sorted(p for p in folder.rglob('*') if p.suffix.lower() in ['.glb','.gltf'])
manifest={p.stem:p.relative_to(ROOT).as_posix() for p in models}
(ROOT/'assets/models.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Modelos verificados:',len(manifest),'; pizzas:',[s for s in manifest if 'pizza' in s.lower()])
print('Pronto. Execute o servidor e abra http://localhost:4173')
