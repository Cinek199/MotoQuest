
"use client";

export default function XPBar({
  xp,
}: {
  xp: number;
}) {
  const progress = (xp % 1000) / 10;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4">
      <div className="text-sm text-zinc-400 mb-2">
        Postęp poziomu
      </div>

      <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
