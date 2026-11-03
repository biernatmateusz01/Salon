"use client";

import { useHydrated } from "@/lib/useHydrated";

/** Renders children only in the browser, so locale/clock-dependent output never mismatches the server HTML. */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return useHydrated() ? <>{children}</> : <>{fallback}</>;
}
