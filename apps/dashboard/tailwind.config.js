/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'hsl(147 68% 45%)',
          foreground: 'hsl(0 0% 98%)',
          50: 'hsl(147 68% 96%)',
          100:'hsl(147 68% 90%)',
          200:'hsl(147 68% 80%)',
          300:'hsl(147 68% 70%)',
          400:'hsl(147 68% 60%)',
          500:'hsl(147 68% 50%)',
          600:'hsl(147 68% 45%)',
          700:'hsl(147 68% 35%)',
          800:'hsl(147 68% 25%)',
          900:'hsl(147 68% 18%)'
        }
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem'
      },
      keyframes: {
        'pulse-soft': { '0%,100%': { opacity: 0.9 }, '50%': { opacity: 1 } },
        'float': { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } }
      },
      animation: {
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite'
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
};
