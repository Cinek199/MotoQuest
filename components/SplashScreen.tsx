"use client";

import { useEffect, useState } from "react";

interface Props {
  status: string;
  progress: number;
}

export default function SplashScreen({
  status,
  progress,
}: Props) {
  const [displayProgress,
    setDisplayProgress] =
    useState(0);

  useEffect(() => {
    const timer =
      setInterval(() => {
        setDisplayProgress(
          prev => {
            if (
              prev >= progress
            )
              return prev;

            return prev + 1;
          }
        );
      }, 20);

    return () =>
      clearInterval(timer);
  }, [progress]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]">

      <img
        src="/icon-192.png"
        alt="MotoQuest"
        className="w-32 h-32 mb-8 animate-pulse"
      />

      <h1 className="text-5xl font-bold">
        Moto
        <span className="text-orange-500">
          Quest
        </span>
      </h1>

      <p className="text-zinc-500 mt-4">
        Odkrywaj Polskę kilometr po kilometrze
      </p>

      <div className="mt-8 text-orange-500 font-medium">
        {status}
      </div>

      <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mt-4">

        <div
          className="
            h-full
            bg-orange-500
            transition-all
            duration-300
          "
          style={{
            width:
              `${displayProgress}%`,
          }}
        />

      </div>

      <div className="text-zinc-400 mt-2">
        {displayProgress}%
      </div>

    </div>
  );
}