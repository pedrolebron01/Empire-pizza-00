# Pesquisa e recursos — revisão da interface

## Interface

Game Accessibility Guidelines: https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/

Aplicação: textos e símbolos acompanham estados; prioridade tem nome, forno usa Pronta e tempo, e receita bloqueada informa o nível. A tela usa um painel de atendimento, com informações detalhadas em menus. O tema da pizzaria e a cena original foram preservados.

## Animação

Referência oficial Three.js: https://threejs.org/examples/webgl_animation_skinning_additive_blending.html

O exemplo identifica seu modelo como vindo do Mixamo. Foram consideradas transições entre movimento e ações: os membros procedurais existentes agora interpolam as poses, o preparo é interrompível e servir/comemorar usa uma ação curta. Não há arquivo Mixamo nesta distribuição.

Adobe/Mixamo: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html e https://helpx.adobe.com/creative-cloud/help/mixamo-rigging-animation.html

A Adobe permite uso de personagens/animações em jogos e explica o download autenticado. O catálogo usa Adobe ID. O download do Xbot.glb da referência oficial Three.js foi tentado, mas a rede do executor recusou a conexão com ECONNREFUSED. Isso não foi resolvido nesta sessão; integração de uma animação Mixamo real permanece pendente.

## Áudio

Kenney Interface Sounds: https://kenney.nl/assets/interface-sounds — 100 efeitos, CC0, conforme a página oficial. O download do pacote oficial foi tentado e recusado pela rede do executor. Nenhum som Kenney foi incluído ou atribuído indevidamente.

A alternativa implementada é original e local: assets/audio contém dez WAVs sintetizados pelo script tools/local-sound-design.mjs (massa, ingredientes, forno, aviso, campainha, moedas e balcão). Não há amostras gravadas de terceiros. RestaurantAudio carrega os WAVs após o gesto inicial e usa síntese em caso de falha. O instrumental ganhou um timbre dedilhado com harmônicos e decaimento. Volume/mute de efeitos e música continuam independentes; percussão de pico entra e sai suavemente.

## Teste visual

Foi tentado Edge headless com perfil exclusivo de QA no projeto. O Windows recusou a criação de canais internos com Acesso negado e encerrou o processo. Não houve captura visual ou confirmação de renderização nesta revisão. Testes de lógica e bundling são reportados separadamente e não substituem esse teste.
