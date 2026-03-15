/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ocean: {
          950: '#020B18',
          900: '#041628',
          800: '#072340',
          700: '#0A3358',
          600: '#0E4778',
          500: '#1260A8',
          400: '#1A7FD4',
          300: '#4BA3E8',
          200: '#8CCAF5',
          100: '#C6E8FB',
        },
        jade: {
          500: '#10B97B',
          400: '#33CF96',
          300: '#6DE0B5',
        },
        coral: {
          500: '#F05252',
          400: '#F47272',
          300: '#F9A8A8',
        },
        amber: {
          500: '#F59E0B',
          400: '#FBB83A',
        },
      },
    },
  },
  plugins: [],
}
