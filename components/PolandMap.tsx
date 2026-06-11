"use client";

import { useEffect, useState } from "react";

const HEX_MAP = [
  [
    "Zachodniopomorskie",
    "Pomorskie",
    "Warmińsko-Mazurskie",
  ],
  [
    "Lubuskie",
    "Wielkopolskie",
    "Kujawsko-Pomorskie",
    "Podlaskie",
  ],
  [
    "Dolnośląskie",
    "Opolskie",
    "Łódzkie",
    "Mazowieckie",
  ],
  [
    "Śląskie",
    "Świętokrzyskie",
    "Lubelskie",
  ],
  [
    "Małopolskie",
    "Podkarpackie",
  ],
];

export default function PolandMap() {
  const [discovered, setDiscovered] =
    useState<string[]>([]);

  const [selectedVoivodeship,
    setSelectedVoivodeship] =
    useState<string | null>(null);

  useEffect(() => {

    const loadVoivodeships =
      () => {

        const data =
          JSON.parse(
            localStorage.getItem(
              "mq_voivodeships"
            ) || "[]"
          );

        setDiscovered(data);
      };

    loadVoivodeships();

    window.addEventListener(
      "mq-voivodeships-updated",
      loadVoivodeships
    );

    return () =>
      window.removeEventListener(
        "mq-voivodeships-updated",
        loadVoivodeships
      );

  }, []);

  const percent = Math.round(
    (discovered.length / 16) * 100
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          🔥 HEX MAP TEST
        </h2>

        <div className="text-orange-500 font-bold">
          {percent}%
        </div>
      </div>

      <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-orange-500 transition-all duration-500"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>

      <div className="flex flex-col items-center gap-2">

        {HEX_MAP.map(
          (row, rowIndex) => (
            <div
              key={rowIndex}
              className={`
                flex gap-2
                ${rowIndex % 2 ? "ml-10" : ""}
              `}
            >
              {row.map(
                (
                  voivodeship
                ) => {

                  const unlocked =
                    discovered.includes(
                      voivodeship
                    );

                  return (
                    <div
                      key={voivodeship}
                      onClick={() =>
                        setSelectedVoivodeship(
                          voivodeship
                        )
                      }
                      title={voivodeship}
                      className={`
                        relative
                        w-20
                        h-20
                        flex
                        items-center
                        justify-center
                        text-[10px]
                        font-bold
                        text-center
                        px-2
                        transition-all
                        duration-300
                        hover:scale-110
                        cursor-pointer
                        ${
                          unlocked
                            ? "text-black"
                            : "text-zinc-500"
                        }
                      `}
                      style={{
                        clipPath:
                          "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)",
                        background:
                          unlocked
                            ? "#f97316"
                            : "#27272a",
                      }}
                    >
                      {voivodeship
                        .replace(
                          "Warmińsko-",
                          "Warm.\n"
                        )
                        .replace(
                          "Kujawsko-",
                          "Kuj.\n"
                        )
                        .replace(
                          "Zachodnio",
                          "Zach.\n"
                        )}
                    </div>
                  );
                }
              )}
            </div>
          )
        )}

      </div>

      <div className="mt-6 text-center text-zinc-400 text-sm">
        Odkryto{" "}
        <span className="text-orange-500 font-bold">
          {discovered.length}
        </span>
        {" "}z 16 województw
      </div>

      {selectedVoivodeship && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-[90%] max-w-sm">

            <h3 className="text-2xl font-bold mb-4 text-orange-500">
              {selectedVoivodeship}
            </h3>

            <div className="space-y-2 text-sm">

              <div>
                {discovered.includes(
                  selectedVoivodeship
                )
                  ? "✅ Odkryte"
                  : "🔒 Nieodkryte"}
              </div>

              <div>
                🏘️ Statystyki województwa pojawią się w kolejnej wersji
              </div>

            </div>

            <button
              onClick={() =>
                setSelectedVoivodeship(
                  null
                )
              }
              className="w-full mt-5 bg-orange-500 hover:bg-orange-600 rounded-xl py-3 font-bold text-black"
            >
              Zamknij
            </button>

          </div>

        </div>
      )}

    </div>
  );
}