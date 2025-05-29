/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0d1117',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#161b22',
          foreground: '#c9d1d9',
        },
        accent: {
          DEFAULT: '#238636',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#f85149',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#8b949e',
          foreground: '#c9d1d9',
        },
        warning: {
          DEFAULT: '#f1e05a',
          foreground: '#24292e',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};