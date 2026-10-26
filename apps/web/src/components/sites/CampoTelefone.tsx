"use client";

import { forwardRef } from "react";
import { formatBrPhoneInput } from "@rco/lead-core/phone";

/** Bandeira do Brasil em SVG (emoji de bandeira não aparece no Windows). */
function Bandeira() {
  return (
    <svg viewBox="0 0 28 20" aria-hidden="true" className="h-4 w-[1.4rem] shrink-0 rounded-[3px]">
      <rect width="28" height="20" fill="#009c3b" />
      <path d="M14 2.2 25.6 10 14 17.8 2.4 10z" fill="#ffdf00" />
      <circle cx="14" cy="10" r="4.6" fill="#002776" />
      <path d="M9.6 9.1c2.9-.6 6.2-.1 8.8 1.4" stroke="#fff" strokeWidth="0.9" fill="none" />
    </svg>
  );
}

/**
 * WhatsApp com máscara "(11) 99999-9999" e o prefixo +55 com a bandeira do Brasil (fixo: o número vai ao
 * COMERCIAL só com dígitos e DDI 55, normalizado no servidor).
 */
export const CampoTelefone = forwardRef<
  HTMLInputElement,
  {
    id: string;
    value: string;
    onChange: (v: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    invalid?: boolean;
    describedBy?: string;
    className?: string;
    autoFocus?: boolean;
    onEnter?: () => void;
  }
>(function CampoTelefone({ id, value, onChange, onBlur, placeholder, invalid, describedBy, className = "", autoFocus, onEnter }, ref) {
  return (
    <div
      className={`flex h-14 w-full items-center rounded-xl border bg-[#070d22] text-base text-ink focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-[#2878F6] ${invalid ? "border-danger" : "border-white/15"} ${className}`}
    >
      <span className="flex h-full items-center gap-2 border-r border-white/15 px-3 text-sm font-medium text-mute">
        <Bandeira />
        +55
      </span>
      <input
        ref={ref}
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(e) => onChange(formatBrPhoneInput(e.target.value))}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-ink placeholder:text-mute/60 focus:outline-none"
      />
    </div>
  );
});
