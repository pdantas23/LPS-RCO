import { createEcomFormSchema, createEcomLeadSchema, createLeadFormSchema, createLeadSchema } from "@rco/lead-core/schema";
import { FATURAMENTOS, FATURAMENTOS_ECOM, INVESTIMENTOS_ECOM, NICHOS } from "@/content/options";
import { FORM_PAGE_IDS } from "@/content/pages";

// Um único ponto define o que é válido; browser e servidor importam daqui.
const config = { pages: FORM_PAGE_IDS, nichos: NICHOS, faturamentos: FATURAMENTOS } as const;

export const leadSchema = createLeadSchema(config);
export const leadFormSchema = createLeadFormSchema(config);

const ecomConfig = { page: "ECOM", faturamentos: FATURAMENTOS_ECOM, investimentos: INVESTIMENTOS_ECOM } as const;

/** /lp-ecom: servidor (sem confirmação de WhatsApp) e navegador (com). */
export const ecomLeadSchema = createEcomLeadSchema(ecomConfig);
export const ecomFormSchema = createEcomFormSchema(ecomConfig);
