import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Analytics, GtmNoScript } from "@/components/tracking/Analytics";
import { UtmCapture } from "@/components/tracking/UtmCapture";
import { ALLOW_INDEXING } from "@/content/site";
import { SITE_URL } from "@/lib/share";

// Poppins como fonte padrão das duas páginas (P04 e P05): next/font baixa e
// hospeda o arquivo no próprio build (sem request pro Google em runtime) e
// expõe como variável CSS, usada em `--font-sans` (globals.css) com a mesma
// pilha de fallback de antes.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "RCO Hub",
  robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101d41",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body>
        <GtmNoScript />
        <Analytics />
        <UtmCapture />
        {children}
      </body>
    </html>
  );
}
