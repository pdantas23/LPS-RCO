"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { formatBrPhoneInput } from "@rco/lead-core/phone";
import { FATURAMENTOS, NICHOS } from "@/content/options";
import type { FormPageId, PageConfig } from "@/content/pages";
import { leadFormSchema } from "@/lib/lead-schema";
import { submitLead, type LeadValues } from "@/lib/lead-submit";
import { newId, track } from "@/lib/tracking/events";
import { readTracking } from "@/lib/tracking/utms";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Select } from "@/components/ui/select";

type FormValues = z.input<typeof leadFormSchema>;
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; message: string };

// Mesma altura e largura pros 4 campos (2 inputs + 2 selects): a única
// diferença entre eles é o conteúdo, nunca o tamanho da caixa.
export const FIELD =
  "h-14 w-full rounded-xl border border-line bg-bg px-4 text-base text-ink placeholder:text-mute/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand aria-[invalid=true]:border-danger";

export function LeadForm({ page, copy }: { page: FormPageId; copy: PageConfig["form"] }) {
  // Um id por "tentativa de envio": reenviar (duplo clique, erro de rede) usa o
  // MESMO id, e o servidor não duplica. É também o event_id do rastreamento.
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
    resolver: zodResolver(leadFormSchema),
    defaultValues: { name: "", whatsapp: "", email: "", website: "" },
  });

  const onValid = async (values: FormValues) => {
    setStatus({ kind: "sending" });
    const outcome = await submitLead({
      values: values as LeadValues,
      respondentId,
      page,
      tracking: readTracking(),
    });
    if (outcome.kind === "done") {
      setStatus({ kind: "done" });
    } else if (outcome.kind === "field_errors") {
      for (const [field, message] of Object.entries(outcome.errors)) {
        if (field in values) setError(field as keyof FormValues, { message });
      }
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", message: outcome.message });
    }
  };

  // Só os NOMES dos campos com erro vão ao dataLayer, nunca o que foi digitado.
  const onInvalid = (fieldErrors: Record<string, unknown>) =>
    track("form_error", { page_id: page, error_type: "validation", fields: Object.keys(fieldErrors).join(",") });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    track("form_submit", { page_id: page });
    return handleSubmit(onValid, onInvalid)(e);
  };

  if (status.kind === "done") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface p-8 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-ok/15 text-ok">
          <svg viewBox="0 0 24 24" className="size-7 fill-none stroke-current" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-xl font-bold">Recebemos seus dados!</h3>
        <p className="mt-2 text-mute">
          Texto de exemplo: nosso time comercial vai chamar você no WhatsApp em breve.
        </p>
      </div>
    );
  }

  const sending = status.kind === "sending";
  const err = (name: keyof FormValues) => errors[name]?.message as string | undefined;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      onFocusCapture={() => {
        if (!started) {
          setStarted(true);
          track("form_start", { page_id: page });
        }
      }}
      className="rounded-2xl border border-line bg-surface p-6 sm:p-8"
      aria-describedby="form-help"
    >
      <h3 className="text-xl font-bold">{copy.heading}</h3>
      <p id="form-help" className="mt-1 mb-6 text-sm text-mute">
        {copy.text}
      </p>

      {/* Honeypot: fora da tela e do teclado. Humano nunca vê nem preenche. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Site
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      {/* Uma coluna só: cada campo em sua própria linha, todos com a mesma
          altura E a mesma largura entre si (a largura do formulário). */}
      <div className="grid grid-cols-1 gap-4">
        <Field id="name" label="Nome" error={err("name")}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            aria-invalid={Boolean(err("name"))}
            className={FIELD}
            {...register("name")}
          />
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
            {...register("whatsapp", {
              onChange: (e) =>
                setValue("whatsapp", formatBrPhoneInput(e.target.value), { shouldValidate: isSubmitted }),
            })}
          />
        </Field>

        <Field id="email" label="Email" error={err("email")}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            aria-invalid={Boolean(err("email"))}
            className={FIELD}
            {...register("email")}
          />
        </Field>

        <Field id="nicho" label="Nicho" error={err("nicho")}>
          <Controller
            name="nicho"
            control={control}
            render={({ field }) => (
              <Select
                id="nicho"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={NICHOS}
                invalid={Boolean(err("nicho"))}
              />
            )}
          />
        </Field>

        <Field id="faturamento" label="Faturamento mensal" error={err("faturamento")}>
          <Controller
            name="faturamento"
            control={control}
            render={({ field }) => (
              <Select
                id="faturamento"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={FATURAMENTOS}
                invalid={Boolean(err("faturamento"))}
              />
            )}
          />
        </Field>
      </div>

      {status.kind === "error" ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {status.message}
        </p>
      ) : null}

      {/* Cápsula de tamanho fixo (brilho na borda, ver o componente): não
          estica pra `w-full` como o botão antigo, por isso centralizada
          aqui em vez de ocupar a largura inteira do formulário. */}
      <div className="mt-6 flex justify-center">
        <ShimmerButton type="submit" disabled={sending} width={260} height={52}>
          {sending ? "Enviando…" : copy.submit}
        </ShimmerButton>
      </div>
    </form>
  );
}

export function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
