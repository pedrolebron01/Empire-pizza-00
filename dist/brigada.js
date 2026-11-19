export const chefs = [
{name:'Lê', color:0xc54a32, skin:0xbf845f, at:0, story:'Aprendeu a abrir massa no balcão da família. Divide o balcão com a namorada, Isa, que lhe ensinou a finalizar a marguerita com manjericão fresco.', perk:'Margem de 6 segundos extras antes de perder o ponto.'},
  {name:'Bianca', color:0x297958, skin:0x92583e, at:0, story:'Cresceu ajudando na padaria da esquina. Mede o ritmo do turno pelas batidas da massa na madeira.', perk:'Monta qualquer receita 25% mais rápido.'},
  {name:'Ravi', color:0xde9734, skin:0x966043, at:3, story:'Antigo garçom das noites de samba, lembra o pedido de cada freguês.', perk:'Recebe R$ 3 extras por entrega a partir da segunda em sequência.'},
  {name:'Nina', color:0x286e99, skin:0xe4ae83, at:5, story:'Conhece cada atalho do bairro desde os tempos de entrega de bicicleta.', perk:'Anda e corre 18% mais rápido.'},
  {name:'Téo', color:0x77539a, skin:0x784e39, at:8, story:'Veio dos bufês de casamento com um equilíbrio impecável e histórias para o turno inteiro.', perk:'Carrega uma pizza extra na bandeja.'},
  {name:'Roberto', color:0x596455, skin:0xce956c, at:12, story:'Depois de anos cuidando da lenha, reconhece uma pizza no ponto só pelo aroma.', perk:'Assa cada pizza 20% mais rápido.'},
  {name:'Isa', color:0xaf3463, skin:0xb57a52, at:0, story:'Isa começou vendendo pizza na feira com o namorado, Lê. Sua especialidade é a marguerita de manjericão fresco.', perk:'Recebe R$ 8 extras de gorjeta por marguerita entregue no ponto.'}
];
export function restoreChef(value,served){
  return Number.isInteger(value) && chefs[value]?.at <= served ? value : 0;
}
