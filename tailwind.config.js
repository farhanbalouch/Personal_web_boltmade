/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0e17',
        'bg-soft': '#111726',
        'bg-card': '#131b2e',
        border: '#1f2937',
        text: '#e8edf5',
        'text-muted': '#9aa7bd',
        gold: '#e8b14b',
        'gold-soft': '#f0c878',
        teal: '#3fb5a4',
        'teal-soft': '#6fd9c9',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', 'serif'],
      },
      spacing: {
        '18': '4.5rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.08)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3.5s linear infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
