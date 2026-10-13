// Telas do celular da /lp-ecom: porte fiel das 5 telas do HTML do hero em vídeo (rco-hub-hero-x300.html), em HTML e SVG
// vetoriais, sem imagem. Os textos (Loja Aurora, Tênis Runner Leve, preços) são só ilustração de uma compra: o conteúdo é
// decorativo e vai dentro de um bloco aria-hidden. A string é gerada UMA vez, na carga do módulo (servidor e navegador
// produzem exatamente o mesmo HTML, inclusive os ids dos gradientes, que dependem da ordem de geração).

/* ===== Ícones ===== */
const P: Record<string, string> = {
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  chat:'<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>',
  send:'<path d="M21 3 10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
  bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',
  chev:'<path d="M9 5l7 7-7 7"/>',
  bag:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  truck:'<path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  arrow:'<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  home:'<path d="M4 11l8-7 8 7v9H4z"/>',
  chart:'<path d="M5 20V10M12 20V4M19 20v-7"/>',
  grid:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'
};
const ic = (n: string, s = 22, w = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
const dots3 = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
const star = '<svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>';

let uid = 0;
function sneaker(w: number, p?: Record<string, string>): string {
  p = p || {u1:'#2c4180', u2:'#15234d', toe:'#34509a', st:'#0d67f0', tab:'#3ddc97'};
  const id = 'sk' + (uid++);
  return `<svg viewBox="0 0 330 170" width="${w}" style="display:block;overflow:visible">
  <defs>
    <linearGradient id="${id}u" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.u1}"/><stop offset="1" stop-color="${p.u2}"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d5ddef"/></linearGradient>
    <radialGradient id="${id}h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#0b1531" stop-opacity=".28"/><stop offset="1" stop-color="#0b1531" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="165" cy="156" rx="150" ry="12" fill="url(#${id}h)"/>
  <path d="M24 112 L304 116 C312 124 310 140 292 146 L52 147 C30 146 20 134 24 112 Z" fill="url(#${id}s)"/>
  <path d="M28 132 C110 136 220 137 300 132" stroke="#c4cee5" stroke-width="3" fill="none"/>
  <path d="M26 114 L28 70 C28 54 38 44 54 44 C70 44 84 55 100 55 C112 55 117 40 129 38 C139 37 143 44 147 52 C161 74 191 88 231 96 C268 103 298 106 304 116 L304 120 L26 117 Z" fill="url(#${id}u)"/>
  <path d="M238 97 C268 102 298 106 304 116 L304 120 L232 119 C228 111 230 102 238 97 Z" fill="${p.toe}"/>
  <path d="M66 104 C108 92 150 72 196 68 C212 67 216 80 200 84 C160 93 120 108 82 117 L64 117 Z" fill="${p.st}"/>
  <path d="M25 66 C22 82 22 100 26 114 L41 114 C37 98 37 81 41 64 Z" fill="${p.tab}"/>
  <path d="M46 52 C62 50 80 61 100 60" stroke="rgba(255,255,255,.28)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <g stroke="#fff" stroke-width="4" stroke-linecap="round"><path d="M139 58 L153 50"/><path d="M154 67 L168 58"/><path d="M170 75 L184 66"/><path d="M186 82 L200 74"/></g>
  </svg>`;
}
const PAL_GREEN = {u1:'#2fc88a', u2:'#1c8f62', toe:'#3ddc97', st:'#101d41', tab:'#0d67f0'};
const PAL_GRAY  = {u1:'#8a95ad', u2:'#5d6880', toe:'#9aa5bd', st:'#3ddc97', tab:'#101d41'};

const statusBar = (): string => `<div class="sb"><span>9:41</span><span class="ri">
  <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
  <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3C13.3 1.4 10.8.4 8 .4S2.7 1.4.8 3.3L2 4.6c1.6-1.5 3.7-2.4 6-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3C11.4 4.7 9.8 4 8 4s-3.4.7-4.6 1.8l1.2 1.3C5.5 6.3 6.7 5.8 8 5.8zm0 3.5c.4 0 .8.2 1.1.5L8 11.9 6.9 9.8c.3-.3.7-.5 1.1-.5z"/></svg>
  <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="19" height="9" rx="2"/><path d="M24 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2z" opacity=".5"/></svg>
</span></div>`;

const STC = ['linear-gradient(135deg,#c9d6f5,#9fb4e8)','linear-gradient(135deg,#ffd9c2,#f5a98a)','linear-gradient(135deg,#cdeedd,#8fd7b5)','linear-gradient(135deg,#d9d2f7,#a99ae6)','linear-gradient(135deg,#f9e0ea,#e9a7c1)'];
const STAGES = ['Anúncio','Produto','Carrinho','Checkout','Compra'];
const WIDTHS = [100, 80, 62, 50, 22];

/* ===== Telas ===== */
const SCREENS: string[] = [
`<div class="scr s1"><div class="zoom"><div class="content tall">
  ${statusBar()}
  <div class="f-top"><b>Para você</b><div class="ics">${ic('heart',24)}${ic('chat',24)}</div></div>
  <div class="stories">${['Você','Moda','Casa','Esporte','Beleza'].map((n: string, i: number)=>`<div class="st"><i style="--c:${STC[i]}"></i>${n}</div>`).join('')}</div>
  <div class="post-h"><div class="av">LA</div><div><div class="n">Loja Aurora</div><div class="s">Patrocinado</div></div><div class="more">${dots3}</div></div>
  <div class="post-img"><span class="chip">Novo</span>${sneaker(300)}</div>
  <div class="cta-wrap"><div class="cta"><span>Comprar agora</span>${ic('arrow',20,2)}</div></div>
  <div class="acts">${ic('heart',24)}${ic('chat',24)}${ic('send',24)}<span style="flex:1"></span>${ic('bookmark',24)}</div>
  <div class="cap"><b>Loja Aurora</b> Tênis Runner Leve. Conforto para o dia todo, do treino ao passeio.</div>
  <div class="ripple"></div>
</div></div></div>`,

`<div class="scr s2"><div class="zoom"><div class="content">
  ${statusBar()}
  <div class="nav">${ic('back')}<span>Loja Aurora</span>${ic('bag')}</div>
  <div class="p-img"><div class="shoe">${sneaker(320)}</div><div class="dots"><i class="on"></i><i></i><i></i></div></div>
  <div class="p-body">
    <div class="stars">${star.repeat(5)}</div>
    <div class="p-title">Tênis Runner Leve</div>
    <div class="p-price">R$ 249,90 <span class="p-inst">ou 3x sem juros</span></div>
    <div class="lbl">Tamanho</div>
    <div class="sizes"><span>38</span><span>39</span><span class="on">40</span><span>41</span><span>42</span></div>
  </div>
  <div class="bwrap"><div class="btn b2"><span>${ic('bag',20,2)} Adicionar ao carrinho</span><div class="ok">${ic('check',20,2.4)} Adicionado</div></div></div>
  <div class="touch"></div>
</div></div></div>`,

`<div class="scr s3"><div class="zoom"><div class="content">
  ${statusBar()}
  <div class="nav">${ic('back')}<span>Carrinho</span><span class="cnt">1 item</span></div>
  <div class="c-item"><div class="thumb">${sneaker(76)}</div><div class="ci">
    <div class="ci-name">Tênis Runner Leve</div><div class="ci-sub">Tamanho 40 · Azul-marinho</div>
    <div class="ci-bot"><div class="ci-price">R$ 249,90</div><div class="qty"><i>${ic('minus',14,2.2)}</i><b>1</b><i>${ic('plus',14,2.2)}</i></div></div>
  </div></div>
  <div class="coupon">${ic('tag',18)}<span>Adicionar cupom</span>${ic('chev',16)}</div>
  <div class="rows">
    <div class="row"><span>Subtotal</span><span>R$ 249,90</span></div>
    <div class="row"><span>Frete</span><span>Calculado no checkout</span></div>
    <div class="row total"><span>Total</span><span>R$ 249,90</span></div>
  </div>
  <div class="recs"><div class="rt">Você também pode gostar</div><div class="tiles">
    <div class="tile"><div class="im">${sneaker(110, PAL_GREEN)}</div><div class="tn">Tênis Urban</div><div class="tp">R$ 219,90</div></div>
    <div class="tile"><div class="im">${sneaker(110, PAL_GRAY)}</div><div class="tn">Tênis Trail</div><div class="tp">R$ 279,90</div></div>
  </div></div>
  <div class="bwrap"><div class="btn b3"><span>Finalizar compra ${ic('arrow',20,2)}</span></div></div>
  <div class="touch"></div>
</div></div></div>`,

`<div class="scr s4"><div class="zoom"><div class="content">
  ${statusBar()}
  <div class="nav">${ic('back')}<span>Checkout</span>${ic('lock',20)}</div>
  <div class="steps">
    <div class="step done"><i>${ic('check',12,3)}</i>Entrega</div><div class="sline done"></div>
    <div class="step cur"><i></i>Pagamento</div><div class="sline"></div>
    <div class="step"><i></i>Revisão</div>
  </div>
  <div class="alert"><div class="adot"><span class="ring"></span></div><div><div class="at">Pagamento não concluído</div><div class="as">Seu pedido ainda não foi finalizado</div></div></div>
  <div class="form">
    <div class="fl">Nome no cartão</div><div class="fi">Ana Souza</div>
    <div class="fl">Número do cartão</div><div class="fi focus">5021 3344<span class="caret"></span><span class="ph">&nbsp;•••• ••••</span></div>
    <div class="frow"><div><div class="fl">Validade</div><div class="fi ph">MM/AA</div></div><div><div class="fl">CVV</div><div class="fi ph">•••</div></div></div>
  </div>
  <div class="sum">
    <div class="sr"><span>${ic('truck',16)} Frete</span><b>R$ 34,90</b></div>
    <div class="sr"><span>${ic('clock',16)} Prazo</span><b>8 a 12 dias úteis</b></div>
    <div class="sr"><span>${ic('tag',16)} Total</span><b>R$ 284,80</b></div>
  </div>
  <div class="bwrap"><div class="btn b4"><span>${ic('lock',18,2)} Pagar agora</span></div></div>
</div></div></div>`,

`<div class="scr s5 dark"><div class="zoom"><div class="content">
  ${statusBar()}
  <div class="d-head"><div class="d-kick">Painel RCO</div><div class="d-title">Funil de vendas</div></div>
  <div class="tabs"><span class="on">Funil</span><span>Campanhas</span><span>Criativos</span></div>
  <div class="fun">${STAGES.map((n: string, i: number)=>`<div class="fr ${n==='Checkout'?'hot':''}"><div class="nm"><i></i>${n}</div>
    <div class="track"><div class="fw" style="left:${(100-(WIDTHS[i] ?? 100))/2}%;width:${WIDTHS[i] ?? 100}%"><div class="fill m"></div>${n==='Checkout'?'<div class="fill b"></div>':''}</div></div></div>`).join('')}</div>
  <div class="tabbar">${['home','chart','grid','user'].map((n: string, i: number)=>`<span class="${i===1?'on':''}">${ic(n,24)}</span>`).join('')}</div>
</div></div></div>`
];


export const PHONE_SCREENS_HTML = SCREENS.join("");
