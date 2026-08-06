"use client";

import Image from "next/image";
import { useState } from "react";
import type { CatalogImage } from "@/lib/catalog";

export default function ImageGallery({
  images,
  name,
}: {
  images: CatalogImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-white">
        {current ? (
          <Image
            src={current.src}
            alt={current.alt || name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-6"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No image available
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.src}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white transition ${
                i === active ? "border-accent" : "border-line hover:border-muted"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={img.src} alt="" fill sizes="64px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
