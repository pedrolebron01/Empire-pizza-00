import pathlib,importlib.util,urllib.request
print('Modules:',{k:bool(importlib.util.find_spec(k)) for k in ['playwright','websocket','requests']})
for root in [pathlib.Path('C:/Program Files'),pathlib.Path('C:/Program Files (x86)'),pathlib.Path.home()/'AppData/Local']:
    for suffix in ['Microsoft/Edge/Application/msedge.exe','Google/Chrome/Application/chrome.exe','ms-playwright']:
        p=root/suffix
        if p.exists():print(p)
for p in ['index.html','game.js','core.js','style.css','assets/models.json']:
    with urllib.request.urlopen('http://127.0.0.1:4173/'+p) as response:print(p,response.status,len(response.read()))
