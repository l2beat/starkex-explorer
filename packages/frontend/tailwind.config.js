/** @type import("tailwindcss/tailwind-config").TailwindConfig */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fira Sans', 'sans-serif'],
        mono: ['Fira Mono', 'mono'],
      },
      screens: {
        wide: '900px',
      },
    },
    colors: {
      zinc: {
        500: '#70737D',
      },
      white: '#FFFFFF',
      neutral: {
        900: '#0C0C0E',
      },
      blue: {
        50: 'rgba(102, 172, 255, 0.2)',
        100: '#3067BB',
        200: '#5196FF',
        300: '#3366cc',
        400: '#3e8fef',
      },
      gray: {
        800: '#222531',
      },
      amber: {
        500: '#F7931A',
      },
      red: {
        100: '#f43636',
        600: '#e10013',
      },
      green: {
        500: '#5eff5a',
      },
      emerald: {
        400: '#06d888',
      },
      brand: '#5F5CFF',
    },
  },
  plugins: [],
}
