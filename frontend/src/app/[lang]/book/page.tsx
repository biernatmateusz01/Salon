import { pageTitle } from "@/i18n/metadata";
import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { ClientOnly } from "@/components/ClientOnly";
import { BookingFlow } from "./BookingFlow";

export const generateMetadata = pageTitle("book");

export default function BookPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ClientOnly fallback={<Spinner />}>
        <BookingFlow />
      </ClientOnly>
    </Suspense>
  );
}
