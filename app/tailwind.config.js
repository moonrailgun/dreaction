/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FFF9E6',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFD700',
          DEFAULT: '#FFC107',
          500: '#FFC107',
          600: '#FFB300',
          700: '#C8A600',
          800: '#B8860B',
          900: '#8B6914',
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
        'gold-gradient-hover': 'linear-gradient(135deg, #FFC107 0%, #8B6914 100%)',
      },
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(255, 215, 0, 0.39)',
        'gold-lg': '0 10px 40px 0 rgba(255, 215, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
