"use client";

import { type MutableRefObject, useEffect, useRef } from "react";

type WakeLockSentinel = EventTarget & {
  released: boolean;
  release: () => Promise<void>;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>;
  };
};

export function useScreenWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackEnabledRef = useRef(false);
  const requestingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      void releaseWakeLock(wakeLockRef);
      stopFallbackVideo(fallbackVideoRef);
      return;
    }

    const requestWakeLock = async (allowFallback: boolean) => {
      if (requestingRef.current || document.visibilityState !== "visible") {
        return;
      }

      const wakeLock = (navigator as WakeLockNavigator).wakeLock;

      if (!wakeLock) {
        if (allowFallback) {
          await startFallbackVideo(fallbackVideoRef);
        }
        return;
      }

      if (wakeLockRef.current && !wakeLockRef.current.released) {
        return;
      }

      requestingRef.current = true;

      try {
        const nextWakeLock = await wakeLock.request("screen");

        wakeLockRef.current = nextWakeLock;
        fallbackEnabledRef.current = false;
        stopFallbackVideo(fallbackVideoRef);
        nextWakeLock.addEventListener("release", () => {
          if (wakeLockRef.current === nextWakeLock) {
            wakeLockRef.current = null;
          }
        });
      } catch {
        wakeLockRef.current = null;
        if (allowFallback) {
          await startFallbackVideo(fallbackVideoRef);
        }
      } finally {
        requestingRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock(fallbackEnabledRef.current);
        return;
      }

      void releaseWakeLock(wakeLockRef);
      stopFallbackVideo(fallbackVideoRef);
    };

    const handlePageShow = () => {
      void requestWakeLock(fallbackEnabledRef.current);
    };

    const handlePageHide = () => {
      void releaseWakeLock(wakeLockRef);
      stopFallbackVideo(fallbackVideoRef);
    };

    const handleUserActivation = () => {
      fallbackEnabledRef.current = true;
      void requestWakeLock(true);
    };

    void requestWakeLock(false);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("click", handleUserActivation, { passive: true });
    window.addEventListener("focus", handlePageShow);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("pointerdown", handleUserActivation, {
      passive: true,
    });
    window.addEventListener("touchstart", handleUserActivation, {
      passive: true,
    });
    window.addEventListener("blur", handlePageHide);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("click", handleUserActivation);
      window.removeEventListener("focus", handlePageShow);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("pointerdown", handleUserActivation);
      window.removeEventListener("touchstart", handleUserActivation);
      window.removeEventListener("blur", handlePageHide);
      window.removeEventListener("pagehide", handlePageHide);
      void releaseWakeLock(wakeLockRef);
      stopFallbackVideo(fallbackVideoRef);
    };
  }, [enabled]);
}

async function releaseWakeLock(
  wakeLockRef: MutableRefObject<WakeLockSentinel | null>
) {
  const currentWakeLock = wakeLockRef.current;
  wakeLockRef.current = null;

  if (!currentWakeLock || currentWakeLock.released) {
    return;
  }

  try {
    await currentWakeLock.release();
  } catch {
    // The browser can release wake locks itself when the app is hidden.
  }
}

async function startFallbackVideo(
  fallbackVideoRef: MutableRefObject<HTMLVideoElement | null>
) {
  if (fallbackVideoRef.current && !fallbackVideoRef.current.paused) {
    return;
  }

  const video = fallbackVideoRef.current ?? createFallbackVideo();
  fallbackVideoRef.current = video;

  try {
    await video.play();
  } catch {
    // iOS can require a fresh user activation. We retry on the next tap.
  }
}

function stopFallbackVideo(
  fallbackVideoRef: MutableRefObject<HTMLVideoElement | null>
) {
  const video = fallbackVideoRef.current;

  if (!video) {
    return;
  }

  video.pause();
}

function createFallbackVideo() {
  const video = document.createElement("video");

  video.setAttribute("aria-hidden", "true");
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.loop = true;
  video.muted = true;
  video.preload = "auto";
  video.src =
    "data:video/mp4;base64,AAAAIGZ0eXBtcDQyAAAAAGlzb21tcDQyAAACAG1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAB0dHJhawAAAFx0a2hkAAAAAwAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAA+gAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAABAAAAAQAAAAAACRlZHRzAAAAGGVsc3QAAAAAAAAAAQAAA+gAAAAAAAEAAAAAAAGDbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAAPoAAAAAAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAAGGbWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAABRnN0YmwAAAC+c3RzZAAAAAAAAAABAAAArm1wNHYAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQABAAEASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAC5lc2RzAAAAA4CAgCAAAQAEgICAgBUAAQAAAgABgICAgQIAAABFc3R0cwAAAAAAAAABAAAAAQAAA+gAAABFc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAAAAAAAAEAAAAEAAAAFHN0Y28AAAAAAAAAAQAAAsQAAABPbWRhdAAAAAdn/wABAAAAAA==";

  Object.assign(video.style, {
    height: "1px",
    left: "-1px",
    opacity: "0",
    pointerEvents: "none",
    position: "fixed",
    top: "-1px",
    width: "1px",
  });

  document.body.appendChild(video);

  return video;
}
