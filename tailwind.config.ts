import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)"
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        pop: "0 10px 0 rgba(36, 24, 66, 0.18)",
        candy: "0 18px 40px rgba(255, 115, 185, 0.25)",
        sticker: "0 12px 0 rgba(20, 10, 40, 0.12)",
        soft: "0 30px 80px rgba(31, 23, 68, 0.2)"
      },
      backgroundImage: {
        "hero-pink": "linear-gradient(135deg, #ff7ad9 0%, #ffae70 45%, #ffe26a 100%)",
        "hero-cyan": "linear-gradient(135deg, #7af5ff 0%, #7aa8ff 45%, #b68bff 100%)",
        "hero-lime": "linear-gradient(135deg, #c6ff6d 0%, #7dffb0 45%, #5be4ff 100%)",
        "hero-blue": "linear-gradient(135deg, #77b5ff 0%, #64d2ff 50%, #4af2c8 100%)",
        "dot-grid": "radial-gradient(circle at 1px 1px, rgba(70, 55, 120, 0.15) 1px, transparent 0)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "-135% 0%" }
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1.5deg)" }
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)" }
        },
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(140px) rotate(180deg)", opacity: "0" }
        }
      },
      animation: {
        shimmer: "shimmer 2.2s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        floaty: "floaty 7s ease-in-out infinite",
        wiggle: "wiggle 0.45s ease-in-out",
        pop: "pop 0.35s ease-out",
        confetti: "confetti 0.9s ease-out forwards"
      },
      borderRadius: {
        blob: "28px"
      }
    }
  },
  plugins: []
};

export default config;
