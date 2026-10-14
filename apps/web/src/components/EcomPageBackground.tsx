import "./hero-story.css";

/**
 * Fundo ÚNICO da página (a mesma identidade do fundo do hero: azul-marinho, brilhos e grade), contínuo do topo ao rodapé.
 * Versão PARADA: os brilhos e a grade são só CSS estático, repetidos a cada 1400 px, alternando esquerda e direita (sem JS e
 * sem animação, para não gastar CPU). Só o hero (EcomHeroStory) tem os brilhos grandes se movendo; o resto da página só ganha dois pontos de luz que derivam muito devagar (transform, sem repintar); o fundo dele termina na mesma cor
 * de base (#0b1531) e o `hs-seam` faz a emenda.
 */
export function EcomPageBackground() {
  return (
    <div aria-hidden="true" className="hs-page">
      <div className="hs-amb hs-amb-a" />
      <div className="hs-amb hs-amb-b" />
    </div>
  );
}
