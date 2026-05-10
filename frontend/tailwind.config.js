/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#43A047',
          DEFAULT: '#2E7D32',
          dark: '#1B5E20',
        }
      }
    },
  },
  plugins: [],
}
