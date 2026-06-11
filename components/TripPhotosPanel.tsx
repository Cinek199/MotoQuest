"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function TripPhotosPanel({
  tripIndex,
}: {
  tripIndex: number;
}) {
  const [uploading, setUploading] =
    useState(false);

  const [photos, setPhotos] =
    useState<string[]>([]);

  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);

  const [touchStartX, setTouchStartX] =
    useState(0);

  const loadPhotos = () => {
    const data = JSON.parse(
      localStorage.getItem(
        "mq_trip_photos"
      ) || "{}"
    );

    setPhotos(
      data[tripIndex] || []
    );
  };

  useEffect(() => {
    loadPhotos();
  }, [tripIndex]);

  const uploadPhoto = async (
    file: File
  ) => {
    try {
      setUploading(true);

      const fileName =
        `${Date.now()}-${file.name}`;

      const { error } =
        await supabase.storage
          .from("trip-photos")
          .upload(
            fileName,
            file
          );

      if (error) {
        console.error(error);
        return;
      }

      const { data } =
        supabase.storage
          .from("trip-photos")
          .getPublicUrl(
            fileName
          );

      const allPhotos =
        JSON.parse(
          localStorage.getItem(
            "mq_trip_photos"
          ) || "{}"
        );

      if (
        !allPhotos[tripIndex]
      ) {
        allPhotos[
          tripIndex
        ] = [];
      }

      allPhotos[
        tripIndex
      ].push(
        data.publicUrl
      );

      localStorage.setItem(
        "mq_trip_photos",
        JSON.stringify(
          allPhotos
        )
      );

      loadPhotos();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = (
    photoIndex: number
  ) => {
    const allPhotos =
      JSON.parse(
        localStorage.getItem(
          "mq_trip_photos"
        ) || "{}"
      );

    allPhotos[
      tripIndex
    ] = allPhotos[
      tripIndex
    ].filter(
      (
        _: string,
        index: number
      ) =>
        index !==
        photoIndex
    );

    localStorage.setItem(
      "mq_trip_photos",
      JSON.stringify(
        allPhotos
      )
    );

    loadPhotos();

    if (
      selectedIndex ===
      photoIndex
    ) {
      setSelectedIndex(
        null
      );
    }
  };

  const setAsCover = (
    photoIndex: number
  ) => {
    const allPhotos =
      JSON.parse(
        localStorage.getItem(
          "mq_trip_photos"
        ) || "{}"
      );

    const tripPhotos =
      allPhotos[
        tripIndex
      ];

    const cover =
      tripPhotos[
        photoIndex
      ];

    tripPhotos.splice(
      photoIndex,
      1
    );

    tripPhotos.unshift(
      cover
    );

    allPhotos[
      tripIndex
    ] = tripPhotos;

    localStorage.setItem(
      "mq_trip_photos",
      JSON.stringify(
        allPhotos
      )
    );

    loadPhotos();
  };

  const nextPhoto = () => {
    if (
      selectedIndex ===
      null
    )
      return;

    setSelectedIndex(
      (selectedIndex + 1) %
        photos.length
    );
  };

  const prevPhoto = () => {
    if (
      selectedIndex ===
      null
    )
      return;

    setSelectedIndex(
      selectedIndex === 0
        ? photos.length - 1
        : selectedIndex - 1
    );
  };

  return (
    <>
      <div className="mt-2 space-y-2">

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file =
              e.target
                .files?.[0];

            if (file) {
              uploadPhoto(
                file
              );
            }
          }}
          className="
            w-full
            bg-zinc-700
            rounded-lg
            px-2
            py-2
            text-xs
          "
        />

        {uploading && (
          <div className="text-orange-500 text-xs">
            Uploadowanie...
          </div>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">

            {photos.map(
              (
                photo,
                index
              ) => (
                <div
                  key={index}
                  className="
                    bg-zinc-900
                    rounded-lg
                    p-1
                  "
                >
                  <img
                    src={photo}
                    alt=""
                    onClick={() =>
                      setSelectedIndex(
                        index
                      )
                    }
                    className="
                      w-full
                      h-20
                      object-cover
                      rounded-lg
                      cursor-pointer
                    "
                  />

                  <div className="flex gap-1 mt-1">

                    <button
                      onClick={() =>
                        setAsCover(
                          index
                        )
                      }
                      className="
                        flex-1
                        text-xs
                        bg-orange-500
                        rounded
                        py-1
                      "
                    >
                      ⭐
                    </button>

                    <button
                      onClick={() =>
                        deletePhoto(
                          index
                        )
                      }
                      className="
                        flex-1
                        text-xs
                        bg-red-500
                        rounded
                        py-1
                      "
                    >
                      🗑
                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

      {selectedIndex !==
        null && (
        <div
          className="
            fixed
            inset-0
            bg-black/95
            z-50
            flex
            items-center
            justify-center
          "
          onTouchStart={(
            e
          ) =>
            setTouchStartX(
              e.touches[0]
                .clientX
            )
          }
          onTouchEnd={(
            e
          ) => {
            const endX =
              e
                .changedTouches[0]
                .clientX;

            const diff =
              touchStartX -
              endX;

            if (
              diff > 50
            ) {
              nextPhoto();
            }

            if (
              diff < -50
            ) {
              prevPhoto();
            }
          }}
        >
          <button
            onClick={() =>
              setSelectedIndex(
                null
              )
            }
            className="
              absolute
              top-4
              right-4
              text-white
              text-4xl
              font-bold
              z-50
            "
          >
            ✕
          </button>

          <img
            src={
              photos[
                selectedIndex
              ]
            }
            alt=""
            className="
              max-w-[95vw]
              max-h-[85vh]
              rounded-2xl
              select-none
            "
          />

          <div
            className="
              absolute
              bottom-6
              text-white
              text-lg
              font-bold
            "
          >
            {selectedIndex + 1}
            {" / "}
            {photos.length}
          </div>
        </div>
      )}
    </>
  );
}