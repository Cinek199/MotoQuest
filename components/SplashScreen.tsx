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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-[2rem] border border-orange-500/30 bg-orange-500/10 shadow-2xl shadow-orange-500/10">
          <img
            src="/icon-192.png"
            alt="MotoQuest"
            className="h-24 w-24 animate-pulse"
          />
        </div>

        <h1 className="mt-8 text-5xl font-black tracking-normal">
          Moto<span className="text-orange-500">Quest</span>
        </h1>

        <p className="mt-4 text-sm font-bold text-zinc-500">
          Odkrywaj Polskę kilometr po kilometrze
        </p>

        <div className="mt-8 rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-sm font-black text-orange-500">{status}</div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-300"
              style={{
                width: `${displayProgress}%`,
              }}
            />
          </div>

          <div className="mt-2 text-sm font-black text-zinc-400">
            {displayProgress}%
          </div>
        </div>
      </div>
    </div>
  );
}
