import type { Metadata } from "next";
import { CalendarView } from "./CalendarView";

export const metadata: Metadata = { title: "Calendar" };

// Rendered only after the client-side session check, so there is nothing to prerender.
export const instant = false;

export default function Page() {
  return <CalendarView />;
}
