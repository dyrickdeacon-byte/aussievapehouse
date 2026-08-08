"use client";

import { useEffect } from "react";

// Loads the Tawk.to widget from whatever snippet the owner pasted in the
// admin panel — we extract the embed URL rather than injecting raw HTML.
export default function LiveChat({ embed }: { embed: string }) {
  useEffect(() => {
    if (!embed) return;
    const m = embed.match(/https:\/\/embed\.tawk\.to\/[\w/]+/);
    if (!m) return;
    if (document.querySelector(`script[src^="https://embed.tawk.to/"]`)) return;
    const w = window as typeof window & { Tawk_API?: object; Tawk_LoadStart?: Date };
    w.Tawk_API = w.Tawk_API || {};
    w.Tawk_LoadStart = new Date();
    const s = document.createElement("script");
    s.async = true;
    s.src = m[0];
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    document.head.appendChild(s);
  }, [embed]);

  return null;
}
