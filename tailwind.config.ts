import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["var(--font-playfair)", "serif"],
        dancing: ["var(--font-dancing)", "cursive"],
        vietnam: ["var(--font-vietnam)", "sans-serif"],
        quicksand: ["var(--font-quicksand)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sage: "#587C4C",
        brown: "#6D3E28",
        "mint-bg": "#ECFAE8",
        "pink-bg": "#FCF5F2",
      },
      keyframes: {
        upDown: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        upDown: "upDown 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
