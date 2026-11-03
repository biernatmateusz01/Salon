import { pageTitle } from "@/i18n/metadata";
import { ClientsView } from "./ClientsView";

export const generateMetadata = pageTitle("clients");

// Rendered only after the client-side session check, so there is nothing to prerender.
export const instant = false;

export default function Page() {
  return <ClientsView />;
}
