import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const write=(p,s)=>{const tmp=new URL(p+'.new',root);fs.writeFileSync(tmp,s);fs.renameSync(tmp,new URL(p,root));};
write('style.css',read('style.css')+`
/* Local artwork and compact hands-on lesson. */
.illustration{display:inline-flex;position:relative;vertical-align:middle;align-items:center;justify-content:center;width:42px;height:42px;flex:0 0 42px;font-size:25px;background:#f1dfb9;border-radius:12px;overflow:hidden;margin-right:8px}
.illustration img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.illustration.portrait{width:80px;height:80px;float:left;margin:0 18px 10px 0}.recipe small .illustration{width:24px;height:24px;min-width:24px;font-size:16px;margin:0 4px 0 0}.order>.illustration{float:left}.order h4{font-size:14px}.order.selected{border:2px solid #976324;background:#fff0c9}.slot .illustration{width:30px;height:30px;min-width:30px;font-size:20px}.recipe.recommended{border:2px solid #bf8b3d;background:#fff0ce;border-radius:12px}.card>.illustration{float:right}
#labels .label[data-station]{pointer-events:auto;cursor:pointer;min-height:34px;display:flex;align-items:center}.station-target,.tutorial-target{outline:3px solid #f3b641!important;outline-offset:3px}.station-target{background:#fff1bf!important;color:#44311b}
#guide{pointer-events:auto;padding:10px 14px;width:min(460px,calc(100vw - 32px))}#guide strong{font-size:17px}#guide-action{min-height:36px;margin-top:8px;padding:6px 12px;font-size:13px}#guide span{font-size:13px}
#tutorial{position:absolute;top:160px;left:50%;transform:translateX(-50%);width:min(370px,calc(100vw - 540px));padding:10px 14px;border-radius:12px;background:#fff9eaf5;border-left:4px solid #bf8a3c;box-shadow:0 4px 20px #44321a20;z-index:3}#tutorial-progress{font-size:11px;color:#865d32;margin-bottom:5px}#tutorial-title{font-size:16px}#tutorial-confirmation{font-size:12px;line-height:1.3;margin:6px 0;color:#38624b}#tutorial-stop{background:transparent;color:#63543c;text-decoration:underline;font-size:11px;padding:2px;min-height:30px}#tutorial[hidden],#unlock-card[hidden]{display:none}
#unlock-card{position:absolute;top:285px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;background:#fff3d5;border:2px solid #d2a14f;border-radius:12px;padding:12px;max-width:370px;z-index:11}#unlock-card p{font-size:13px;margin:4px 0}#unlock-card button{padding:4px 10px}#tutorial:has(~ #guide){}button:focus-visible,[role=button]:focus-visible{outline:3px solid #d9a03c;outline-offset:3px}
@media(min-width:701px){#orders,#mission{width:225px}#orders{max-height:calc(100vh - 310px)}#mission{max-height:calc(100vh - 310px)}}
@media(max-width:700px){#tutorial{top:174px;right:10px;left:auto;transform:none;width:145px;padding:9px;max-height:150px;overflow:auto}#tutorial-title{font-size:13px}#tutorial-progress{font-size:10px}#tutorial-confirmation{font-size:11px}#tutorial-stop{font-size:10px}#orders{width:170px;max-height:25vh}.order>.illustration{width:30px;height:30px;margin-right:5px}.order h4{font-size:12px}#guide{bottom:210px;padding:8px 12px}#guide strong{font-size:15px}#guide span{font-size:12px}#guide-action{min-height:36px;font-size:12px}#unlock-card{top:125px;width:calc(100vw - 36px)}#event,#combo{display:none}#work{bottom:350px}.recipe>.illustration{width:36px;height:36px;flex-basis:36px}.recipe>span:not(.illustration){flex:1;min-width:150px}}
@media(max-height:600px){#tutorial{top:130px;max-height:125px;overflow:auto}#guide{bottom:90px;width:min(380px,48vw)}#guide strong{font-size:14px}#guide span{font-size:12px}#guide-action{min-height:32px}#orders{max-height:35vh}#work{bottom:265px}}
`);
let audio=read('audio.js');
audio=audio.replace('this.hidden=false;','this.hidden=false;this.lastEffects=new Map();');
audio=audio.replace('const t=this.ctx.currentTime+delay;',`const now=this.ctx.currentTime;
    if(now-(this.lastEffects.get(kind)??-Infinity)<.09)return;
    this.lastEffects.set(kind,now);
    const t=now+delay;`);
audio=audio.replace('const chords=[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]];',`const chords=[[60,64,67,72],[57,60,64,69],[53,57,60,65],[55,59,62,67]];
    const melody=[76,79,76,74,72,74,76,72,76,81,79,76,74,72,71,74];`);
audio=audio.replace("if(i%4===2)this.note(150",`// Original mandolin-like melody: short pluck with a quiet octave harmonic.
      if(this.step%4===0){const f=hz(melody[Math.floor(this.step/4)%melody.length]);this.note(f,t,.32,'triangle',this.music,.05);this.note(f*2,t,.16,'sine',this.music,.012);}
      if(i%4===2)this.note(150`);
audio=audio.replace('now+.15','now+.3');
write('audio.js',audio);
write('README.md',read('README.md')+`

## Tutorial interativo e ilustrações

O primeiro jogo inicia uma orientação em seis etapas (colocar e retirar do forno são etapas separadas). Cada etapa avança apenas após a ação correta. Clientes não perdem paciência durante o tutorial, e Roberto aguarda você aprender a retirar a pizza. As estações e o botão de destino permitem caminhar com um clique; WASD, setas e joystick continuam funcionando. Como jogar permite reiniciar o tutorial sem apagar o progresso. Continuar sem tutorial encerra apenas a orientação.

O pedido selecionado, a receita correspondente e a bandeja têm destaques. Se faltar dinheiro para a melhoria, siga preparando pedidos; não há dinheiro artificial nem alteração dos preços. Pizzas fora do ponto continuam válidas com desconto. Uma receita sem cliente pode ser guardada no balcão ou descartada para liberar espaço.

Retratos, receitas, ingredientes, melhorias, missões e novidades usam SVGs locais em assets/ui. São ilustrações originais leves que acompanham as formas e cores da cena 3D, com símbolos alternativos se uma imagem falhar. Créditos: assets/ui/CREDITS.md. A trilha original ganhou uma melodia de cordas dedilhadas sobre os arpejos; música e efeitos seguem independentes e salvos. Não há serviços externos nem downloads de áudio/imagens. A dependência Three.js do jogo continua usando seu CDN já configurado.

O salvamento continua na chave pizza-empire-v1, versão 1; tutorialComplete é opcional. Dinheiro, melhorias, missões e volumes anteriores são preservados. As etapas de preparo são transitórias: reabrir a página reinicia a orientação de uma primeira partida ainda não concluída, sem restaurar pizzas ou duplicar pagamentos.

## JavaScript e Java

JavaScript e Java são linguagens diferentes. Este jogo roda no navegador com JavaScript e Three.js. Um jogo em Java exigiria outra estrutura ou tecnologia, como uma aplicação separada com motor compatível; não seria uma simples troca de nome ou extensão. Não há modo Java configurado neste projeto. Um servidor Java poderia servir os mesmos arquivos web, mas o jogo continuaria sendo executado em JavaScript no navegador. Essa é uma alternativa separada e não exige substituir o jogo atual.
`);
