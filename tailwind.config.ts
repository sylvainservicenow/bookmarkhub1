import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(180deg, #FFF7ED 0%, #FFEDD5 50%, #FEF3C7 100%)',
        'hero-pattern': 'radial-gradient(ellipse at 20% 80%, rgba(251, 146, 60, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(251, 146, 60, 0.1) 0%, transparent 50%)',
      },
    },
  },
  plugins: [],
}
export default config
