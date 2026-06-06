import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        border: "var(--border)",
        profit: "var(--green-profit)",
        loss: "var(--red-loss)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
      },
      boxShadow: {
        soft: "0 8px 30px rgb(0, 0, 0, 0.04)",
        "soft-dark": "0 8px 30px rgb(0, 0, 0, 0.2)",
        premium: "0 10px 40px -10px rgba(0, 0, 0, 0.05)",
        "premium-dark": "0 10px 40px -10px rgba(0, 0, 0, 0.3)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;

