import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#F0455A",
          light: "#FF8A93",
          dark: "#C22C40",
          cyan: "#C2760C",
        },
        ink: "#22201E",
        paper: "#FFFDFB",
        surface: "#FCF6F1",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        grid:
          "linear-gradient(to right, rgba(34,32,30,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,32,30,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "44px 44px",
      },
    },
  },
  plugins: [],
};

export default config;
