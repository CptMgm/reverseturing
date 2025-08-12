/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-blue': '#00ffff',
        'matrix-green': '#00ff00',
        'danger-red': '#ff0040',
        'ai-purple': '#9945ff',
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
        'game': ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          'from': { boxShadow: '0 0 10px #00ffff, 0 0 20px #00ffff' },
          'to': { boxShadow: '0 0 20px #00ffff, 0 0 30px #00ffff' }
        }
      }
    },
  },
  plugins: [],
}