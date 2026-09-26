"use client";

import { Play } from "lucide-react";

interface YouTubeTrailerProps {
  url?: string | null;
  title: string;
}

function getYouTubeVideoId(
  value?: string | null
): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.hostname === "youtu.be" ||
      url.hostname === "www.youtu.be"
    ) {
      return url.pathname
        .replace("/", "")
        .trim() || null;
    }

    if (
      url.hostname === "youtube.com" ||
      url.hostname === "www.youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      if (url.pathname.startsWith("/embed/")) {
        return url.pathname
          .replace("/embed/", "")
          .split("/")[0];
      }

      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname
          .replace("/shorts/", "")
          .split("/")[0];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export default function YouTubeTrailer({
  url,
  title,
}: YouTubeTrailerProps) {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return (
      <section className="mt-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
            <Play
              size={24}
              className="text-zinc-600"
            />
          </div>

          <h3 className="mt-4 text-lg font-bold text-white">
            Trailer unavailable
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            A trailer has not been added for this movie yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
          Watch Trailer
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          {title} — Official Trailer
        </h2>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
        <div className="aspect-video w-full">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
              videoId
            )}?rel=0&modestbranding=1`}
            title={`${title} trailer`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
}