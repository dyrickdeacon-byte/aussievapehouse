import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import AgeGate from "@/components/AgeGate";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import LiveChat from "@/components/LiveChat";

// Self-hosted (app/fonts) — the dev machine's node fetch can't reliably
// reach fonts.gstatic.com, and self-hosting is better for prod anyway.
const inter = localFont({
  src: "./fonts/inter-var-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
});

const bebas = localFont({
  src: "./fonts/bebas-neue-latin.woff2",
  variable: "--font-bebas",
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Aussie Vape House — Vapes, E-Liquids & Accessories",
    template: "%s | Aussie Vape House",
  },
  description:
    "Australia's home of vapes. 2,500+ products — disposables, e-liquids, kits, pods and accessories. Same-day dispatch, discreet packaging, genuine stock.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const settings = getSettings();
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bebas.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <AgeGate />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFloat number={settings.whatsapp} />
          <LiveChat embed={settings.livechatEmbed} />
        </CartProvider>
      </body>
    </html>
  );
}
