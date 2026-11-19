# Forno & Fortuna: O Legado da Pizzaria

Jogo 3D de simulação e gestão de pizzaria com história, exploração em terceira pessoa, equipe e progressão. Na Forno da Fortuna, até guardar uma pizza muda o turno. Ela libera a bandeja do pizzaiolo e pode virar uma retirada no balcão ou uma encomenda para o entregador.

## Jogar e apresentar

Na pasta do projeto, abra **JOGAR.bat** no Windows ou execute `bun server.mjs` ou `node server.mjs`. Entre em **http://localhost:4173** num navegador com WebGL 2. Para recuperar uma campanha anterior, use o mesmo navegador, perfil e endereço, incluindo a porta. O jogo conserva a chave local `pizza-empire-v1`. Saves antigos recebem campos para o diário, as páginas e o andar. O botão Novo jogo pede confirmação quando há uma partida iniciada.

Na abertura, escolha **Continuar** para voltar ao salão, ou **História principal** para começar ou retomar um serviço. Para uma demonstração curta, selecione Bianca, abra uma comanda, pegue massa, monte a pizza na bancada, asse e entregue ao cliente indicado. Mostre depois o elevador, o documento do escritório e a horta. O menu da partida reúne a ajuda, a equipe, os mapas, as configurações e as missões.

WASD ou setas movem, Shift corre, E interage e Esc abre a pausa. Também é possível clicar no chão. Em telas de toque há joystick e botão de interação. A interface oferece controles de gráficos, áudio, controles e acessibilidade, incluindo redução de movimento, legendas e prévia reversível dos ajustes gráficos.

## A história de uma mesa sempre aberta

A família deixou um forno apagado, uma chave e um livro de receitas incompleto. Roberto reconhece as pistas, mas cada capítulo traz outra pessoa para contar a história. O jogador reabre a casa atendendo a vizinhança. No mezanino, lê documentos curtos, interpreta uma pista e recupera páginas do livro. Uma resposta incorreta permite outra tentativa. Capítulos já alcançados liberam os documentos correspondentes no mesmo save.

| Capítulo | Serviço, descoberta e mudança | Estimativa de projeto |
| --- | --- | --- |
| O forno apagado | Primeiras mesas e retiradas. Uma fotografia revela onde ficava a chave. | 40 min |
| Receitas de família | Combinações de sabores e degustações. O bilhete de Rosa guarda uma erva entre as folhas. | 45 min |
| O bairro reunido | Coordenação com Roberto. Uma folha de pagamento identifica a primeira equipe. | 45 min |
| Novas portas, novos sabores | Estoque especial, grupos e transporte. Um guardanapo revela a origem da carta. | 50 min |
| Uma casa em vários andares | Prioridades, capacidade e salão. A planta explica como o terraço abastecia a cozinha. | 50 min |
| O Festival da Fortuna | Rodadas com o repertório da casa. O convite final explica para quem a família reservava lugar. | 50 min |

A estrutura anterior tem 36 serviços e 144 rodadas. Os 280 minutos acima são estimativas anteriores à expansão narrativa. Os testes percorrem as regras e a retomada, sem medir duração humana. Quatro horas **adicionais** de conteúdo variado seguem pendentes. Após o festival, continuam disponíveis atendimento livre, encomendas, circuito regional, metas diárias e Taça das Doze.

## Histórias secundárias

O diário apresenta oito histórias. Escolher uma abordagem muda o primeiro objetivo. O segundo conclui a história e paga R$ 45 e 25 XP uma vez. É possível intercalar histórias. A rivalidade abre com seis entregas e a festa com o segundo capítulo.

| História | Ação no mundo |
| --- | --- |
| A receita da nona Rosa | Conversar com Roberto ou testar manjericão, depois acertar o ponto. |
| O aprendiz do balcão | Ensinar uma retirada ou entrega e conversar com Roberto. |
| O crítico misterioso | Ouvir o salão ou a cozinha e servir uma pizza no ponto. |
| A entrega que nunca chegou | Reservar a encomenda ou refazer a massa e entregá-la. |
| O segredo de Roberto | Ouvir Roberto ou acender a fornada e guardar uma pizza. |
| A horta do terraço | Investigar o caderno ou provar a marguerita e colher ervas. |
| O rival da esquina | Dividir bancada ou forno e concluir a prova de ponto. |
| A festa do bairro | Reservar porções ou receber a primeira mesa e servir o bairro. |

## Personagens, equipe e lugares

Lê tem margem extra no forno. Bianca monta mais rápido. Ravi recebe bônus por sequência, Nina corre mais, Téo leva uma pizza extra, Roberto assa mais rápido e Isa ganha gorjeta por marguerita no ponto. A seleção exibe o modelo animado, apresentação, história, vantagem e requisito por entregas. Lê, Bianca e Isa começam disponíveis.

Roberto pode transportar pizzas ao balcão. Jana prepara, Zeca entrega encomendas, Malu recebe clientes e Cícero melhora as compras. Zilda libera mesas mais depressa após a saída dos clientes. As contratações e seus níveis têm efeitos durante o turno.

O térreo reúne estações e clientes. O elevador leva ao mezanino com escritório, arquivo e vestiário, e ao terraço com horta e estoque. Há sete casas no mapa: Bairro da Figueira, Trattoria das Videiras, Rua do Neon, Varanda da Praia, Chalé da Serra, Praça Central e Festival das Fatias. Os destinos variam em ambiente, ritmo de serviço e encomendas locais.

## Produção e verificação

JavaScript modular, HTML e CSS compõem a interface. Three.js local renderiza a cena, os personagens articulados e seus movimentos. A arte usa terracota, dourado, verde e turquesa. O áudio combina efeitos WAV e arranjos sintetizados para abertura, salão, festival e final, com camada de intensidade no pico. Consulte [créditos e referências](CREDITOS.md).

As onze suítes cobrem economia, salvamento, contratos, campanha, preparo, equipe, configurações, elevador, seleção e recompensas. A suíte legado.test.mjs verifica as duas rotas de cada relato. A suíte de abertura usa Three.js real com DOM e renderizador simulados. A avaliação visual em GPU, o teste físico de toque e a medição de uma campanha completa ainda estão pendentes. As três imagens anexadas ao pedido ficaram inacessíveis no ambiente de edição.
