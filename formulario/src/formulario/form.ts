/**
 * Controlador do formulário da P02: uma pergunta por tela (SCREENS em config.ts).
 * A última tela (confirmar o WhatsApp) é a que envia.
 * Estados do envio: idle → submitting → success | error (error volta a permitir envio).
 */
import type { Attribution } from "../lib/attribution";
import type { LeadPayload, PartialPayload, SendResult } from "../lib/api";
import { clearDraft, newSubmissionId, saveDraft, type Draft } from "../lib/draft";
import type { Tracker } from "../lib/tracking";
import {
  ERROR_MESSAGES,
  cleanEmail,
  cleanName,
  firstInvalidScreen,
  normalizeInstagram,
  validateScreen,
  type ErrorType,
  type Field,
  type FieldError,
} from "../lib/validation";
import { isSuspectName } from "../lib/suspect-name";
import { formatWhatsapp, normalizeWhatsapp } from "../lib/whatsapp";
import {
  CURIOUS_PAGE,
  LANDING_PAGE_VERSION,
  NICHES,
  NICHE_OTHER,
  SCREENS,
  SUSPECT_NAMES,
  WHATSAPP_CONFIRMATION_MODE,
  type Screen,
  type WhatsappConfirmationMode,
} from "./config";

/** Índice da última tela: a confirmação do WhatsApp, cujo botão envia. */
export const LAST = SCREENS.length - 1;

export type Status = "idle" | "submitting" | "success" | "error";

export interface FormDeps {
  doc: Document;
  storage: Storage | null;
  tracker: Tracker;
  attribution: Attribution;
  draft: Draft;
  send: (payload: LeadPayload) => Promise<SendResult>;
  /** Navegação para a página "Aqui não, curioso" (injetável para teste). */
  redirect?: (url: string) => void;
  /** Contato parcial (quem para no meio): salvo a partir da pergunta do WhatsApp. */
  savePartial?: (payload: PartialPayload) => void;
}

/** Status gravado com o lead para cada modalidade de confirmação. */
export function confirmationStatusFor(mode: WhatsappConfirmationMode): "confirmado_visualmente" {
  if (mode === "visual") return "confirmado_visualmente";
  throw new Error("Confirmação por código ainda não implementada (depende de decisão da RCO).");
}

/** Erro devolvido pelo servidor → campo da tela. */
const SERVER_FIELD: Record<string, { field: Field; type: ErrorType }> = {
  invalid_name: { field: "full_name", type: "invalid_name" },
  invalid_whatsapp: { field: "whatsapp", type: "invalid_whatsapp" },
  whatsapp_not_confirmed: { field: "whatsapp_repeat", type: "whatsapp_mismatch" },
  invalid_niche: { field: "niche", type: "missing_niche" },
  missing_niche_other: { field: "niche_other", type: "missing_niche_other" },
  invalid_revenue_range: { field: "revenue_range", type: "missing_revenue_range" },
  invalid_email: { field: "email", type: "invalid_email" },
  invalid_instagram: { field: "instagram", type: "invalid_instagram" },
  invalid_employees: { field: "employees", type: "missing_employees" },
  invalid_partner: { field: "partner", type: "invalid_partner" },
  invalid_sales_challenge: { field: "sales_challenge", type: "missing_sales_challenge" },
  invalid_urgency: { field: "urgency", type: "missing_urgency" },
  invalid_ads_experience: { field: "ads_experience", type: "missing_ads_experience" },
};

const SUBMIT_MESSAGES = {
  rate_limited: "Recebemos várias tentativas com este número em pouco tempo. Aguarde alguns minutos e tente novamente.",
  generic: "Não conseguimos enviar agora. Suas respostas continuam aqui — tente novamente.",
};

const MAX_LENGTH: Partial<Record<Field, number>> = { full_name: 120, partner: 200, email: 254, instagram: 80, niche_other: 80 };

/** A partir desta tela (inclusive) o contato parcial passa a ser salvo. */
const WHATSAPP_SCREEN = SCREENS.findIndex((s) => s.field === "whatsapp");

const screenOf = (field: Field) => SCREENS.findIndex((s) => s.field === (field === "niche_other" ? "niche" : field));

export function mountForm(deps: FormDeps) {
  const { doc, storage, tracker, attribution, send } = deps;
  const draft: Draft = deps.draft;
  let status: Status = "idle";
  /** O servidor recusou um campo: depois de corrigir, Continuar volta direto para a última tela. */
  let returnToEnd = false;

  const $ = <T extends Element>(sel: string) => doc.querySelector<T>(sel)!;
  const form = $<HTMLFormElement>("#lead-form");
  const honeypot = $<HTMLInputElement>("#website");

  renderScreens();
  const submitButton = $<HTMLButtonElement>("#submit-button");
  const submitError = $<HTMLElement>("#submit-error");
  const submitStatus = $<HTMLElement>("#submit-status");
  fillInputs();
  showStep(draft.step, false);

  // form_start: primeira interação real (digitar, escolher ou tentar avançar), uma única vez.
  form.addEventListener("input", () => tracker.formStart());
  form.addEventListener("change", () => tracker.formStart());

  form.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement;
    const field = t.name as Field;
    if (field === "whatsapp" || field === "whatsapp_repeat") {
      t.value = formatWhatsapp(t.value);
      // Número mudou → a confirmação digitada antes não vale mais.
      if (field === "whatsapp" && t.value !== draft.data.whatsapp) {
        update({ whatsapp: t.value, whatsapp_repeat: "" });
        input("whatsapp_repeat").value = "";
        return;
      }
    }
    if (field in draft.data && t.type !== "radio") update({ [field]: t.value });
  });

  // Escolha única: clicar/tocar já avança; pelo teclado as setas só escolhem e o Enter avança.
  let pointerChoice = false;
  form.addEventListener("pointerdown", (e) => {
    pointerChoice = !!(e.target as HTMLElement).closest(".radio");
  });
  form.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    const field = t.name as Field;
    if (!(field in draft.data)) return;
    update({ [field]: t.value });
    if (field === "niche") toggleNicheOther();
    if (t.type === "radio" && pointerChoice) {
      pointerChoice = false;
      const at = draft.step;
      setTimeout(() => {
        if (draft.step === at) next();
      }, 250);
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    tracker.formStart();
    if (draft.step < LAST) next();
    else void submit();
  });
  form.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-back]");
    if (b && !b.disabled) showStep(Math.max(0, draft.step - 1));
  });

  // Fechou ou trocou de aba no meio: salva o que já foi digitado na tela atual também.
  const flushPartial = () => {
    if (doc.visibilityState === "hidden" || !doc.visibilityState) savePartialNow(SCREENS[draft.step].id);
  };
  doc.defaultView?.addEventListener("pagehide", () => savePartialNow(SCREENS[draft.step].id));
  doc.addEventListener("visibilitychange", flushPartial);

  function input(field: Field) {
    return $<HTMLInputElement>(`[name="${field}"]`);
  }

  function update(patch: Partial<Draft["data"]>) {
    Object.assign(draft.data, patch);
    for (const key of Object.keys(patch) as Field[]) clearError(key);
    saveDraft(storage, draft);
  }

  function renderScreens() {
    const box = $<HTMLElement>("#screens");
    SCREENS.forEach((screen, i) => box.append(renderScreen(screen, i)));
  }

  function renderScreen(screen: Screen, i: number): HTMLElement {
    const el = (tag: string, props: Record<string, string> = {}, text?: string) => {
      const node = doc.createElement(tag);
      for (const [k, v] of Object.entries(props)) node.setAttribute(k, v);
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const titleId = `q${i}-title`;
    const descId = `q${i}-desc`;
    const section = el("section", { "data-screen": String(i), "aria-labelledby": titleId, hidden: "" });
    if (i === 0) section.append(el("p", { class: "step__eyebrow" }, "Olá! Vamos começar."));
    section.append(el("h2", { id: titleId, class: "step__title", tabindex: "-1" }, screen.title));
    if (screen.description) section.append(el("p", { id: descId, class: "step__desc" }, screen.description));
    const describedBy = [screen.description ? descId : "", `${screen.field}-error`].filter(Boolean).join(" ");
    const error = (field: Field) => el("p", { id: `${field}-error`, class: "field__error", hidden: "" });

    const field = el(screen.kind === "choice" ? "fieldset" : "div", { class: "field" });
    if (screen.kind === "choice") {
      field.setAttribute("aria-labelledby", titleId);
      field.setAttribute("aria-describedby", describedBy);
      field.id = screen.field;
      const radios = el("div", { class: "radios" });
      screen.options!.forEach((o, n) => {
        const id = `${screen.field}-${o.value}`;
        const wrap = el("div", { class: "radio" });
        wrap.append(
          el("input", { type: "radio", name: screen.field, id, value: o.value }),
          el("label", { for: id }),
        );
        const label = wrap.querySelector("label")!;
        label.append(el("span", { class: "radio__key", "aria-hidden": "true" }, String.fromCharCode(65 + n)), o.label);
        radios.append(wrap);
      });
      field.append(radios, error(screen.field));
    } else if (screen.kind === "niche") {
      const select = el("select", { id: "niche", name: "niche", "aria-labelledby": titleId, "aria-describedby": "niche-error" });
      select.append(el("option", { value: "" }, "Selecionar segmento"));
      for (const o of NICHES) select.append(el("option", { value: o.value }, o.label));
      field.append(select, error("niche"));
      const other = el("div", { class: "field", id: "niche_other-field", hidden: "" });
      other.append(
        el("label", { for: "niche_other" }, "Qual segmento?"),
        el("input", { id: "niche_other", name: "niche_other", type: "text", maxlength: "80", autocomplete: "off", "aria-describedby": "niche_other-error" }),
        error("niche_other"),
      );
      section.append(field, other);
      section.append(actions(i));
      return section;
    } else {
      const attrs: Record<string, string> = {
        id: screen.field,
        name: screen.field,
        "aria-labelledby": titleId,
        "aria-describedby": describedBy,
        placeholder: screen.placeholder ?? "",
      };
      if (!screen.optional) attrs.required = "";
      if (MAX_LENGTH[screen.field]) attrs.maxlength = String(MAX_LENGTH[screen.field]);
      if (screen.kind === "text") Object.assign(attrs, { type: "text", autocomplete: screen.field === "full_name" ? "name" : "off" });
      if (screen.field === "full_name") attrs.autocapitalize = "words";
      if (screen.kind === "email") Object.assign(attrs, { type: "email", inputmode: "email", autocomplete: "email", autocapitalize: "none", spellcheck: "false" });
      if (screen.kind === "instagram") Object.assign(attrs, { type: "text", autocomplete: "off", autocapitalize: "none", spellcheck: "false" });
      if (screen.kind === "whatsapp" || screen.kind === "whatsapp_confirm")
        Object.assign(attrs, { type: "tel", inputmode: "tel", maxlength: "25", autocomplete: screen.kind === "whatsapp" ? "tel-national" : "off" });
      field.append(el("input", attrs), error(screen.field));
    }
    section.append(field);
    if (i === LAST) {
      section.append(
        el("p", { id: "submit-error", class: "alert", role: "alert", hidden: "" }),
        el("p", { id: "submit-status", class: "status", role: "status" }),
      );
    }
    section.append(actions(i));
    return section;
  }

  function actions(i: number): HTMLElement {
    const box = doc.createElement("div");
    box.className = "actions";
    if (i > 0) {
      const back = doc.createElement("button");
      Object.assign(back, { type: "button", className: "btn btn--back", textContent: "Voltar" });
      back.setAttribute("data-back", "");
      box.append(back);
    }
    const go = doc.createElement("button");
    go.type = "submit";
    go.className = "btn btn--primary";
    if (i === LAST) {
      go.id = "submit-button";
      go.textContent = "Enviar";
      box.append(go);
      return box;
    }
    go.innerHTML =
      'Continuar<svg class="btn__icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    box.append(go);
    return box;
  }

  function fillInputs() {
    const d = draft.data;
    for (const [field, value] of Object.entries(d)) {
      for (const node of doc.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[name="${field}"]`)) {
        if (node instanceof HTMLInputElement && node.type === "radio") node.checked = node.value === value;
        else node.value = value;
      }
    }
    toggleNicheOther();
  }

  function toggleNicheOther() {
    $<HTMLElement>("#niche_other-field").hidden = draft.data.niche !== NICHE_OTHER;
  }

  function showStep(step: number, focus = true) {
    draft.step = step;
    if (step === LAST) returnToEnd = false;
    saveDraft(storage, draft);
    for (const s of doc.querySelectorAll<HTMLElement>("[data-screen]")) s.hidden = Number(s.dataset.screen) !== step;
    // Na tela só a barra; o texto fica para o leitor de tela.
    $<HTMLElement>("#progress-text").textContent = `Pergunta ${step + 1} de ${SCREENS.length}`;
    $<HTMLElement>("#progress-fill").style.width = `${((step + 1) / SCREENS.length) * 100}%`;
    if (focus) $<HTMLElement>(`#q${step}-title`).focus();
  }

  /** Nome de curioso (Teste, Fulano, aaaa…): nada é salvo, rascunho apagado, vai para a página própria. */
  function blockCurious(): boolean {
    if (!isSuspectName(draft.data.full_name, SUSPECT_NAMES)) return false;
    tracker.formError("suspect_name");
    clearDraft(storage);
    (deps.redirect ?? ((url: string) => window.location.assign(url)))(CURIOUS_PAGE);
    return true;
  }

  function next() {
    const errors = validateScreen(draft.step, draft.data);
    if (errors.length) return showErrors(errors);
    const screen = SCREENS[draft.step];
    if (screen.field === "full_name" && blockCurious()) return;
    tracker.formStep(draft.step + 1, screen.id, draft.submissionId);
    if (draft.step >= WHATSAPP_SCREEN) savePartialNow(screen.id);
    if (returnToEnd) {
      // Corrigiu o campo que o servidor recusou: volta ao fim, a não ser que falte algo antes.
      showStep(firstInvalidScreen(draft.data) ?? LAST);
    } else {
      showStep(draft.step + 1);
    }
  }

  /**
   * Contato parcial: só com WhatsApp válido e antes do envio final. Manda o que já foi
   * respondido (inválido vira null) e não repete o mesmo conteúdo.
   */
  let lastPartial = "";
  function savePartialNow(lastStep: string) {
    if (!deps.savePartial || status === "submitting" || status === "success") return;
    if (validateScreen(WHATSAPP_SCREEN, draft.data).length) return;
    const d = draft.data;
    const opt = (v: string) => v || null;
    const payload: PartialPayload = {
      ...attribution,
      submission_id: draft.submissionId,
      whatsapp: normalizeWhatsapp(d.whatsapp),
      full_name: cleanName(d.full_name) || null,
      email: cleanEmail(d.email) || null,
      instagram: normalizeInstagram(d.instagram) || null,
      employees: opt(d.employees),
      niche: opt(d.niche),
      niche_other: d.niche === NICHE_OTHER ? d.niche_other.trim() || null : null,
      partner: cleanName(d.partner) || null,
      sales_challenge: opt(d.sales_challenge),
      urgency: opt(d.urgency),
      ads_experience: opt(d.ads_experience),
      revenue_range: opt(d.revenue_range),
      last_step: lastStep,
      landing_page_version: LANDING_PAGE_VERSION,
      website: honeypot.value,
    };
    const fingerprint = JSON.stringify({ ...payload, last_step: "" });
    if (fingerprint === lastPartial) return;
    lastPartial = fingerprint;
    deps.savePartial(payload);
  }

  function showErrors(errors: FieldError[]) {
    for (const err of errors) {
      const box = $<HTMLElement>(`#${err.field}-error`);
      box.textContent = ERROR_MESSAGES[err.type];
      box.hidden = false;
      setInvalid(err.field, true);
      tracker.formError(err.type);
    }
    focusField(errors[0].field);
  }

  function focusField(field: Field) {
    const target = doc.querySelector<HTMLElement>(`[name="${field}"]:checked`) ?? doc.querySelector<HTMLElement>(`[name="${field}"]`);
    target?.focus();
  }

  function clearError(field: Field) {
    const box = doc.querySelector<HTMLElement>(`#${field}-error`);
    if (box) {
      box.hidden = true;
      box.textContent = "";
    }
    setInvalid(field, false);
  }

  function setInvalid(field: Field, invalid: boolean) {
    for (const el of doc.querySelectorAll<HTMLElement>(`[name="${field}"]`)) {
      if (invalid) el.setAttribute("aria-invalid", "true");
      else el.removeAttribute("aria-invalid");
    }
  }

  function setStatus(next: Status) {
    status = next;
    const busy = next === "submitting";
    submitButton.disabled = busy;
    submitButton.setAttribute("aria-busy", String(busy));
    submitButton.textContent = busy ? "Enviando…" : next === "error" ? "Tentar novamente" : "Enviar";
    submitStatus.textContent = busy ? "Enviando seus dados…" : "";
    for (const b of doc.querySelectorAll<HTMLButtonElement>(`[data-screen='${LAST}'] [data-back]`)) b.disabled = busy;
  }

  function showSubmitError(message: string) {
    submitError.textContent = message;
    submitError.hidden = false;
  }

  /**
   * Retry com as MESMAS respostas reusa o submission_id: se o servidor já gravou e só a
   * resposta se perdeu, ele devolve "duplicate" e nada se repete. Respostas diferentes
   * (a pessoa corrigiu algo depois de uma falha) são outra tentativa e ganham ID novo;
   * senão o servidor devolveria "duplicate" com os dados antigos e a correção se perderia.
   */
  function submissionIdFor(answers: object): string {
    const fingerprint = JSON.stringify(answers);
    if (draft.sentFingerprint !== undefined && draft.sentFingerprint !== fingerprint) {
      draft.submissionId = newSubmissionId();
    }
    draft.sentFingerprint = fingerprint;
    saveDraft(storage, draft);
    return draft.submissionId;
  }

  async function submit() {
    if (status === "submitting" || status === "success") return;

    // A revisão revalida tudo: rascunho antigo ou edição fora de ordem não passa.
    const invalid = firstInvalidScreen(draft.data);
    if (invalid !== null) {
      showStep(invalid);
      return showErrors(validateScreen(invalid, draft.data));
    }
    if (blockCurious()) return;

    tracker.formSubmit();
    tracker.formStep(LAST + 1, SCREENS[LAST].id, draft.submissionId);
    submitError.hidden = true;
    setStatus("submitting");

    const d = draft.data;
    const answers = {
      full_name: cleanName(d.full_name),
      whatsapp: normalizeWhatsapp(d.whatsapp),
      niche: d.niche,
      niche_other: d.niche === NICHE_OTHER ? d.niche_other.trim() : null,
      revenue_range: d.revenue_range,
      email: cleanEmail(d.email),
      instagram: normalizeInstagram(d.instagram),
      employees: d.employees,
      partner: cleanName(d.partner) || null,
      sales_challenge: d.sales_challenge,
      urgency: d.urgency,
      ads_experience: d.ads_experience,
    };
    const submissionId = submissionIdFor(answers);
    const result = await send({
      ...attribution,
      ...answers,
      submission_id: submissionId,
      whatsapp_confirmation_status: confirmationStatusFor(WHATSAPP_CONFIRMATION_MODE),
      landing_page_version: LANDING_PAGE_VERSION,
      website: honeypot.value,
    });

    if (result.kind === "saved") {
      // Único ponto do código que dispara generate_lead: servidor confirmou o salvamento.
      tracker.generateLead(submissionId, { niche: answers.niche, revenue: answers.revenue_range });
      clearDraft(storage);
      setStatus("success");
      form.hidden = true;
      $<HTMLElement>("#success").hidden = false;
      $<HTMLElement>("#success-title").focus();
      return;
    }

    setStatus("error");
    if (result.kind === "rejected") {
      tracker.formError(`server_${result.error}`);
      const mapped = SERVER_FIELD[result.error];
      if (mapped) {
        returnToEnd = true;
        showStep(screenOf(mapped.field));
        return showErrors([mapped]);
      }
      return showSubmitError(result.error === "rate_limited" ? SUBMIT_MESSAGES.rate_limited : SUBMIT_MESSAGES.generic);
    }
    tracker.formError(`submit_${result.reason}`);
    showSubmitError(SUBMIT_MESSAGES.generic);
  }

  return {
    get status() {
      return status;
    },
    get step() {
      return draft.step;
    },
  };
}
