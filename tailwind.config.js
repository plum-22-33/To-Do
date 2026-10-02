/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Thai"', "Sarabun", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
