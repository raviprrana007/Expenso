/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          pressed: 'var(--primary-pressed)',
          soft: 'var(--primary-soft)',
          border: 'var(--primary-border)',
          fg: 'var(--primary-fg)',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          base: 'var(--bg)',
          subtle: 'var(--bg-subtle)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          card: 'var(--surface-card)',
          glass: 'var(--surface-glass)',
          border: 'var(--border)',
          hairline: 'var(--hairline)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        display: ['2.25rem', { lineHeight: '1.12', letterSpacing: '-0.035em', fontWeight: '800' }],
        heading: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '700' }],
        subheading: ['1.125rem', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '600' }],
        caption: ['0.6875rem', { lineHeight: '1.35', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
        card: 'var(--shadow-card)',
        glow: 'var(--glow-primary)',
        'glow-danger': 'var(--glow-danger)',
        'glow-success': 'var(--glow-success)',
        elevate: 'var(--shadow-2)',
        overlay: 'var(--shadow-3)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.4, 0, 0.2, 1)',
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        160: '160ms',
        220: '220ms',
        280: '280ms',
        theme: '280ms',
      },
      keyframes: {
        'ui-fade': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'ui-fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'ui-sheet': {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'ui-fade 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-up': 'ui-fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'sheet': 'ui-sheet 0.34s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
