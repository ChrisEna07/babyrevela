import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Baby Revela — Revelación de Sexo",
    short_name: "Baby Revela",
    description:
      "Vota si será niño o niña y vive la revelación en tiempo real con tus invitados.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff8f0",
    theme_color: "#a6d8f0",
    lang: "es",
    categories: ["events", "social", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
