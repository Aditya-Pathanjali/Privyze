/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable class-based dark mode
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // blue for actions
        safe: '#10B981', // green
        danger: '#EF4444', // red
        warning: '#F59E0B', // amber
        brand: '#8A2BE2', // purple accent
        background: '#0B0F14', // deep navy
        surface: '#111827', // slightly lighter
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
      },
      boxShadow: {
        glow: '0 0 8px rgba(138,43,226,0.6)',
      },
    },
  },
  plugins: [],
};
