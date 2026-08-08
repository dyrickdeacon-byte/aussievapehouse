import { requireAdmin } from "@/lib/admin";
import { getSettings, PAYMENT_METHOD_LABELS, type PaymentMethodKey } from "@/lib/settings";
import { saveSettingsAction } from "@/app/admin/actions";

const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent";

const METHOD_HINTS: Record<PaymentMethodKey, string> = {
  bank: "e.g. Name: Aussie Vape House\nBSB: 000-000\nAccount: 12345678",
  payid: "e.g. PayID: pay@aussievapehouse.com",
  paypal: "e.g. paypal.me/aussievapehouse or PayPal email",
  applepay: "e.g. Apple Pay to 0400 000 000",
  googlepay: "e.g. Google Pay to 0400 000 000",
  card: "e.g. payment link for card payments",
  other: "e.g. USDT (TRC20): TXabc… — or gift cards, cash on pickup, etc.",
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { saved } = await searchParams;
  const s = getSettings();

  return (
    <div>
      <h1 className="font-display text-3xl">Settings</h1>
      {saved && (
        <p className="mt-3 inline-block rounded-lg border border-eucalypt/40 bg-eucalypt/10 px-4 py-2 text-sm font-semibold text-eucalypt">
          Saved — live on the store now.
        </p>
      )}

      <form action={saveSettingsAction} className="mt-6 space-y-6">
        {/* Checkout mode */}
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Checkout mode
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line-2 p-4 has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input
                type="radio"
                name="paymentMode"
                value="manual"
                defaultChecked={s.payments.mode === "manual"}
                className="mt-1 accent-[#b4451c]"
              />
              <span className="text-sm">
                <b>Manual</b>
                <br />
                <span className="text-muted">
                  Customer picks a preferred method and places the order — you
                  email them the payment details to proceed.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line-2 p-4 has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input
                type="radio"
                name="paymentMode"
                value="direct"
                defaultChecked={s.payments.mode === "direct"}
                className="mt-1 accent-[#b4451c]"
              />
              <span className="text-sm">
                <b>Direct</b>
                <br />
                <span className="text-muted">
                  Your payment details below show at checkout so customers can
                  pay immediately. Only filled-in methods appear.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethodKey[]).map((key) => (
              <label key={key} className="text-sm">
                <span className="font-semibold">
                  {key === "other" ? "Other (custom method)" : PAYMENT_METHOD_LABELS[key]}
                </span>
                <textarea
                  name={`method_${key}`}
                  defaultValue={s.payments.methods[key]}
                  placeholder={METHOD_HINTS[key]}
                  rows={3}
                  className={`${input} mt-1.5 font-mono text-[12.5px]`}
                />
              </label>
            ))}
            <label className="text-sm">
              <span className="font-semibold">&ldquo;Other&rdquo; method name</span>{" "}
              <span className="text-muted">(shown as the button at checkout)</span>
              <input
                name="otherLabel"
                defaultValue={s.payments.otherLabel}
                placeholder="e.g. Crypto (USDT)"
                className={`${input} mt-1.5`}
              />
            </label>
          </div>
        </section>

        {/* Contact widgets */}
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            WhatsApp &amp; livechat
          </h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm">
              <span className="font-semibold">WhatsApp number</span>{" "}
              <span className="text-muted">(with country code, no +; empty = button hidden)</span>
              <input name="whatsapp" defaultValue={s.whatsapp} placeholder="61400000000" className={`${input} mt-1.5`} />
            </label>
            <label className="text-sm">
              <span className="font-semibold">Livechat embed code</span>{" "}
              <span className="text-muted">(paste the Tawk.to snippet; empty = no chat)</span>
              <textarea
                name="livechatEmbed"
                defaultValue={s.livechatEmbed}
                rows={4}
                placeholder="<script>…tawk.to…</script>"
                className={`${input} mt-1.5 font-mono text-[12px]`}
              />
            </label>
          </div>
        </section>

        {/* Socials */}
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Social links{" "}
            <span className="normal-case text-muted">(empty = icon hidden in footer)</span>
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["facebook", "instagram", "tiktok", "x", "youtube"] as const).map((k) => (
              <label key={k} className="text-sm">
                <span className="font-semibold capitalize">{k}</span>
                <input name={k} defaultValue={s.socials[k]} placeholder={`https://${k}.com/…`} className={`${input} mt-1.5`} />
              </label>
            ))}
          </div>
        </section>

        <button className="glow-accent rounded-lg bg-accent px-8 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-accent-2">
          Save settings
        </button>
      </form>
    </div>
  );
}
