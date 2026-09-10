import type { MetadataRoute } from "next";

/**
 * Makes the dashboard installable on a phone's home screen. Android Chrome
 * needs a name, a 192 and a 512 icon, a start_url and display "standalone"
 * before it will offer the install prompt.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RCCG The Brooks Attendance",
    short_name: "The Brooks",
    description:
      "Service attendance for RCCG The Brooks, read live from the church attendance sheet.",
    // Landing on the dashboard rather than /login means an already signed in
    // phone opens straight into the numbers.
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // The window chrome colour. Teal from the logo wordmark.
    theme_color: "#35b5c2",
    // Shown behind the splash screen while the app starts. Kept light because
    // the theme is per device and this cannot know which way it is set.
    background_color: "#f4f8f9",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops this one to the device's icon shape, so it carries extra
      // margin around the wordmark.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
