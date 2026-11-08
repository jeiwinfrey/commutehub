import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CommuteHub",
    short_name: "CommuteHub",
    description: "Live jeepney and bus ETAs, seat status and your best time to leave.",
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
