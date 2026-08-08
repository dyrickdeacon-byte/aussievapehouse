import Medallion from "@/components/Medallion";
import { loginAction } from "@/app/admin/actions";

export const metadata = { title: "Admin login" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-4 py-24 text-center">
      <Medallion variant={3} size={64} className="mx-auto mb-6" />
      <h1 className="font-display text-3xl">Admin</h1>
      <form action={loginAction} className="mt-6 space-y-3">
        <input
          type="password"
          name="password"
          required
          placeholder="Admin password"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
        />
        <button className="glow-accent w-full rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-2">
          Sign in
        </button>
        {error && (
          <p className="text-sm text-red-600">Wrong password — try again.</p>
        )}
      </form>
      <p className="mt-4 text-xs text-muted">
        Set via ADMIN_PASSWORD in .env.local
      </p>
    </div>
  );
}
