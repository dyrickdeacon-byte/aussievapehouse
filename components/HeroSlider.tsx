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
    <section className="relative h-[420px] overflow-hidden bg-background sm:h-[460px]">
      <div
        className="absolute inset-0 flex transition-transform duration-700 ease-[cubic-bezier(.4,0,.2,1)]"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div key={s.slug} className="relative h-full w-full shrink-0">
            {/* Blurred backdrop from the product shot */}
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-100"
              style={{
                backgroundImage: `url(${s.image})`,
                filter: "brightness(0.25) blur(14px) saturate(0.6)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />

            <div className="relative mx-auto flex h-full max-w-[1380px] items-center gap-8 px-6 sm:px-12">
              <div className="w-full max-w-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent">
                  {s.eyebrow}
                </p>
                <h2 className="font-display mt-2 text-4xl leading-[0.95] text-white sm:text-5xl">
                  {s.name}
                </h2>
                <p className="mt-3 inline-flex items-center rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
                  {s.category}
                </p>
                <p className="mt-4 text-2xl font-bold text-foreground">
                  <span className="mr-1.5 text-xs font-normal text-muted">from</span>
                  {s.price}
                </p>
                <Link
                  href={`/product/${s.slug}`}
                  className="glow-accent mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-3 text-[13px] font-extrabold uppercase tracking-wider text-white transition hover:bg-accent-2"
                >
                  Shop now →
                </Link>
              </div>
              <div className="hidden flex-1 items-center justify-end pr-6 md:flex">
                <Image
                  src={s.image}
                  alt={s.name}
                  width={340}
                  height={340}
                  priority={i === 0}
                  className="glow-img h-[300px] w-[300px] object-contain transition-transform duration-500 hover:scale-105 lg:h-[340px] lg:w-[340px]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-[7px] rounded-full transition-all ${
                i === active
                  ? "w-[22px] bg-accent shadow-[0_0_8px_var(--accent)]"
                  : "w-[7px] bg-white/20"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
