/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff3b30',
        background: '#000000',
        surface: '#1c1c1e',
        surface2: '#2c2c2e',
        text: '#ffffff',
        textSecondary: '#8e8e93',
        border: '#3a3a3c',
      },
    },
  },
  plugins: [],
}