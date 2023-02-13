/** @type import("tailwindcss/tailwind-config").TailwindConfig */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    colors: {
      white: '#FFFFFF', // White
      amber: {
        500: '#F7931A', // Orange 1
      },
      zinc: {
        500: '#70737D', // Gray 1
      },
      gray: {
        600: '#575B64', // Gray 2
        800: '#222531', // Elements background base
      },
      slate: {
        800: '#2F3341', // Elements background base 2 Gunmetal
      },
      neutral: {
        900: '#0C0C0E', // Background
      },
      blue: {
        500: '#3E97FF', // Blue 1
        600: '#2969E9', // Blue 1 - TEXT
      },
      red: {
        500: '#FF394A', // Red 1 - TEXT
        600: '#E10013', // Red 1
      },
      cyan: {
        600: '#1595B1', // Blue 2
      },
      emerald: {
        400: '#06D888', // Green (positive)
        500: '#0CAF75', // Green 2
      },
      yellow: {
        300: '#FFEF5A', // Yellow 1
      },
      brand: '#5F5CFF', // Brand Color
    },
  },
  plugins: [],
}
