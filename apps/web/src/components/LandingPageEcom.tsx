import { Check } from "lucide-react";
import {
  ECOM_ANCHORS, ECOM_CLOSING, ECOM_FAQ, ECOM_FLOW, ECOM_HERO, ECOM_INDICATORS, ECOM_METHOD, ECOM_MODELS, ECOM_NEXT,
  ECOM_OBJECTIONS, ECOM_PAINS, ECOM_PROOF, ECOM_SERVICE, PROOF_CASES, SHOW_PROOF_SECTION,
} from "@/content/ecom";
import { EcomFooter } from "./EcomFooter";
import { EcomHeader } from "./EcomHeader";
import { EcomHeroGraphic } from "./EcomHeroGraphic";
import { EcomIcon, iconOf } from "./EcomIcon";
import { EcomLeadForm } from "./EcomLeadForm";
import { IconCards, PurchaseFlow, SectionHead, TwoModels } from "./EcomSections";
import { Faq } from "./Faq";
import { HeroCta } from "./HeroCta";
import { Steps } from "./sections";
import { DarkGradientLayers } from "./ui/dark-gradient-bg";
import { FeaturesWithPanel } from "./ui/features-with-panel";

const PAGE = "ECOM";
const FORM = `#${ECOM_ANCHORS.form}`;
const WRAP = "mx-auto max-w-6xl px-5";
const SECTION = `${WRAP} py-12 sm:py-16`;

/**
 * /lp-ecom, versão final do documento (09/10/2026), sobre UM fundo contínuo (o do hero, como na P05).
 * Texto em content/ecom.ts. Um formulário só, no hero; todos os CTAs rolam até ele (#formulario).
 *
 * Seção → componente: menu EcomHeader | 03 hero (EcomLeadForm + EcomHeroGraphic) | 04 IconCards |
 * 05 PurchaseFlow | 06 FeaturesWithPanel (da P05) | 07 IconCards quote | 08 TwoModels | 09 IconCards |
 * 10 Steps (da P05/P04) | 11 provas (escondida, SHOW_PROOF_SECTION) | 13 Steps | 14 Faq (das outras LPs) |
 * 15 fechamento + EcomFooter. Sem banner de cookies, sem pop-up, sem CTA fixo.
 */
export function LandingPageEcom() {
  return (
    <main id="topo" className="relative">
      <div aria-hidden="true" className="absolute inset-0">
        <DarkGradientLayers />
      </div>
      <div className="relative">
        <EcomHeader page={PAGE} />

        {/* ---------- 03 Hero: texto à esquerda, formulário à direita (no celular: texto, botão, formulário) ---------- */}
        <section className="relative overflow-hidden px-5 pt-6 pb-14 sm:pt-10 sm:pb-20">
          <EcomHeroGraphic />
          <div className="relative mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <div>
              <p className="mb-3 text-sm font-semibold tracking-wide text-brand uppercase">{ECOM_HERO.eyebrow}</p>
              <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{ECOM_HERO.title}</h1>
              <p className="mt-5 max-w-xl text-lg text-mute">{ECOM_HERO.subtitle}</p>
              <ul className="mt-7 flex flex-col gap-3">
                {ECOM_HERO.supports.map((s) => (
                  <li key={s.text} className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-bg text-brand">
                      <EcomIcon name={s.icon} className="size-5" />
                    </span>
                    <span>{s.text}</span>
                  </li>
                ))}
              </ul>
              {/* O botão só existe onde o formulário fica abaixo (celular e tablet); no desktop ele está ao lado. */}
              <div className="mt-8 lg:hidden">
                <HeroCta label={ECOM_HERO.cta} targetSelector={FORM} page={PAGE} location="hero" width={320} className="max-w-full text-sm sm:text-base" />
              </div>
              <p className="mt-4 flex max-w-xl items-start gap-2 text-sm text-mute">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
                {ECOM_HERO.microtext}
              </p>
            </div>
            <EcomLeadForm />
          </div>
        </section>

        {/* ---------- 04 Dores ---------- */}
        <section className={SECTION}>
          <SectionHead eyebrow={ECOM_PAINS.eyebrow} title={ECOM_PAINS.title} support={ECOM_PAINS.support} />
          <IconCards items={ECOM_PAINS.items} />
        </section>

        {/* ---------- 05 Caminho da compra ---------- */}
        <section className={SECTION}>
          <SectionHead eyebrow={ECOM_FLOW.eyebrow} title={ECOM_FLOW.title} support={ECOM_FLOW.text} />
          <PurchaseFlow steps={ECOM_FLOW.steps} />
          <p className="mx-auto mt-8 max-w-2xl text-center text-lg">{ECOM_FLOW.closing}</p>
        </section>

        {/* ---------- 06 O que a RCO faz (FeaturesWithPanel, o painel clicável da P05) ---------- */}
        <section className={SECTION}>
          <SectionHead eyebrow={ECOM_SERVICE.eyebrow} title={ECOM_SERVICE.title} support={ECOM_SERVICE.support} />
          <FeaturesWithPanel
            items={ECOM_SERVICE.items.map((s) => ({
              title: s.title,
              content: (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <EcomIcon name={s.icon} className="size-14 text-brand" />
                  <p className="max-w-md text-sm leading-relaxed text-mute">{s.text}</p>
                </div>
              ),
            }))}
          />
          <div className="mt-10 flex justify-center">
            <HeroCta label={ECOM_SERVICE.cta} targetSelector={FORM} page={PAGE} location="servico" width={380} className="max-w-full text-sm sm:text-base" />
          </div>
        </section>

        {/* ---------- 07 Objeções ---------- */}
        <section className={SECTION}>
          <SectionHead eyebrow={ECOM_OBJECTIONS.eyebrow} title={ECOM_OBJECTIONS.title} />
          <IconCards items={ECOM_OBJECTIONS.items} quote />
        </section>

        {/* ---------- 08 Dois modelos de loja ---------- */}
        <section id={ECOM_ANCHORS.models} className={`${SECTION} scroll-mt-6`}>
          <SectionHead eyebrow={ECOM_MODELS.eyebrow} title={ECOM_MODELS.title} />
          <TwoModels items={ECOM_MODELS.items} />
          <p className="mx-auto mt-8 max-w-2xl text-center text-lg">{ECOM_MODELS.closing}</p>
        </section>

        {/* ---------- 09 Indicadores ---------- */}
        <section id={ECOM_ANCHORS.indicators} className={`${SECTION} scroll-mt-6`}>
          <SectionHead eyebrow={ECOM_INDICATORS.eyebrow} title={ECOM_INDICATORS.title} support={ECOM_INDICATORS.support} />
          <IconCards items={ECOM_INDICATORS.items} />
          <p className="mx-auto mt-8 max-w-2xl text-center text-mute">{ECOM_INDICATORS.note}</p>
        </section>

        {/* ---------- 10 Como trabalhamos (Steps, o "Como funciona" da P05/P04) ---------- */}
        <div id={ECOM_ANCHORS.method} className="scroll-mt-6 pt-6">
          <Steps
            eyebrow={ECOM_METHOD.eyebrow}
            steps={{ heading: ECOM_METHOD.title, subtitle: "", items: ECOM_METHOD.items.map((i) => ({ ...i })) }}
            icons={ECOM_METHOD.icons.map(iconOf)}
          />
        </div>

        {/* ---------- 11 Provas: ESCONDIDA até existirem cases reais (SHOW_PROOF_SECTION em content/ecom.ts) ---------- */}
        {SHOW_PROOF_SECTION && PROOF_CASES.length > 0 ? (
          <section className={SECTION}>
            <SectionHead title={ECOM_PROOF.title} support={ECOM_PROOF.support} />
            <ul className="grid gap-4 md:grid-cols-2">
              {PROOF_CASES.map((c) => (
                <li key={c.loja} className="rounded-2xl border border-line bg-surface p-6">
                  <h3 className="text-lg font-bold">{c.loja}</h3>
                  <p className="text-sm text-mute">{c.periodo}</p>
                  <dl className="mt-4 space-y-2 text-sm">
                    {([[ECOM_PROOF.caseFields[2], c.desafio], [ECOM_PROOF.caseFields[3], c.feito], [ECOM_PROOF.caseFields[4], c.resultados], [ECOM_PROOF.caseFields[5], c.fonte]] as const).map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-semibold">{k}</dt>
                        <dd className="text-mute">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ---------- 13 Próximos passos (Steps) ---------- */}
        <div className="pt-6">
          <Steps
            eyebrow={ECOM_NEXT.eyebrow}
            steps={{ heading: ECOM_NEXT.title, subtitle: "", items: ECOM_NEXT.items.map((i) => ({ ...i })) }}
            icons={ECOM_NEXT.icons.map(iconOf)}
          />
        </div>

        {/* ---------- 14 Dúvidas (Faq, o das outras LPs) ---------- */}
        <div id={ECOM_ANCHORS.faq} className="scroll-mt-6 pt-6">
          <Faq items={ECOM_FAQ.items.map((f) => ({ q: f.q, a: f.a }))} page={PAGE} eyebrow={ECOM_FAQ.eyebrow} title={ECOM_FAQ.title} />
        </div>

        {/* ---------- 15 Fechamento (faixa em azul escuro) e rodapé ---------- */}
        <section className="bg-surface/80">
          <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:py-20">
            <h2 className="text-2xl leading-tight font-bold sm:text-3xl">{ECOM_CLOSING.headline}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-mute">{ECOM_CLOSING.text}</p>
            <div className="mt-8 flex justify-center">
              <HeroCta label={ECOM_CLOSING.cta} targetSelector={FORM} page={PAGE} location="fechamento" width={320} className="max-w-full text-sm sm:text-base" />
            </div>
            <p className="mt-4 text-sm text-mute">{ECOM_CLOSING.microtext}</p>
          </div>
        </section>
        <EcomFooter />
      </div>
    </main>
  );
}
