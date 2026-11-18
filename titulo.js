export function titleMenu({resume, chef, chapter, location}) {
  return `<div class="casa-menu">
    <div class="menu-poster"><img src="./assets/capa-fornada.png" alt="Pizzaiola da casa apresentando uma pizza de tomate e manjericão">
      <div class="poster-type"><span>Do balcão ao império</span><h1>Pizza<br><em>Empire</em></h1></div>
    </div>
    <div class="menu-service"><div class="menu-place"><i aria-hidden="true">✦</i>${location}</div>
      <h2>Abra as portas.</h2><p>Pizzaiolo da casa <strong>${chef}</strong></p>
      <nav aria-label="Menu principal">
        <button id="start">${resume?'Continuar':'Novo jogo'} <span aria-hidden="true">→</span></button>
        <button id="home-chef">Escolher pizzaiolo <span aria-hidden="true">›</span></button>
        <button id="home-story">Campanha <small>Cap. ${chapter}</small></button>
        <button id="home-settings">Configurações <span aria-hidden="true">›</span></button>
      </nav>
      <div class="menu-foot"><button id="home-salon">Ver salão ao vivo</button><button id="home-help">Como jogar</button><button id="home-credits">Créditos</button>${resume?'<button id="home-new">Novo jogo</button>':''}</div>
    </div></div>`;
}
