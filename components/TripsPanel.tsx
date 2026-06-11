"use client";

import { supabase } from "../lib/supabase";
import { savePlayer } from "../lib/playerService";
import { useEffect, useState } from "react";
import TripPhotosPanel from "./TripPhotosPanel";

export default function TripsPanel() {
  const [activeTrip, setActiveTrip] =
    useState<any>(null);

  const [trips, setTrips] =
    useState<any[]>([]);

  const [tripName, setTripName] =
    useState("");

  useEffect(() => {
    const trip = JSON.parse(
      localStorage.getItem(
        "mq_active_trip"
      ) || "null"
    );

    setActiveTrip(trip);

    setTrips(
      JSON.parse(
        localStorage.getItem(
          "mq_trips"
        ) || "[]"
      )
    );
  }, []);

  const startTrip = () => {
    if (!tripName.trim()) return;

    const trip = {
      name: tripName,

      startedAt: Date.now(),

      startDistance: Number(
        localStorage.getItem(
          "mq_distance"
        ) || "0"
      ),

      startTiles: JSON.parse(
        localStorage.getItem(
          "mq_tiles"
        ) || "[]"
      ).length,

      startTowns: JSON.parse(
        localStorage.getItem(
          "mq_towns"
        ) || "[]"
      ).length,

      startVoivodeships:
        JSON.parse(
          localStorage.getItem(
            "mq_voivodeships"
          ) || "[]"
        ).length,
    };

    localStorage.setItem(
      "mq_active_trip",
      JSON.stringify(trip)
    );

    setActiveTrip(trip);

    setTripName("");
  };

  const endTrip = async () => {
    if (!activeTrip) return;

    const finishedTrip = {
      name: activeTrip.name,

      date:
        new Date().toLocaleDateString(),

      distance:
        Number(
          localStorage.getItem(
            "mq_distance"
          ) || "0"
        ) - activeTrip.startDistance,

      tiles:
        JSON.parse(
          localStorage.getItem(
            "mq_tiles"
          ) || "[]"
        ).length -
        activeTrip.startTiles,

      towns:
        JSON.parse(
          localStorage.getItem(
            "mq_towns"
          ) || "[]"
        ).length -
        activeTrip.startTowns,

      voivodeships:
        JSON.parse(
          localStorage.getItem(
            "mq_voivodeships"
          ) || "[]"
        ).length -
        activeTrip.startVoivodeships,

      duration:
        Math.floor(
          (Date.now() -
            activeTrip.startedAt) /
            1000 /
            60
        ),
    };

    const trips = JSON.parse(
      localStorage.getItem(
        "mq_trips"
      ) || "[]"
    );

    trips.unshift(
      finishedTrip
    );

    const achievements = JSON.parse(
  localStorage.getItem(
    "mq_achievements"
  ) || "[]"
);

const addAchievement = (
  id: string,
  title: string,
  xp: number
) => {
  if (
    achievements.some(
      (a:any) => a.id === id
    )
  ) {
    return;
  }

  achievements.push({
    id,
    title,
    xp,
  });
};

if (trips.length >= 1) {
  addAchievement(
    "trip-1",
    "Pierwsza wyprawa",
    250
  );
}

if (trips.length >= 5) {
  addAchievement(
    "trip-5",
    "5 wypraw",
    1000
  );
}

if (trips.length >= 10) {
  addAchievement(
    "trip-10",
    "10 wypraw",
    2500
  );
}

if (
  finishedTrip.distance >= 1000
) {
  addAchievement(
    "trip-1000km",
    "1000 km w jednej wyprawie",
    5000
  );
}

localStorage.setItem(
  "mq_achievements",
  JSON.stringify(
    achievements
  )
);

    localStorage.setItem(
      "mq_trips",
      JSON.stringify(trips)
    );

    localStorage.removeItem(
      "mq_active_trip"
    );

    const user = await supabase.auth.getUser();

if (
  user.data.user
) {
  await savePlayer(
    user.data.user.id
  );
}
    setTrips(trips);

    setActiveTrip(null);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">

      <h2 className="text-xl font-bold mb-4">
        🏕️ Wyprawa
      </h2>

      {!activeTrip ? (
        <div className="space-y-3">

          <input
            value={tripName}
            onChange={(e) =>
              setTripName(
                e.target.value
              )
            }
            placeholder="Np. Tatry Weekend"
            className="w-full bg-zinc-800 rounded-xl px-3 py-3"
          />

          <button
            onClick={startTrip}
            className="w-full bg-orange-500 hover:bg-orange-600 rounded-xl py-3 font-bold"
          >
            Rozpocznij wyprawę
          </button>

        </div>
      ) : (
        <div className="space-y-3">

          <div className="font-bold text-orange-500">
            🏕️ {activeTrip.name}
          </div>

          <div className="text-green-500 font-bold">
            🟢 Wyprawa aktywna
          </div>

          <button
            onClick={endTrip}
            className="w-full bg-red-500 hover:bg-red-600 rounded-xl py-3 font-bold"
          >
            Zakończ wyprawę
          </button>

        </div>
      )}

      {trips.length > 0 && (
        <div className="mt-4 space-y-2">

          <h3 className="font-bold">
            Historia wypraw
          </h3>

          {trips
            .slice(0, 10)
            .map(
              (
                trip,
                index
              ) => (
                <div
                  key={index}
                  className="bg-zinc-800 rounded-xl p-3 text-sm"
                >
                    {
  JSON.parse(
    localStorage.getItem(
      "mq_trip_photos"
    ) || "{}"
  )[index]?.[0] && (
    <img
      src={
        JSON.parse(
          localStorage.getItem(
            "mq_trip_photos"
          ) || "{}"
        )[index][0]
      }
      alt=""
      className="
        w-full
        h-40
        object-cover
        rounded-xl
        mb-3
      "
    />
  )
}
                  <div className="font-bold text-orange-500">
                    🏕️ {trip.name}
                  </div>

                  <div>
                    📅 {trip.date}
                  </div>

                  <div>
                    📏 {trip.distance.toFixed(1)} km
                  </div>

                  <div>
                    🏘️ {trip.towns} miejscowości
                  </div>

                  <div>
                    🗺️ {trip.voivodeships} woj.
                  </div>

                  <div>
                    🟧 {trip.tiles} kafelków
                  </div>

                 <div>
                ⏱️ {trip.duration} min
                </div>

                <TripPhotosPanel
                tripIndex={index}
                />
                  </div>
                
              )
            )}

        </div>
      )}

    </div>
  );
}