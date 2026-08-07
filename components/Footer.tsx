import Link from "next/link";
import { getSettings } from "@/lib/settings";
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

export default function Footer() {
  const settings = getSettings();
  const socials = [
    { url: settings.socials.facebook, label: "Facebook", Icon: FacebookIcon },
    { url: settings.socials.instagram, label: "Instagram", Icon: InstagramIcon },
    { url: settings.socials.tiktok, label: "TikTok", Icon: TikTokIcon },
    { url: settings.socials.x, label: "X", Icon: XIcon },
    { url: settings.socials.youtube, label: "YouTube", Icon: YouTubeIcon },
  ].filter((s) => s.url);

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1380px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div>
          <p className="font-display text-2xl text-accent">AUSSIE VAPE HOUSE</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Australia&apos;s home of vapes — disposables, e-liquids, kits and
            more. Same-day dispatch, discreet packaging, genuine stock.
          </p>
          <a
            href="mailto:info@aussievapehouse.com"
            className="mt-4 inline-flex items-center gap-2 text-sm text-foreground transition hover:text-accent"
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
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SHOP_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-muted transition hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">Help</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {HELP_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-muted transition hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
            We accept
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PAYMENT_ICONS.map(({ name, Icon }) => (
              <span key={name} title={name} className="opacity-90 transition hover:opacity-100">
                <Icon />
              </span>
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted">
            18+ only. Nicotine is an addictive chemical. By entering this site
            you confirm you are of legal age in your state or territory.
          </p>
        </div>
      </div>

      <div className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Aussie Vape House · aussievapehouse.com ·
        All prices in AUD
      </div>
    </footer>
  );
}
