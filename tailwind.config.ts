import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#090A0F",
        panel: "#11131C",
        line: "rgba(255,255,255,0.09)",
        violet: "#9B8CFF",
        mint: "#9BE7CF"
      },
      boxShadow: {
        glow: "0 0 50px rgba(155,140,255,0.12)"
      }
    }
  },
  plugins: []
};
export default config;