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
      borderRadius: {
        'action-button': '0.25rem',
      }
    },
    colors: {
      grey: {
        100: '#20252F',
        200: '#2D2D3A',
        300: '#374354',
        400: '#838F9F',
        500: '#70737D'
      },
      white: '#FAFAFA',
      blue: {
        100: '#3067BB',
        200: '#5196FF',
        900: '#222531',
      },
      orange: {
        100: '#9C4D03',
      },
      red: {
        100: '#f43636',
      },
      yellow: {
        100: '#cb9800',
      },
      purple: {
        100: '#5F5CFF',
      },
      'dydx-brand-color': '#5F5CFF'
    },
  },
  plugins: [],
}
