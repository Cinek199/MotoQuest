"use client";

import { useEffect } from "react";

function isEmptyObject(value: unknown) {
  return (
    !!value &&
    typeof value === "object" &&
    value.constructor === Object &&
    Object.keys(value).length === 0
  );
}

export default function DevRuntimeGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const originalError = console.error;

    console.error = (...args: unknown[]) => {
      const onlyEmptyObject = args.length === 1 && isEmptyObject(args[0]);

      if (onlyEmptyObject) {
        return;
      }

      originalError(...args);
    };

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
    }

    if ("caches" in window) {
      void caches.keys().then((keys) => {
        keys.forEach((key) => {
          void caches.delete(key);
        });
      });
    }

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
