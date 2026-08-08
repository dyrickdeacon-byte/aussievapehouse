import { fsRead, kvGet, kvSet } from "@/lib/storage";

export type PaymentMethodKey =
  | "bank"
  | "payid"
  | "paypal"
  | "applepay"
  | "googlepay"
  | "card"
  | "other";

export type SiteSettings = {
  whatsapp: string;
  livechatEmbed: string;
  socials: {
    facebook: string;
    instagram: string;
    tiktok: string;
    x: string;
    youtube: string;
  };
  payments: {
    /**
     * manual — customer picks a preferred method, places the order, and
     *   the owner follows up with payment details.
     * direct — the owner's saved method details show at checkout so the
     *   customer can pay immediately.
     */
    mode: "manual" | "direct";
    /** Owner-entered payment details per method; empty = hidden in direct mode */
    methods: Record<PaymentMethodKey, string>;
    /** Display name for the owner's custom "other" method (e.g. "Crypto — USDT") */
    otherLabel: string;
  };
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodKey, string> = {
  bank: "Bank Transfer",
  payid: "PayID",
  paypal: "PayPal",
  applepay: "Apple Pay",
  googlepay: "Google Pay",
  card: "Card",
  other: "Other",
};

const DEFAULTS: SiteSettings = {
  whatsapp: "",
  livechatEmbed: "",
  socials: { facebook: "", instagram: "", tiktok: "", x: "", youtube: "" },
  payments: {
    mode: "manual",
    methods: {
      bank: "",
      payid: "",
      paypal: "",
      applepay: "",
      googlepay: "",
      card: "",
      other: "",
    },
    otherLabel: "",
  },
};

// Stored under the "site-settings" key (data/site-settings.json locally,
// Upstash Redis on Vercel). Read fresh on every call so admin saves apply
// without a restart.
export async function getSettings(): Promise<SiteSettings> {
  let raw: Partial<SiteSettings> | null = null;
  // Reads must never take the site down (or fail the build): a broken
  // key / missing table falls back to the committed defaults file.
  // Writes (saveSettings, orders) still fail loudly.
  try {
    raw = await kvGet<Partial<SiteSettings>>("site-settings");
  } catch (e) {
    console.error("[settings] storage read failed, using fallback:", e);
  }
  // First run on a fresh database: fall back to the committed defaults
  // file (ships in the repo) so livechat/socials/WhatsApp survive the
  // initial deploy; the first admin save then persists to the database.
  if (!raw) raw = fsRead<Partial<SiteSettings>>("site-settings");
  if (!raw) return structuredClone(DEFAULTS);
  return {
    whatsapp: raw.whatsapp ?? "",
    livechatEmbed: raw.livechatEmbed ?? "",
    socials: { ...DEFAULTS.socials, ...raw.socials },
    payments: {
      mode: raw.payments?.mode === "direct" ? "direct" : "manual",
      methods: { ...DEFAULTS.payments.methods, ...raw.payments?.methods },
      otherLabel: raw.payments?.otherLabel ?? "",
    },
  };
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await kvSet("site-settings", settings);
}
