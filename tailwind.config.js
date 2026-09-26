const signal = {
  50: '#fff4ed', 100: '#ffe6d5', 200: '#ffc9a8', 300: '#ffa370', 400: '#ff7a38',
  500: '#ff5f1f', 600: '#e84a0c', 700: '#c0390a', 800: '#99300f', 900: '#7c2910', 950: '#431206',
};
const graphite = {
  50: '#f7f6f3', 100: '#eeece7', 200: '#dedbd4', 300: '#c2beb5', 400: '#9d9990', 500: '#7a766e',
  600: '#5c5953', 700: '#42403c', 800: '#2b2a28', 900: '#1a1918', 950: '#0f0e0d',
};
const bone = {
  50: '#fbf9f5', 100: '#f4f0e8', 200: '#e8e1d4', 300: '#d9cfbd', 400: '#c4b8a2', 500: '#a89a82',
  600: '#8a7d68', 700: '#6b6152', 800: '#4d463c', 900: '#332f29', 950: '#1f1c18',
};

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
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        // Labels, metadata and figures: the UI sans with tabular numerals, so numbers still align.
        mono: [['"IBM Plex Sans"', 'system-ui', 'sans-serif'], { fontFeatureSettings: '"tnum", "zero"' }],
        // Genuine code only: terminals, CLI output, commands.
        code: ['"IBM Plex Mono"', 'ui-monospace', 'Consolas', 'monospace'],
        display: ['"IBM Plex Sans Condensed"', '"IBM Plex Sans"', 'sans-serif'],
      },
      // Drawing-sheet geometry: no soft corners. Only true circles (nodes, LEDs) stay round.
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '9999px',
      },
      colors: {
        // "Live schematic" palette. The UI was authored against emerald/slate/cyan,
        // so remapping those scales restyles every utility in one place.
        emerald: signal, // brand accent → safety orange
        teal: signal,
        slate: graphite, // all neutrals → warm graphite
        cyan: bone, // former secondary accent → bone white
        indigo: bone,
        sky: bone,
        blue: signal,
        signal,
        graphite,
        bone,
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },

        lab: {
          bg: '#070a12',
          surface: '#0d1322',
          surface2: '#131b2e',
          card: '#101726',
          border: '#1f293d',
          borderLight: '#2c3b59',
          accent: '#ff5f1f', // Signal orange
          accentGlow: 'rgba(59, 130, 246, 0.18)',
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

