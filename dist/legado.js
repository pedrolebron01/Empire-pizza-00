// Cada rota guarda a escolha inicial e dois marcos observados no turno.
const conversa = ['roberto', 'Pergunte a Roberto na cozinha.'];
const entrega = ['delivery', 'Entregue uma comanda ao cliente.'];
const reserva = ['store', 'Guarde uma pizza pronta no balcão.'];
const ponto = ['perfect', 'Entregue uma pizza antes de passar do ponto.'];
const massa = ['dough', 'Pegue uma massa na estação 01.'];
const forno = ['ovenIn', 'Coloque uma pizza montada no forno.'];
const horta = ['basil', 'Entregue uma marguerita.'];
export const relatos = [
 ['A receita da nona Rosa','Rosa lembra do cheiro, mas os irmãos discordam sobre a cobertura.', 'Consultar Roberto',conversa,'Testar o manjericão',horta,ponto,'Rosa reconheceu a borda tostada. Na margem da receita escreveu o nome dos dois irmãos.'],
 ['O aprendiz do balcão','No primeiro turno, Davi trocou duas bandejas e agora hesita até para chamar a senha.', 'Ensinar a guardar',reserva,'Ensaiar uma entrega',entrega,conversa,'Roberto deixou Davi chamar a próxima senha. Dessa vez o salão inteiro ouviu.'],
 ['O crítico misterioso','Uma avaliação sem assinatura diz que o balcão esqueceu quem chega sozinho.', 'Ouvir o salão',entrega,'Investigar a cozinha',conversa,ponto,'A autora veio sem disfarce. Só queria poder pedir uma fatia e sentar na mesa grande.'],
 ['A entrega que nunca chegou','Uma comanda antiga ainda tem o endereço do baile dos ferroviários.', 'Reservar a encomenda',reserva,'Recomeçar pela massa',massa,entrega,'A antiga maquinista guardou a caixa com a data do reencontro.'],
 ['O segredo de Roberto','Uma foto mostra Roberto fechando a casa em plena festa.', 'Ouvir sua versão',conversa,'Acender a fornada',forno,reserva,'Ele fechou para levar o vizinho ao hospital. A pizza reservada esperou os dois voltarem.'],
 ['A horta do terraço','Isa acha um envelope de sementes dentro do livro.', 'Consultar o caderno de Roberto',conversa,'Preparar uma prova',horta,['harvest','Colha as ervas na horta do terraço.'],'Isa anotou a primeira safra na página em branco. O próximo plantio já tem data.'],
 ['O rival da esquina','O concorrente trouxe massa demais para uma disputa de forno.', 'Dividir a bancada',massa,'Dividir o forno',forno,ponto,'No fim da prova os dois assinaram a mesma receita. O prêmio virou almoço da equipe.'],
 ['A festa do bairro','Há convidados chegando em horários diferentes para a ceia.', 'Reservar para os atrasados',reserva,'Receber a primeira mesa',entrega,entrega,'A última mesa puxou cadeiras para a equipe. Pela primeira vez Roberto jantou sentado.']
];
export function restoreRelatos(raw) {
 return relatos.map((_,i)=>{
   const item=raw?.[i];
   return item && [0,1].includes(item.rota) && [0,1,2].includes(item.etapa) ? {rota:item.rota,etapa:item.etapa} : null;
 });
}
function passo(q,item){return item.etapa===0?q[item.rota===0?3:5]:q[6];}
export function proximoRelato(s){
 const i=s.relatos.findIndex(item=>item&&item.etapa<2);
 return i<0?"":relatos[i][0]+" · "+passo(relatos[i],s.relatos[i])[1];
}
export function registrar(s,event,data={}){
 relatos.forEach((q,i)=>{
   const item=s.relatos[i];
   if(!item || item.etapa===2)return;
   const target=passo(q,item)[0];
   if(target!==event && !(event==='delivery' && ((target==='perfect' && data.quality>=1)||(target==='basil' && data.recipe===2))))return;
   item.etapa++;
   if(item.etapa===2){s.money+=45;s.xp+=25;}
 });
}
export function abrirDiario(s,show,save){
 const render=()=>{show('<span class="eyebrow">FORNO DA FORTUNA</span><h2>Histórias do bairro</h2><p>Escolha como ajudar. Cada história rende R$ 45 e 25 XP.</p>'+relatos.map((q,i)=>{
 const item=s.relatos[i];
 if(!item && ((i===6&&s.served<6)||(i===7&&s.service.index<6)))return '<article class="card"><h3>'+q[0]+'</h3><p>'+(i===6?'Abra a trattoria com seis entregas.':'Conclua o capítulo O forno apagado.')+'</p></article>';
 return '<article class="card"><h3>'+q[0]+'</h3><p>'+q[1]+'</p>'+(item?'<p>'+ (item.etapa===2?'✓ '+q[7]:'Etapa '+(item.etapa+1)+' de 2 · '+passo(q,item)[1])+'</p>':[0,1].map(r=>'<button data-relato="'+i+'" data-rota="'+r+'">'+q[r===0?2:4]+'</button>').join(' '))+'</article>';
 }).join(''));
 document.querySelectorAll('[data-relato]').forEach(b=>b.onclick=()=>{s.relatos[+b.dataset.relato]={rota:+b.dataset.rota,etapa:0};save();render();});
 };render();
}
