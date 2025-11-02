import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#C60000',
          dark: '#0C0F14',
          mid:  '#12161D',
          light:'#F4F6F8',
        },
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 6px 24px rgba(0,0,0,.18)',
      },
    },
  },
  plugins: [],
} satisfies Config
