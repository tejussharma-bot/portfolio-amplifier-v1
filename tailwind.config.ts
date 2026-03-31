import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        ring: "hsl(var(--ring))",
        ink: {
          50: "#f6f7f8",
          100: "#e8ebee",
          200: "#cbd3d9",
          300: "#a7b5c0",
          400: "#7b8e9d",
          500: "#5d7182",
          600: "#485a6b",
          700: "#3a4958",
          800: "#303c48",
          900: "#1f2933"
        },
        tide: {
          50: "#effaf9",
          100: "#d7f2ee",
          200: "#b1e5dd",
          300: "#7fd0c4",
          400: "#4fb8aa",
          500: "#2b9d92",
          600: "#1f7d76",
          700: "#1d645f",
          800: "#1b504d",
          900: "#163f3d"
        },
        coral: {
          50: "#fff5f0",
          100: "#ffe7d8",
          200: "#ffccb0",
          300: "#ffab7d",
          400: "#ff7f4d",
          500: "#f55d29",
          600: "#dd4618",
          700: "#b83715",
          800: "#933019",
          900: "#752a17"
        },
        sand: {
          50: "#fffdf7",
          100: "#fff8ea",
          200: "#f9ecd0",
          300: "#f1d8a4",
          400: "#e6bc69",
          500: "#da9f38",
          600: "#bf7f29",
          700: "#9d6024",
          800: "#824d25",
          900: "#6c4023"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2rem"
      },
      boxShadow: {
        glow: "0 20px 70px -35px rgba(245, 93, 41, 0.45)",
        panel: "0 30px 80px -45px rgba(31, 41, 51, 0.28)"
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at 20% 20%, rgba(245,93,41,0.18), transparent 32%), radial-gradient(circle at 82% 18%, rgba(43,157,146,0.16), transparent 28%), radial-gradient(circle at 52% 82%, rgba(218,159,56,0.18), transparent 26%)",
        "grid-fade":
          "linear-gradient(rgba(31,41,51,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(31,41,51,0.05) 1px, transparent 1px)"
      },
      keyframes: {
        appear: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        appear: "appear 0.7s ease-out",
        float: "float 7s ease-in-out infinite",
        shimmer: "shimmer 2.8s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;

