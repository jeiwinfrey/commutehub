import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CommuteHub",
    short_name: "CommuteHub",
    description: "Track rides, explore routes, and get pickup and weather alerts.",
    start_url: "/home",
    display: "standalone",
    orientation: "portrait",
    background_color: "#00A6FF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
