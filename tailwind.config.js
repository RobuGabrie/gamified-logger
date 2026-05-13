/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "#f8f1e9",
        blush: "#e6b5b3",
        rose: "#c98a8a",
        cocoa: "#3b2d2d",
        gold: "#caa26b",
        sage: "#9bb7a3",
        sand: "#f3e6d7"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(59,45,45,0.12)",
        glow: "0 0 0 1px rgba(202,162,107,0.4), 0 12px 30px rgba(202,162,107,0.25)"
      },
      keyframes: {
        floatUp: {
          "0%": { transform: "translateY(0)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { transform: "translateY(-24px)", opacity: "0" }
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" }
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        floatUp: "floatUp 1.6s ease-out",
        pulseSoft: "pulseSoft 1.8s ease-in-out infinite",
        fadeIn: "fadeIn 0.45s ease-out"
      }
    }
  },
  plugins: []
};
