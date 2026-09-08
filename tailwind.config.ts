import type { Config } from "tailwindcss";

/**
 * Palette sampled from the church logo: the teal "Brooks" wordmark, the orange
 * and grey swooshes above the "oo", and the charcoal of "The" and the tagline.
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Teal — the wordmark, and the dashboard's primary.
        brand: {
          50: "#f0fafb",
          100: "#d8f2f5",
          200: "#b4e6ec",
          300: "#82d5df",
          400: "#4cbecd",
          500: "#35b5c2",
          600: "#2494a3",
          700: "#227784",
          800: "#23616c",
          900: "#21515c",
          950: "#0f353d",
        },
        // Orange — the second swoosh, used for accents and the median line.
        accent: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed6aa",
          300: "#fbc389",
          400: "#f7a355",
          500: "#ef8b24",
          600: "#db6f13",
          700: "#b55312",
          800: "#924316",
          900: "#763915",
        },
        // Charcoal — "The" and the tagline.
        ink: {
          400: "#8a8b8d",
          500: "#6d6e71",
          600: "#58595b",
          700: "#454648",
        },
        // Dark-mode surfaces, tinted very slightly teal so they sit with the brand.
        night: {
          900: "#0b1417",
          850: "#0f1b1f",
          800: "#132227",
          700: "#1b2f36",
          600: "#264048",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
