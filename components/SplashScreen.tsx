"use client";

import { useEffect, useState } from "react";

interface Props {
  status: string;
  progress: number;
}

export default function SplashScreen({ status, progress }: Props) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= progress) {
          return prev;
        }

        return prev + 1;
      });
    }, 20);

    return () => clearInterval(timer);
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black px-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.22),transparent_38%),linear-gradient(180deg,#09090b,#000)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(circle_at_bottom,rgba(34,197,94,0.12),transparent_46%)]" />

      <div className="relative w-full max-w-sm text-center">
        <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-[2rem] border border-orange-500/30 bg-orange-500/10 shadow-2xl shadow-orange-500/10">
          <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] border border-white/10 bg-black/55">
            <img
              src="/icon-192.png"
              alt="MotoQuest"
              className="h-20 w-20 animate-pulse"
            />
          </div>
        </div>

        <h1 className="mt-8 text-5xl font-black tracking-normal">
          Moto<span className="text-orange-500">Quest</span>
        </h1>

        <p className="mt-4 text-sm font-bold text-zinc-400">
          Odkrywaj Polske kilometr po kilometrze
        </p>

        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-zinc-950/80 p-4 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black text-orange-400">{status}</div>
            <div className="text-sm font-black text-zinc-300">
              {displayProgress}%
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-lime-400 transition-all duration-300"
              style={{
                width: `${displayProgress}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
