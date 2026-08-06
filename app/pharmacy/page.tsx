export const metadata = { title: "Pharmacy & Consultation Finder" };

const STEPS = [
  {
    title: "Check your eligibility",
    body: "A short questionnaire about your age, smoking or vaping history and goals — takes under two minutes.",
  },
  {
    title: "Book a consultation",
    body: "Talk to a pharmacist or telehealth clinician about nicotine strength and the right product pathway for you.",
  },
  {
    title: "Pick up at a pharmacy",
    body: "Collect from a participating pharmacy near you, or have it dispensed per your consultation outcome.",
  },
];

export default function PharmacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Pharmacies &amp; consults near you</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted">
        In Australia, nicotine vaping products are supplied through pharmacies
        — not shipped to your door. We&apos;re building a finder for
        participating pharmacies and a consultation booking flow right here.
      </p>

      {/* Finder placeholder */}
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <label htmlFor="postcode" className="text-sm font-semibold">
          Find a pharmacy near you
        </label>
        <div className="mt-2 flex max-w-md gap-2">
          <input
            id="postcode"
            placeholder="Enter your postcode or suburb…"
            disabled
            className="w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted disabled:opacity-60"
          />
          <button
            disabled
            className="rounded-lg bg-accent-strong px-5 py-2.5 text-sm font-semibold text-black opacity-60"
          >
            Search
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Coming soon — the pharmacy directory and map are being built. The
          consultation booking flow will land alongside it.
        </p>
      </div>

      {/* How it works */}
      <h2 className="mt-10 text-xl font-semibold">How it will work</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="rounded-xl border border-line bg-surface p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
              {i + 1}
            </span>
            <p className="mt-3 font-semibold">{s.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-xs leading-relaxed text-muted">
        VapeAussie does not provide medical advice. Consultations are carried
        out by registered pharmacists or clinicians. Regulations vary by state
        and territory; the finder will reflect what&apos;s available in your
        area.
      </p>
    </div>
  );
}
