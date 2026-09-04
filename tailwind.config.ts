import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#ff5a1f",
          dark: "#c2410c",
          ink: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
