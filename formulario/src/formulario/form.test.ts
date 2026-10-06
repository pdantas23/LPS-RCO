import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LeadPayload, PartialPayload, SendResult } from "../lib/api";
import { captureAttribution } from "../lib/attribution";
import { loadDraft } from "../lib/draft";
import { createTracker } from "../lib/tracking";
import { SCREENS } from "./config";
import { LAST, confirmationStatusFor, mountForm } from "./form";

const HTML = readFileSync(resolve(process.cwd(), "formulario/index.html"), "utf8");
const BODY = HTML.slice(HTML.indexOf("<body>") + 6, HTML.indexOf("</body>"));
const ENTRY = "https://lp.rcohub.com/formulario/?utm_source=instagram&utm_medium=bio&utm_campaign=performance&utm_content=story&utm_term=crm&gclid=G1&fbclid=ABC&foo=bar";
const DRAFT_KEY = "rco_p02_rascunho_v3";
/** Tudo que a pessoa responde: nada disso pode aparecer no dataLayer. */
const PII = ["Maria", "Silva", "99876", "5562998765432", "maria@", "empresa.com", "@empresa", "João", "Saúde", "R$", "nao_converte", "imediato", "nunca", "2_3"];

type Sender = ReturnType<typeof vi.fn<(p: LeadPayload) => Promise<SendResult>>>;

let redirected: string[] = [];
let partials: PartialPayload[] = [];

function setup(send: Sender, href = ENTRY) {
  document.body.innerHTML = BODY;
  const tracker = createTracker(window, sessionStorage);
  tracker.pageView();
  return mountForm({
    doc: document,
    storage: sessionStorage,
    tracker,
    attribution: captureAttribution(href, "https://bio.rcohub.com/", sessionStorage),
    draft: loadDraft(sessionStorage),
    send,
    redirect: (url) => redirected.push(url),
    savePartial: (p) => partials.push(p),
  });
}

const at = (field: string) => SCREENS.findIndex((s) => s.field === field);
const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
const visibleStep = () => Number(document.querySelector<HTMLElement>("[data-screen]:not([hidden])")?.dataset.screen);
const type = (sel: string, value: string) => {
  const el = $<HTMLInputElement>(sel);
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};
/** Escolha pelo teclado (sem pointerdown): marca, não avança sozinho. */
const choose = (sel: string) => {
  const el = $<HTMLInputElement>(sel);
  el.checked = true;
  el.dispatchEvent(new Event("change", { bubbles: true }));
};
const select = (value: string) => {
  const el = $<HTMLSelectElement>("#niche");
  el.value = value;
  el.dispatchEvent(new Event("change", { bubbles: true }));
};
const submitStep = () => $<HTMLButtonElement>("[data-screen]:not([hidden]) button[type=submit]").click();
const back = () => $<HTMLButtonElement>("[data-screen]:not([hidden]) [data-back]").click();
const events = () => (window.dataLayer ?? []) as Record<string, unknown>[];
const named = (n: string) => events().filter((e) => e.event === n);
const flush = () => new Promise((r) => setTimeout(r, 0));

/** Responde uma tela e avança. */
const answer: Record<string, () => void> = {
  full_name: () => type("#full_name", "  Maria   da Silva "),
  employees: () => choose("#employees-2_3"),
  niche: () => select("saude"),
  email: () => type("#email", " maria@empresa.com.br "),
  instagram: () => type("#instagram", "instagram.com/Empresa"),
  whatsapp: () => type("#whatsapp", "62998765432"),
  whatsapp_repeat: () => type("#whatsapp_repeat", "(62) 99876-5432"),
  partner: () => type("#partner", " João  (sócio) "),
  sales_challenge: () => choose("#sales_challenge-nao_converte"),
  urgency: () => choose("#urgency-imediato"),
  ads_experience: () => choose("#ads_experience-nunca"),
  revenue_range: () => choose("#revenue_range-10k_30k"),
};

/** Responde tudo e para na última tela (confirmação do WhatsApp), sem enviar. */
function fillToEnd() {
  for (const s of SCREENS.slice(0, LAST)) {
    answer[s.field]();
    submitStep();
  }
  answer[SCREENS[LAST].field]();
}

const saved = (): Sender => vi.fn(async () => ({ kind: "saved", leadId: "L1", duplicate: false }) as SendResult);

beforeEach(() => {
  sessionStorage.clear();
  window.dataLayer = [];
  redirected = [];
  partials = [];
});

describe("P02 — uma pergunta por tela", () => {
  it("cada tela mostra uma única pergunta, na ordem da config; a última é a confirmação do WhatsApp", () => {
    setup(saved());
    const sections = [...document.querySelectorAll<HTMLElement>("#screens [data-screen]")];
    expect(sections.map((s) => s.querySelector("h2")!.textContent)).toEqual(SCREENS.map((s) => s.title));
    expect(SCREENS.map((s) => s.id)).toEqual([
      "name", "employees", "niche", "email", "instagram", "whatsapp",
      "partner", "sales_challenge", "urgency", "ads_experience", "revenue", "whatsapp_confirmation",
    ]);
    for (let i = 0; i < LAST; i++) {
      expect(visibleStep()).toBe(i);
      expect(document.querySelectorAll("[data-screen]:not([hidden])")).toHaveLength(1);
      answer[SCREENS[i].field]();
      submitStep();
    }
    expect(visibleStep()).toBe(LAST);
    expect(document.activeElement).toBe($(`#q${LAST}-title`));
    expect($("[data-screen]:not([hidden]) button[type=submit]").textContent).toBe("Enviar");
  });

  it("progresso: só a barra na tela; o texto fica para leitor de tela", () => {
    setup(saved());
    expect($("#progress-text").className).toBe("sr-only");
    expect($("#progress-text").textContent).toBe("Pergunta 1 de 12");
    expect(parseFloat($("#progress-fill").style.width)).toBeCloseTo(100 / 12);
    answer.full_name();
    submitStep();
    expect($("#progress-text").textContent).toBe("Pergunta 2 de 12");
  });

  it("foco vai para a pergunta de cada tela; as opções aparecem com letra", () => {
    setup(saved());
    answer.full_name();
    submitStep();
    expect(document.activeElement).toBe($("#q1-title"));
    const labels = [...document.querySelectorAll("#employees label")].map((l) => l.textContent);
    expect(labels[0]).toBe("ASomente eu");
    expect($("#employees").getAttribute("aria-labelledby")).toBe("q1-title");
  });

  it("clicar numa opção avança sozinho; pelo teclado só marca", async () => {
    setup(saved());
    answer.full_name();
    submitStep();
    choose("#employees-4_8");
    await new Promise((r) => setTimeout(r, 300));
    expect(visibleStep()).toBe(at("employees"));
    $("#employees-9_15").closest(".radio")!.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    choose("#employees-9_15");
    await new Promise((r) => setTimeout(r, 300));
    expect(visibleStep()).toBe(at("niche"));
  });

  it("voltar não apaga respostas; máscara no WhatsApp", () => {
    setup(saved());
    for (const f of ["full_name", "employees", "niche", "email", "instagram", "whatsapp"]) {
      answer[f]();
      submitStep();
    }
    for (let i = 0; i < 3; i++) back();
    expect(visibleStep()).toBe(at("email"));
    expect($<HTMLInputElement>("#email").value).toBe("maria@empresa.com.br");
    back();
    back();
    expect($<HTMLSelectElement>("#niche").value).toBe("saude");
    back();
    expect($<HTMLInputElement>("#employees-2_3").checked).toBe(true);
    expect($<HTMLInputElement>("#whatsapp").value).toBe("(62) 99876-5432");
  });

  it("reload mantém tela, respostas e o mesmo submission_id", () => {
    setup(saved());
    answer.full_name();
    submitStep();
    answer.employees();
    submitStep();
    const id = JSON.parse(sessionStorage.getItem(DRAFT_KEY)!).submissionId;
    setup(saved());
    expect(visibleStep()).toBe(at("niche"));
    expect($<HTMLInputElement>("#employees-2_3").checked).toBe(true);
    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY)!).submissionId).toBe(id);
  });
});

describe("P02 — validação na tela", () => {
  it("erro perto do campo, aria-invalid e foco no campo", () => {
    setup(saved());
    submitStep();
    expect(visibleStep()).toBe(0);
    expect($("#full_name-error").hidden).toBe(false);
    expect($("#full_name").getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe($("#full_name"));
    expect($("#full_name").getAttribute("aria-describedby")).toContain("full_name-error");
    type("#full_name", "Maria");
    expect($("#full_name-error").hidden).toBe(true);
  });

  it("múltipla escolha sem resposta não avança e foca a primeira opção", () => {
    setup(saved());
    answer.full_name();
    submitStep();
    submitStep();
    expect(visibleStep()).toBe(at("employees"));
    expect($("#employees-error").textContent).toBe("Escolha uma opção.");
    expect(document.activeElement).toBe($("#employees-somente_eu"));
  });

  it("e-mail e @ inválidos são barrados", () => {
    setup(saved());
    for (const f of ["full_name", "employees", "niche"]) {
      answer[f]();
      submitStep();
    }
    type("#email", "maria@empresa");
    submitStep();
    expect($("#email-error").hidden).toBe(false);
    answer.email();
    submitStep();
    type("#instagram", "@minha empresa");
    submitStep();
    expect(visibleStep()).toBe(at("instagram"));
    expect($("#instagram-error").hidden).toBe(false);
  });

  it("confirmação (última tela): número diferente não envia; trocar o número apaga a confirmação", async () => {
    const send = saved();
    setup(send);
    fillToEnd();
    type("#whatsapp_repeat", "(62) 99876-5433");
    submitStep();
    await flush();
    expect(send).not.toHaveBeenCalled();
    expect(visibleStep()).toBe(LAST);
    expect($("#whatsapp_repeat-error").textContent).toContain("não são iguais");
    for (let i = LAST; i > at("whatsapp"); i--) back();
    type("#whatsapp", "62998765431");
    expect($<HTMLInputElement>("#whatsapp_repeat").value).toBe("");
    for (let i = at("whatsapp"); i < LAST; i++) submitStep();
    expect(visibleStep()).toBe(LAST);
    submitStep();
    expect($("#whatsapp_repeat-error").textContent).toContain("de novo");
    type("#whatsapp_repeat", "62998765431");
    submitStep();
    await flush();
    expect(send.mock.calls[0][0].whatsapp).toBe("5562998765431");
  });

  it("sócio é opcional; segmento Outro abre texto obrigatório", () => {
    setup(saved());
    answer.full_name();
    submitStep();
    answer.employees();
    submitStep();
    select("outro");
    expect($("#niche_other-field").hidden).toBe(false);
    submitStep();
    expect($("#niche_other-error").hidden).toBe(false);
    type("#niche_other", "Pet shop");
    submitStep();
    for (const f of ["email", "instagram", "whatsapp"]) {
      answer[f]();
      submitStep();
    }
    submitStep(); // sócio em branco
    expect(visibleStep()).toBe(at("sales_challenge"));
  });

  it("modalidade configurada: grava 'confirmado_visualmente'; código não existe ainda", () => {
    expect(confirmationStatusFor("visual")).toBe("confirmado_visualmente");
    expect(() => confirmationStatusFor("codigo")).toThrow();
  });
});

describe("P02 — envio", () => {
  it("loading, sem envio duplicado por clique duplo, sucesso só após salvar", async () => {
    let resolveSend!: (r: SendResult) => void;
    const send: Sender = vi.fn(() => new Promise<SendResult>((r) => (resolveSend = r)));
    const ctl = setup(send);
    fillToEnd();
    submitStep();
    submitStep();
    $<HTMLButtonElement>("#submit-button").click();
    expect(send).toHaveBeenCalledTimes(1);
    expect(ctl.status).toBe("submitting");
    expect($<HTMLButtonElement>("#submit-button").disabled).toBe(true);
    expect($<HTMLButtonElement>("[data-screen]:not([hidden]) [data-back]").disabled).toBe(true);
    expect(named("generate_lead")).toHaveLength(0); // clique não é lead

    resolveSend({ kind: "saved", leadId: "L1", duplicate: false });
    await flush();
    expect(ctl.status).toBe("success");
    expect($("#success").hidden).toBe(false);
    expect($("#lead-form").hidden).toBe(true);
    expect(document.activeElement).toBe($("#success-title"));
    expect(named("generate_lead")).toHaveLength(1);
    expect(named("generate_lead")[0]).toMatchObject({
      event: "generate_lead",
      lp_origem: "form",
      page_id: "P02",
      page_type: "performance_form",
      form_name: "performance",
    });
    // event_id = submission_id (deduplicação com a Conversions API); nicho/faturamento só como código de categoria.
    expect(named("generate_lead")[0].event_id).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/));
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("payload: respostas normalizadas, submission_id, origem completa e nada arbitrário", async () => {
    const send = saved();
    setup(send);
    fillToEnd();
    submitStep();
    await flush();
    const p = send.mock.calls[0][0];
    expect(p).toMatchObject({
      full_name: "Maria da Silva",
      whatsapp: "5562998765432",
      whatsapp_confirmation_status: "confirmado_visualmente",
      email: "maria@empresa.com.br",
      instagram: "@empresa",
      employees: "2_3",
      niche: "saude",
      niche_other: null,
      partner: "João (sócio)",
      sales_challenge: "nao_converte",
      urgency: "imediato",
      ads_experience: "nunca",
      revenue_range: "10k_30k",
      landing_page_version: "p02-formulario-v2",
      utm_source: "instagram",
      gclid: "G1",
      fbclid: "ABC",
      source_page: "https://bio.rcohub.com/",
      conversion_page: "https://lp.rcohub.com/formulario/",
      website: "",
    });
    expect(p).not.toHaveProperty("whatsapp_repeat");
    expect(p.submission_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(p)).not.toContain("foo");
  });

  it("sócio em branco vai como null", async () => {
    const send = saved();
    setup(send);
    answer.partner = () => type("#partner", "   ");
    fillToEnd();
    answer.partner = () => type("#partner", " João  (sócio) ");
    submitStep();
    await flush();
    expect(send.mock.calls[0][0].partner).toBeNull();
  });

  it("erro: mensagem, respostas preservadas, retry com o MESMO submission_id, sem falso sucesso", async () => {
    const send: Sender = vi
      .fn<(p: LeadPayload) => Promise<SendResult>>()
      .mockResolvedValueOnce({ kind: "failed", reason: "timeout" })
      .mockResolvedValueOnce({ kind: "saved", leadId: "L1", duplicate: true });
    const ctl = setup(send);
    fillToEnd();
    submitStep();
    await flush();
    expect(ctl.status).toBe("error");
    expect($("#submit-error").hidden).toBe(false);
    expect($("#submit-error").getAttribute("role")).toBe("alert");
    expect($("#submit-button").textContent).toBe("Tentar novamente");
    expect(named("generate_lead")).toHaveLength(0);
    expect(named("form_error").at(-1)).toMatchObject({ error_type: "network", error_detail: "submit_timeout" });
    expect(visibleStep()).toBe(LAST);
    expect($<HTMLInputElement>("#full_name").value).toBe("  Maria   da Silva ");

    submitStep();
    await flush();
    expect(send.mock.calls[1][0].submission_id).toBe(send.mock.calls[0][0].submission_id);
    expect(ctl.status).toBe("success");
    expect(named("generate_lead")).toHaveLength(1);
  });

  it("corrigir uma resposta depois de falha vira nova tentativa (ID novo); a correção não se perde", async () => {
    const send: Sender = vi
      .fn<(p: LeadPayload) => Promise<SendResult>>()
      .mockResolvedValueOnce({ kind: "failed", reason: "http" })
      .mockResolvedValueOnce({ kind: "saved", leadId: "L2", duplicate: false });
    const ctl = setup(send);
    fillToEnd();
    submitStep();
    await flush();
    for (let i = LAST; i > at("email"); i--) back();
    type("#email", "maria@outra.com.br");
    for (let i = at("email"); i <= LAST; i++) submitStep();
    await flush();
    const [first, second] = send.mock.calls.map((c) => c[0]);
    expect(second.email).toBe("maria@outra.com.br");
    expect(second.submission_id).not.toBe(first.submission_id);
    expect(ctl.status).toBe("success");
    expect(named("generate_lead")).toHaveLength(1);
  });

  it("reload depois de falha: retry com as mesmas respostas mantém o submission_id", async () => {
    const send: Sender = vi
      .fn<(p: LeadPayload) => Promise<SendResult>>()
      .mockResolvedValueOnce({ kind: "failed", reason: "timeout" })
      .mockResolvedValueOnce({ kind: "saved", leadId: "L1", duplicate: true });
    setup(send);
    fillToEnd();
    submitStep();
    await flush();
    setup(send);
    expect(visibleStep()).toBe(LAST);
    submitStep();
    await flush();
    expect(send.mock.calls[1][0].submission_id).toBe(send.mock.calls[0][0].submission_id);
  });

  it("rejeição do servidor volta à pergunta certa; corrigida, Continuar leva direto ao fim", async () => {
    const send: Sender = vi
      .fn<(p: LeadPayload) => Promise<SendResult>>()
      .mockResolvedValueOnce({ kind: "rejected", error: "invalid_instagram", field: "instagram" })
      .mockResolvedValueOnce({ kind: "saved", leadId: "L1", duplicate: false });
    setup(send);
    fillToEnd();
    submitStep();
    await flush();
    expect(visibleStep()).toBe(at("instagram"));
    expect($("#instagram-error").hidden).toBe(false);
    expect(named("generate_lead")).toHaveLength(0);
    type("#instagram", "@empresa.oficial");
    submitStep();
    expect(visibleStep()).toBe(LAST);
    submitStep();
    await flush();
    expect(send.mock.calls[1][0].instagram).toBe("@empresa.oficial");
  });

  it("rate limit mostra mensagem própria e permite tentar depois", async () => {
    setup(vi.fn(async () => ({ kind: "rejected", error: "rate_limited" }) as SendResult));
    fillToEnd();
    submitStep();
    await flush();
    expect($("#submit-error").textContent).toContain("Aguarde alguns minutos");
    expect($<HTMLButtonElement>("#submit-button").disabled).toBe(false);
  });

  it("rascunho adulterado não passa da revisão sem revalidar", async () => {
    const send = saved();
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ submissionId: crypto.randomUUID(), step: LAST, data: { full_name: "Maria", whatsapp: "x" } }));
    setup(send);
    submitStep();
    await flush();
    expect(send).not.toHaveBeenCalled();
    expect(visibleStep()).toBe(at("employees"));
  });

  it("sem JS, Enter não navega nem põe dados na URL; WhatsApp colado com +55 cabe no campo", () => {
    setup(saved());
    const form = $<HTMLFormElement>("#lead-form");
    expect(form.getAttribute("action")).toBe("javascript:void(0)");
    expect(form.method).toBe("post");
    for (const f of ["#whatsapp", "#whatsapp_repeat"]) {
      expect("+55 (62) 99876-5432".length).toBeLessThanOrEqual($<HTMLInputElement>(f).maxLength);
    }
  });
});

describe("P02 — tracking", () => {
  it("sequência completa sem duplicidade e sem nenhuma resposta no dataLayer", async () => {
    setup(saved());
    answer.full_name();
    submitStep();
    back();
    submitStep(); // passa de novo pela primeira tela
    for (const s of SCREENS.slice(1)) {
      answer[s.field]();
      submitStep();
    }
    await flush();
    const steps = named("form_step");
    expect(steps.map((e) => e.step_name)).toEqual(SCREENS.map((s) => s.id));
    expect(steps.map((e) => e.step)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(events().map((e) => e.event).filter((e) => e !== "form_step")).toEqual(["page_view", "form_start", "form_submit", "generate_lead"]);
    const dump = JSON.stringify(events());
    for (const pii of PII) expect(dump, pii).not.toContain(pii);
    // Só as CATEGORIAS (nicho/faturamento) podem sair, e só no generate_lead (catálogo único das LPs).
    expect(named("generate_lead")[0]).toMatchObject({ nicho: "saude", faturamento: "10k_30k" });
    for (const e of events().filter((e) => e.event !== "generate_lead")) {
      expect(JSON.stringify(e)).not.toMatch(/saude|10k_30k/);
    }
  });

  it("tentar avançar vazio também é interação: form_start vem antes do form_error", () => {
    setup(saved());
    submitStep();
    expect(events().map((e) => e.event)).toEqual(["page_view", "form_start", "form_error"]);
    expect(named("form_error")[0]).toMatchObject({ error_type: "validation", error_detail: "missing_name" });
  });

  it("form_start só com interação real (não no carregamento)", () => {
    setup(saved());
    expect(named("form_start")).toHaveLength(0);
    type("#full_name", "M");
    type("#full_name", "Ma");
    expect(named("form_start")).toHaveLength(1);
  });
});

describe("P02 — nome de curioso", () => {
  it.each(["Teste", "Fulano de Tal", "aaaaa", "asdf"])("'%s' vai para a página do curioso e nada é salvo", (nome) => {
    const send = saved();
    setup(send);
    type("#full_name", nome);
    submitStep();
    expect(redirected).toEqual(["./curioso/"]);
    expect(visibleStep()).toBe(0);
    expect(send).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(named("form_error").at(-1)).toMatchObject({ error_type: "validation", error_detail: "suspect_name" });
    expect(JSON.stringify(events())).not.toContain(nome);
    expect(named("form_step")).toHaveLength(0);
  });

  it("nome real segue normal", () => {
    setup(saved());
    type("#full_name", "Celeste Souza");
    submitStep();
    expect(redirected).toEqual([]);
    expect(visibleStep()).toBe(1);
  });

  it("nome trocado para curioso depois (rascunho editado) é barrado no envio final", async () => {
    const send = saved();
    setup(send);
    fillToEnd();
    const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY)!);
    d.data.full_name = "Fulano";
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    setup(send);
    submitStep();
    await flush();
    expect(redirected).toEqual(["./curioso/"]);
    expect(send).not.toHaveBeenCalled();
  });
});

describe("P02 — contato parcial (quem para no meio)", () => {
  const upTo = (field: string) => {
    for (const sc of SCREENS.slice(0, at(field) + 1)) {
      answer[sc.field]();
      submitStep();
    }
  };

  it("antes do WhatsApp nada é salvo", () => {
    setup(saved());
    upTo("instagram");
    expect(partials).toHaveLength(0);
  });

  it("ao passar do WhatsApp salva o que já foi respondido, normalizado", () => {
    setup(saved());
    upTo("whatsapp");
    expect(partials).toHaveLength(1);
    expect(partials[0]).toMatchObject({
      whatsapp: "5562998765432",
      full_name: "Maria da Silva",
      email: "maria@empresa.com.br",
      instagram: "@empresa",
      employees: "2_3",
      niche: "saude",
      sales_challenge: null,
      revenue_range: null,
      last_step: "whatsapp",
      utm_source: "instagram",
      website: "",
    });
    expect(partials[0].submission_id).toBe(JSON.parse(sessionStorage.getItem(DRAFT_KEY)!).submissionId);
    expect(partials[0]).not.toHaveProperty("whatsapp_repeat");
  });

  it("atualiza a cada tela; voltar e avançar sem mudar nada não repete", () => {
    setup(saved());
    upTo("sales_challenge");
    expect(partials.map((p) => p.last_step)).toEqual(["whatsapp", "partner", "sales_challenge"]);
    expect(partials.at(-1)!.sales_challenge).toBe("nao_converte");
    back();
    submitStep();
    expect(partials).toHaveLength(3);
  });

  it("fechar a página no meio salva também o que foi digitado na tela atual", () => {
    setup(saved());
    upTo("whatsapp");
    type("#partner", "João");
    window.dispatchEvent(new Event("pagehide"));
    expect(partials.at(-1)).toMatchObject({ partner: "João", last_step: "partner" });
  });

  it("depois do envio final não salva parcial; e nada disso entra no tracking", async () => {
    setup(saved());
    fillToEnd();
    const before = events().length;
    const count = partials.length;
    submitStep();
    await flush();
    window.dispatchEvent(new Event("pagehide"));
    expect(partials).toHaveLength(count);
    expect(events().slice(before).map((e) => e.event)).toEqual(["form_submit", "form_step", "generate_lead"]);
  });
});
