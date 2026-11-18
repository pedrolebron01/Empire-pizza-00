export const LESSONS=[
 ['move','Movimente-se pela pizzaria','Use WASD, setas ou o joystick.'],
 ['select','Selecione um pedido','Clique na comanda e identifique o nome do cliente.'],
 ['dough','Pegue uma massa','Vá à Massa e pressione E, ou clique no marcador.'],
 ['prepDone','Prepare a receita do cliente','Escolha a receita na Bancada.'],
 ['ovenIn','Coloque a pizza no Forno','Leve a pizza montada ao Forno.'],
 ['ovenOut','Retire a pizza pronta','Espere o texto Pronta e retire no Forno.'],
 ['counter','Leve a pizza ao Balcão','Abra o Balcão com E; você também pode guardar pizzas.'],
 ['delivery','Entregue o pedido correto','No Balcão, entregue ao cliente selecionado.'],
 ['purchase','Compre uma melhoria','Abra Melhorar pizzaria; faça mais entregas se faltar dinheiro.'],
 ['roberto','Converse com Roberto','Aproxime-se do Roberto e pressione E.']
];
export class Tutorial {
 constructor(saved){this.active=false;this.step=0;this.confirmation='';this.done=new Set(saved?.done?.filter(e=>LESSONS.some(l=>l[0]===e))||[]);this.skipped=!!saved?.skipped;this.sync();}
 sync(){this.step=LESSONS.findIndex(l=>!this.done.has(l[0]));if(this.step<0){this.step=LESSONS.length;this.active=false;}}
 start(restart=false){if(restart)this.done.clear();this.skipped=false;this.active=true;this.sync();}
 record(event){if(!this.active||!LESSONS.some(l=>l[0]===event)||this.done.has(event))return false;this.done.add(event);this.confirmation='✓ Etapa concluída';this.sync();return true;}
 snapshot(){return {done:[...this.done],skipped:this.skipped};}
}
