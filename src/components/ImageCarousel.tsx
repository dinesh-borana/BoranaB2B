"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { cdnImg } from "@/lib/cdn";

type Props = {
  images: { url: string; isMain: boolean }[];
  alt: string;
};

export function ImageCarousel({ images, alt }: Props) {
  const [current, setCurrent] = useState(
    () => Math.max(0, images.findIndex((i) => i.isMain)),
  );
  const touchStartX = useRef<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center rounded-2xl bg-stone-100 text-stone-300">
        <Package className="h-16 w-16" />
      </div>
    );
  }

  function prev() {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  }

  function next() {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-stone-100">
      <div
        className="relative aspect-square w-full"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.url}
            src={cdnImg(img.url, 1200)}
            alt={`${alt} ${i + 1}`}
            width={800}
            height={800}
            loading={i === 0 ? "eager" : "lazy"}
            decoding={i === 0 ? "sync" : "async"}
            fetchPriority={i === 0 ? "high" : "low"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
              i === current ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm active:scale-95 transition-transform"
          >
            <ChevronLeft className="h-6 w-6 text-stone-700" />
          </button>

          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm active:scale-95 transition-transform"
          >
            <ChevronRight className="h-6 w-6 text-stone-700" />
          </button>

          <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {current + 1} / {images.length}
          </div>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === current ? "h-2 w-6 bg-white" : "h-2 w-2 bg-white/60"
                }`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
