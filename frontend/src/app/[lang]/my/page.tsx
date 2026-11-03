import { pageTitle } from "@/i18n/metadata";
import { MyVisits } from "./MyVisits";

export const generateMetadata = pageTitle("my");

// Rendered only after the client-side session check, so there is nothing to prerender.
export const instant = false;

export default function Page() {
  return <MyVisits />;
}
