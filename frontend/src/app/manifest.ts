import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Salon — Barber & Beauty",
    short_name: "Salon",
    description: "Book your next haircut or beauty treatment in seconds.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ee",
    theme_color: "#1f1a17",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Book a visit", url: "/book" },
      { name: "My visits", url: "/my" },
    ],
  };
}
