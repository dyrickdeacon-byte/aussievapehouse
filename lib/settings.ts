import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

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

const FILE = () => path.join(process.cwd(), "data", "site-settings.json");

// Read fresh on every call — the admin panel writes this file and the
// change should show up without a server restart.
export function getSettings(): SiteSettings {
  try {
    const raw = JSON.parse(readFileSync(FILE(), "utf8"));
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
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function saveSettings(settings: SiteSettings): void {
  mkdirSync(path.dirname(FILE()), { recursive: true });
  writeFileSync(
    FILE(),
    JSON.stringify(
      {
        _note:
          "Managed by the /admin dashboard. Empty string = feature hidden.",
        ...settings,
      },
      null,
      1
    )
  );
}
