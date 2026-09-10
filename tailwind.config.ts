import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Night mode. Deliberately NOT pure black: on an LCD iPhone (and any
      // non-OLED panel) #000 can't actually switch pixels off, so it renders
      // as backlight grey and the page looks washed out and cheap. A warm
      // near-black reads as an intentional colour on every screen, and on
      // OLED it still looks near-black. It also avoids the halation you get
      // from white-on-pure-black text.
      colors: {
        brand: {
          DEFAULT: "#F0455A",
          light: "#FF8A93",
          dark: "#C22C40",
          // Lifted from #C2760C: the old amber was mixed for contrast against
          // a near-white page and only manages ~5:1 on this background, which
          // is thin for the small mono labels and prices it's used on.
          cyan: "#E9A83F",
        },
        ink: "#F6F1EA",
        paper: "#14120F",
        surface: "#1D1A15",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        grid:
          "linear-gradient(to right, rgba(246,241,234,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(246,241,234,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "44px 44px",
      },
    },
  },
  plugins: [],
};

export default config;
