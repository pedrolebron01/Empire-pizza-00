from pathlib import Path
import os, zipfile
root=Path(__file__).resolve().parent.parent
def write(path,text):
    temp=path.with_name(path.name+'.storage.tmp')
    temp.write_text(text,encoding='utf-8')
    os.replace(temp,path)
p=root/'game.js'
s=p.read_text(encoding='utf-8')
s="import {storePizza, takePizza, findReadyPizza} from './counter.js';\n"+s
start=s.index("if(n.id==='counter'){const c=")
end=s.index("if(n.id==='stock')",start)
s=s[:start]+"if(n.id==='counter')return showCounter();"+s[end:]
s=s.replace("m.position.set(-6+i%4*.7,1.24,1.8+Math.floor(i/4)*.3)","m.position.set(-6.4+i%4*.93,1.24+Math.floor(i/8)*.16,1.5+Math.floor(i/4)%2*.6)")
s=s.replace("counter:'Entregar comanda selecionada'+(shelf.length?' · '+shelf.length+' no balcão':'')", "counter:'Balcão · guardar, pegar ou entregar'+(shelf.length?' · '+shelf.length+' guardada(s)':'')")
s=s.replace("ready?'Sua bandeja está cheia.'", "ready?'Sua bandeja está cheia. Use E no balcão para guardar uma pizza.'")
s=s.replace("Bandeja cheia. Asse ou entregue o que está carregando.", "Bandeja cheia. Guarde uma pizza no balcão para liberar espaço.")
marker='function showRecipes()'
counter='''function showCounter(){
  const describe=p=>(p.stage==='dough'?'Massa':RECIPES[p.recipe].name)+' · '+({dough:'crua',raw:'montada, falta assar',ready:p.quality<1?'pronta, passou do ponto':'pronta'}[p.stage]||'em preparo');
  const index=hand.length?Math.max(0,Math.min(heldIndex,hand.length-1)):0;
  const held=hand[index];
  const client=customers.find(c=>c.id===selected&&c.status==='wait')||customers.find(c=>c.status==='wait');
  const fromHand=client&&findReadyPizza(hand,client.recipe);
  const ready=fromHand||(client&&findReadyPizza(shelf,client.recipe));
  showModal(`<span class="eyebrow">04 / BALCÃO DE APOIO E ENTREGA</span><h2>Um lugar para cada pizza.</h2><p>Guarde sua pizza aqui para liberar a bandeja e retirar outra do forno. Você pode guardar massas, pizzas montadas ou prontas e pegá-las depois.</p>
    <div class="grid"><div class="card"><h4>Deixar no balcão</h4><p>${held?describe(held):'Sua bandeja está vazia.'}</p><button id="store-pizza" ${held?'':'disabled'}>Guardar pizza da mão</button></div>
    <div class="card"><h4>Entregar pedido</h4><p>${client?'#'+client.id+' · '+RECIPES[client.recipe].name:'Aguarde um cliente chegar.'}</p><button id="serve-pizza" ${ready?'':'disabled'}>Entregar ${client?'comanda #'+client.id:'pedido'}</button></div></div>
    <h3>Pizzas no balcão · ${shelf.length}</h3><p>${hand.length}/${1+state.upgrades.tray} espaços ocupados na bandeja. ${hand.length>=1+state.upgrades.tray?'Guarde uma pizza antes de pegar outra.':'Escolha qual pizza deseja pegar.'}</p>
    ${shelf.length?shelf.map((p,i)=>`<div class="recipe"><span>${describe(p)}</span><button data-take-pizza="${i}" ${hand.length>=1+state.upgrades.tray?'disabled':''}>Pegar pizza</button></div>`).join(''):'<p>Nenhuma pizza guardada. Roberto também deixa as pizzas prontas aqui.</p>'}`);
  $('#store-pizza').onclick=()=>{
    if(!storePizza(hand,shelf,index))return;
    heldIndex=Math.max(0,Math.min(index,hand.length-1));
    closeModal();refreshPizzas();renderUI();sound('tap');
    toast('Pizza guardada no balcão. Sua bandeja tem espaço para outra!');
  };
  $('#serve-pizza').onclick=()=>{
    if(!client||!ready)return;
    closeModal();deliver(client,ready,fromHand?hand:shelf);
  };
  document.querySelectorAll('[data-take-pizza]').forEach(button=>button.onclick=()=>{
    if(!takePizza(shelf,hand,+button.dataset.takePizza,1+state.upgrades.tray))return;
    heldIndex=hand.length-1;
    closeModal();refreshPizzas();renderUI();sound('tap');toast('Pizza retirada do balcão.');
  });
}
'''
assert marker in s
s=s.replace(marker,counter+marker,1)
write(p,s)
for name in ['game.js','counter.js']:
    write(root/'dist'/name,(root/name).read_text(encoding='utf-8'))
readme=root/'README.md'
text=readme.read_text(encoding='utf-8')
text=text.replace('pressione **E** para entregar.', 'pressione **E** e escolha **Entregar comanda**.')
text+='\n## Guardar e pegar pizzas\n\nAproxime-se de **04 · Balcão** e pressione **E**. Escolha **Guardar pizza da mão** para liberar espaço e buscar outra pizza no forno. Para recuperar uma pizza, abra o balcão novamente e use **Pegar pizza**. Se carregar várias pizzas, selecione a desejada na bandeja antes de guardar. Massa, pizza montada e pizza pronta podem ser guardadas; somente pizzas prontas são entregues aos clientes. Roberto compartilha esse mesmo balcão. Como as demais pizzas em preparo, as guardadas são transitórias e não são recuperadas ao recarregar a página.\n'
write(readme,text)
archive=root.parent/'Pizza-Empire.zip'
temp=archive.with_suffix('.storage.tmp')
with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED) as z:
    for name in ['index.html','startup.js','style.css','game.js','core.js','counter.js','counter.test.mjs','package.json','server.mjs','setup.py','tests.mjs','JOGAR.bat','README.md','assets/models.json']:
        z.write(root/name,'pizza-empire/'+name)
os.replace(temp,archive)
print('Balcão atualizado no projeto, dist e ZIP.')
