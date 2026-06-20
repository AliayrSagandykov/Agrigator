import type { MetadataRoute } from "next";

// PWA-манифест — «веб как приложение на телефоне» (тех-док §1).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agrigator — тюторы с верифицированными результатами",
    short_name: "Agrigator",
    description: "Выбирай тютора по реальным результатам, а не по чужому логотипу.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7c3aed",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
