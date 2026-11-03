import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 pt-16 text-center">
      <WifiOff className="size-10 text-muted" />
      <h1 className="font-display text-2xl font-semibold">You&apos;re offline</h1>
      <p className="text-muted">Bookings need a connection to show live availability. We&apos;ll be here when you&apos;re back online.</p>
    </div>
  );
}
