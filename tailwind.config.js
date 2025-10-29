/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./{App,index}.tsx", "./{components,contexts,data,hooks,services,styles,types}/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
