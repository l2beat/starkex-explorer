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
      },
    },
    colors: {
      grey: {
        100: '#20252F',
        200: '#2D2D3A',
        300: '#374354',
        400: '#838F9F',
        500: '#70737D',
      },
      white: '#FAFAFA',
      background: '#0c0c0e',
      blue: {
        50: 'rgba(102, 172, 255, 0.2)',
        100: '#3067BB',
        200: '#5196FF',
        300: '#3366cc',
        400: '#3e8fef',
        900: '#222531',
      },
      orange: {
        100: '#9C4D03',
        300: '#F7931A',
      },
      red: {
        100: '#f43636',
        200: '#ff394a',
        300: '#e10013',
      },
      green: {
        100: '#06d888',
        500: '#5eff5a',
      },
      yellow: {
        100: '#cb9800',
      },
      purple: {
        100: '#5F5CFF',
      },
      'dydx-brand-color': '#5F5CFF',
    },
  },
  plugins: [],
}
