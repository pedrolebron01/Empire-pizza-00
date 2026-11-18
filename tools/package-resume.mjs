import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),write=(p,s)=>fs.writeFileSync(new URL(p,root),s);
let s=read('game.js');
s=s.replace("$('#guide-action').onclick=()=>goToStation(guideStation);", "$('#guide-action').onclick=()=>{const lesson=tutorial.active?LESSONS[tutorial.step]?.[0]:null;if(lesson==='purchase')return showUpgrades();if(lesson==='roberto')return showRoberto();if(lesson==='select'){document.body.classList.add('all-orders');$('#orderlist').querySelector('[data-order]')?.focus();return;}goToStation(guideStation);};");
s=s.replace("$('#guide-title').textContent=title;$('#guide-detail').textContent=detail;", "$('#guide-title').textContent=title;$('#guide-detail').textContent=detail;if(tutorial.active){const lesson=LESSONS[tutorial.step][0];if(['select','purchase','roberto'].includes(lesson))$('#guide-action').textContent={select:'Escolher pedido',purchase:'Ver melhorias',roberto:'Conversar com Roberto'}[lesson];}");
s=s.replace("guideRing.visible=started&&", "guideRing.visible=started&&!(tutorial.active&&['move','select','purchase','roberto'].includes(LESSONS[tutorial.step][0]))&&");
write('game.js',s);
let p=JSON.parse(read('package.json'));p.scripts.test+=' && node campaign.test.mjs';write('package.json',JSON.stringify(p,null,2)+'\n');
write('TECHNICAL-REFERENCES.md',`# Referências e estado da atualização

Atualização integrada no projeto existente em 16/11/2026. A chave localStorage pizza-empire-v1 e versão 1 são preservadas. Campos opcionais de campanha, tutorial, aparência e histórico são validados na restauração. Pedidos e pizzas continuam transitórios.

## Exemplos oficiais Three.js consultados

- Índice: https://threejs.org/examples/
- Interactive Cubes: https://threejs.org/examples/webgl_interactive_cubes.html
  Referência aplicada: Raycaster, coordenadas normalizadas do ponteiro e teste de interseção. Adaptação: o clique no chão identifica a estação próxima e chama a navegação e interação existentes. Marcadores HTML acessíveis continuam disponíveis.
- Skinning and Morphing: https://threejs.org/examples/webgl_animation_skinning_morph.html
  Referência estudada para transições entre estados e ações curtas. Personagens atuais são procedurais, sem esqueleto glTF. AnimationMixer e clips desse exemplo não foram incorporados. Movimento dos membros e preparo continuam locais.

## Mixamo e recursos

Consultados https://www.mixamo.com/ e https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html. O acesso aos downloads exige Adobe ID; não há sessão autenticada ou FBX exportado disponível. Nenhuma animação foi atribuída ao Mixamo ou integrada a partir dele. A integração de um arquivo licenciado de caminhada/preparo permanece pendente de acesso e adaptação ao personagem.

Three.js: MIT. Kenney Food Kit: CC0, preservado no inventário e no instalador do projeto. Não foram encontrados GLB/FBX locais nesta inspeção. O fallback procedural continua disponível para os modelos opcionais. A dependência principal Three.js ainda usa o CDN configurado no projeto; a execução offline completa permanece pendente. Música e efeitos são gerados localmente pela Web Audio API.

## Duração planejada

| Capítulo | Orçamento de design |
| --- | ---: |
| As primeiras fornadas | 35 min |
| A casa ganha fama | 40 min |
| Uma equipe de verdade | 40 min |
| Os sabores da cidade | 45 min |
| O salão cheio | 45 min |
| O festival da pizza | 45 min |

Total de planejamento: 250 minutos. Os 93 contratos implementam entregas, qualidade, rapidez, sabores, compras, sequências, VIPs, armazenamento, trabalho do ajudante, reposição, variedade, gorjetas e eventos. Esta estimativa ainda precisa de teste de duração e balanceamento. Não se declara quatro horas comprovadas de conteúdo significativo: há repetição de tipos de atividade e a expansão narrativa e os desafios exclusivos do festival precisam de mais trabalho. Nenhum capítulo exige espera por tempo mínimo.

## Verificação

Passaram as cinco suítes de lógica: economia/rotas; balcão; áudio/progressão; handlers de preparo/forno/entrega/Roberto/configurações; campanha/migração/tutorial. Os 93 contratos foram percorridos com eventos simulados, conferindo recompensas únicas, recarga e compras prévias. Isso verifica alcançabilidade lógica, não duração ou diversão. Bundler verificou sintaxe e imports internos.

Não havia ferramenta de navegador disponível nesta sessão. Renderização WebGL, áudio físico, seleção 3D, navegação com personagens simultâneos e layout em celulares precisam de validação visual. Não houve nova publicação online.
`);
write('README.md',read('README.md')+`\n## Continuação de 16/11/2026

Abra JOGAR.bat no endereço habitual e use Ctrl+F5. Continuar mantém caixa, nível e melhorias. A campanha começa no objetivo atual; consulte **Ver jornada** para ver contrato, recompensa e próximo marco. **Roberto · ajuda** permite conversar e consultar dicas.

O tutorial agora tem dez etapas e salva cada ação concluída. Use **Como jogar** na abertura ou **Esc → Reabrir tutorial**. **Pular tutorial** também fica salvo. O guia reúne a próxima instrução; Trocar pedido abre as outras comandas. Os clientes têm nomes visíveis na comanda e no cenário.

Teclado: WASD/setas, E para interagir, Shift para correr, Q para cancelar preparo e devolver ingredientes. Mouse/toque: clique no marcador ou na região da estação; joystick e E continuam disponíveis. O movimento tem aceleração suave e os personagens tentam recalcular rotas quando bloqueados.

Em **Esc / Configurações**, ajuste música e efeitos separadamente, qualidade, redução de movimento, partículas e detalhes do salão. O histórico de clientes está em Ver jornada. A abertura anima a cena existente; as opções de movimento reduzido são respeitadas.

Verificações: cinco suítes de lógica e bundling passaram. Consulte TECHNICAL-REFERENCES.md para os limites atuais: duração de quatro horas não medida, Mixamo pendente, dependência principal ainda pelo CDN e apresentação no navegador ainda sem validação nesta sessão.
`);
for(const f of ['index.html','startup.js','style.css','game.js','core.js','counter.js','audio.js','progression.js','tutorial.js','campaign.js','illustrations.js','TECHNICAL-REFERENCES.md'])fs.copyFileSync(new URL(f,root),new URL('dist/'+f,root));
console.log('Documentação e distribuição local atualizadas.');
