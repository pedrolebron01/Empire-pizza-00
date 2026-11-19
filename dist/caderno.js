export const paginas = [
 ['A fotografia do balcão','O carimbo diz INAUGURAÇÃO. O retrato mostra uma pá pendurada junto à porta e uma chave amarrada no cabo.','Onde a família deixava a chave?',['No bolso do avental','No cabo da pá','Na despensa'],1,'A primeira a chegar abria a casa.'],
 ['O bilhete de Rosa','“Duas folhas depois do forno”, diz a margem. Entre as páginas há um ramo seco com o perfume da marguerita.','Qual ingrediente Rosa guardou?',['Manjericão','Calabresa','Farinha'],0,'Rosa escrevia as medidas para os netos, que tinham mãos pequenas.'],
 ['A folha de pagamento','Há três nomes na coluna do caixa e seis assinaturas no rodapé. Ao lado das outras três, alguém desenhou pratos.','Como os vizinhos participaram?',['Compraram o forno','Cobraram ingresso','Ajudaram em troca de almoço'],2,'Roberto reconheceu sua primeira assinatura.'],
 ['A carta da varanda','O envelope traz areia nas dobras e um guardanapo bordado com ondas. A remetente reclama da maresia no forno.','De que casa veio a carta?',['Da serra','Da varanda da praia','Da rua do neon'],1,'Foi a primeira vez que a receita viajou para fora do bairro.'],
 ['A planta da casa','O desenho liga a calha do telhado a um barril. Do barril sai uma mangueira marcada com uma folha verde.','Para onde seguia a água?',['Para a horta','Para o balcão','Para o forno'],0,'O terraço alimentava o salão antes mesmo de ganhar mesas.'],
 ['O convite dobrado','Na lista do festival há uma cadeira sem nome. No verso, a nona escreveu: “Para quem chegar quando todos já estiverem sentados”.','Quem recebe o último convite?',['O júri','O dono da casa','Quem ainda precisar de lugar'],2,'Roberto pousa a pá. Agora também há uma cadeira para ele.']
];
export function lerPagina(state,show,save,voltar,id){
 const [titulo,pista,pergunta,opcoes,certa,fim]=paginas[id];
 const render=(aviso='')=>{const lida=state.paginas.includes(id);
 show('<span class="eyebrow">ARQUIVO DA FAMÍLIA · '+(id+1)+'/6</span><h2>'+titulo+'</h2><blockquote>'+pista+'</blockquote><p>'+(lida?fim:pergunta)+'</p>'+ (lida?'':opcoes.map((s,i)=>'<button data-resposta="'+i+'">'+s+'</button>').join(' '))+'<p role="status">'+aviso+'</p><button id="arquivo-voltar">Voltar</button>');
 document.querySelector('#arquivo-voltar').onclick=voltar;
 document.querySelectorAll('[data-resposta]').forEach(b=>b.onclick=()=>{if(+b.dataset.resposta!==certa)return render('Confira a pista no documento e tente outra vez.');if(!state.paginas.includes(id)){state.paginas.push(id);state.xp+=35;save();}render('Página recuperada · +35 XP');});
 };render();
}
