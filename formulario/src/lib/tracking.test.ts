import { beforeEach, describe, expect, it } from "vitest";
import { createTracker, errorTypeOf } from "./tracking";

const ORIGEM = { lp_origem: "form", page_id: "P02", page_type: "performance_form" };

let w: Window;
beforeEach(() => {
  sessionStorage.clear();
  w = {} as Window;
});

describe("tracker", () => {
  it("page_view e form_start disparam uma vez só", () => {
    const t = createTracker(w, sessionStorage);
    t.pageView();
    t.pageView();
    t.formStart();
    t.formStart();
    expect(w.dataLayer).toEqual([
      { event: "page_view", lp_origem: "form", page_id: "P02", page_type: "performance_form", page_path: "/" },
      { event: "form_start", lp_origem: "form", page_id: "P02", page_type: "performance_form", form_name: "performance" },
    ]);
  });

  it("form_step uma vez por etapa, mesmo voltando e avançando", () => {
    const t = createTracker(w, sessionStorage);
    t.formStep(1, "name", "s1");
    t.formStep(2, "employees", "s1");
    t.formStep(1, "name", "s1");
    expect(w.dataLayer).toEqual([
      { event: "form_step", ...ORIGEM, form_name: "performance", step: 1, step_name: "name" },
      {
        event: "form_step",
        ...ORIGEM,
        form_name: "performance",
        step: 2,
        step_name: "employees",
      },
    ]);
  });

  it("form_step não repete após reload (novo tracker); jornada nova conta de novo", () => {
    createTracker(w, sessionStorage).formStep(1, "name", "s1");
    createTracker(w, sessionStorage).formStep(1, "name", "s1");
    createTracker(w, sessionStorage).formStep(1, "name", "s2");
    expect((w.dataLayer as { event: string }[]).filter((e) => e.event === "form_step")).toHaveLength(2);
  });

  it("generate_lead uma vez por submission_id, inclusive após reload (novo tracker)", () => {
    createTracker(w, sessionStorage).generateLead("s1");
    createTracker(w, sessionStorage).generateLead("s1");
    createTracker(w, sessionStorage).generateLead("s2");
    expect((w.dataLayer as { event: string }[]).filter((e) => e.event === "generate_lead")).toHaveLength(2);
  });

  it("form_error leva só o código técnico", () => {
    createTracker(w, sessionStorage).formError("invalid_whatsapp");
    expect(w.dataLayer).toEqual([
      {
        event: "form_error",
        ...ORIGEM,
        form_name: "performance",
        error_type: "validation",
        error_detail: "invalid_whatsapp",
      },
    ]);
  });

  it("error_type segue o catálogo e o código original fica em error_detail", () => {
    expect(errorTypeOf("required")).toBe("validation");
    expect(errorTypeOf("suspect_name")).toBe("validation");
    expect(errorTypeOf("server_invalid_whatsapp")).toBe("server");
    expect(errorTypeOf("server_rate_limited")).toBe("rate_limit");
    expect(errorTypeOf("submit_timeout")).toBe("network");
    expect(errorTypeOf("submit_network")).toBe("network");
    expect(errorTypeOf("submit_http")).toBe("server");
  });

  it("page_view leva só a campanha presente; form_submit e generate_lead seguem o catálogo", () => {
    const t = createTracker(w, sessionStorage);
    t.pageView({ utm_source: "meta", utm_medium: null, gclid: "abc" }, "/");
    t.formSubmit();
    t.generateLead("s1", { niche: "saude", revenue: "10k_30k" });
    expect(w.dataLayer).toEqual([
      { event: "page_view", ...ORIGEM, page_path: "/", utm_source: "meta", gclid: "abc" },
      { event: "form_submit", ...ORIGEM, form_name: "performance" },
      {
        event: "generate_lead",
        ...ORIGEM,
        form_name: "performance",
        nicho: "saude",
        faturamento: "10k_30k",
        event_id: "s1",
      },
    ]);
  });
});
