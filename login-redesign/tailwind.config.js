/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base brand ramp (fixed across themes)
        brand: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#2E7D32',
          700: '#1B5E20',
          800: '#134E1A',
          900: '#0B3A12',
        },
        teal: {
          DEFAULT: '#14B8A6',
          soft: '#5EEAD4',
        },
        mint: '#A7F3D0',
        forest: '#0B2B1E',
        // Semantic tokens resolved from CSS variables so they swap with the theme.
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
      },
      boxShadow: {
        card: '0 1px 0 0 rgb(255 255 255 / 0.4) inset, 0 18px 40px -22px rgb(15 23 42 / 0.35)',
        'card-dark': '0 1px 0 0 rgb(255 255 255 / 0.05) inset, 0 22px 50px -24px rgb(0 0 0 / 0.7)',
        glow: '0 10px 30px -12px rgb(var(--brand) / 0.55)',
        key: '0 6px 16px -6px rgb(15 23 42 / 0.22)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      keyframes: {
        'mesh-drift': {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(4%, -3%, 0) scale(1.12)' },
        },
        'float-slow': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        pop: {
          '0%': { transform: 'scale(0.86)', opacity: '0' },
          '60%': { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'row-flash': {
          '0%': { backgroundColor: 'rgb(var(--brand) / 0.22)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'scale-in': {
          from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
          to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'mesh-drift': 'mesh-drift 22s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        shimmer: 'shimmer 1.6s ease-in-out',
        'toast-in': 'toast-in .28s cubic-bezier(.22,1,.36,1)',
        'spin-slow': 'spin-slow 14s linear infinite',
        pop: 'pop .4s cubic-bezier(.22,1,.36,1)',
        'row-flash': 'row-flash 1.6s ease-out',
        'fade-in': 'fade-in .18s ease-out',
        'slide-right': 'slide-right .26s cubic-bezier(.22,1,.36,1)',
        'slide-left': 'slide-left .26s cubic-bezier(.22,1,.36,1)',
        'slide-up': 'slide-up .26s cubic-bezier(.22,1,.36,1)',
        'scale-in': 'scale-in .2s cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
}
