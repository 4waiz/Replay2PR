import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07090c",
          900: "#0d1117",
          800: "#121a24",
          700: "#1b2633",
          600: "#243244"
        },
        steel: {
          400: "#9ab0c8",
          300: "#b6c6d9",
          200: "#d5e2f2"
        },
        mint: {
          400: "#37f5c2",
          300: "#7af5d6"
        },
        sky: {
          400: "#60a5fa",
          300: "#93c5fd"
        },
        amberish: {
          400: "#fbbf24",
          300: "#fcd34d"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 40px rgba(56, 189, 248, 0.15)",
        soft: "0 20px 60px rgba(6, 12, 19, 0.45)",
        card: "0 14px 45px rgba(6, 12, 19, 0.35)"
      },
      backgroundImage: {
        "radial-glow": "radial-gradient(circle at top, rgba(56,189,248,0.25), transparent 55%)",
        "mesh": "linear-gradient(120deg, rgba(16,185,129,0.12), rgba(59,130,246,0.12) 45%, rgba(14,165,233,0.18))"
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
          "50%": { transform: "translateY(-6px)" }
        }
      },
      animation: {
        shimmer: "shimmer 2.2s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        floaty: "floaty 6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
