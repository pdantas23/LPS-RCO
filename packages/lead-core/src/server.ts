// Tudo o que só roda no servidor (usa fs / rede). Não importar no browser.
export * from "./respondi";
export * from "./rate-limit";
export * from "./outbox/types";
export * from "./outbox/file-outbox";
export * from "./outbox/deliver";
export * from "./outbox/worker";
export { normalizeBrPhone, phoneTail } from "./phone";
export { sanitizeTracking, cleanText, TRACKING_KEYS } from "./tracking";
export type { Tracking, TrackingKey } from "./tracking";
export { createLeadSchema, createLeadFormSchema, createEcomLeadSchema, createEcomFormSchema, fieldErrors } from "./schema";
export type { LeadInput, LeadSchemaConfig, EcomSchemaConfig, EcomLeadInput } from "./schema";
