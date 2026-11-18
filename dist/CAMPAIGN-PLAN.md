# Campanha de serviços — conteúdo e duração

Acesso: Menu → Campanha → Começar/continuar serviço. Atendimento livre continua disponível. As antigas 93 metas ficam em Menu → Metas e histórico, com recompensas e progresso preservados. A campanha de serviços começa em um novo campo compatível do salvamento; não zera a economia ou as melhorias existentes.

São 36 serviços nomeados, em seis capítulos. Cada serviço tem quatro rodadas de 5 ou 6 pizzas: total de 144 rodadas e 816 pizzas dirigidas. Uma pizza só pertence a um pagamento e uma entrega só é observada uma vez pelo serviço. Recarregar preserva a rodada e o número de porções aceitas; pedidos transitórios são recriados e o serviço espera retomada pelo menu.

| Capítulo | Serviços / pizzas | Variedade e sistemas | Estimativa |
| --- | --- | --- | ---: |
| As primeiras fornadas | 6 / 120 | Muçarela, ordem de atendimento, ponto, duplas, retirada, primeira parceria | 40 min |
| A casa ganha fama | 6 / 120 | Três receitas, combinações por rodada, qualidade, grupos, prioridades | 45 min |
| Uma equipe de verdade | 6 / 144 | Fornadas, Roberto obrigatório no serviço da equipe, balcão, grupos | 45 min |
| Os sabores da cidade | 6 / 144 | Frango, quatro queijos, estoque especial, combinações e transporte | 50 min |
| O salão cheio | 6 / 144 | Especial da casa, capacidade, fila, duplas e prazos prioritários | 50 min |
| O festival da pizza | 6 / 144 | Todas as receitas em rodadas, qualidade, praça, equipe e final | 50 min |

Orçamento total: 280 minutos. O planejamento usa cerca de 18 segundos ativos por pizza (244,8 minutos), mais aproximadamente 35 minutos de escolhas, compras, reposição, leitura e organização. A estimativa é sensível à habilidade: bandeja, forno melhorado, corrida e paralelismo podem reduzir bastante esse tempo. **Não é uma duração medida nem uma garantia de quatro horas para todo jogador.** Não há cronômetro que bloqueie o avanço. Ainda é necessário um teste completo de duração e balanceamento antes de anunciar “mínimo de quatro horas reais”.

## Regras de serviço implementadas

- Mesa em sequência: só a próxima receita combinada avança; entregar outra receita ainda paga o pedido normal e explica o sabor que falta.
- Degustação: pizza passada do ponto não conta para a prova; mantém as porções anteriores e o pagamento normal.
- Famílias: pedidos de duas pizzas com paciência e bônus próprios; o grupo recebe cada pizza pelo ciclo existente.
- Retiradas: a entrega deve sair de uma pizza guardada no balcão. Guardar e pegar continuam disponíveis.
- Equipe: a partir do capítulo 3, Roberto precisa levar ao menos uma fornada ao balcão em cada rodada; sem contratação, a interface abre a melhoria necessária.
- Prioridades: alterna visitantes prioritários com paciência de 115s e pedidos comuns. Não depende somente de cor para indicar prioridade.

Novas ondas são liberadas por conclusão, sem espera mínima. As receitas são determinadas pelas combinações do capítulo. O jogador pode interromper um serviço, atender livremente e retomar depois. Cada serviço paga uma vez. O encerramento oferece R$ 750 adicionais, troféu visual e gorjetas permanentes +10%, sem acumular duas vezes com o bônus antigo.

## Verificações e limites

O teste service.test.mjs percorre todas as rodadas, testa receita fora da sequência, qualidade reduzida, origem no balcão, trabalho de Roberto, restauração e recompensa única. Isso verifica a lógica; não mede duração, diversão nem navegação real com clientes. As seis modalidades ainda compartilham parte do ciclo central de preparo. Balanceamento de variedade e duração deve ser revisto com observações de partidas completas.
