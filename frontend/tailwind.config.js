/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          bg: '#050811',
          slate: '#0f172a',
          dark: '#080c16'
        },
        neon: {
          cyan: '#00f0ff',
          glow: 'rgba(0, 240, 255, 0.15)',
          amber: '#ffaa00',
          critical: '#ff3366',
          emerald: '#00ff9d'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Orbitron"', '"Syne"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
