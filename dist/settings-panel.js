import {GRAPHICS,BINDINGS,localVoice,speak,validKey} from './preferences.js';

const tabs={graphics:'Gráficos',access:'Acessibilidade',audio:'Áudio',controls:'Controles'};
const actions={w:'Avançar',s:'Recuar',a:'Esquerda',d:'Direita',shift:'Correr',e:'Interagir',q:'Cancelar preparo'};
const $=id=>document.getElementById(id);
const row=(name,widget,help='')=>`<label class="option-row"><span>${name}${help?`<small>${help}</small>`:''}</span>${widget}</label>`;
const select=(id,value,options)=>`<select id="${id}">${Object.entries(options).map(([k,name])=>`<option value="${k}" ${String(value)===k?'selected':''}>${name}</option>`).join('')}</select>`;
const range=(id,v,min,max,step)=>`<span class="option-slider"><input aria-label="${id}" id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"><output>${Math.round(v*100)}%</output></span>`;
const checkbox=(id,v)=>`<input id="${id}" type="checkbox" ${v?'checked':''}>`;
let pending=null;
export function cancelDisplayPreview(){if(pending){const cancel=pending;pending=null;cancel();}}
export function openSettings(api,tab='graphics'){
  const {state,show,back,save,display,appearance,motionReduced,music,updateInterface}=api;
  const p=state.preferences;
  function render(which){
    tab=which;
    const g=p.graphics;
    let content='';
    if(tab==='graphics'){
      const max=api.anisotropy();
      content=row('Perfil',select('quality',state.quality,{baixa:'Baixa',media:'Média',alta:'Alta',personalizada:'Personalizada'}),'Use um perfil ou ajuste os detalhes abaixo.')
        +row('Resolução',range('scale',g.scale,.5,1.5,.05),'Escala de pixels da cena 3D.')
        +row('Quadros por segundo',select('fps',state.fps,{30:30,60:60,90:90,120:120,0:'Sem limite'}),'Limitado também pela frequência da tela.')
        +row('Sombras',select('shadows',g.shadows,{0:'Desligadas',1:'Suaves',2:'Alta definição'}))
        +(max>1?row('Filtro de texturas',select('texture',Math.min(max,g.texture),Object.fromEntries([1,2,4,8].filter(n=>n<=max).map(n=>[n,n+'×']))),'Nitidez dos letreiros e ingredientes vistos de lado.'):'')
        +row('Distância visível',select('distance',g.distance,{37:'Curta',55:'Média',80:'Longa'}),'Ajusta a névoa e o alcance da câmera.')
        +row('Suavizar contornos',checkbox('smoothing',g.smoothing),'Superamostragem da cena 3D.')
        +row('Sombras de contato',checkbox('contact',g.contact),'Cria uma sombra difusa sob os personagens.')
        +row('Luz dinâmica do forno',checkbox('detailLight',g.detailLight))
        +row('Fumaça e vapor',range('smoke',g.smoke,0,1,.05),'Densidade das partículas.')
        +(document.fullscreenEnabled?`<button id="screen">${document.fullscreenElement?'Voltar à janela':'Tela cheia'}</button>`:'')
        +'<button class="setting-primary" id="apply-display">Testar imagem</button>';
    }else if(tab==='access'){
      content=row('Escala dos painéis',range('interfaceScale',p.interfaceScale,.85,1.25,.05))
        +row('Tamanho do texto',range('textScale',p.textScale,1,1.4,.05))
        +row('Movimento reduzido',checkbox('reduce-motion',motionReduced()),'Reduz animações ambientes e movimentos da câmera do menu.')
        +row('Oscilação de luz',range('flash',p.flash,0,1,.05))
        +row('Partículas',checkbox('particles',state.particles))
        +row('Legendas de sons',checkbox('captions',p.captions),'Mostra os sinais de chegada, forno e entrega.')
        +row('Alto contraste',checkbox('contrast',p.contrast))
        +row('Destacar estações',checkbox('highlights',p.highlights),'Mostra os nomes das estações do térreo.')
        +row('Paleta do salão',select('appearance',state.appearance,{classica:'Terracota',verde:'Jardim',azul:'Azulejos'}));
    }else if(tab==='audio'){
      content=['music','sfx'].map((k,i)=>row(i?'Efeitos':'Música',range(k+'-volume',state[k+'Volume'],0,1,.05))+row(i?'Silenciar efeitos':'Silenciar música',checkbox(k+'-mute',state[k+'Muted']))).join('');
      if(localVoice())content+=row('Voz de Roberto',range('voiceVolume',p.voiceVolume,0,1,.05),'Leitura local das falas em português.');
    }else{
      content='<p>Selecione um comando e pressione a nova tecla. Esc cancela a troca. As setas também movimentam o personagem.</p><div class="binding-list">'+Object.entries(actions).map(([k,name])=>`<button data-bind="${k}">${name} <kbd>${p.bindings[k].toUpperCase()}</kbd></button>`).join('')+'</div><button id="default-bind">Restaurar teclas</button><p id="bind-info" role="status"></p>'
        +row('Câmera do menu',range('cameraSensitivity',p.cameraSensitivity,0,2,.1),'Intensidade da reação ao movimento do ponteiro.')
        +row('Inverter câmera do menu',checkbox('invert',p.invert))
        +'<p><strong>Controles de toque</strong><br>Arraste o joystick para andar ou toque no chão. Toque em uma estação para ir até ela. O botão de interação usa a estação mais próxima.</p><button id="reopen-tutorial">Abrir tutorial</button>';
    }
    show(`<div class="settings-panel"><h2>Configurações</h2><nav aria-label="Categorias de configurações">${Object.entries(tabs).map(([k,v])=>`<button data-tab="${k}" aria-pressed="${k===tab}">${v}</button>`).join('')}</nav><div class="options-group">${content}</div><button id="settings-back">Voltar</button></div>`);
    document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>render(b.dataset.tab));
    $('settings-back').onclick=back;
    function bindRange(id,fn){if(!$(id))return;$(id).oninput=e=>{const value=Number(e.target.value);e.target.nextElementSibling.textContent=Math.round(value*100)+'%';fn?.(value);};}
    if(tab==='graphics'){
      function read(){return {scale:+$('scale').value,shadows:+$('shadows').value,texture:$('texture')?+$('texture').value:1,distance:+$('distance').value,contact:$('contact').checked,detailLight:$('detailLight').checked,smoothing:$('smoothing').checked,smoke:+$('smoke').value};}
      $('quality').onchange=e=>{const preset=GRAPHICS[e.target.value];if(!preset)return;for(const [k,value] of Object.entries(preset)){const input=$(k);if(!input)continue;if(input.type==='checkbox')input.checked=value;else input.value=k==='texture'?Math.min(value,api.anisotropy()):value;if(input.type==='range')input.nextElementSibling.textContent=Math.round(value*100)+'%';}};
      for(const id of Object.keys(g)){if(!$(id))continue;$(id).onchange=()=>$('quality').value='personalizada';}
      bindRange('scale');bindRange('smoke');
      if($('screen'))$('screen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{api.notice('Tela cheia indisponível nesta janela.');}render('graphics');};
      $('apply-display').onclick=()=>{
        const candidate=read(),name=$('quality').value,fps=+$('fps').value;
        show('<div class="settings-panel"><h2>Manter esta imagem?</h2><p>As configurações anteriores voltam em <b id="remaining">12</b> segundos.</p><button id="keep-display">Manter</button><button id="undo-display">Reverter agora</button></div>');
        display(candidate,fps);
        const end=Date.now()+12000;
        const timer=setInterval(()=>{const left=Math.ceil((end-Date.now())/1000);if(left<=0){cancelDisplayPreview();if($('remaining'))render('graphics');}else if($('remaining'))$('remaining').textContent=left;},200);
        pending=()=>{clearInterval(timer);display(p.graphics,state.fps);};
        $('keep-display').onclick=()=>{clearInterval(timer);pending=null;p.graphics=candidate;state.quality=name;state.fps=fps;save();render('graphics');};
        $('undo-display').onclick=()=>{cancelDisplayPreview();render('graphics');};
      };
    }else if(tab==='access'){
      for(const k of ['interfaceScale','textScale','flash'])bindRange(k,v=>{p[k]=v;updateInterface();save();});
      for(const k of ['captions','contrast','highlights'])$(k).onchange=e=>{p[k]=e.target.checked;updateInterface();save();};
      $('particles').onchange=e=>{state.particles=e.target.checked;save();};
      $('reduce-motion').onchange=e=>{state.reducedMotion=e.target.checked;updateInterface();save();};
      $('appearance').onchange=e=>{state.appearance=e.target.value;appearance();save();};
    }else if(tab==='audio'){
      for(const k of ['music','sfx']){
        bindRange(k+'-volume',v=>{state[k+'Volume']=v;if(k==='sfx')state.volume=v;music.apply();save();});
        $(k+'-mute').onchange=e=>{state[k+'Muted']=e.target.checked;music.apply();save();};
      }
      $('sfx-volume').onchange=()=>music.effect('tap');
      bindRange('voiceVolume',v=>{p.voiceVolume=v;save();});if($('voiceVolume'))$('voiceVolume').onchange=()=>speak('O forno está pronto, chefe!',p.voiceVolume);
    }else{
      bindRange('cameraSensitivity',v=>{p.cameraSensitivity=v;save();});
      $('invert').onchange=e=>{p.invert=e.target.checked;save();};
      $('default-bind').onclick=()=>{p.bindings={...BINDINGS};save();render('controls');};
      $('reopen-tutorial').onclick=api.tutorial;
      document.querySelectorAll('[data-bind]').forEach(b=>b.onclick=()=>{
        $('bind-info').textContent='Pressione uma letra, número ou modificador.';b.focus();
        b.onblur=()=>{b.onkeydown=null;};
        b.onkeydown=e=>{e.stopPropagation();e.preventDefault();const key=e.key.toLowerCase();
          if(key==='escape'){render('controls');return;}
          if(!validKey(key)||Object.entries(p.bindings).some(([a,v])=>a!==b.dataset.bind&&v===key)){$('bind-info').textContent='Tecla reservada ou em uso. Escolha outra.';return;}
          p.bindings[b.dataset.bind]=key;save();render('controls');};
      });
    }
  }
  render(tab);
}

