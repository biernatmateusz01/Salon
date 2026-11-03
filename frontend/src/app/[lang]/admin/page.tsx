import { pageTitle } from "@/i18n/metadata";
import { CalendarView } from "./CalendarView";

export const generateMetadata = pageTitle("calendar");

// Rendered only after the client-side session check, so there is nothing to prerender.
export const instant = false;

export default function Page() {
  return <CalendarView />;
}
