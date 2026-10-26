"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CAPTURA_TEXTOS } from "@/content/captura/sites";
import type { CapturaConfig, Tela, Versao } from "@/content/captura/tipos";
import { telasVisiveis, type Respostas } from "@/lib/captura/fluxo";
import { enviarCaptura } from "@/lib/captura/envio";
import { criarRastreioDeTelas, pushCaptura } from "@/lib/captura/eventos";
import { erroDaTela, validarRespostas } from "@/lib/captura/validacao";
import { armazenamentoLocal, versaoDoQuizDaPessoa } from "@/lib/captura/versao";
import { newId } from "@/lib/tracking/events";
import { captureTracking, readTracking } from "@/lib/tracking/utms";
import { CampoTelefone } from "./CampoTelefone";
import { Sucesso } from "./Sucesso";

// ============================================================
// Formato 1 (bloco 4): quiz em tela própria, uma pergunta por tela. Genérico: recebe a configuração da captura
// (perguntas, opções e caminhos) e não tem texto de pergunta. Cartões com letra, avanço sozinho ao clicar,
// barra de progresso, voltar com a resposta guardada, caminho curto ou longo sorteado e guardado
// (lib/captura/versao.ts). Eventos por tela vista/respondida e no envio (lib/captura/eventos.ts).
// ============================================================

const Q = CAPTURA_TEXTOS.quiz;
const LETRAS = "ABCDEFGHIJKLMNOP";

let cache: Versao | null = null;
const noop = () => () => {};
const lerVersao = () => (cache ??= versaoDoQuizDaPessoa(window.location.search, armazenamentoLocal()));
const nulo = () => null;

export function Quiz({ config, pageId, voltarHref }: { config: CapturaConfig; pageId: string; voltarHref: string }) {
  const versao = useSyncExternalStore(noop, lerVersao, nulo);
  if (!versao) return <Moldura progresso={0} voltar={null} />;
  return <QuizComVersao config={config} pageId={pageId} versao={versao} voltarHref={voltarHref} />;
}

function QuizComVersao({ config, pageId, versao, voltarHref }: { config: CapturaConfig; pageId: string; versao: Versao; voltarHref: string }) {
  const reduce = useReducedMotion();
  const [respondentId] = useState(() => newId());
  const [r, setR] = useState<Respostas>({});
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "sending" | "done" } | { kind: "error"; message: string }>({ kind: "idle" });
  const [website, setWebsite] = useState("");
  const rastreio = useMemo(() => criarRastreioDeTelas(pageId, versao), [pageId, versao]);
  const avancando = useRef(false);

  const visiveis = telasVisiveis(config, versao, r);
  const atual = visiveis[Math.min(idx, visiveis.length - 1)]!;
  const ultima = idx >= visiveis.length - 1;

  // Entrada: page_view com a versão (uma vez; o ref segura o efeito duplo do modo estrito em desenvolvimento).
  const vista = useRef(false);
  useEffect(() => {
    if (vista.current) return;
    vista.current = true;
    captureTracking();
    pushCaptura("page_view", { page_id: pageId, versao_captura: versao, page_path: window.location.pathname, ...readTracking() });
  }, [pageId, versao]);

  // Tela vista (uma vez por tela).
  useEffect(() => {
    if (status.kind !== "done") rastreio.visto(atual.numero, atual.tela.slug);
  }, [atual.numero, atual.tela.slug, rastreio, status.kind]);

  const ir = (novo: number) => {
    setDir(novo > idx ? 1 : -1);
    setErro(null);
    setIdx(novo);
    window.scrollTo({ top: 0 });
  };

  const enviar = async (respostas: Respostas) => {
    const v = validarRespostas(config, versao, respostas);
    if (!v.ok) {
      const primeira = visiveis.findIndex((x) => x.tela.id in v.erros);
      if (primeira >= 0) {
        ir(primeira);
        setErro(v.erros[visiveis[primeira]!.tela.id]!);
      }
      return;
    }
    setStatus({ kind: "sending" });
    const out = await enviarCaptura({ pageId, versao, respostas, respondentId, tracking: readTracking(), website });
    if (out.kind === "ok") setStatus({ kind: "done" });
    else if (out.kind === "erros") {
      const primeira = visiveis.findIndex((x) => x.tela.id in out.erros);
      setStatus({ kind: "idle" });
      if (primeira >= 0) {
        ir(primeira);
        setErro(out.erros[visiveis[primeira]!.tela.id]!);
      }
    } else setStatus({ kind: "error", message: out.mensagem });
  };

  /** Confirma a tela atual com o valor dado: valida, registra o evento e avança (ou envia, na última). */
  const responder = (tela: Tela, valor: string, atraso = 0) => {
    const e = erroDaTela(tela, valor);
    if (e) {
      setErro(e);
      return;
    }
    const novas = { ...r, [tela.id]: valor };
    setR(novas);
    rastreio.respondido(atual.numero, tela.slug);
    if (ultima) {
      void enviar(novas);
      return;
    }
    if (avancando.current) return;
    avancando.current = true;
    window.setTimeout(() => {
      avancando.current = false;
      ir(idx + 1);
    }, atraso);
  };

  // Atalho: letra da opção no teclado escolhe a opção.
  useEffect(() => {
    if (atual.tela.tipo !== "opcoes" || status.kind !== "idle") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const i = LETRAS.indexOf(e.key.toUpperCase());
      const op = atual.tela.opcoes?.[i];
      if (e.key.length === 1 && op) responder(atual.tela, op, 220);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const progresso = status.kind === "done" ? 1 : (idx + 1) / visiveis.length;
  const voltar = status.kind === "done" ? null : idx === 0 ? { href: voltarHref } : { onClick: () => ir(idx - 1) };

  if (status.kind === "done") {
    return (
      <Moldura progresso={1} voltar={null}>
        <Sucesso className="py-10" />
      </Moldura>
    );
  }

  const tela = atual.tela;
  const tituloId = `q-${tela.id}`;
  const descId = `q-${tela.id}-desc`;
  const erroId = `q-${tela.id}-erro`;
  const sending = status.kind === "sending";

  return (
    <Moldura progresso={progresso} voltar={voltar} progressoTexto={Q.progresso(idx + 1, visiveis.length)}>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Site
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.section
          key={tela.id}
          aria-labelledby={tituloId}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -40 * dir }}
          transition={{ duration: reduce ? 0.01 : 0.22, ease: "easeOut" }}
        >
          <h1 id={tituloId} tabIndex={-1} className="text-[1.65rem] leading-tight font-bold tracking-[-0.02em] text-balance sm:text-4xl">
            {tela.pergunta}
          </h1>
          {tela.descricao ? (
            <p id={descId} className="mt-3 text-base leading-relaxed text-mute sm:text-lg">
              {tela.descricao}
            </p>
          ) : null}

          <div className="mt-7">
            {tela.tipo === "opcoes" ? (
              <div role="radiogroup" aria-labelledby={tituloId} aria-describedby={[tela.descricao ? descId : "", erro ? erroId : ""].filter(Boolean).join(" ") || undefined} className="grid gap-3">
                {tela.opcoes!.map((op, i) => {
                  const marcada = r[tela.id] === op;
                  return (
                    <button
                      key={op}
                      type="button"
                      role="radio"
                      aria-checked={marcada}
                      disabled={sending}
                      onClick={() => responder(tela, op, 220)}
                      className={`group flex min-h-14 w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2878F6] ${
                        marcada ? "border-[#2878F6] bg-[#2878F6]/15" : "border-white/12 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.07]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`grid size-8 shrink-0 place-items-center rounded-lg border text-sm font-bold ${marcada ? "border-[#2878F6] bg-[#2878F6] text-white" : "border-white/25 text-mute group-hover:text-ink"}`}
                      >
                        {LETRAS[i]}
                      </span>
                      <span className="flex-1">{op}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <CampoDigitado
                key={tela.id}
                tela={tela}
                inicial={r[tela.id] ?? ""}
                erro={erro}
                erroId={erroId}
                descId={tela.descricao ? descId : undefined}
                ultima={ultima}
                sending={sending}
                onLimparErro={() => setErro(null)}
                onConfirmar={(v) => responder(tela, v)}
              />
            )}
            {erro && tela.tipo === "opcoes" ? (
              <p id={erroId} role="alert" className="mt-3 text-sm text-danger">
                {erro}
              </p>
            ) : null}
            {status.kind === "error" ? (
              <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                {status.message}
              </p>
            ) : null}
          </div>
        </motion.section>
      </AnimatePresence>
    </Moldura>
  );
}

const INPUT =
  "h-14 w-full rounded-xl border border-white/15 bg-[#070d22] px-4 text-base text-ink placeholder:text-mute/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2878F6] aria-[invalid=true]:border-danger";

function CampoDigitado({
  tela,
  inicial,
  erro,
  erroId,
  descId,
  ultima,
  sending,
  onLimparErro,
  onConfirmar,
}: {
  tela: Tela;
  inicial: string;
  erro: string | null;
  erroId: string;
  descId?: string;
  ultima: boolean;
  sending: boolean;
  onLimparErro: () => void;
  onConfirmar: (v: string) => void;
}) {
  const [valor, setValor] = useState(inicial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Foco no campo depois da transição (no celular abre o teclado na hora).
    const t = window.setTimeout(() => ref.current?.focus({ preventScroll: true }), 260);
    return () => window.clearTimeout(t);
  }, []);
  const describedBy = [descId, erro ? erroId : ""].filter(Boolean).join(" ") || undefined;
  const mudar = (v: string) => {
    setValor(v);
    if (erro) onLimparErro();
  };
  const confirmar = () => onConfirmar(valor.trim());
  const rotulo = sending ? Q.enviando : ultima ? Q.enviar : tela.opcional && !valor.trim() ? Q.pular : Q.continuar;
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        confirmar();
      }}
    >
      {tela.tipo === "telefone" ? (
        <CampoTelefone ref={ref} id={`campo-${tela.id}`} value={valor} onChange={mudar} placeholder={tela.placeholder} invalid={Boolean(erro)} describedBy={describedBy} onEnter={confirmar} />
      ) : (
        <input
          ref={ref}
          id={`campo-${tela.id}`}
          type={tela.tipo === "email" ? "email" : "text"}
          inputMode={tela.tipo === "email" ? "email" : undefined}
          autoComplete={tela.tipo === "texto" ? "name" : tela.tipo === "email" ? "email" : "off"}
          autoCapitalize={tela.tipo === "instagram" || tela.tipo === "email" ? "none" : undefined}
          spellCheck={tela.tipo === "instagram" ? false : undefined}
          placeholder={tela.placeholder}
          value={valor}
          onChange={(e) => mudar(e.target.value)}
          aria-invalid={Boolean(erro)}
          aria-describedby={describedBy}
          aria-label={tela.pergunta}
          className={INPUT}
        />
      )}
      {erro ? (
        <p id={erroId} role="alert" className="mt-2 text-sm text-danger">
          {erro}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={sending}
        className="mt-5 inline-flex h-14 w-full items-center justify-center rounded-xl bg-[#2878F6] px-8 text-base font-semibold text-white transition-colors hover:bg-[#1f66d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-70 sm:w-auto"
      >
        {rotulo}
      </button>
    </form>
  );
}

/** Fundo escuro, logo no canto superior esquerdo, barra de progresso no topo e botão de voltar. */
function Moldura({
  progresso,
  voltar,
  progressoTexto,
  children,
}: {
  progresso: number;
  voltar: null | { href: string } | { onClick: () => void };
  progressoTexto?: string;
  children?: React.ReactNode;
}) {
  const btn =
    "inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-mute transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-2 focus-visible:outline-[#2878F6]";
  const seta = (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <path d="M13 8H3M7 4 3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <div className="min-h-svh bg-[#060b1a] text-ink">
      <div className="fixed inset-x-0 top-0 z-20 h-1.5 bg-white/[0.08]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progresso * 100)} aria-valuetext={progressoTexto}>
        <div className="h-full origin-left bg-[#2878F6] transition-transform duration-300 ease-out" style={{ transform: `scaleX(${progresso})` }} />
      </div>
      <header className="flex w-full items-center justify-between px-4 pt-5 sm:px-8 sm:pt-6">
        <Image src="/rco-logo-white.png" alt="RCO Hub" width={406} height={387} priority className="h-8 w-auto" />
        {voltar ? (
          "href" in voltar ? (
            <a href={voltar.href} className={btn}>
              {seta}
              {Q.voltar}
            </a>
          ) : (
            <button type="button" onClick={voltar.onClick} className={btn}>
              {seta}
              {Q.voltar}
            </button>
          )
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16">{children}</main>
    </div>
  );
}
