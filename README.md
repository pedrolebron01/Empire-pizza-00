# Pizza Empire — Do Balcão ao Império

## Liberdade para jogar

A partida começa em **atendimento livre**, sem tutorial automático ou indicação obrigatória de próxima estação. O botão **Ações** permite escolher massa, bancada, forno, balcão, despensa ou lixeira; escolha qualquer receita desbloqueada e prepare pizzas antes dos pedidos. Clique no chão para andar até um ponto, ou use WASD/setas/joystick. O movimento manual interrompe o caminho automático.

Em **Meu jeito** (também no Menu), ligue ou desligue sugestões, suspenda ou retome a chegada de clientes e pause Roberto após contratá-lo. Ele termina de guardar pizzas que já está carregando antes da pausa. Clientes presentes continuam esperando; forno e preparo continuam funcionando. Essas preferências ficam salvas.

Em **Trocar / Pedidos**, atenda na ordem que preferir ou recuse uma comanda. Recusar encerra o combo, sem multa, preservando as pizzas já preparadas. Campanha e tutorial são opcionais. **Jogar livre** interrompe o serviço e o tutorial, mantendo caixa, melhorias e o ponto alcançado na campanha; retome o serviço pelo Menu. Receitas, economia e melhorias continuam com progressão normal.

Verificação desta atualização: sete suítes executadas com Bun e compilação do jogo para navegador. Testes de lógica e integração simulada cobrem as novas decisões, persistência, migração, movimento e pausa de Roberto. Renderização e interação visual ainda precisam de uma partida no navegador.

Jogo de administração e preparação de pizzas em Three.js. Interface em português, cozinha física, clientes com fila e paciência, progressão persistente e ajudante com navegação em grade.

## Executar

Abra `JOGAR.bat` e acesse **http://localhost:4173**. Requer Node.js ou Bun. Também é possível executar `node server.mjs` nessa pasta. Alternativa com Python: `python -m http.server 4173`.

**Não abra index.html diretamente pelo protocolo file://.** Os módulos e modelos precisam de um servidor HTTP.

## Instalar os recursos locais

Execute, com Python 3.9+ e acesso à internet:

```console
python setup.py
```

Esse comando baixa Three.js 0.180.0, GLTFLoader, BufferGeometryUtils e o arquivo oficial Kenney Food Kit. Extrai o pacote dentro de `assets/food/`, verifica os nomes reais dos arquivos GLB/glTF e gera `assets/models.json`. O jogo só seleciona modelos existentes nesse inventário. A pizza real é carregada por GLTFLoader e normalizada à escala do jogo.

**Three.js via CDN:** o jogo carrega Three.js 0.180.0 e GLTFLoader diretamente do jsDelivr usando um import map. Não é necessário instalar Three.js, npm ou executar setup.py para abrir o jogo. É necessária conexão à internet e acesso HTTPS a `cdn.jsdelivr.net`.

`setup.py` continua disponível para baixar o pacote Kenney e gerar o inventário local de modelos. Ele também baixa uma cópia do Three.js, mas a configuração atual da página usa o CDN.

**Limitação de verificação:** os downloads pelo terminal do ambiente de implementação foram bloqueados pelo proxy. Os binários Kenney não estão incluídos; até instalar o pacote, o jogo usa pizzas procedurais. A renderização e o ciclo completo no navegador ainda precisam de validação. Não houve publicação online.

## Primeiro pedido

1. Clique em **Abrir as portas**.
2. Ande com **WASD** ou **setas** até **01 · Massa** e pressione **E**.
3. Vá à **02 · Preparo**, pressione **E** e escolha **Muçarela**. Aguarde a montagem.
4. Na **03 · Forno**, pressione **E**, espere 10 segundos e pressione **E** novamente para retirar.
5. Selecione a comanda na interface, vá à **04 · Balcão** e pressione **E** e escolha **Entregar comanda**. Também pode entregar junto ao próprio cliente.

O pagamento básico é R$ 28, com gorjeta por paciência e combo. O caixa começa com R$ 20; o primeiro forno custa R$ 65. As três primeiras pizzas rendem uma missão com dinheiro e XP e liberam a contratação de Roberto.

**Shift** corre. **Esc** pausa. No celular, joystick e botão E substituem teclado. Paineis suspendem o tempo. A lixeira descarta a pizza selecionada na bandeja, permitindo refazer pedidos gratuitamente com os ingredientes básicos.

## Sistemas implementados

- Massa, molho/ingredientes por receita, tempo de montagem, capacidade de forno, cozimento, retirada, qualidade por atraso, entrega e pagamento.
- Muçarela, calabresa, marguerita, frango com catupiry, quatro queijos e especial da casa, liberadas nos níveis 1–6.
- Ingredientes das três primeiras receitas ilimitados; estoque para as três especiais, reposto na despensa.
- Clientes variados entram, caminham até a fila, esperam, perdem paciência e saem. Clientes especiais pedem duas pizzas e concedem bônus ao completar.
- Roberto conversa e, contratado após três entregas, caminha do forno ao balcão, carregando fisicamente as pizzas. Velocidade e capacidade melhoram com contratação e upgrades.
- Melhorias de forno, bancada, bandeja, mesas, decoração, expansão e Roberto. Forno, bancada, mesas, quadros e expansão aparecem no cenário; a bandeja exibe a capacidade adicional ao carregar pizzas.
- Seis missões com recompensas únicas, combo de gorjetas até 2×, horário de pico de 30 segundos a cada três minutos com aviso de 15 segundos.
- Sons sintetizados, volume, três qualidades gráficas, sombras, acompanhamento suave da câmera, colisões e vapor.
- Salvamento em localStorage de caixa, XP, upgrades, missões, estoque e configurações. Pedidos, pizzas transitórias, combo e evento não são restaurados; a sessão reabre em estado seguro, sem pagamentos duplicados. Porções especiais já consumidas continuam consumidas.
- Reinício requer confirmação dentro do jogo.

## Verificação

```console
node tests.mjs
```

Testes de lógica passaram: dedução de compras, fundos insuficientes, limites de upgrades, contratação, recompensa idempotente de missões, XP, restauração e dados inválidos, colisões e rotas forno→balcão / entrada→fila / fila→saída. A sintaxe e imports internos foram verificados com o bundler Bun, mantendo Three.js externo. Esses testes não substituem um teste completo no navegador.

Roteiro de teste manual: completar um pedido; comprar forno e comparar tempo/capacidade; servir três pizzas e contratar Roberto; conferir retirada automática e entrega pelo balcão; esperar um cliente desistir; desbloquear calabresa; comprar expansão; recarregar e conferir caixa e melhorias; testar joystick em celular, pausa e volume.

## Organização

- `game.js`: cena, animações, interface e integração do jogo.
- `core.js`: economia, progressão, salvamento validado, colisão e navegação.
- `style.css` / `index.html`: interface responsiva e carregamento.
- `setup.py`: instalação das dependências e inventário do pacote.
- `assets/models.json`: nomes e caminhos comprovados pelo instalador.
- `server.mjs`: servidor HTTP local, sem dependências npm.
- `tests.mjs`: testes automatizados de lógica.

## Créditos

Kenney Food Kit: https://kenney.nl/assets/food-kit — CC0. Licença original é preservada junto do pacote instalado. Three.js: https://threejs.org — MIT; licença baixada em `vendor/LICENSE-three.txt`. Arquitetura, móveis, personagens e pizzas alternativas são construídos proceduralmente para este projeto. Sons gerados pela Web Audio API.

## Guardar e pegar pizzas

Aproxime-se de **04 · Balcão** e pressione **E**. Escolha **Guardar pizza da mão** para liberar espaço e buscar outra pizza no forno. Para recuperar uma pizza, abra o balcão novamente e use **Pegar pizza**. Se carregar várias pizzas, selecione a desejada na bandeja antes de guardar. Massa, pizza montada e pizza pronta podem ser guardadas; somente pizzas prontas são entregues aos clientes. Roberto compartilha esse mesmo balcão. Como as demais pizzas em preparo, as guardadas são transitórias e não são recuperadas ao recarregar a página.

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

## Continuação de 16/11/2026

Abra JOGAR.bat no endereço habitual e use Ctrl+F5. Continuar mantém caixa, nível e melhorias. A campanha começa no objetivo atual; consulte **Ver jornada** para ver contrato, recompensa e próximo marco. **Roberto · ajuda** permite conversar e consultar dicas.

O tutorial agora tem dez etapas e salva cada ação concluída. Use **Como jogar** na abertura ou **Esc → Reabrir tutorial**. **Pular tutorial** também fica salvo. O guia reúne a próxima instrução; Trocar pedido abre as outras comandas. Os clientes têm nomes visíveis na comanda e no cenário.

Teclado: WASD/setas, E para interagir, Shift para correr, Q para cancelar preparo e devolver ingredientes. Mouse/toque: clique no marcador ou na região da estação; joystick e E continuam disponíveis. O movimento tem aceleração suave e os personagens tentam recalcular rotas quando bloqueados.

Em **Esc / Configurações**, ajuste música e efeitos separadamente, qualidade, redução de movimento, partículas e detalhes do salão. O histórico de clientes está em Ver jornada. A abertura anima a cena existente; as opções de movimento reduzido são respeitadas.

Verificações: cinco suítes de lógica e bundling passaram. Consulte TECHNICAL-REFERENCES.md para os limites atuais: duração de quatro horas não medida, Mixamo pendente, dependência principal ainda pelo CDN e apresentação no navegador ainda sem validação nesta sessão.

## Revisão da tela de atendimento

A partida usa agora um único painel: cliente, pizza, ação atual e estados relevantes da bandeja/forno. O botão Menu (ou Esc) abre pedidos, campanha, melhorias, estoque, receitas, bandeja, metas/histórico, Roberto e configurações. Trocar abre a lista de clientes. Pular tutorial fica no Menu enquanto o tutorial está ativo.

Campanha: Menu → Campanha → Começar/continuar serviço. São 36 serviços em quatro rodadas, preservando as antigas metas como atividades opcionais. Veja CAMPAIGN-PLAN.md para conteúdo, estimativa de 280 minutos e limites da estimativa: ainda não há comprovação de quatro horas reais para todo jogador.

Dez efeitos WAV originais estão em assets/audio, com fallback Web Audio. Música e efeitos continuam ajustáveis separadamente. Consulte WEB-REFERENCES.md para pesquisa, licenças e os downloads Mixamo/Kenney bloqueados pela rede. Nenhuma animação Mixamo foi integrada.

Seis suítes de lógica e o bundler verificam a revisão. A abertura do navegador de QA foi bloqueada pelo Windows, portanto o layout e a saída sonora precisam de avaliação em uma partida real.
