/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      },
      colors: {
        ink: "#eef2ff",
        sand: "#05030d",
        brass: "#ff5ab3",
        spruce: "#61d3ff",
        mist: "#161127",
        orchid: "#8f5dff",
        night: "#0c0818"
      },
      boxShadow: {
        card: "0 22px 60px rgba(0, 0, 0, 0.45)"
      }
    }
  },
  plugins: []
};
