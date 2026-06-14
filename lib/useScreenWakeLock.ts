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
  const requestingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      void releaseWakeLock(wakeLockRef);
      return;
    }

    const requestWakeLock = async () => {
      if (requestingRef.current || document.visibilityState !== "visible") {
        return;
      }

      const wakeLock = (navigator as WakeLockNavigator).wakeLock;

      if (!wakeLock) {
        return;
      }

      if (wakeLockRef.current && !wakeLockRef.current.released) {
        return;
      }

      requestingRef.current = true;

      try {
        const nextWakeLock = await wakeLock.request("screen");

        wakeLockRef.current = nextWakeLock;
        nextWakeLock.addEventListener("release", () => {
          if (wakeLockRef.current === nextWakeLock) {
            wakeLockRef.current = null;
          }
        });
      } catch {
        wakeLockRef.current = null;
      } finally {
        requestingRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
        return;
      }

      void releaseWakeLock(wakeLockRef);
    };

    const handlePageShow = () => {
      void requestWakeLock();
    };

    const handlePageHide = () => {
      void releaseWakeLock(wakeLockRef);
    };

    void requestWakeLock();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handlePageShow);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("blur", handlePageHide);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handlePageShow);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("blur", handlePageHide);
      window.removeEventListener("pagehide", handlePageHide);
      void releaseWakeLock(wakeLockRef);
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
