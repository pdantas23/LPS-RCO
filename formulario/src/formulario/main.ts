import "./style.css";
import { savePartial, sendLead } from "../lib/api";
import { captureAttribution } from "../lib/attribution";
import { loadDraft } from "../lib/draft";
import { createTracker } from "../lib/tracking";
import { api } from "./config";
import { mountForm } from "./form";

function sessionStore(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null; // navegador bloqueou o storage: o formulário segue, só sem rascunho
  }
}

const storage = sessionStore();

const tracker = createTracker(window, storage);
const attribution = captureAttribution(window.location.href, document.referrer, storage);
tracker.pageView(attribution, window.location.pathname);

mountForm({
  doc: document,
  storage,
  tracker,
  attribution,
  draft: loadDraft(storage),
  send: (payload) => sendLead(payload, api),
  savePartial: (payload) => savePartial(payload, api),
});
