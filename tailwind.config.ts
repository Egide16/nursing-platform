import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C2B31",
        paper: "#F6F4EE",
        teal: "#2F6F62",
        tealdark: "#1F4B41",
        gold: "#B4832E",
        clay: "#A8452F",
        slate: "#6B7378",
        line: "#DAD4C4",
      },
    },
  },
  plugins: [],
};
export default config;
