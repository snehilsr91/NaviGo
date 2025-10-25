/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        purplePrimary: "#6B46C1", // primary purple
        orangeAccent: "#F97316", // orange
        grayLight: "#F7FAFC", // light background
        grayDark: "#4A5568", // text gray
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
