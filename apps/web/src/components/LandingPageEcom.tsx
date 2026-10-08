import {
  BarChart3, Megaphone, MessageCircle, Quote, Image as ImageIcon, ShoppingCart, Tag, UserRound, Users,
  type LucideIcon,
} from "lucide-react";
import { ECOM_FAQ, ECOM_HERO, ECOM_METHOD, ECOM_PROOF, ECOM_SERVICE, PROOF_PLACEHOLDERS } from "@/content/ecom";
import { EcomHeroVisual } from "./EcomHeroVisual";
import { EcomLeadForm } from "./EcomLeadForm";
import { EcomPains } from "./EcomPains";
import { Faq } from "./Faq";
import { HeroCta } from "./HeroCta";
import { Logo } from "./Logo";
import { SiteFooter } from "./sections";
import { DarkGradientLayers } from "./ui/dark-gradient-bg";

const PAGE = "ECOM";
const FORM_ID = "formulario";

const ICONS: Record<string, LucideIcon> = {
  cart: ShoppingCart,
  megaphone: Megaphone,
  "bar-chart": BarChart3,
  image: ImageIcon,
  message: MessageCircle,
  users: Users,
};

function IconBox({ name }: { name: string }) {
  const Icon = ICONS[name] ?? Tag;
  return (
    <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-bg text-brand">
      <Icon aria-hidden="true" className="size-6" />
    </div>
  );
}

/**
 * /lp-ecom: 6 blocos na ordem do briefing da RCO (versão e-commerce, sem vídeo):
 * 1 abertura, 2 dores, 3 o que a RCO faz, 4 metodologia, 5 provas e quem é a RCO, 6 dúvidas + formulário.
 * Texto em content/ecom.ts. Sem cabeçalho, sem pop-up, sem banner de cookies.
 */
export function LandingPageEcom() {
  return (
    <main>
      {/* ---------- 1 Abertura ---------- */}
      <section className="relative overflow-hidden px-5 pt-8 pb-14 sm:pt-12 sm:pb-20">
        <div aria-hidden="true" className="absolute inset-0">
          <DarkGradientLayers />
        </div>
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

      {/* ---------- 3 O que a RCO faz ---------- */}
      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">{ECOM_SERVICE.heading}</h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-mute">{ECOM_SERVICE.subtitle}</p>
        <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {ECOM_SERVICE.items.map((s) => (
            <li key={s.title} className="flex gap-4">
              <IconBox name={s.icon} />
              <div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="mt-0.5 text-mute">{s.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- 4 Metodologia ---------- */}
      <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">{ECOM_METHOD.heading}</h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-mute">{ECOM_METHOD.subtitle}</p>
        <ol>
          {ECOM_METHOD.items.map((s, i) => {
            const last = i === ECOM_METHOD.items.length - 1;
            return (
              <li key={s.title} className="relative flex gap-5">
                {!last && <span aria-hidden="true" className="absolute top-14 bottom-0 left-7 w-px -translate-x-1/2 bg-line" />}
                <div className="relative z-10 grid size-14 shrink-0 place-items-center rounded-xl border border-line bg-bg text-xl font-extrabold text-brand">
                  {i + 1}
                </div>
                <div className={last ? "pt-2.5" : "pt-2.5 pb-10"}>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-1.5 text-mute">{s.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-10 flex justify-center">
          <HeroCta label={ECOM_METHOD.cta} targetSelector={`#${FORM_ID}`} page={PAGE} location="metodologia" width={280} />
        </div>
      </section>

      {/* ---------- 5 Provas e quem é a RCO ---------- */}
      <section className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <h2 className="mb-4 text-center text-2xl font-bold sm:text-3xl">{ECOM_PROOF.heading}</h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-mute">{ECOM_PROOF.about}</p>
        <h3 className="mb-2 text-center text-lg font-bold">{ECOM_PROOF.resultsHeading}</h3>
        <p className="mx-auto mb-6 max-w-xl text-center text-sm text-mute">{ECOM_PROOF.resultsNote}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {PROOF_PLACEHOLDERS.map((ph) => (
            <div
              key={ph.id}
              data-placeholder={ph.id}
              className="flex items-center gap-4 rounded-2xl border border-dashed border-line p-6 text-mute"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-bg">
                {ph.kind === "depoimento" ? <Quote className="size-5" /> : ph.kind === "equipe" ? <UserRound className="size-5" /> : <BarChart3 className="size-5" />}
              </span>
              <span className="text-sm">{ph.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 6 Dúvidas + formulário ---------- */}
      <div className="pt-6">
        <Faq items={ECOM_FAQ.map((f) => ({ q: f.q, a: f.a }))} page={PAGE} />
      </div>
      <section id={FORM_ID} className="mx-auto max-w-xl scroll-mt-6 px-5 pb-16 sm:pb-24">
        <EcomLeadForm />
      </section>

      <SiteFooter />
    </main>
  );
}
