/** @type import("tailwindcss/tailwind-config").TailwindConfig */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
    },
    colors: {
      grey: {
        100: '#20252F',
        200: '#2D2D3A',
        300: '#374354',
        400: '#838F9F',
      },
      white: '#838F9F',
      blue: {
        100: '#3067BB',
        200: '#5196FF',
      },
      orange: {
        100: '#9C4D03',
      },
    },
  },
  plugins: [],
}
