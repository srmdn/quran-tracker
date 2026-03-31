/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./template.html",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#2A65AE",
        "primary-dark": "#1e4f8a",
        "primary-light": "#eff6ff",
        "background": "#f8fafd",
        "surface": "#ffffff",
        "border-light": "#e2e8f0",
        "text-main": "#1e293b",
        "text-secondary": "#64748b",
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "full": "9999px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
}
