"use client";

export default function XPBar({ xp }: { xp: number }) {
  const progress = (xp % 1000) / 10;
  const nextLevelXp = 1000 - (xp % 1000);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-orange-500/20 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="p-5">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
              Poziom
            </div>
            <div className="mt-1 font-black text-white">Postęp poziomu</div>
          </div>

          <div className="text-right">
            <div className="text-xl font-black text-orange-500">
              {Math.round(progress)}%
            </div>
            <div className="text-[10px] font-black uppercase text-zinc-500">
              do celu
            </div>
          </div>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 text-sm font-bold text-zinc-400">
          Do kolejnego poziomu brakuje {nextLevelXp} XP
        </div>
      </div>
    </div>
  );
}
