/** @type import("tailwindcss/tailwind-config").TailwindConfig */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    fontSize: {
      xxs: ['12px', '12px'],
      xs: ['13px', '13px'],
      sm: ['14px', '14px'],
      md: ['15px', '15px'],
      lg: ['16px', '16px'],
      xl: ['24px', '24px'],
      xxl: ['32px', '32px'],
    },
    colors: {
      transparent: 'transparent',
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
        800: '#2F3341',
      },
      neutral: {
        900: '#0C0C0E',
      },
      blue: {
        50: 'rgba(102, 172, 255, 0.2)',
        200: '#5196FF',
        300: '#3366cc',
        400: '#3e8fef',
        500: '#3E97FF',
        600: '#2969E9',
        700: '#3067BB',
      },
      red: {
        400: '#f43636',
        500: '#FF394A',
        600: '#E10013',
      },
      green: {
        400: '#5eff5a',
      },
      emerald: {
        400: '#06D888',
        500: '#0CAF75',
      },
      cyan: {
        600: '#1595B1',
      },
      yellow: {
        300: '#FFEF5A',
      },
      brand: '#5F5CFF',
    },
  },
  plugins: [],
}
