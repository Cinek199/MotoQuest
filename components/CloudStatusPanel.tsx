"use client";

export default function CloudStatusPanel() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#08090b] shadow-2xl shadow-black/50">
      <div className="relative overflow-hidden border-b border-white/10 px-5 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_42%),linear-gradient(135deg,rgba(24,24,27,0.9),rgba(0,0,0,0.35))]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.36em] text-orange-500">
              Synchronizacja
            </div>
            <h2 className="mt-1 text-2xl font-black text-white">Chmura</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-400">
              Dane gracza sa gotowe do zapisu w Supabase.
            </p>
          </div>

          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-green-500/30 bg-green-500/10">
            <span className="absolute h-3 w-3 animate-ping rounded-full bg-green-400/60" />
            <span className="h-3 w-3 rounded-full bg-green-400 shadow-lg shadow-green-400/40" />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="rounded-[1.5rem] border border-green-500/25 bg-green-500/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-black text-white">Synchronizacja aktywna</div>
              <div className="mt-1 text-sm font-semibold text-zinc-400">
                Profil, garaz, wyprawy i odkrycia beda odtwarzane po logowaniu.
              </div>
            </div>

            <span className="rounded-full border border-green-500/30 bg-green-500 px-3 py-1 text-[10px] font-black uppercase text-black">
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
