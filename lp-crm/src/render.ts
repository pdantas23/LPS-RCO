/**
 * HTML da LP gerado em build a partir de src/config.ts (conteúdo indexável, sem JS para ler).
 * Seção sem dado real some; planos só aparecem completos (ver lib/plans.ts).
 */
import * as cfg from "./config";
import { formatPrice, readyPlans } from "./lib/plans";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Link com destino, ou marcador inativo (sem href) enquanto o destino é pendente — mesmo padrão da P03. */
export function link(label: string, href: string, name: string, position: string, cls: string): string {
  const attrs = `class="${cls}" data-cta="${esc(name)}" data-position="${esc(position)}"`;
  return href
    ? `<a ${attrs} href="${esc(href)}">${esc(label)}</a>`
    : `<a ${attrs} role="link" aria-disabled="true">${esc(label)}</a>`;
}

/** CTA principal: planos quando existirem; senão, os recursos. */
export function primaryCta(c = cfg): { label: string; href: string } {
  return readyPlans(c.plans).length
    ? { label: "Conhecer os planos", href: "#planos" }
    : { label: "Ver os recursos", href: "#recursos" };
}

export function renderHead(c = cfg): string {
  const og = new URL("og-rco.webp", c.SITE_URL).toString();
  const tags = [
    `<title>${esc(c.copy.title)}</title>`,
    `<meta name="description" content="${esc(c.copy.description)}" />`,
    `<link rel="canonical" href="${esc(c.SITE_URL)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:site_name" content="RCO" />`,
    `<meta property="og:title" content="${esc(c.copy.title)}" />`,
    `<meta property="og:description" content="${esc(c.copy.description)}" />`,
    `<meta property="og:url" content="${esc(c.SITE_URL)}" />`,
    `<meta property="og:image" content="${esc(og)}" />`,
  ];
  if (c.GTM_ID) {
    tags.push(
      `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${esc(c.GTM_ID)}');</script>`,
    );
  }
  return tags.join("\n    ");
}

export function renderNav(c = cfg): string {
  const cta = primaryCta(c);
  return `<nav class="nav__links" aria-label="Seções">
          <a href="#recursos">Recursos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#planos">Planos</a>
          <a href="#duvidas">Dúvidas</a>
        </nav>
        <div class="nav__actions">
          ${link("Entrar no CRM", c.links.login, "entrar_crm", "topo", "nav__login")}
          ${link(cta.label, cta.href, "cta_principal", "topo", "btn btn--primary btn--sm")}
        </div>`;
}

export function renderHero(c = cfg): string {
  const cta = primaryCta(c);
  const shot = c.heroShot;
  return `<h1 class="hero__title">${esc(c.copy.heroTitle)}</h1>
          <p class="hero__kicker">${esc(c.copy.heroKicker)}</p>
          <p class="hero__lead">${esc(c.copy.heroLead)}</p>
          <div class="hero__actions">
            ${link(cta.label, cta.href, "cta_principal", "hero", "btn btn--primary")}
            ${c.links.whatsapp ? link("Falar com a RCO", c.links.whatsapp, "whatsapp", "hero", "btn btn--soft") : ""}
          </div>${
            shot
              ? `
          <figure class="hero__shot"><img src="${esc(shot.src)}" alt="${esc(shot.alt)}" width="${shot.width}" height="${shot.height}" fetchpriority="high" /></figure>`
              : ""
          }`;
}

/** Desenhos esquemáticos (só formas), trocados pela tela real quando ela existir. */
export function art(kind: cfg.Art): string {
  const b = 'fill="#fff" stroke="#c9dcfb" stroke-width="2"';
  const blue = "#0d67f0";
  const shapes: Record<cfg.Art, string> = {
    inbox: `<rect x="20" y="70" width="70" height="44" rx="10" fill="${blue}"/><path d="M40 114l-6 12 16-12" fill="${blue}"/>
      <path d="M92 92h40" stroke="${blue}" stroke-width="3" stroke-dasharray="6 6"/>
      <rect x="134" y="40" width="112" height="104" rx="14" ${b}/><rect x="150" y="58" width="80" height="10" rx="5" fill="#dbe7fd"/><rect x="150" y="78" width="60" height="10" rx="5" fill="#dbe7fd"/><rect x="150" y="98" width="72" height="10" rx="5" fill="#dbe7fd"/><rect x="150" y="118" width="50" height="10" rx="5" fill="#dbe7fd"/>
      <path d="M248 92h26" stroke="${blue}" stroke-width="3" stroke-dasharray="6 6"/>
      <circle cx="296" cy="52" r="16" fill="#dbe7fd"/><circle cx="296" cy="92" r="16" fill="${blue}"/><circle cx="296" cy="132" r="16" fill="#dbe7fd"/>`,
    funnel: `<rect x="16" y="30" width="96" height="124" rx="12" ${b}/><rect x="124" y="30" width="96" height="124" rx="12" ${b}/><rect x="232" y="30" width="96" height="124" rx="12" ${b}/>
      <rect x="28" y="44" width="72" height="30" rx="8" fill="#dbe7fd"/><rect x="28" y="82" width="72" height="30" rx="8" fill="#dbe7fd"/>
      <rect x="136" y="44" width="72" height="30" rx="8" fill="${blue}"/>
      <rect x="244" y="44" width="72" height="30" rx="8" fill="#dbe7fd"/><rect x="244" y="82" width="72" height="30" rx="8" fill="#dbe7fd"/><rect x="244" y="120" width="72" height="24" rx="8" fill="#dbe7fd"/>
      <path d="M100 59c14 0 18 0 36 0" stroke="${blue}" stroke-width="3" stroke-dasharray="5 5"/>`,
    origin: `<rect x="16" y="64" width="80" height="56" rx="12" fill="${blue}"/><path d="M40 84l20 8-20 8z" fill="#fff"/>
      <path d="M98 92h34" stroke="${blue}" stroke-width="3" stroke-dasharray="6 6"/>
      <rect x="134" y="64" width="80" height="56" rx="12" ${b}/><rect x="148" y="80" width="52" height="8" rx="4" fill="#dbe7fd"/><rect x="148" y="96" width="36" height="8" rx="4" fill="#dbe7fd"/>
      <path d="M216 92h34" stroke="${blue}" stroke-width="3" stroke-dasharray="6 6"/>
      <circle cx="286" cy="92" r="32" fill="#dbe7fd"/><path d="M272 93l10 10 18-20" fill="none" stroke="${blue}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
    automation: `<rect x="20" y="30" width="88" height="40" rx="10" fill="#1e3a6b"/><rect x="236" y="30" width="88" height="40" rx="10" fill="#1e3a6b"/>
      <rect x="128" y="72" width="88" height="40" rx="10" fill="${blue}"/><rect x="20" y="114" width="88" height="40" rx="10" fill="#1e3a6b"/><rect x="236" y="114" width="88" height="40" rx="10" fill="#1e3a6b"/>
      <path d="M108 50c20 0 20 42 20 42M216 92c20 0 20-42 20-42M108 134c20 0 20-42 20-42M216 92c20 0 20 42 20 42" fill="none" stroke="#5b8fe8" stroke-width="3" stroke-dasharray="6 6"/>`,
  };
  return `<svg class="art" viewBox="0 0 344 184" aria-hidden="true" focusable="false">${shapes[kind]}</svg>`;
}

export function renderPillars(c = cfg): string {
  return c.pillars
    .map(
      (p) => `<li class="pillar">
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.text)}</p>
            <div class="pillar__art">${art(p.art)}</div>
          </li>`,
    )
    .join("\n          ");
}

const check =
  '<svg class="check" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function renderDeepDives(c = cfg): string {
  return c.deepDives
    .map((d, i) => {
      const visual = d.shot
        ? `<img src="${esc(d.shot.src)}" alt="${esc(d.shot.alt)}" width="${d.shot.width}" height="${d.shot.height}" loading="lazy" />`
        : art(d.art);
      return `<section class="dive${d.dark ? " dive--dark" : ""}${i % 2 ? " dive--flip" : ""}" id="${esc(d.id)}" aria-labelledby="${esc(d.id)}-title">
      <div class="container dive__inner">
        <div class="dive__visual">${visual}</div>
        <div class="dive__text">
          <p class="eyebrow">${esc(d.problem)}</p>
          <h2 id="${esc(d.id)}-title" class="dive__title">${esc(d.title)}</h2>
          <ul class="checks" role="list">${d.points.map((pt) => `<li>${check}<span>${esc(pt)}</span></li>`).join("")}</ul>
        </div>
      </div>
    </section>`;
    })
    .join("\n\n    ");
}

export function renderSteps(c = cfg): string {
  return c.onboarding
    .map((s, i) => `<li class="step"><span class="step__n" aria-hidden="true">${i + 1}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div></li>`)
    .join("\n          ");
}

export function renderPlans(c = cfg): string {
  const plans = readyPlans(c.plans);
  if (!plans.length) {
    return `<p class="plans__pending" data-pending="${cfg.PENDING}">Os planos e preços do CRM RCO estão em definição.</p>`;
  }
  return `<ul class="plans" role="list">${plans
    .map(
      (p) => `
          <li class="plan${p.highlighted ? " plan--highlight" : ""}">
            <h3 class="plan__name">${esc(p.name)}</h3>
            <p class="plan__price"><strong>${esc(formatPrice(p.priceCents as number, p.currency))}</strong> <span>/ ${esc(p.period)}</span></p>
            ${list("Inclui", p.features)}${list("Limites", p.limits)}${list("Adicionais", p.addons)}
            <a class="btn btn--primary plan__cta" href="${esc(p.checkoutUrl)}" data-plan="${esc(p.id)}">Contratar ${esc(p.name)}</a>
          </li>`,
    )
    .join("")}
        </ul>`;
}

function list(title: string, items: string[]): string {
  if (!items.length) return "";
  return `<div class="plan__list"><p>${esc(title)}</p><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`;
}

export function renderTrust(c = cfg): string {
  return c.trust.map((t) => `<li>${check}<div><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></div></li>`).join("\n          ");
}

export function renderTestimonials(c = cfg): string {
  if (!c.testimonials.length) return "";
  return `<section class="section" aria-labelledby="dep-title">
      <div class="container">
        <h2 id="dep-title" class="section__title">Quem usa</h2>
        <ul class="quotes" role="list">${c.testimonials
          .map((t) => `<li><blockquote>${esc(t.quote)}</blockquote><p>${esc(t.author)} · ${esc(t.company)}</p></li>`)
          .join("")}</ul>
      </div>
    </section>`;
}

export function renderFaq(c = cfg): string {
  return c.faq.map((f) => `<details class="faq__item"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n          ");
}

export function renderClosing(c = cfg): string {
  const cta = primaryCta(c);
  return link(cta.label, cta.href, "cta_principal", "fechamento", "btn btn--light");
}

export function renderFooterLogin(c = cfg): string {
  return link("Já é cliente? Entrar no CRM", c.links.login, "entrar_crm", "rodape", "footer__login");
}

export const slots: Record<string, () => string> = {
  head: () => renderHead(),
  nav: () => renderNav(),
  hero: () => renderHero(),
  pillars: () => renderPillars(),
  dives: () => renderDeepDives(),
  "pillars-title": () => esc(cfg.copy.pillarsTitle),
  "closing-title": () => esc(cfg.copy.closingTitle),
  steps: () => renderSteps(),
  plans: () => renderPlans(),
  trust: () => renderTrust(),
  testimonials: () => renderTestimonials(),
  faq: () => renderFaq(),
  closing: () => renderClosing(),
  "footer-login": () => renderFooterLogin(),
};
