const loading = document.querySelector('#loading');
const message = loading.querySelector('p');
let phase = 'Inicializando';

function status(text) {
  phase = text;
  message.textContent = text;
}

function fail(error) {
  loading.classList.remove('hidden');
  loading.querySelector('h1').textContent = 'A pizzaria não conseguiu abrir';
  message.textContent = error.message || String(error);
  let details = document.querySelector('#startup-details');
  if (!details) {
    details = document.createElement('pre');
    details.id = 'startup-details';
    details.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;max-width:90vw;padding:16px;font:12px monospace;background:#e8dfca;border-radius:10px';
    loading.append(details);
  }
  details.textContent = `Etapa: ${phase}\nEndereço: ${location.href}\n${error.stack || error}`;
  if (!document.querySelector('#startup-retry')) {
    const button = document.createElement('button');
    button.id = 'startup-retry';
    button.textContent = 'Tentar novamente';
    button.onclick = () => location.reload();
    loading.append(button);
  }
  console.error('Falha ao abrir Pizza Empire:', phase, error);
}

function timeout(promise, ms, explanation) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(explanation)), ms); })
  ]).finally(() => clearTimeout(timer));
}

try {
  if (location.protocol === 'file:') {
    throw new Error('Abra JOGAR.bat e acesse http://localhost:4173. Abrir index.html diretamente não permite carregar os módulos do jogo.');
  }
  status('Verificando suporte a gráficos 3D…');
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  if (!gl) {
    throw new Error('O navegador não disponibilizou WebGL 2, necessário para esta versão do Three.js. Confira a aceleração gráfica nas configurações do navegador e tente uma versão atual do Chrome ou Edge.');
  }
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  status('Baixando Three.js pelo CDN…');
  try {
    await timeout(import('three'), 15000, 'O CDN não respondeu em 15 segundos. Confira sua conexão e o acesso a cdn.jsdelivr.net.');
  } catch (error) {
    throw new Error('Não foi possível carregar o Three.js pelo CDN. A cena 3D depende desse download. Confira o acesso a https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js. Detalhe: ' + error.message);
  }
  status('Carregando o leitor de modelos 3D…');
  await timeout(import('three/addons/loaders/GLTFLoader.js'), 15000, 'O leitor GLTFLoader não respondeu. Confira o acesso a cdn.jsdelivr.net.');
  status('Construindo a pizzaria…');
  await import('./game.js');
} catch (error) {
  fail(error);
}
