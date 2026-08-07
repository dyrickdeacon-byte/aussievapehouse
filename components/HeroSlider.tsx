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
    <section className="relative h-[440px] overflow-hidden bg-background sm:h-[470px]">
      <div
        className="absolute inset-0 flex transition-transform duration-700 ease-[cubic-bezier(.4,0,.2,1)]"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div key={s.slug} className="relative h-full w-full shrink-0">
            {/* Blurred backdrop from the product shot */}
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center"
              style={{
                backgroundImage: `url("${encodeURI(s.image)}")`,
                filter: "brightness(0.22) blur(14px) saturate(0.6) sepia(0.25)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
            <div className="dot-field absolute inset-0 opacity-70" />

            <div className="relative mx-auto grid h-full max-w-[1380px] grid-cols-[1.15fr_0.85fr] items-center gap-4 px-5 sm:gap-8 sm:px-12 md:grid-cols-[1fr_1fr]">
              <div className="max-w-md">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-ochre">
                  <span aria-hidden>●&nbsp;●&nbsp;●</span>
                  {s.eyebrow}
                </p>
                <h2 className="font-display mt-2 text-[26px] leading-[0.98] text-white sm:text-4xl lg:text-5xl">
                  {s.name}
                </h2>
                <p className="mt-3 inline-flex items-center rounded-full border border-ochre/30 bg-ochre/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ochre sm:text-[11px]">
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

              {/* Product shot — visible on every screen size */}
              <div className="relative flex items-center justify-center md:justify-end md:pr-6">
                <div className="art-rings absolute h-[260px] w-[260px] sm:h-[340px] sm:w-[340px] lg:h-[400px] lg:w-[400px]" />
                <Image
                  src={s.image}
                  alt={s.name}
                  width={340}
                  height={340}
                  priority={i === 0}
                  className="glow-img relative h-[190px] w-[190px] object-contain transition-transform duration-500 hover:scale-105 sm:h-[280px] sm:w-[280px] lg:h-[340px] lg:w-[340px]"
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
                  ? "w-[22px] bg-ochre shadow-[0_0_8px_var(--ochre)]"
                  : "w-[7px] bg-white/20"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
