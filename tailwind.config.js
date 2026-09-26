/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        lab: {
          bg: '#070a12',
          surface: '#0d1322',
          surface2: '#131b2e',
          card: '#101726',
          border: '#1f293d',
          borderLight: '#2c3b59',
          accent: '#10b981', // Emerald
          accentGlow: 'rgba(16, 185, 129, 0.18)',
          cyan: '#06b6d4',
          amber: '#f59e0b',
          rose: '#f43f5e',
          purple: '#8b5cf6',
          blue: '#3b82f6',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'packet-move': 'packetTransit 2s linear infinite',
      },
      keyframes: {
        packetTransit: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}

