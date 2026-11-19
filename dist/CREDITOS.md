# Créditos de Forno & Fortuna

## Recursos incorporados

| Recurso | Fonte e uso | Licença ou crédito disponível |
| --- | --- | --- |
| Three.js | Distribuição local em vendor/three.module.js. Renderização, geometria, iluminação e AnimationMixer. | MIT, autores do Three.js. [Texto integral](vendor/LICENSE-three.txt). |
| Personagens e cenários | Modelos articulados, roupas, mobiliário, estações, ingredientes e animações construídos pelo código do projeto. | Produção local herdada de Pizza Empire. |
| Ilustrações SVG | Ícones, clientes, receitas e equipamentos em assets/ui. Geração local com tools/create-illustrations.mjs. | [Crédito do conjunto original](assets/ui/CREDITS.md). |
| Capa ilustrada | assets/capa-fornada.png, arte preexistente. Os créditos da abertura original atribuem a ilustração ao ImageGen. | Mantida a atribuição do projeto original. |
| Atlas de bairros | assets/atlas-casas.png, ilustrações exibidas nos cartões de viagem. | Arquivo herdado. O repositório consultado não identifica autoria individual ou licença específica. |
| Forno da Figueira | assets/forno-da-figueira.png, imagem preexistente no pacote. | Autoria e licença específica não documentadas nos créditos disponíveis. |
| Música, efeitos e vozes | Arranjos e efeitos de áudio sintetizados pelo projeto. Dez arquivos WAV locais em assets/audio. Gerador em tools/local-sound-design.mjs. Fala sintetizada depende das vozes disponíveis no navegador. | Produção local, sem amostras externas identificadas nos WAVs. |
| Diário, documentos do arquivo e diálogos do legado | Texto e interações criados para esta evolução. | Conteúdo original do projeto. |

O inventário assets/models.json está vazio nesta instalação. As pizzas usam geometria procedural. O instalador opcional menciona Kenney Food Kit. Nenhum modelo Kenney foi identificado nesta distribuição do jogo. Nenhum modelo ou clipe do Mixamo foi incorporado.

## Referências consultadas

O exemplo de mistura de clipes e o manual descrevem transições e AnimationMixer. O jogo aproveita o rig articulado e as animações locais de sua própria base. [Exemplo oficial](https://threejs.org/examples/webgl_animation_skinning_blending.html) · [Sistema de animação](https://threejs.org/manual/pages/animation-system.html).

A documentação de carregamento trata do formato glTF. O manual de jogos discute a organização de sistemas de um jogo Three.js. [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) · [Criação de jogos](https://threejs.org/manual/pages/game.html).

A ajuda da Adobe descreve o processo de rigging e mapeamento de esqueletos. [Mixamo](https://www.mixamo.com/) · [Guia da Adobe](https://helpx.adobe.com/creative-cloud/help/mixamo-rigging-animation.html).

As referências visuais image(4).png, image(2).png e image(3).png não estavam nos caminhos de upload acessíveis. A apresentação utiliza a arte já existente na aplicação.
