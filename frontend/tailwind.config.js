/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official FujiNova 7.0 Japanese Travel Brand Palette
        'fuji-blue': '#2878B8',
        'sakura-pink': '#F2A7C0',
        'blossom-rose': '#D96C98',
        'sky-blue': '#9BD7EF',
        'soft-lavender': '#B8A9E8',
        'forest-green': '#4F9A79',
        'warm-cream': '#FFF6EB',
        'deep-navy': '#17253F',
        fuji: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          500: '#2878B8',
          600: '#0369a1',
          700: '#075985',
          800: '#17253F',
          900: '#0c1626',
        },
        sakura: {
          50: '#fff5f8',
          100: '#fde8ef',
          200: '#F2A7C0',
          300: '#e889a7',
          400: '#D96C98',
          500: '#c54f7e',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans JP"',
          'sans-serif'
        ]
      }
    },
  },
  plugins: [],
}
