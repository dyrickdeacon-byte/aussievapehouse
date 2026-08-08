import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { logoutAction } from "@/app/admin/actions";

export const metadata = { title: "Admin" };

// Admin is session-gated and reads live data — never prerender it at build
export const dynamic = "force-dynamic";

// Each protected page calls requireAdmin() itself (redirects to login);
// this layout only decides whether to show the nav.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {authed && (
        <nav className="mb-8 flex flex-wrap items-center gap-2 border-b border-line pb-4 text-sm">
          <span className="font-display mr-2 text-xl text-accent">AVH ADMIN</span>
          <Link href="/admin" className="rounded-md px-3 py-1.5 text-muted transition hover:bg-surface hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/admin/orders" className="rounded-md px-3 py-1.5 text-muted transition hover:bg-surface hover:text-foreground">
            Orders
          </Link>
          <Link href="/admin/products" className="rounded-md px-3 py-1.5 text-muted transition hover:bg-surface hover:text-foreground">
            Products
          </Link>
          <Link href="/admin/settings" className="rounded-md px-3 py-1.5 text-muted transition hover:bg-surface hover:text-foreground">
            Settings
          </Link>
          <Link href="/" className="rounded-md px-3 py-1.5 text-muted transition hover:bg-surface hover:text-foreground">
            View store →
          </Link>
          <form action={logoutAction} className="ml-auto">
            <button className="rounded-md border border-line px-3 py-1.5 text-muted transition hover:text-foreground">
              Sign out
            </button>
          </form>
        </nav>
      )}
      {children}
    </div>
  );
}
