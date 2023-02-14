/** @type import("tailwindcss/tailwind-config").TailwindConfig */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    fontFamily: {
      inter: ['Inter', 'sans-serif'],
    },
    colors: {
      white: '#FFFFFF',
      amber: {
        500: '#F7931A',
      },
      zinc: {
        500: '#70737D',
        800: '#272A31',
      },
      gray: {
        600: '#575B64',
        800: '#222531',
      },
      slate: {
        400: '#8D8CBD',
        800: '#2F3341',
      },
      neutral: {
        900: '#0C0C0E',
      },
      blue: {
        500: '#3E97FF',
        600: '#2969E9',
      },
      red: {
        500: '#FF394A',
        600: '#E10013',
      },
      cyan: {
        600: '#1595B1',
      },
      emerald: {
        400: '#06D888',
        500: '#0CAF75',
      },
      yellow: {
        300: '#FFEF5A',
      },
      brand: '#5F5CFF',
    },
  },

  plugins: [],
}
