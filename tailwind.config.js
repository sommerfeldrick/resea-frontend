/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: [
      './index.html',
      './src/**/*.{js,ts,jsx,tsx}',
      './*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
      './contexts/**/*.{js,ts,jsx,tsx}',
      './hooks/**/*.{js,ts,jsx,tsx}',
      './services/**/*.{js,ts,jsx,tsx}'
    ]
  },
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        secondary: 'var(--color-secondary)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
}
