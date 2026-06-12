"use client";

export default function CloudStatusPanel() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-orange-500/20 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="border-b border-zinc-800 bg-black/35 px-5 py-4">
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
          Synchronizacja
        </div>
        <h2 className="mt-1 text-2xl font-black text-white">Chmura</h2>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-green-500/25 bg-green-500/10 p-4">
          <div>
            <div className="font-black text-white">Synchronizacja aktywna</div>
            <div className="mt-1 text-sm text-zinc-400">
              Postęp jest gotowy do zapisu w Supabase.
            </div>
          </div>

          <span className="h-3 w-3 shrink-0 rounded-full bg-green-400 shadow-lg shadow-green-400/40" />
        </div>
      </div>
    </div>
  );
}
