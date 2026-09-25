/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          light: '#DFB86C',
          DEFAULT: '#C5A059',
          dark: '#A6823B',
        }
      }
    },
  },
  plugins: [],
}
