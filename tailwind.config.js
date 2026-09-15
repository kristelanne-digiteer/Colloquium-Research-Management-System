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
        primary: '#1B3C53',   // Primary Dark
        secondary: '#456882', // Secondary Slate Blue
        sand: '#D2C1B6',      // Warm Sand
        cream: '#F9F3EF',     // Soft Cream
      }
    },
  },
  plugins: [],
}