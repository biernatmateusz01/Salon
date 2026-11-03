import type { Metadata } from "next";
import { MyVisits } from "./MyVisits";

export const metadata: Metadata = { title: "My visits" };

// Rendered only after the client-side session check, so there is nothing to prerender.
export const instant = false;

export default function Page() {
  return <MyVisits />;
}
