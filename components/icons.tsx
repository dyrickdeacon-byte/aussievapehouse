// Inline brand icons: colored socials + payment method chips.
// Simplified marks drawn by hand so no external assets are needed.

export function FacebookIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.4 21v-6.8h2.3l.35-2.65H13.4V9.85c0-.77.21-1.29 1.32-1.29h1.41V6.19c-.24-.03-1.08-.1-2.06-.1-2.04 0-3.43 1.24-3.43 3.53v1.93H8.35v2.65h2.29V21z"
      />
    </svg>
  );
}

export function InstagramIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <radialGradient id="ig-g" cx="0.3" cy="1.1" r="1.3">
          <stop offset="0" stopColor="#FDF497" />
          <stop offset="0.25" stopColor="#FD5949" />
          <stop offset="0.6" stopColor="#D6249F" />
          <stop offset="1" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6.5" fill="url(#ig-g)" />
      <rect
        x="5.2" y="5.2" width="13.6" height="13.6" rx="4"
        fill="none" stroke="#fff" strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.4" cy="7.6" r="1.15" fill="#fff" />
    </svg>
  );
}

export function TikTokIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6.5" fill="#010101" />
      <path
        fill="#25F4EE"
        d="M13.2 4.6c.4 2 1.9 3.5 4.1 3.7v2.5c-1.5 0-2.9-.5-4.1-1.3v5.1a5.1 5.1 0 1 1-5.1-5.1c.3 0 .7 0 1 .1v2.7a2.4 2.4 0 1 0 1.8 2.3V4.6z"
        transform="translate(-.6 .4)"
      />
      <path
        fill="#FE2C55"
        d="M13.2 4.6c.4 2 1.9 3.5 4.1 3.7v2.5c-1.5 0-2.9-.5-4.1-1.3v5.1a5.1 5.1 0 1 1-5.1-5.1c.3 0 .7 0 1 .1v2.7a2.4 2.4 0 1 0 1.8 2.3V4.6z"
        transform="translate(.6 -.2)"
      />
      <path
        fill="#fff"
        d="M13.2 4.6c.4 2 1.9 3.5 4.1 3.7v2.5c-1.5 0-2.9-.5-4.1-1.3v5.1a5.1 5.1 0 1 1-5.1-5.1c.3 0 .7 0 1 .1v2.7a2.4 2.4 0 1 0 1.8 2.3V4.6z"
      />
    </svg>
  );
}

export function XIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6.5" fill="#000" />
      <path
        fill="#fff"
        d="M5.5 5h4.1l3 4.3L16.4 5h2.3l-5 5.9 5.5 8.1h-4.1l-3.3-4.8-4.1 4.8H5.4l5.6-6.5z"
      />
    </svg>
  );
}

export function YouTubeIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="1" y="4.5" width="22" height="15" rx="4" fill="#FF0000" />
      <path fill="#fff" d="M10 9.2v5.6l5-2.8z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#fff"
        d="M12 3.8a8.2 8.2 0 0 0-7 12.4L3.8 20l3.9-1.1A8.2 8.2 0 1 0 12 3.8zm4.1 11.5c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4-.1.6.4l.8 2c.1.2.1.4 0 .6l-.3.5-.4.5c-.1.1-.3.3-.1.6.1.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l1-1.1c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.5.3.1.2.1.7-.1 1.3z"
      />
    </svg>
  );
}

/* ── Payment chips (46×30, light chip on dark footer) ── */

function Chip({ children, bg = "#fff" }: { children: React.ReactNode; bg?: string }) {
  return (
    <svg width="46" height="30" viewBox="0 0 46 30" aria-hidden>
      <rect width="46" height="30" rx="5" fill={bg} />
      {children}
    </svg>
  );
}

export function VisaIcon() {
  return (
    <Chip>
      <text
        x="23" y="20" textAnchor="middle"
        fontFamily="Arial, sans-serif" fontSize="12" fontWeight="800"
        fontStyle="italic" fill="#1A1F71" letterSpacing="0.5"
      >
        VISA
      </text>
    </Chip>
  );
}

export function MastercardIcon() {
  return (
    <Chip bg="#252525">
      <circle cx="19" cy="15" r="8.5" fill="#EB001B" />
      <circle cx="27" cy="15" r="8.5" fill="#F79E1B" fillOpacity="0.92" />
      <path d="M23 8.6a8.5 8.5 0 0 1 0 12.8 8.5 8.5 0 0 1 0-12.8z" fill="#FF5F00" />
    </Chip>
  );
}

export function AmexIcon() {
  return (
    <Chip bg="#2E77BC">
      <text
        x="23" y="19" textAnchor="middle"
        fontFamily="Arial, sans-serif" fontSize="9.5" fontWeight="800" fill="#fff"
      >
        AMEX
      </text>
    </Chip>
  );
}

export function PayPalIcon() {
  return (
    <Chip>
      <text
        x="10" y="19" fontFamily="Arial, sans-serif" fontSize="10"
        fontWeight="800" fontStyle="italic" fill="#003087"
      >
        Pay
      </text>
      <text
        x="27" y="19" fontFamily="Arial, sans-serif" fontSize="10"
        fontWeight="800" fontStyle="italic" fill="#009CDE"
      >
        Pal
      </text>
    </Chip>
  );
}

export function ApplePayIcon() {
  return (
    <Chip bg="#000">
      <path
        fill="#fff"
        transform="translate(9.5 7.5) scale(0.62)"
        d="M12.1 4.9c.6-.8 1.1-1.9.9-3-1 .1-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1 0 2.2-.6 2.9-1.4zm.9 1.6c-1.6-.1-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-3.9 2.4-1.7 2.9-.5 7.2 1.2 9.5.8 1.2 1.8 2.4 3 2.4 1.2-.1 1.7-.8 3.1-.8s1.9.8 3.2.7c1.3 0 2.2-1.2 3-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.6-3.8 0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9z"
      />
      <text
        x="27" y="19.5" fontFamily="Arial, sans-serif" fontSize="10.5"
        fontWeight="600" fill="#fff"
      >
        Pay
      </text>
    </Chip>
  );
}

export function GooglePayIcon() {
  return (
    <Chip>
      <g transform="translate(8 7) scale(0.67)">
        <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5z" />
        <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 24z" />
        <path fill="#FBBC04" d="M5.6 14.7a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4z" />
        <path fill="#EA4335" d="M12 4.6c1.7 0 3.2.6 4.4 1.7L19.7 3A11.5 11.5 0 0 0 1.8 7.3l3.8 3C6.5 6.6 9 4.6 12 4.6z" />
      </g>
      <text
        x="27" y="19.5" fontFamily="Arial, sans-serif" fontSize="10.5"
        fontWeight="600" fill="#5F6368"
      >
        Pay
      </text>
    </Chip>
  );
}

export function PayIDIcon() {
  return (
    <Chip>
      <text
        x="8" y="19.5" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800" fill="#0d1c3d"
      >
        Pay
      </text>
      <text
        x="28" y="19.5" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800" fill="#25b34b"
      >
        iD
      </text>
    </Chip>
  );
}

export function AfterpayIcon() {
  return (
    <Chip bg="#B2FCE4">
      <text
        x="23" y="19" textAnchor="middle"
        fontFamily="Arial, sans-serif" fontSize="8.5" fontWeight="700" fill="#000"
      >
        afterpay
      </text>
    </Chip>
  );
}

export function BankTransferIcon() {
  return (
    <Chip bg="#1c3f5e">
      <g fill="#fff" transform="translate(7 6)">
        <path d="M6 0 0 3.4h12z" />
        <rect x="0.6" y="4.4" width="1.8" height="6" />
        <rect x="5.1" y="4.4" width="1.8" height="6" />
        <rect x="9.6" y="4.4" width="1.8" height="6" />
        <rect x="0" y="11.2" width="12" height="1.9" />
      </g>
      <text
        x="24" y="19.5" fontFamily="Arial, sans-serif" fontSize="10.5"
        fontWeight="800" fill="#fff"
      >
        EFT
      </text>
    </Chip>
  );
}

export const PAYMENT_ICONS = [
  { name: "Visa", Icon: VisaIcon },
  { name: "Mastercard", Icon: MastercardIcon },
  { name: "American Express", Icon: AmexIcon },
  { name: "PayPal", Icon: PayPalIcon },
  { name: "Apple Pay", Icon: ApplePayIcon },
  { name: "Google Pay", Icon: GooglePayIcon },
  { name: "PayID", Icon: PayIDIcon },
  { name: "Afterpay", Icon: AfterpayIcon },
  { name: "Bank Transfer", Icon: BankTransferIcon },
];
