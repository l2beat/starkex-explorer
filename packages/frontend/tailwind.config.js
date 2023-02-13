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
        300: '#F7931A',
      },
      red: {
        100: '#f43636',
        300: '#e10013',
      },
      green: {
        100: '#06d888',
        500: '#5eff5a',
      },
      'dydx-brand-color': '#5F5CFF',
    },
  },
  plugins: [],
}
