"use client";

import { useState } from "react";
import { CAPTURA_TEXTOS, SITES_CAPTURA } from "@/content/captura/sites";
import { SITES_PAGE } from "@/content/sites";
import { telasVisiveis, type Respostas } from "@/lib/captura/fluxo";
import { enviarCaptura } from "@/lib/captura/envio";
import { EVENTOS_CARD, pushCaptura } from "@/lib/captura/eventos";
import { validarRespostas } from "@/lib/captura/validacao";
import { newId } from "@/lib/tracking/events";
import { readTracking } from "@/lib/tracking/utms";
import { Select } from "@/components/ui/select";
import { CampoTelefone } from "./CampoTelefone";
import { Sucesso } from "./Sucesso";

const PAGE = SITES_PAGE.id;
const VERSAO = "card" as const;
const T = CAPTURA_TEXTOS.card;
// O card usa só o caminho curto, sem ramificação (bloco 5): as 9 telas, com o rótulo curto de cada uma.
const CAMPOS = telasVisiveis(SITES_CAPTURA, VERSAO, {}).map((x) => x.tela);

const INPUT =
  "h-14 w-full rounded-xl border border-white/15 bg-[#070d22] px-4 text-base text-ink placeholder:text-mute/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2878F6] aria-[invalid=true]:border-danger";

/**
 * Formato 2 (bloco 5): card de formulário dentro da LP. Envia sem sair da página e mostra a confirmação no
 * lugar do card. Rótulos, opções e placeholders vêm de content/captura/sites.ts.
 */
export function CardForm() {
  const [respondentId] = useState(() => newId());
  const [r, setR] = useState<Respostas>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ kind: "idle" | "sending" | "done" } | { kind: "error"; message: string }>({ kind: "idle" });
  const [iniciado, setIniciado] = useState(false);
  const [website, setWebsite] = useState("");

  const set = (id: string, v: string) => {
    setR((prev) => ({ ...prev, [id]: v }));
    if (erros[id])
      setErros((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    pushCaptura("form_submit", { page_id: PAGE, versao_captura: VERSAO });
    const v = validarRespostas(SITES_CAPTURA, VERSAO, r);
    if (!v.ok) {
      setErros(v.erros);
      pushCaptura("form_error", { page_id: PAGE, versao_captura: VERSAO, error_type: "validation", fields: Object.keys(v.erros).join(",") });
      document.getElementById(`card-${Object.keys(v.erros)[0]}`)?.focus();
      return;
    }
    setStatus({ kind: "sending" });
    const out = await enviarCaptura({ pageId: PAGE, versao: VERSAO, respostas: r, respondentId, tracking: readTracking(), website });
    if (out.kind === "ok") setStatus({ kind: "done" });
    else if (out.kind === "erros") {
      setErros(out.erros);
      setStatus({ kind: "idle" });
    } else setStatus({ kind: "error", message: out.mensagem });
  };

  const shell = "rounded-3xl border border-white/10 bg-[#0b1430] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] sm:p-8";

  if (status.kind === "done") return <Sucesso className={shell} />;

  const sending = status.kind === "sending";
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={shell}
      aria-labelledby="card-titulo"
      onFocusCapture={() => {
        if (!iniciado) {
          setIniciado(true);
          pushCaptura(EVENTOS_CARD.iniciado, { page_id: PAGE, versao_captura: VERSAO });
        }
      }}
    >
      <h2 id="card-titulo" className="text-2xl font-bold">
        {T.titulo}
      </h2>
      <p className="mt-1 mb-6 text-mute">{T.apoio}</p>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Site
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {CAMPOS.map((tela) => {
          const id = `card-${tela.id}`;
          const err = erros[tela.id];
          const desc = err ? `${id}-erro` : undefined;
          const value = r[tela.id] ?? "";
          return (
            <div key={tela.id}>
              <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
                {tela.rotuloCard}
              </label>
              {tela.tipo === "opcoes" ? (
                <Select id={id} value={value} onChange={(v) => set(tela.id, v)} options={tela.opcoes ?? []} placeholder={T.selecione} invalid={Boolean(err)} className="border-white/15 bg-[#070d22]" />
              ) : tela.tipo === "telefone" ? (
                <CampoTelefone id={id} value={value} onChange={(v) => set(tela.id, v)} placeholder={tela.placeholderCard ?? tela.placeholder} invalid={Boolean(err)} describedBy={desc} />
              ) : (
                <input
                  id={id}
                  type="text"
                  autoComplete={tela.tipo === "texto" ? "name" : "off"}
                  autoCapitalize={tela.tipo === "instagram" ? "none" : undefined}
                  spellCheck={tela.tipo === "instagram" ? false : undefined}
                  placeholder={tela.placeholderCard ?? tela.placeholder}
                  value={value}
                  onChange={(e) => set(tela.id, e.target.value)}
                  aria-invalid={Boolean(err)}
                  aria-describedby={desc}
                  className={INPUT}
                />
              )}
              {err ? (
                <p id={`${id}-erro`} className="mt-1.5 text-sm text-danger">
                  {err}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {Object.keys(erros).length > 0 ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {T.erroCampos}
        </p>
      ) : null}
      {status.kind === "error" ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {status.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="mt-6 h-14 w-full rounded-xl bg-[#2878F6] text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(40,120,246,0.8)] transition-colors hover:bg-[#1f66d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-70"
      >
        {sending ? T.enviando : T.enviar}
      </button>
    </form>
  );
}
