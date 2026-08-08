import { WhatsAppIcon } from "@/components/icons";

// Floating WhatsApp button — bottom-LEFT, sitting at the same height as the
// Tawk livechat bubble on the right so the two balance across the screen.
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
      className="wa-float fixed bottom-5 left-5 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] transition hover:scale-105"
    >
      <WhatsAppIcon size={30} />
    </a>
  );
}
