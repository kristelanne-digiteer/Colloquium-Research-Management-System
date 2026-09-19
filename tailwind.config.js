/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Dark — headers, sidebars, branding, primary buttons
        primary: {
          50: '#eef3f6',
          100: '#dce7ec',
          200: '#b3cbd6',
          300: '#85abbc',
          400: '#4f7f97',
          500: '#2f5a72',
          600: '#1B3C53', // Figma: Primary Dark
          700: '#15303f',
          800: '#102530',
          900: '#0b1a21',
        },
        // Secondary Slate Blue — secondary cards, hover states, borders
        secondary: {
          50: '#eef4f7',
          100: '#dbe8ee',
          200: '#b3cedb',
          300: '#86b0c4',
          400: '#6390a8',
          500: '#456882', // Figma: Secondary Slate Blue
          600: '#375267',
          700: '#2a3e4d',
          800: '#1d2b36',
          900: '#101820',
        },
        // Warm Sand — accents, tag backgrounds, highlights
        accent: {
          50: '#fbf8f6',
          100: '#f6efeb',
          200: '#ecdfd7',
          300: '#D2C1B6', // Figma: Warm Sand
          400: '#c2ac9d',
          500: '#a98c78',
          600: '#8a705e',
        },
        // Off-White / Soft Cream — background canvas
        surface: {
          muted: '#F9F3EF', // Figma: Off-White / Soft Cream
          dark: '#12222c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(27, 60, 83, 0.06), 0 8px 24px rgba(27, 60, 83, 0.08)',
      },
    },
  },
  plugins: [],
};