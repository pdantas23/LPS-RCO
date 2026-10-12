import { CircleDot, ClipboardList, Rocket, type LucideIcon } from "lucide-react";
import type { PageConfig } from "@/content/pages";
import { HeroCta } from "./HeroCta";
import { InstagramLink } from "./InstagramLink";
import { IncludedFlow } from "./IncludedFlow";
import { BRAND_ICONS, BrandIcon } from "./icons/brand-icons";
import { TestimonialsMarquee } from "./TestimonialsMarquee";

const WHATSAPP_ICON = BRAND_ICONS.find((icon) => icon.slug === "whatsapp")!;

/** Um ícone por passo, na ordem do conteúdo (`content/pages.ts`). `null` no
 *  2º passo marca o WhatsApp de verdade (ver `StepIcon`), não um ícone
 *  genérico de mensagem: é o mesmo app que o time usa pra responder, não
 *  "uma mensagem qualquer". Se um dia entrar um 4º passo sem ícone definido
 *  aqui, cai num genérico em vez de quebrar. */
const STEP_ICONS = [ClipboardList, null, Rocket] as const;

function StepIcon({ index, icons = STEP_ICONS }: { index: number; icons?: readonly (LucideIcon | null)[] }) {
  const Icon = icons[index];
  if (Icon === null) return <BrandIcon icon={WHATSAPP_ICON} size={24} />;
  const Fallback = Icon ?? CircleDot;
  return <Fallback aria-hidden="true" className="size-6 text-ink" />;
}

export function Benefits() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
      <h2 className="mb-3 text-center text-2xl font-bold">Tudo dentro de um único CRM</h2>
      <p className="mx-auto mb-10 max-w-xl text-center text-mute">
        Do primeiro contato até o fechamento, cada etapa acontece dentro do mesmo CRM, sem depender de planilha nem de ferramenta separada.
      </p>
      <IncludedFlow />
    </section>
  );
}

export function Steps({ steps, icons, eyebrow }: { steps: PageConfig["steps"]; icons?: readonly (LucideIcon | null)[]; eyebrow?: string }) {
  const { heading, subtitle, items } = steps;
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-3xl px-5 pb-10 sm:pb-16">
      {eyebrow ? <p className="mb-3 text-center text-sm font-semibold tracking-wide text-brand uppercase">{eyebrow}</p> : null}
      <h2 className="mb-3 text-center text-2xl font-bold">{heading}</h2>
      {subtitle ? <p className="mx-auto max-w-xl text-center text-mute">{subtitle}</p> : null}
      <div className="mb-10" />

      <ol>
        {items.map((s, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={s.title} className="relative flex gap-5">
              {/* Linha vertical ligando esta caixa à próxima (não depois da
                  última). `top-14` = pula a caixa do ícone (size-14); a
                  altura cobre o resto do espaço até o próximo ícone. */}
              {!isLast && (
                <span aria-hidden="true" className="absolute top-14 bottom-0 left-7 w-px -translate-x-1/2 bg-line" />
              )}
              <div className="relative z-10 grid size-14 shrink-0 place-items-center rounded-xl border border-line bg-bg">
                <StepIcon index={i} icons={icons} />
              </div>
              <div className={isLast ? "pt-2.5" : "pt-2.5 pb-10"}>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-mute">{s.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Bloco 06 (o último) do fluxo da P04 ("Resumo da oferta e chamada final"):
 * um resumo curto do que é oferecido mais um botão, depois do FAQ — pedido
 * explícito do usuário pra tirar o botão de logo após o vídeo e só chamar
 * pra ação depois de responder as dúvidas. Não existe na P05 (que usa
 * `HeroCta` direto, sem o texto de resumo, no próprio bloco final).
 */
export function OfferSummary({ text, cta, formId, page }: { text: string; cta: string; formId: string; page: string }) {
  return (
    <section className="mx-auto max-w-2xl px-5 pt-2 pb-8 text-center sm:pt-4 sm:pb-12">
      <p className="text-lg text-mute">{text}</p>
      <div className="mt-6 flex justify-center">
        <HeroCta label={cta} targetSelector={`#${formId}`} page={page} location="resumo_oferta" />
      </div>
    </section>
  );
}

/**
 * Bloco 03 do fluxo da P04 ("Resultados e depoimentos"): marcado como
 * PENDENTE no planejamento (falta o material de prova de verdade). Sem
 * `testimonials` (hoje: nenhum depoimento real ainda existe), mostra um
 * aviso disso mesmo — borda tracejada, tom mais apagado — em vez de
 * inventar depoimento ou número pra preencher o espaço (mesma regra do
 * `features.items[].content` em content/pages.ts). Assim que
 * `results.testimonials` tiver pelo menos um item de verdade, troca sozinho
 * pro carrossel (`TestimonialsMarquee`); não precisa mexer em mais nada.
 */
export function Results({ results }: { results: PageConfig["results"] }) {
  if (!results) return null;
  const { heading, note, testimonials } = results;
  return (
    <section className="mx-auto max-w-5xl px-5 py-10 text-center sm:py-16">
      <h2 className="mb-6 text-2xl font-bold">{heading}</h2>
      {testimonials?.length ? (
        <TestimonialsMarquee testimonials={testimonials} />
      ) : (
        <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-line p-8 text-mute">{note}</div>
      )}
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto max-w-6xl px-5 py-4 text-center text-sm text-mute sm:py-6">
        <InstagramLink />
        © RCO Hub. Todos os direitos reservados.
      </div>
    </footer>
  );
}
