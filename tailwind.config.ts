import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.2' }],
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'display': ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        'amber': {
          '50': '#fffbeb',
          '100': '#fef3c7',
          '150': '#fde8a8',
          '200': '#fcd34d',
          '250': '#fbca38',
          '300': '#fbbf24',
          '350': '#faa907',
          '400': '#f59e0b',
          '500': '#f97316',
          '600': '#dc2626',
          '700': '#b45309',
          '800': '#92400e',
          '900': '#78350f',
          '950': '#451a03',
        },
      },
      animation: {
        'fadeIn': 'fadeIn 0.4s ease-out forwards',
        'slideInUp': 'slideInUp 0.3s ease-out forwards',
        'slideInDown': 'slideInDown 0.3s ease-out forwards',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slideInUp': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slideInDown': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      maxWidth: {
        'container-sm': '36rem',
        'container-md': '48rem',
        'container-lg': '64rem',
        'container-xl': '80rem',
      },
    },
  },
  plugins: [],
};

export default config;
