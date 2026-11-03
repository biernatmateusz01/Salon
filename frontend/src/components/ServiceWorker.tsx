"use client";

import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    // Skip in dev so the cache never serves stale HMR bundles.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(console.error);
  }, []);
  return null;
}
