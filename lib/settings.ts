import { readFileSync } from "node:fs";
import path from "node:path";

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
};

const DEFAULTS: SiteSettings = {
  whatsapp: "",
  livechatEmbed: "",
  socials: { facebook: "", instagram: "", tiktok: "", x: "", youtube: "" },
};

// Read fresh on every call — the admin panel writes this file and the
// change should show up without a server restart.
export function getSettings(): SiteSettings {
  try {
    const file = path.join(process.cwd(), "data", "site-settings.json");
    const raw = JSON.parse(readFileSync(file, "utf8"));
    return {
      whatsapp: raw.whatsapp ?? "",
      livechatEmbed: raw.livechatEmbed ?? "",
      socials: { ...DEFAULTS.socials, ...raw.socials },
    };
  } catch {
    return DEFAULTS;
  }
}
