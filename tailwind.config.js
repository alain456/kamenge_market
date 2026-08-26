/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#f2f8f3',
          100: '#e1f0e4',
          200: '#cbe4d0',
          300: '#a7d2ae',
          400: '#7bb984',
          500: '#2aa848', // Main Brand Green matching image
          600: '#228b3a',
          700: '#1b6f2e',
          800: '#185927',
          900: '#144922',
        },
        brand: {
          green: '#2aa848',
          greenDark: '#1e7e34',
          greenLight: '#e4f5e7',
          bg: '#d2e8d5', // Shell background exact match
        }
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
