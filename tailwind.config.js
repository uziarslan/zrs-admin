/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand teal (#295860)
        primary: {
          50: '#f0f6f7',
          100: '#d4e5e7',
          200: '#a8cbd0',
          300: '#7db0b8',
          400: '#5295a0',
          500: '#3a7a85',
          600: '#295860',
          700: '#1f444a',
          800: '#143036',
          900: '#0a1c1f',
        },
        // Bronze/gold accent (#bd925c)
        accent: {
          50: '#faf6f0',
          100: '#f5ecdf',
          200: '#e8d5b8',
          300: '#dcbe92',
          400: '#cfa86b',
          500: '#c39849',
          600: '#bd925c',
          700: '#9a7549',
          800: '#654721',
          900: '#4a3418',
        },
        ink: {
          900: '#181a20',
          800: '#202d45',
          700: '#1e1515',
        },
      },
      fontFamily: {
        sans: ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 10px 30px -10px rgba(41, 88, 96, 0.3)',
        'accent': '0 10px 30px -10px rgba(189, 146, 92, 0.3)',
      },
    },
  },
  plugins: [],
}
