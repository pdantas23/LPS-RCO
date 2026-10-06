import "./style.css";

// Só a visita, com tipo próprio para não somar com o formulário. O motivo (suspect_name) já foi
// registrado no formulário como form_error, sem o nome digitado.
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "page_view",
  lp_origem: "form",
  page_id: "P02",
  page_type: "performance_form_curious",
  page_path: window.location.pathname,
});
