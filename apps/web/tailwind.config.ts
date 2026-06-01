import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        andromeda: {
          DEFAULT: "#6d28d9",
          dark: "#4c1d95",
          light: "#a78bfa",
        },
      },
    },
  },
  plugins: [],
};

export default config;
