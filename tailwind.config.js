/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'honey-primary': '#F59E0B',
        'honey-dark': '#92400E',
      }
    },
  },
  plugins: [],
}