import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PAGES } from "@/content/pages";
import { OG_IMAGE_LP, SITE_URL, shareMetadata } from "./share";

const pub = path.resolve(__dirname, "../../public");

describe("prévia de compartilhamento", () => {
  const m = shareMetadata({ title: "T", description: "D", path: "/lp01", image: OG_IMAGE_LP });

  it("OG e Twitter completos, com imagem grande", () => {
    expect(m.openGraph).toMatchObject({ type: "website", locale: "pt_BR", siteName: "RCO Hub", url: "/lp01", title: "T", description: "D" });
    expect(m.openGraph?.images).toEqual([expect.objectContaining({ url: OG_IMAGE_LP, width: 1200, height: 630, type: "image/png" })]);
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("SITE_URL é absoluto (base da og:image)", () => {
    expect(SITE_URL).toBe("https://lp.rcohub.com.br");
  });

  it("imagens existem, são PNG 1200x630 e cabem em 300 KB", () => {
    for (const f of ["og/lp.png", "og/form.png"]) {
      const p = path.join(pub, f);
      expect(existsSync(p), f).toBe(true);
      expect(statSync(p).size, f).toBeLessThan(300 * 1024);
      const b = readFileSync(p);
      expect(b.readUInt32BE(16), f).toBe(1200);
      expect(b.readUInt32BE(20), f).toBe(630);
    }
  });

  it("não altera título/descrição das páginas", () => {
    expect(PAGES.P05.title).toBeTruthy();
  });
});
