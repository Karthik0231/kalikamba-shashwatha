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
        ink: {
          DEFAULT: '#17251F',
          dark: '#0F1814',
        },
        forest: {
          deep: '#173D30',
          muted: '#527263',
          light: '#EAF0EC',
          hover: '#1F4C3D',
        },
        gold: {
          DEFAULT: '#B88A3B',
          muted: '#C99B4B',
          light: '#F8F3EA',
          border: '#E8D7B5',
        },
        temple: {
          bg: 'var(--bg-page)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          border: 'var(--border-color)',
          text: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Kannada', 'sans-serif'],
        kannada: ['Noto Sans Kannada', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
