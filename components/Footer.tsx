import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold">
            Vape<span className="text-accent">Aussie</span>
          </p>
          <p className="mt-2 leading-relaxed text-muted">
            Quality vaping products with a compliant pathway for every market.
          </p>
        </div>
        <div>
          <p className="font-semibold">Shop</p>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li><Link href="/shop" className="hover:text-foreground">All products</Link></li>
            <li><Link href="/shop?group=disposables" className="hover:text-foreground">Disposables</Link></li>
            <li><Link href="/shop?group=e-liquids" className="hover:text-foreground">E-Liquids</Link></li>
            <li><Link href="/pharmacy" className="hover:text-foreground">Pharmacy &amp; consults</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">The fine print</p>
          <p className="mt-2 leading-relaxed text-muted">
            18+ only. Nicotine is an addictive chemical. Product availability
            and purchase pathways vary by region — in Australia, nicotine
            vaping products are supplied through pharmacies only.
          </p>
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} VapeAussie. Demo storefront — not yet taking orders.
      </div>
    </footer>
  );
}
