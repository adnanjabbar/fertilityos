"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker when running in the browser.
 * Allows the app to be installed and to serve cached dashboard when offline.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (process.env.NODE_ENV === "development") {
          reg.update();
        }
      })
      .catch(() => {});
  }, []);
  return null;
}
