import type { Metadata, Viewport } from "next";
import { ThemeProvider, THEME_STORAGE_KEY } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attendance Dashboard | RCCG The Brooks",
  description:
    "Service attendance trends for RCCG The Brooks, updated automatically from the church attendance sheet.",
  robots: { index: false, follow: false },
  applicationName: "RCCG The Brooks Attendance",
  appleWebApp: {
    capable: true,
    title: "The Brooks",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

/**
 * Runs before first paint so a dark-mode visitor never sees a white flash.
 * Falls back to the operating system preference on a first visit.
 */
const noFlashScript = `
(function(){
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var dark = stored ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1417" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
