import type { Metadata } from "next";
import { ServicesView } from "./ServicesView";

export const metadata: Metadata = { title: "Services" };

// Rendered only after the client-side session check, so there is nothing to prerender.
export const instant = false;

export default function Page() {
  return <ServicesView />;
}
