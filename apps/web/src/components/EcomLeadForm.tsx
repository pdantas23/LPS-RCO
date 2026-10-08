"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { formatBrPhoneInput } from "@rco/lead-core/phone";
import { ECOM_FORM, ECOM_THANKS } from "@/content/ecom";
import { FATURAMENTOS_ECOM, INVESTIMENTOS_ECOM, perfilEcom, type PerfilEcom } from "@/content/options";
import { ecomFormSchema } from "@/lib/lead-schema";
import { submitLead, type EcomLeadValues } from "@/lib/lead-submit";
import { newId, track } from "@/lib/tracking/events";
import { readTracking } from "@/lib/tracking/utms";
import { Select } from "@/components/ui/select";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { FIELD, Field } from "./LeadForm";

type FormValues = z.input<typeof ecomFormSchema>;
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done"; perfil: PerfilEcom } | { kind: "error"; message: string };

const PAGE = "ECOM" as const;

/**
 * Formulário da /lp-ecom: 5 perguntas (nome, WhatsApp com confirmação, email, faturamento,
 * investimento em anúncio). Sem tela de revisão. Quem marca a primeira faixa de faturamento
 * ("Abaixo de R$ 30 mil") envia normalmente; só muda a tela de confirmação (e o Perfil, que o
 * servidor calcula e manda ao COMERCIAL). Mesmo /api/lead e mesma fila (outbox) das outras LPs.
 */
export function EcomLeadForm() {
  const [respondentId] = useState(() => newId());
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [started, setStarted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(ecomFormSchema),
    defaultValues: { name: "", whatsapp: "", whatsappConfirm: "", email: "", website: "" },
  });

  const onValid = async (values: FormValues) => {
    setStatus({ kind: "sending" });
    // A confirmação do WhatsApp só serve para conferir no navegador: não vai ao servidor.
    const { whatsappConfirm: _confirm, ...toSend } = values;
    void _confirm;
    const outcome = await submitLead({
      values: toSend as EcomLeadValues,
      respondentId,
      page: PAGE,
      tracking: readTracking(),
    });
    if (outcome.kind === "done") {
      setStatus({ kind: "done", perfil: perfilEcom(values.faturamento) });
    } else if (outcome.kind === "field_errors") {
      for (const [field, message] of Object.entries(outcome.errors)) {
        if (field in values) setError(field as keyof FormValues, { message });
      }
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", message: outcome.message });
    }
  };

  const onInvalid = (fieldErrors: Record<string, unknown>) =>
    track("form_error", { page_id: PAGE, error_type: "validation", fields: Object.keys(fieldErrors).join(",") });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    track("form_submit", { page_id: PAGE });
    return handleSubmit(onValid, onInvalid)(e);
  };

  if (status.kind === "done") {
    const thanks = ECOM_THANKS[status.perfil];
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface p-8 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-ok/15 text-ok">
          <svg viewBox="0 0 24 24" className="size-7 fill-none stroke-current" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-xl font-bold">{thanks.title}</h3>
        <p className="mt-2 text-mute">{thanks.text}</p>
      </div>
    );
  }

  const sending = status.kind === "sending";
  const err = (name: keyof FormValues) => errors[name]?.message as string | undefined;
  const phoneOnChange = (name: "whatsapp" | "whatsappConfirm") => ({
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue(name, formatBrPhoneInput(e.target.value), { shouldValidate: isSubmitted }),
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      onFocusCapture={() => {
        if (!started) {
          setStarted(true);
          track("form_start", { page_id: PAGE });
        }
      }}
      className="rounded-2xl border border-line bg-surface p-6 sm:p-8"
      aria-describedby="form-help"
    >
      <h3 className="text-xl font-bold">{ECOM_FORM.heading}</h3>
      <p id="form-help" className="mt-1 mb-6 text-sm text-mute">
        {ECOM_FORM.text}
      </p>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Site
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Field id="name" label="Nome" error={err("name")}>
          <input id="name" type="text" autoComplete="name" placeholder="Seu nome" aria-invalid={Boolean(err("name"))} className={FIELD} {...register("name")} />
        </Field>

        <Field id="whatsapp" label="WhatsApp" error={err("whatsapp")}>
          <input
            id="whatsapp"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="(11) 99999-8888"
            aria-invalid={Boolean(err("whatsapp"))}
            className={FIELD}
            {...register("whatsapp", phoneOnChange("whatsapp"))}
          />
        </Field>

        <Field id="whatsappConfirm" label="Confirme seu WhatsApp" error={err("whatsappConfirm")}>
          <input
            id="whatsappConfirm"
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Repita o número com DDD"
            aria-invalid={Boolean(err("whatsappConfirm"))}
            className={FIELD}
            {...register("whatsappConfirm", phoneOnChange("whatsappConfirm"))}
          />
        </Field>

        <Field id="email" label="Email" error={err("email")}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@sualoja.com.br"
            aria-invalid={Boolean(err("email"))}
            className={FIELD}
            {...register("email")}
          />
        </Field>

        <Field id="faturamento" label="Faturamento mensal da loja" error={err("faturamento")}>
          <Controller
            name="faturamento"
            control={control}
            render={({ field }) => (
              <Select id="faturamento" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} options={FATURAMENTOS_ECOM} invalid={Boolean(err("faturamento"))} />
            )}
          />
        </Field>

        <Field id="investimento" label="Quanto você consegue investir em anúncio por mês?" error={err("investimento")}>
          <Controller
            name="investimento"
            control={control}
            render={({ field }) => (
              <Select id="investimento" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} options={INVESTIMENTOS_ECOM} invalid={Boolean(err("investimento"))} />
            )}
          />
        </Field>
      </div>

      {status.kind === "error" ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {status.message}
        </p>
      ) : null}

      <div className="mt-6 flex justify-center">
        <ShimmerButton type="submit" disabled={sending} width={280} height={52}>
          {sending ? "Enviando…" : ECOM_FORM.submit}
        </ShimmerButton>
      </div>
    </form>
  );
}
