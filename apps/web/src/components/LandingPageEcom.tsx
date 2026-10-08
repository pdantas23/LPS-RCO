import { BarChart3, Megaphone, Search, TrendingUp } from "lucide-react";
import { ECOM_FAQ, ECOM_HERO, ECOM_METHOD, ECOM_PROOF, ECOM_SERVICE, PROOF_TESTIMONIAL_PLACEHOLDERS } from "@/content/ecom";
import { EcomHeroVisual } from "./EcomHeroVisual";
import { EcomLeadForm } from "./EcomLeadForm";
import { EcomPains } from "./EcomPains";
import { Faq } from "./Faq";
import { HeroCta } from "./HeroCta";
import { Logo } from "./Logo";
import { SiteFooter, Steps } from "./sections";
import { TestimonialsMarquee } from "./TestimonialsMarquee";
import { DarkGradientLayers } from "./ui/dark-gradient-bg";
import { FeaturesWithPanel } from "./ui/features-with-panel";

const PAGE = "ECOM";
const FORM_ID = "formulario";

/**
 * /lp-ecom: 6 blocos na ordem do briefing da RCO (versão e-commerce, sem vídeo), sobre UM fundo contínuo
 * (o mesmo do hero, DarkGradientLayers, como na P05). Texto em content/ecom.ts.
 * Componentes reaproveitados das outras LPs: FeaturesWithPanel (3), Steps (4), TestimonialsMarquee (5),
 * Faq e o formulário no estilo do LeadForm (6). Sem cabeçalho, sem pop-up, sem banner de cookies.
 */
export function LandingPageEcom() {
  return (
    <main className="relative">
      <div aria-hidden="true" className="absolute inset-0">
        <DarkGradientLayers />
      </div>
      <div className="relative">
        {/* ---------- 1 Abertura ---------- */}
        <section className="relative overflow-hidden px-5 pt-8 pb-14 sm:pt-12 sm:pb-20">
          <div className="relative mx-auto max-w-6xl">
            <div className="grid items-center gap-14 md:grid-cols-2 md:gap-10">
              <div className="flex flex-col items-center text-center">
                <Logo className="mb-10" />
                <p className="mb-3 text-sm font-semibold tracking-wide text-brand uppercase">{ECOM_HERO.eyebrow}</p>
                <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{ECOM_HERO.title}</h1>
                <p className="mx-auto mt-5 max-w-xl text-lg text-mute">{ECOM_HERO.subtitle}</p>
                <div className="mt-8">
                  <HeroCta label={ECOM_HERO.cta} targetSelector={`#${FORM_ID}`} page={PAGE} location="hero" width={280} />
                </div>
              </div>
              <EcomHeroVisual />
            </div>
          </div>
        </section>

        {/* ---------- 2 Dores (carrossel Gallery4) ---------- */}
        <EcomPains page={PAGE} formId={FORM_ID} />

        {/* ---------- 3 O que a RCO faz (FeaturesWithPanel, o painel clicável da P05) ---------- */}
        <FeaturesWithPanel heading={ECOM_SERVICE.heading} items={ECOM_SERVICE.items.map((s) => ({ title: s.title, content: s.text }))} />

        {/* ---------- 4 Metodologia (Steps, o "Como funciona" da P05/P04) ---------- */}
        <div className="pt-6">
          <Steps
            steps={{ heading: ECOM_METHOD.heading, subtitle: ECOM_METHOD.subtitle, items: ECOM_METHOD.items.map((i) => ({ ...i })) }}
            icons={[Search, BarChart3, Megaphone, TrendingUp]}
          />
          <div className="flex justify-center px-5 pb-10 sm:pb-16">
            <HeroCta label={ECOM_METHOD.cta} targetSelector={`#${FORM_ID}`} page={PAGE} location="metodologia" width={280} />
          </div>
        </div>

        {/* ---------- 5 Provas e quem é a RCO (TestimonialsMarquee com espaços reservados) ---------- */}
        <section className="mx-auto max-w-5xl px-5 py-10 text-center sm:py-16">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">{ECOM_PROOF.heading}</h2>
          <p className="mx-auto mb-10 max-w-2xl text-mute">{ECOM_PROOF.about}</p>
          <h3 className="mb-2 text-lg font-bold">{ECOM_PROOF.resultsHeading}</h3>
          <p className="mx-auto mb-6 max-w-xl text-sm text-mute">{ECOM_PROOF.resultsNote}</p>
          <TestimonialsMarquee testimonials={PROOF_TESTIMONIAL_PLACEHOLDERS} />
        </section>

        {/* ---------- 6 Dúvidas + formulário ---------- */}
        <div className="pt-6">
          <Faq items={ECOM_FAQ.map((f) => ({ q: f.q, a: f.a }))} page={PAGE} />
        </div>
        <section id={FORM_ID} className="mx-auto max-w-xl scroll-mt-6 px-5 pb-16 sm:pb-24">
          <EcomLeadForm />
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
