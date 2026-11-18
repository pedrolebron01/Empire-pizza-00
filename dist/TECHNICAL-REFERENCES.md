# Referências e estado da atualização

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
