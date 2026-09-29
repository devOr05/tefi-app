/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tefi: {
          primary: '#00A650', // Verde confianza estilo fintech
          primaryDark: '#008740',
          accent: '#2962FF',  // Azul Solana / Web3
          solana: '#9945FF',  // Purpura Solana
          gold: '#FFB800',
          dark: '#1E232A',
          card: '#FFFFFF',
          bg: '#F4F6F9',
        }
      }
    },
  },
  plugins: [],
}
