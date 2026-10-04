import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00D9FF',
          purple: '#D946EF',
          green: '#00FF88',
          pink: '#FF006E',
        },
        ink: '#0a0a0a',
      },
      fontFamily: {
        heading: ["'Space Mono'", 'monospace'],
        body: ["'Inter'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
        sans: ["'Inter'", 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
        'neon-cyan': '0 0 20px rgba(0, 217, 255, 0.35)',
        'neon-purple': '0 0 20px rgba(217, 70, 239, 0.35)',
      },
      keyframes: {
        'glow-pulse': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.8' } },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'orb-float': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(40px,-30px) scale(1.1)' },
          '66%': { transform: 'translate(-30px,25px) scale(0.95)' },
        },
        'spin-slow': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.6s ease-out both',
        'orb-float': 'orb-float 12s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
