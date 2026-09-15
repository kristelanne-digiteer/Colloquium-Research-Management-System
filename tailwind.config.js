/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B3C53',
        secondary: '#456882',
        sand: '#D2C1B6',
        cream: '#F9F3EF',
      }
    },
  },
  plugins: [],
}