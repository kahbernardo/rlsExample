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
        surface: "var(--surface)",
        surfaceElevated: "var(--surface-elevated)",
        border: "var(--border)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        accent: "var(--accent)",
      },
    },
  },
  plugins: [],
};

export default config;
