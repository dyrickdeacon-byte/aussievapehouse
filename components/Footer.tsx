import Link from "next/link";
import { getSettings } from "@/lib/settings";
import Medallion from "@/components/Medallion";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
  PAYMENT_ICONS,
} from "@/components/icons";

const SHOP_LINKS = [
  { href: "/shop", label: "All products" },
  { href: "/shop?group=disposables", label: "Disposable vapes" },
  { href: "/shop?group=e-liquids", label: "E-Liquids" },
  { href: "/shop?group=kits", label: "Vape kits & hardware" },
  { href: "/shop?group=pods", label: "Pods & coils" },
  { href: "/shop?group=accessories", label: "Accessories" },
];

const HELP_LINKS = [
  { href: "/shop", label: "Track my order" },
  { href: "/shop", label: "Shipping & delivery" },
  { href: "/shop", label: "Returns & refunds" },
  { href: "/cart", label: "Cart" },
];

// Deep-earth block — the dark anchor at the base of the light sandstone page
export default async function Footer() {
  const settings = await getSettings();
  const socials = [
    { url: settings.socials.facebook, label: "Facebook", Icon: FacebookIcon },
    { url: settings.socials.instagram, label: "Instagram", Icon: InstagramIcon },
    { url: settings.socials.tiktok, label: "TikTok", Icon: TikTokIcon },
    { url: settings.socials.x, label: "X", Icon: XIcon },
    { url: settings.socials.youtube, label: "YouTube", Icon: YouTubeIcon },
  ].filter((s) => s.url);

  return (
    <footer className="mt-20 bg-earth text-[#d8c9a8]">
      {/* Dot band transition into the footer — sand ground, multicolour dots */}
      <div
        className="h-[12px] w-full bg-background"
        style={{
          backgroundImage: [
            "radial-gradient(circle 3px at 11px 50%, #f4633a 2.8px, transparent 3px)",
            "radial-gradient(circle 3px at 33px 50%, #14b0a5 2.8px, transparent 3px)",
            "radial-gradient(circle 3px at 55px 50%, #f6b83d 2.8px, transparent 3px)",
            "radial-gradient(circle 3px at 77px 50%, #b4451c 2.8px, transparent 3px)",
          ].join(", "),
          backgroundSize: "88px 12px",
        }}
        aria-hidden
      />
      <div className="mx-auto grid max-w-[1380px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div>
          <p className="font-display text-2xl text-[#e9b44c]">AUSSIE VAPE HOUSE</p>
          <div className="mt-3 flex items-center gap-4" aria-hidden>
            <Medallion variant={1} size={34} onDark />
            <Medallion variant={5} size={34} onDark />
            <Medallion variant={2} size={34} onDark />
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#a4936f]">
            Australia&apos;s home of vapes — disposables, e-liquids, kits and
            more. Same-day dispatch, discreet packaging, genuine stock.
          </p>
          <a
            href="mailto:info@aussievapehouse.com"
            className="mt-4 inline-flex items-center gap-2 text-sm text-[#e5d7b5] transition hover:text-[#e9b44c]"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            info@aussievapehouse.com
          </a>
          {socials.length > 0 && (
            <div className="mt-5 flex items-center gap-3">
              {socials.map(({ url, label, Icon }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="transition hover:-translate-y-0.5"
                >
                  <Icon />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b7a58]">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SHOP_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-[#a4936f] transition hover:text-[#e9b44c]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b7a58]">Help</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {HELP_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-[#a4936f] transition hover:text-[#e9b44c]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b7a58]">
            We accept
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PAYMENT_ICONS.map(({ name, Icon }) => (
              <span key={name} title={name} className="opacity-90 transition hover:opacity-100">
                <Icon />
              </span>
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-[#8b7a58]">
            18+ only. Nicotine is an addictive chemical. By entering this site
            you confirm you are of legal age in your state or territory. All
            prices in AUD.
          </p>
        </div>
      </div>

      <div className="border-t border-[#3a2c19] px-4 py-4 text-center text-xs text-[#8b7a58]">
        © {new Date().getFullYear()} Aussie Vape House · aussievapehouse.com
      </div>
    </footer>
  );
}
