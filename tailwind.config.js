/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        md: '768px',
      },
      colors: {
        bg: '#F8F7F4',
        surface: '#FFFFFF',
        border: '#E8E5DF',
        primary: '#1A1916',
        secondary: '#78756E',
        'accent-red': '#DC2626',
        'accent-red-light': '#FEF2F2',
        'accent-green': '#16A34A',
        'accent-green-light': '#F0FDF4',
        'accent-blue': '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}
