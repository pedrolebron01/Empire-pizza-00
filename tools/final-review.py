from pathlib import Path
import json,os,zipfile
root=Path(__file__).resolve().parent.parent
def write(p,s):
    t=p.with_name(p.name+'.review.tmp');t.write_text(s,encoding='utf-8');os.replace(t,p)
p=root/'game.js';s=p.read_text(encoding='utf-8')
s=s.replace("function showMissions(){showModal(dailyMarkup()+", "function showMissions(){const next=nearestUnlock(state);showModal('<h3>Seu próximo desbloqueio</h3><p>'+next.recipe+'<br>'+next.upgrade+'<br>'+next.expansion+'</p>'+dailyMarkup()+")
s=s.replace("mutedMusic?'Música silenciada':mutedEffects?", "mutedMusic&&mutedEffects?'Áudio silenciado':mutedMusic?'Música silenciada':mutedEffects?")
write(p,s)
p=root/'style.css';write(p,p.read_text(encoding='utf-8')+'\n#toast{z-index:12}#audio-status{max-width:220px}\n')
p=root/'package.json';data=json.loads(p.read_text());data['scripts']['test']+=' && node game-integration.test.mjs';write(p,json.dumps(data,ensure_ascii=False,indent=2)+'\n')
p=root/'README.md';s=p.read_text(encoding='utf-8')
s+='''
## Atualização: música, recompensas e interface ampliada

O projeto existente foi mantido: cena, colisões, receitas, estoque, Roberto, balcão de apoio, missões, upgrades e salvamento continuam conectados.

- Música instrumental original gerada localmente pela Web Audio API, com arpejos, baixo e sinos em 88 BPM. Não há arquivos remotos de áudio. O primeiro toque/clique/tecla habilita o áudio; nenhuma reprodução automática ocorre antes desse gesto.
- Música e efeitos têm sliders e botões de silêncio independentes em Esc / Configurações. O volume antigo foi migrado para os efeitos; caixa, XP, inventário persistente e upgrades não são apagados. A chave `pizza-empire-v1` e versão 1 foram preservadas com campos novos opcionais.
- A percussão do evento entra e sai com transição suave. Música reduz durante menus e ambos os canais silenciam enquanto a aba estiver oculta.
- Efeitos específicos para massa, ingredientes, preparo, forno, cliente, comanda, entrega, caixa, gorjeta, compras, reposição, missões, nível, erros, atraso, desistência e trabalho de Roberto. Avisos de pizza pronta e de queima disparam somente na mudança de estado.
- Metas diárias: 5 pizzas (+R$25/+15XP), 3 entregas rápidas (+R$20/+15XP) e 1 pedido especial (+R$30/+20XP). Recompensas são automáticas e registradas por data local para não se repetirem ao recarregar.
- Combo: 3 acertos dão +R$5/+3XP e 5 acertos +R$10/+5XP. Não se repetem no sexto ou demais acertos da mesma sequência; gorjetas continuam limitadas a 2×. Receita errada ou desistência encerra a sequência.
- Famílias pedem 2 pizzas e recebem 240s de paciência, com bônus R$18/+15XP. Críticos pedem uma pizza no ponto antes de metade da paciência para bônus R$25/+25XP. Depois de três entregas, cada quarto cliente é especial; os tipos alternam.
- Eventos alternam a cada três minutos: horário de pico (2 entregas) e festival (2 receitas diferentes). Aviso de 15s, duração de 30s, gorjetas +50% e bônus único por evento de R$20/+10XP. O relógio para nos menus; recarregar reinicia eventos transitórios.
- Textos maiores, botões de 44px, painéis roláveis, ajuda, zoom +/− persistente, luzes decorativas, guia contextual e círculo dourado na estação recomendada. Em telas pequenas, o botão Ver jornada permite consultar também metas e desbloqueios.

### Como testar esta atualização

1. Reabra JOGAR.bat, acesse http://localhost:4173 e pressione Ctrl+F5. Clique em Abrir as portas/Reabrir minha pizzaria; a música começa após o gesto.
2. Em Esc, altere cada slider, silencie só música e depois só efeitos. Recarregue e confira que as escolhas e o progresso permanecem. Teste música com efeitos em zero e efeitos com música em zero.
3. Complete uma pizza. Confira efeitos diferentes para massa, montagem, entrada/retirada e aviso do forno, entrega e dinheiro. Espere uma pizza passar 18s além do tempo de forno: o aviso de qualidade reduzida deve soar apenas uma vez.
4. Contrate Roberto e confira efeitos de retirada e depósito no balcão. Guardar/pegar manualmente continua disponível pelo E no balcão.
5. Faça 3 e 5 entregas seguidas e abra Ver jornada para conferir metas diárias e próximo desbloqueio. Recarregue após receber uma meta: o pagamento não deve repetir.
6. Jogue 2min15s sem menus para ver o aviso. Aos 2min30s o pico começa e a trilha ganha instrumentos. Faça duas entregas para o bônus; aos 3min volta suavemente ao arranjo normal. O evento seguinte exige duas receitas diferentes.
7. Use +/− para ajustar a câmera e siga o círculo dourado. Confira a interface em desktop e celular.

Verificações automatizadas: `npm test` (ou execute cada `.test.mjs` com Node/Bun). Há testes de migração, volumes/mute com AudioContext simulado, transições musicais, pagamentos únicos, clientes especiais, eventos e integração dos handlers reais do jogo com DOM/renderização simulados. A verificação de sintaxe foi feita com Bun. A qualidade audível e a apresentação final no navegador precisam de teste manual; os testes simulados não confirmam renderização WebGL nem saída física de áudio.

Arquivos existentes atualizados nesta etapa: `game.js`, `core.js`, `style.css`, `package.json`, `README.md` e cópias em `dist/`. Novos módulos: `audio.js` e `progression.js`. Testes adicionados: `enhancements.test.mjs` e `game-integration.test.mjs`.
'''
write(p,s)
runtime=['index.html','startup.js','style.css','game.js','core.js','counter.js','audio.js','progression.js']
for name in runtime:write(root/'dist'/name,(root/name).read_text(encoding='utf-8'))
archive=root.parent/'Pizza-Empire.zip';temp=archive.with_suffix('.review.tmp')
with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED) as z:
    for name in runtime+['package.json','server.mjs','setup.py','tests.mjs','counter.test.mjs','enhancements.test.mjs','game-integration.test.mjs','JOGAR.bat','README.md']:
        z.write(root/name,'pizza-empire/'+name)
    for folder in ['assets','vendor']:
        for p in (root/folder).rglob('*'):
            if p.is_file():z.write(p,'pizza-empire/'+p.relative_to(root).as_posix())
os.replace(temp,archive)
print('Documentação, dist e ZIP atualizados, preservando os assets existentes.')
