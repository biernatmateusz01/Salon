import type { Metadata } from "next";
import { ClientsView } from "./ClientsView";

export const metadata: Metadata = { title: "Clients" };

// Rendered only after the client-side session check, so there is nothing to prerender.
export const instant = false;

export default function Page() {
  return <ClientsView />;
}
