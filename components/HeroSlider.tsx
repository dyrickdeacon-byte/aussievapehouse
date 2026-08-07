"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type HeroSlide = {
  slug: string;
  name: string;
  eyebrow: string;
  price: string;
  image: string;
  category: string;
};

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="dot-field relative overflow-hidden border-b border-line bg-background">
      {/* Warm sun-wash top corner + eucalypt wash bottom-left */}
      <div
        className="pointer-events-none absolute -right-32 -top-40 h-[420px] w-[420px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(156,115,26,0.25) 0%, transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-44 -left-36 h-[420px] w-[420px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(47,109,95,0.22) 0%, transparent 65%)",
        }}
      />

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(.4,0,.2,1)]"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div key={s.slug} className="w-full shrink-0">
              <div className="mx-auto grid min-h-[400px] max-w-[1380px] grid-cols-[1.1fr_0.9fr] items-center gap-4 px-5 py-10 sm:min-h-[440px] sm:gap-8 sm:px-12 md:grid-cols-2">
                <div className="max-w-md">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-accent">
                    <span aria-hidden>●&nbsp;●&nbsp;●</span>
                    {s.eyebrow}
                  </p>
                  <h2 className="font-display mt-2 text-[26px] leading-[0.98] text-foreground sm:text-4xl lg:text-5xl">
                    {s.name}
                  </h2>
                  <p className="mt-3 inline-flex items-center rounded-full border border-ochre/35 bg-ochre/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ochre sm:text-[11px]">
                    {s.category}
                  </p>
                  <p className="mt-4 text-xl font-bold text-foreground sm:text-2xl">
                    <span className="mr-1.5 text-xs font-normal text-muted">from</span>
                    {s.price}
                  </p>
                  <Link
                    href={`/product/${s.slug}`}
                    className="glow-accent mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[12px] font-extrabold uppercase tracking-wider text-white transition hover:bg-accent-2 sm:mt-6 sm:px-7 sm:py-3 sm:text-[13px]"
                  >
                    Shop now →
                  </Link>
                </div>

                {/* Product shot on a sand disc with dotted rings — shown at
                    native-ish size (source images are ~300px, don't upscale) */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`absolute h-[190px] w-[190px] rounded-full border border-line-2 shadow-inner sm:h-[320px] sm:w-[320px] ${
                      ["bg-[#fbf3e2]", "bg-[#f4e7cb]", "bg-[#e6eee8]", "bg-[#f5e0d1]"][i % 4]
                    }`}
                  />
                  <div className="art-rings absolute h-[220px] w-[220px] sm:h-[380px] sm:w-[380px]" />
                  <Image
                    src={s.image}
                    alt={s.name}
                    width={280}
                    height={280}
                    priority={i === 0}
                    className="glow-img relative h-[150px] w-[150px] object-contain transition-transform duration-500 hover:scale-105 sm:h-[260px] sm:w-[260px]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-[7px] rounded-full transition-all ${
                i === active ? "w-[22px] bg-accent" : "w-[7px] bg-foreground/15"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
