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
      grey: {
        100: '#20252F',
        200: '#2D2D3A',
        300: '#374354',
        400: '#838F9F',
      },
      white: '#FAFAFA',
      blue: {
        100: '#3067BB',
        200: '#5196FF',
      },
      orange: {
        100: '#9C4D03',
      },
      red: {
        100: '#f43636',
      },
    },
  },
  plugins: [],
}
