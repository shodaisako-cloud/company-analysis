import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe7ff",
          200: "#b8cfff",
          300: "#8bafff",
          400: "#5c8aff",
          500: "#3465f6",
          600: "#254bd1",
          700: "#1e3ca8",
          800: "#1c357f",
          900: "#1a2f60",
        },
      },
    },
  },
  plugins: [],
};

export default config;
