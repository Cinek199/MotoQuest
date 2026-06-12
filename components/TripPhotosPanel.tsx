"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function TripPhotosPanel({ tripId }: { tripId: string }) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [touchStartX, setTouchStartX] = useState(0);

  const loadPhotos = () => {
    try {
      const data = JSON.parse(localStorage.getItem("mq_trip_photos") || "{}");

      setPhotos(data[tripId] || []);
    } catch {
      setPhotos([]);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [tripId]);

  const uploadPhoto = async (file: File) => {
    try {
      setErrorMessage("");
      setUploading(true);

      const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-");
      const fileName = `${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from("trip-photos")
        .upload(fileName, file);

      if (error) {
        setErrorMessage(
          "Nie udało się wysłać zdjęcia. Sprawdź bucket trip-photos w Supabase."
        );
        return;
      }

      const { data } = supabase.storage
        .from("trip-photos")
        .getPublicUrl(fileName);

      const allPhotos = JSON.parse(
        localStorage.getItem("mq_trip_photos") || "{}"
      );

      if (!allPhotos[tripId]) {
        allPhotos[tripId] = [];
      }

      allPhotos[tripId].push(data.publicUrl);

      localStorage.setItem("mq_trip_photos", JSON.stringify(allPhotos));

      loadPhotos();
    } catch {
      setErrorMessage("Nie udało się zapisać zdjęcia wyprawy.");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = (photoIndex: number) => {
    const allPhotos = JSON.parse(localStorage.getItem("mq_trip_photos") || "{}");

    allPhotos[tripId] = (allPhotos[tripId] || []).filter(
      (_: string, index: number) => index !== photoIndex
    );

    localStorage.setItem("mq_trip_photos", JSON.stringify(allPhotos));

    loadPhotos();

    if (selectedIndex === photoIndex) {
      setSelectedIndex(null);
    }
  };

  const setAsCover = (photoIndex: number) => {
    const allPhotos = JSON.parse(localStorage.getItem("mq_trip_photos") || "{}");
    const tripPhotos = allPhotos[tripId] || [];
    const cover = tripPhotos[photoIndex];

    if (!cover) {
      return;
    }

    tripPhotos.splice(photoIndex, 1);
    tripPhotos.unshift(cover);
    allPhotos[tripId] = tripPhotos;

    localStorage.setItem("mq_trip_photos", JSON.stringify(allPhotos));

    loadPhotos();
  };

  const nextPhoto = () => {
    if (selectedIndex === null) {
      return;
    }

    setSelectedIndex((selectedIndex + 1) % photos.length);
  };

  const prevPhoto = () => {
    if (selectedIndex === null) {
      return;
    }

    setSelectedIndex(selectedIndex === 0 ? photos.length - 1 : selectedIndex - 1);
  };

  return (
    <>
      <div className="mt-4 space-y-3">
        <label className="block cursor-pointer rounded-2xl border border-dashed border-orange-500/30 bg-orange-500/5 px-4 py-4 transition hover:border-orange-500/70 hover:bg-orange-500/10">
          <span className="block text-sm font-black text-white">
            Dodaj zdjęcia z wyprawy
          </span>
          <span className="mt-1 block text-xs font-bold text-zinc-500">
            Galeria lub aparat, zapis przez bucket trip-photos
          </span>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                void uploadPhoto(file);
              }
            }}
            className="mt-3 w-full text-xs font-bold text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:text-xs file:font-black file:text-black"
          />
        </label>

        {uploading && (
          <div className="rounded-2xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-xs font-black text-orange-400">
            Wysyłanie zdjęcia...
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-black text-red-300">
            {errorMessage}
          </div>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo, index) => (
              <div
                key={`${photo}-${index}`}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-1"
              >
                <img
                  src={photo}
                  alt=""
                  onClick={() => setSelectedIndex(index)}
                  className="h-20 w-full cursor-pointer rounded-xl object-cover transition hover:opacity-80"
                />

                <div className="mt-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setAsCover(index)}
                    className="flex-1 rounded-lg bg-orange-500 py-1.5 text-[10px] font-black text-black"
                  >
                    OKL.
                  </button>

                  <button
                    type="button"
                    onClick={() => deletePhoto(index)}
                    className="flex-1 rounded-lg bg-red-600 py-1.5 text-[10px] font-black text-white"
                  >
                    USUN
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = touchStartX - endX;

            if (diff > 50) {
              nextPhoto();
            }

            if (diff < -50) {
              prevPhoto();
            }
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="absolute right-4 top-4 z-50 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-black text-white shadow-2xl"
          >
            Zamknij
          </button>

          <img
            src={photos[selectedIndex]}
            alt=""
            className="max-h-[85vh] max-w-[95vw] select-none rounded-[2rem] border border-zinc-800 shadow-2xl"
          />

          <div className="absolute bottom-6 rounded-full border border-zinc-700 bg-zinc-950/90 px-4 py-2 text-sm font-black text-white">
            {selectedIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
