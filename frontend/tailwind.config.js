/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official FujiNova 8.0 Sakura Garden Japanese Tourism Palette
        'warm-ivory': '#F7EFE5',
        'ivory-card': '#FFFFFF',
        'ivory-border': '#EAE0D0',
        'ivory-dark': '#E8DEC9',
        'sakura-pink': '#E9A5B5',
        'sakura-light': '#FDF2F4',
        'sakura-border': '#F3C5D0',
        'ink-charcoal': '#29252B',
        'charcoal-muted': '#5A525E',
        'charcoal-light': '#8A808F',
        'matcha-green': '#789477',
        'matcha-light': '#EFF5EE',
        'matcha-border': '#A4BBA3',
        'sunset-vermilion': '#C66B4E',
        'vermilion-hover': '#B2583D',
        'vermilion-light': '#F8ECE8',
        'wisteria-purple': '#B99BCB',
        'wisteria-light': '#F4EFF7',
        // Semantic aliases
        ivory: {
          50: '#FDFCFB',
          100: '#FAF6F0',
          200: '#F7EFE5',
          300: '#EFE4D4',
          400: '#E4D5BF',
          500: '#D5C1A3',
        },
        sakura: {
          50: '#FDF7F8',
          100: '#FCEEF1',
          200: '#F7D4DD',
          300: '#E9A5B5',
          400: '#DC7E94',
          500: '#C75A74',
        },
        charcoal: {
          50: '#F5F4F6',
          100: '#E7E5E9',
          200: '#CBC7CE',
          400: '#8A808F',
          600: '#5A525E',
          800: '#3D3740',
          900: '#29252B',
          950: '#1E1A20',
        },
        matcha: {
          50: '#F6F9F5',
          100: '#EFF5EE',
          200: '#D9E6D7',
          300: '#ADC4AA',
          400: '#789477',
          500: '#5F7C5E',
          600: '#486247',
        },
        vermilion: {
          50: '#FDF8F6',
          100: '#F8ECE8',
          200: '#F0D4CC',
          300: '#E2ABA0',
          400: '#C66B4E',
          500: '#B2583D',
          600: '#94442C',
        },
        wisteria: {
          50: '#FAF8FC',
          100: '#F4EFF7',
          200: '#E5D9EB',
          300: '#CEB8DC',
          400: '#B99BCB',
          500: '#9C78B2',
          600: '#7F5B95',
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
        ],
        serif: [
          '"Noto Serif JP"',
          '"Yu Mincho"',
          '"Hiragino Mincho ProN"',
          'Georgia',
          'serif'
        ]
      }
    },
  },
  plugins: [],
}
