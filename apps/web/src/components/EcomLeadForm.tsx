"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { formatBrPhoneInput } from "@rco/lead-core/phone";
import { ECOM_ANCHORS, ECOM_FORM, FATURAMENTOS_ECOM, INVESTIMENTOS_ECOM, PRIVACY_URL } from "@/content/ecom";
import { ecomFormSchema } from "@/lib/lead-schema";
import { submitLead, type EcomLeadValues } from "@/lib/lead-submit";
import { newId, track } from "@/lib/tracking/events";
import { readTracking } from "@/lib/tracking/utms";
import { Select } from "@/components/ui/select";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { FIELD, Field } from "./LeadForm";

type FormValues = z.input<typeof ecomFormSchema>;
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; message: string };

const PAGE = "ECOM" as const;
const F = ECOM_FORM;

/**
 * Formulário único da /lp-ecom (fica no hero; todos os CTAs rolam até #formulario). 5 perguntas, um campo de
 * WhatsApp, sem tela de revisão. Mesmo /api/lead e mesma fila das outras LPs. O Perfil (Dentro/Fora) é calculado
 * no servidor e nunca aparece aqui: a tela de sucesso é a mesma para todos.
 */
export function EcomLeadForm() {
  const [respondentId] = useState(() => newId());
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [started, setStarted] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(ecomFormSchema),
    defaultValues: { name: "", whatsapp: "", email: "", website: "" },
  });

  const onValid = async (values: FormValues) => {
    setInvalid(false);
    setStatus({ kind: "sending" });
    const outcome = await submitLead({
      values: values as EcomLeadValues,
      respondentId,
      page: PAGE,
      tracking: readTracking(),
      messages: { rate_limit: F.errors.rateLimit, server: F.errors.network, network: F.errors.network },
    });
    if (outcome.kind === "done") {
      setStatus({ kind: "done" });
    } else if (outcome.kind === "field_errors") {
      for (const [field, message] of Object.entries(outcome.errors)) {
        if (field in values) setError(field as keyof FormValues, { message });
      }
      setInvalid(true);
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", message: outcome.message });
    }
  };

  const onInvalid = (fieldErrors: Record<string, unknown>) => {
    setInvalid(true);
    track("form_error", { page_id: PAGE, error_type: "validation", fields: Object.keys(fieldErrors).join(",") });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    track("form_submit", { page_id: PAGE });
    return handleSubmit(onValid, onInvalid)(e);
  };

  const shell = "rounded-2xl border border-line bg-surface p-6 sm:p-8";

  if (status.kind === "done") {
    return (
      <div id={ECOM_ANCHORS.form} role="status" className={`${shell} scroll-mt-6 text-center`}>
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-ok/15 text-ok">
          <svg viewBox="0 0 24 24" className="size-7 fill-none stroke-current" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-xl font-bold">{F.successTitle}</h3>
        <p className="mt-2 text-mute">{F.successText}</p>
      </div>
    );
  }

  const sending = status.kind === "sending";
  const err = (name: keyof FormValues) => errors[name]?.message as string | undefined;
  const describe = (name: keyof FormValues, extra?: string) => [err(name) ? `${name}-error` : null, extra].filter(Boolean).join(" ") || undefined;

  return (
    <form
      id={ECOM_ANCHORS.form}
      onSubmit={onSubmit}
      noValidate
      onFocusCapture={() => {
        if (!started) {
          setStarted(true);
          track("form_start", { page_id: PAGE });
        }
      }}
      className={`${shell} scroll-mt-6`}
      aria-labelledby="ecom-form-title"
      aria-describedby="ecom-form-help"
    >
      <h2 id="ecom-form-title" className="text-xl font-bold">
        {F.title}
      </h2>
      <p id="ecom-form-help" className="mt-1 mb-6 text-sm text-mute">
        {F.support}
      </p>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Site
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Field id="name" label={F.name.label} error={err("name")}>
          <input id="name" type="text" autoComplete="name" placeholder={F.name.placeholder} aria-invalid={Boolean(err("name"))} aria-describedby={describe("name")} className={FIELD} {...register("name")} />
        </Field>

        <Field id="whatsapp" label={F.whatsapp.label} error={err("whatsapp")}>
          <input
            id="whatsapp"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={F.whatsapp.placeholder}
            aria-invalid={Boolean(err("whatsapp"))}
            aria-describedby={describe("whatsapp")}
            className={FIELD}
            {...register("whatsapp", {
              onChange: (e) => setValue("whatsapp", formatBrPhoneInput(e.target.value), { shouldValidate: isSubmitted }),
            })}
          />
        </Field>

        <Field id="email" label={F.email.label} error={err("email")}>
          <input id="email" type="email" inputMode="email" autoComplete="email" placeholder={F.email.placeholder} aria-invalid={Boolean(err("email"))} aria-describedby={describe("email")} className={FIELD} {...register("email")} />
        </Field>

        <Field id="faturamento" label={F.faturamento.label} error={err("faturamento")}>
          <Controller
            name="faturamento"
            control={control}
            render={({ field }) => (
              <Select id="faturamento" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} options={FATURAMENTOS_ECOM} placeholder={F.faturamento.placeholder} invalid={Boolean(err("faturamento"))} />
            )}
          />
        </Field>

        <Field id="investimento" label={F.investimento.label} error={err("investimento")}>
          <p id="investimento-help" className="mb-2 -mt-1 text-sm text-mute">
            {F.investimento.help}
          </p>
          <Controller
            name="investimento"
            control={control}
            render={({ field }) => (
              <Select id="investimento" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} options={INVESTIMENTOS_ECOM} placeholder={F.investimento.placeholder} invalid={Boolean(err("investimento"))} />
            )}
          />
        </Field>
      </div>

      {invalid && status.kind !== "error" ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {F.errors.validation}
        </p>
      ) : null}
      {status.kind === "error" ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {status.message}
        </p>
      ) : null}

      <div className="mt-6 flex justify-center">
        <ShimmerButton type="submit" disabled={sending} className="w-full sm:w-[300px]" height={52}>
          {sending ? F.sending : F.submit}
        </ShimmerButton>
      </div>
      <p className="mt-4 text-center text-xs text-mute">
        {F.consent}
        {PRIVACY_URL ? (
          <>
            {" "}
            <a href={PRIVACY_URL} className="underline underline-offset-2">
              {F.privacyLink}
            </a>
          </>
        ) : null}
      </p>
    </form>
  );
}
