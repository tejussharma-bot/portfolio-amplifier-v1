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
        background: "#f7f9fb",
        foreground: "#131b2e",
        card: "#ffffff",
        "card-foreground": "#131b2e",
        border: "rgba(197, 197, 217, 0.16)",
        input: "rgba(218, 226, 253, 0.4)",
        muted: "#f2f4f6",
        "muted-foreground": "#444656",
        ring: "#2f1bdb",
        primary: {
          DEFAULT: "#2f1bdb",
          foreground: "#ffffff"
        },
        secondary: {
          DEFAULT: "#4f6077",
          foreground: "#ffffff"
        },
        accent: {
          DEFAULT: "#4a41f2",
          foreground: "#ffffff"
        },
        surface: "#f7f9fb",
        "surface-bright": "#f7f9fb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        outline: "#777587",
        "outline-variant": "#c5c5d9",
        "on-surface": "#131b2e",
        "on-surface-variant": "#444656",
        "secondary-container": "#d0e1fb",
        "on-secondary-container": "#38485d",
        "primary-fixed": "#e2dfff",
        "primary-container": "#4a41f2",
        "inverse-surface": "#283044",
        "inverse-on-surface": "#eef0ff",
        ink: {
          50: "#f4f6fb",
          100: "#e9edfa",
          200: "#d6dcf5",
          300: "#b8c0e9",
          400: "#8f99c2",
          500: "#66708f",
          600: "#505a78",
          700: "#3c4660",
          800: "#283044",
          900: "#131b2e"
        },
        coral: {
          50: "#fff1f3",
          100: "#ffe1e5",
          200: "#ffc7cf",
          300: "#ff9eab",
          400: "#ff7387",
          500: "#ef5a5a",
          600: "#d24749",
          700: "#b0363f",
          800: "#8d2d38",
          900: "#752834"
        },
        tide: {
          50: "#eefbfd",
          100: "#d6f5fb",
          200: "#b2ebf8",
          300: "#7ed9ef",
          400: "#3ec2de",
          500: "#1aa9ca",
          600: "#0f84a8",
          700: "#0b667f",
          800: "#0d5668",
          900: "#0f4858"
        },
        sand: {
          50: "#fff7ef",
          100: "#ffedd8",
          200: "#ffd8ad",
          300: "#ffbc75",
          400: "#ff9b43",
          500: "#f7841e",
          600: "#dd630f",
          700: "#b64610",
          800: "#933715",
          900: "#772f15"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        label: ["var(--font-label)", "sans-serif"]
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1.25rem",
        "3xl": "2rem",
        "4xl": "2.5rem"
      },
      boxShadow: {
        ambient: "0 24px 48px rgba(19, 27, 46, 0.06)",
        floating: "0 24px 48px rgba(19, 27, 46, 0.1)",
        glow: "0 18px 40px rgba(47, 27, 219, 0.18)",
        panel: "0 18px 36px rgba(19, 27, 46, 0.05)"
      },
      backgroundImage: {
        "pulse-primary": "linear-gradient(135deg, #2f1bdb 0%, #4a41f2 100%)",
        "pulse-secondary": "linear-gradient(135deg, #0f84a8 0%, #3ec2de 100%)",
        "gallery-glow":
          "radial-gradient(circle at top left, rgba(47,27,219,0.1), transparent 28%), radial-gradient(circle at top right, rgba(15,132,168,0.08), transparent 24%), linear-gradient(180deg, #f7f9fb 0%, #f6f8fa 52%, #eef2f6 100%)"
      },
      keyframes: {
        appear: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        }
      },
      animation: {
        appear: "appear 0.7s ease-out",
        float: "float 7s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
