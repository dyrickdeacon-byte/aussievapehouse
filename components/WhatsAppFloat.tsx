import { WhatsAppIcon } from "@/components/icons";

// Floating WhatsApp button, bottom-right, riding ~200px up so the Tawk
// livechat bubble owns the corner below it with clear separation.
// Rendered only when the admin has set a WhatsApp number.
export default function WhatsAppFloat({ number }: { number: string }) {
  if (!number) return null;
  const clean = number.replace(/[^\d]/g, "");
  return (
    <a
      href={`https://wa.me/${clean}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="wa-float fixed bottom-[200px] right-5 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] transition hover:scale-105"
    >
      <WhatsAppIcon size={30} />
    </a>
  );
}
