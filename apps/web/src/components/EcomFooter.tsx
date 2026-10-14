import { CONTACT_URL, ECOM_FOOTER, PRIVACY_URL } from "@/content/ecom";
import { InstagramLink } from "./InstagramLink";

/** Rodapé da /lp-ecom. Política de Privacidade e Contato comercial só aparecem quando houver URL real (content/ecom.ts). */
export function EcomFooter() {
  const links: { label: string; href: string }[] = [];
  if (PRIVACY_URL) links.push({ label: ECOM_FOOTER.privacy, href: PRIVACY_URL });
  if (CONTACT_URL) links.push({ label: ECOM_FOOTER.contact, href: CONTACT_URL });
  return (
    <footer data-rv-group className="border-t border-line/60">
      <div data-rv-item className="mx-auto max-w-6xl px-5 py-8 text-center text-sm text-mute">
        <InstagramLink />
        <p>{ECOM_FOOTER.tagline}</p>
        {links.length ? (
          <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {links.map((l, i) => (
              <span key={l.href} className="flex gap-4">
                {i > 0 ? <span aria-hidden="true">|</span> : null}
                <a href={l.href} className="underline underline-offset-2 hover:text-ink">
                  {l.label}
                </a>
              </span>
            ))}
          </p>
        ) : null}
        <p className="mt-3">{ECOM_FOOTER.copyright}</p>
      </div>
    </footer>
  );
}
