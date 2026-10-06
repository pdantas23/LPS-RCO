import { beforeEach, describe, expect, it } from "vitest";
import { createTracker } from "./tracking";

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
      { event: "page_view", page_type: "performance_form" },
      { event: "form_start", page_type: "performance_form", form_name: "performance" },
    ]);
  });

  it("form_step uma vez por etapa, mesmo voltando e avançando", () => {
    const t = createTracker(w, sessionStorage);
    t.formStep(1, "name", "s1");
    t.formStep(2, "employees", "s1");
    t.formStep(1, "name", "s1");
    expect(w.dataLayer).toEqual([
      { event: "form_step", page_type: "performance_form", form_name: "performance", step: 1, step_name: "name" },
      {
        event: "form_step",
        page_type: "performance_form",
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
      { event: "form_error", page_type: "performance_form", form_name: "performance", error_type: "invalid_whatsapp" },
    ]);
  });
});
