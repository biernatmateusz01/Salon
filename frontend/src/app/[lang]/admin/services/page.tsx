import { pageTitle } from "@/i18n/metadata";
import { ServicesView } from "./ServicesView";

export const generateMetadata = pageTitle("services");

// Rendered only after the client-side session check, so there is nothing to prerender.
export const instant = false;

export default function Page() {
  return <ServicesView />;
}
