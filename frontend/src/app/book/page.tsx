import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { ClientOnly } from "@/components/ClientOnly";
import { BookingFlow } from "./BookingFlow";

export const metadata: Metadata = { title: "Book a visit" };

export default function BookPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ClientOnly fallback={<Spinner />}>
        <BookingFlow />
      </ClientOnly>
    </Suspense>
  );
}
