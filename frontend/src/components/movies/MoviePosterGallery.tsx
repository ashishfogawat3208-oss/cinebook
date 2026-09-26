"use client";

import Image from "next/image";
import { useState } from "react";

interface MoviePoster {
  id: number;
  image: string;
  display_order: number;
  is_primary: boolean;
}

interface MoviePosterGalleryProps {
  primaryPoster?: string | null;
  posters?: MoviePoster[];
  title: string;
}

export default function MoviePosterGallery({
  primaryPoster,
  posters = [],
  title,
}: MoviePosterGalleryProps) {
  const allPosters = [
    ...(primaryPoster
      ? [
          {
            id: -1,
            image: primaryPoster,
            display_order: -1,
            is_primary: true,
          },
        ]
      : []),
    ...posters,
  ].filter(
    (poster, index, array) =>
      array.findIndex(
        (item) => item.image === poster.image
      ) === index
  );

  const [selected, setSelected] = useState(
    allPosters[0]?.image || null
  );

  if (!allPosters.length) {
    return (
      <div className="mx-auto flex h-[360px] w-[240px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-zinc-600">
        No poster
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">

      {/* Main Poster */}

      <div className="relative w-full max-w-[300px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/40">
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={selected || allPosters[0].image}
            alt={`${title} poster`}
            fill
            priority
            sizes="(max-width: 768px) 80vw, 300px"
            className="object-cover transition duration-300"
          />
        </div>
      </div>


      {/* Poster thumbnails */}

      {allPosters.length > 1 && (
        <div className="mt-5 flex max-w-full gap-3 overflow-x-auto px-1 pb-2">

          {allPosters.map((poster) => {
            const isSelected =
              selected === poster.image;

            return (
              <button
                key={`${poster.id}-${poster.image}`}
                type="button"
                onClick={() =>
                  setSelected(poster.image)
                }
                aria-label={`View ${title} poster`}
                className={`relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? "scale-105 border-red-500 opacity-100 shadow-lg shadow-red-500/20"
                    : "border-white/10 opacity-50 hover:scale-105 hover:border-white/30 hover:opacity-100"
                }`}
              >
                <Image
                  src={poster.image}
                  alt={`${title} poster thumbnail`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </button>
            );
          })}

        </div>
      )}

    </div>
  );
}