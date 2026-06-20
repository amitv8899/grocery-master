import type { Config } from "tailwindcss";

const config: Config = {
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
        warm: {
          bg: '#F1EFE8',
          card: '#FBFAF7',
          border: '#E7E3DA',
          muted: '#D3D1C7',
          text: '#1B1A17',
          sub: '#888780',
          fade: '#B4B2A9',
        },
        accent: {
          green: '#1D9E75',
        },
      },
    },
  },
  plugins: [],
};
export default config;
