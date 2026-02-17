import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mpl: {
          primary: "#0EA5E9",
          primaryDark: "#0284C7",
          primaryLight: "#E0F2FE",
          accent: "#F59E0B",
          bg: "#F8FAFC",
          surface: "#FFFFFF",
          border: "#E2E8F0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
