"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";

interface CastMember {
  id: number;
  name: string;
  role: string;
  photo?: string;
  character_name?: string;
}

interface MovieCastProps {
  cast?: CastMember[];
}

export default function MovieCast({
  cast = [],
}: MovieCastProps) {
  if (!cast.length) {
    return null;
  }

  return (
    <section className="mt-10">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
          Cast
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Cast & Characters
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cast.map((member) => (
          <div
            key={member.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            <div className="relative aspect-[4/5] bg-white/5">
              {member.photo ? (
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <UserRound
                    size={42}
                    className="text-zinc-700"
                  />
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-white">
                {member.name}
              </h3>

              {member.character_name && (
                <p className="mt-1 text-sm text-red-400">
                  {member.character_name}
                </p>
              )}

              {member.role && (
                <p className="mt-1 text-xs text-zinc-600">
                  {member.role}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}