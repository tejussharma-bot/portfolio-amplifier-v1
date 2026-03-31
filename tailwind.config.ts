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
        background: "#faf8ff",
        foreground: "#131b2e",
        card: "#ffffff",
        "card-foreground": "#131b2e",
        border: "rgba(197, 197, 217, 0.16)",
        input: "rgba(218, 226, 253, 0.4)",
        muted: "#f2f3ff",
        "muted-foreground": "#444656",
        ring: "#1c32df",
        primary: {
          DEFAULT: "#1c32df",
          foreground: "#ffffff"
        },
        secondary: {
          DEFAULT: "#006b5a",
          foreground: "#ffffff"
        },
        accent: {
          DEFAULT: "#3e51f7",
          foreground: "#ffffff"
        },
        surface: "#faf8ff",
        "surface-bright": "#faf8ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f3ff",
        "surface-container": "#eaedff",
        "surface-container-high": "#e2e7ff",
        "surface-container-highest": "#dae2fd",
        outline: "#757687",
        "outline-variant": "#c5c5d9",
        "on-surface": "#131b2e",
        "on-surface-variant": "#444656",
        "secondary-container": "#54f8d7",
        "on-secondary-container": "#00705e",
        "primary-fixed": "#dfe0ff",
        "primary-container": "#3e51f7",
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
          50: "#eef1ff",
          100: "#dfe4ff",
          200: "#bdc2ff",
          300: "#9fa9ff",
          400: "#7280ff",
          500: "#3e51f7",
          600: "#3346ee",
          700: "#1c32df",
          800: "#0824d8",
          900: "#000965"
        },
        tide: {
          50: "#e8fcf8",
          100: "#c8f7ef",
          200: "#9fefdf",
          300: "#72e6cf",
          400: "#44ddc0",
          500: "#2cdebf",
          600: "#12b59a",
          700: "#006b5a",
          800: "#005143",
          900: "#00372f"
        },
        sand: {
          50: "#f4f3ff",
          100: "#e7e5ff",
          200: "#d9d5ff",
          300: "#c0c1ff",
          400: "#8f91ff",
          500: "#5355e0",
          600: "#3939c7",
          700: "#2f2ebe",
          800: "#1a1a96",
          900: "#07006c"
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
        glow: "0 18px 40px rgba(28, 50, 223, 0.18)",
        panel: "0 18px 36px rgba(19, 27, 46, 0.05)"
      },
      backgroundImage: {
        "pulse-primary": "linear-gradient(135deg, #1c32df 0%, #3e51f7 100%)",
        "pulse-secondary": "linear-gradient(135deg, #006b5a 0%, #2cdebf 100%)",
        "gallery-glow":
          "radial-gradient(circle at top left, rgba(28,50,223,0.1), transparent 28%), radial-gradient(circle at top right, rgba(0,107,90,0.08), transparent 24%), linear-gradient(180deg, #faf8ff 0%, #f8f7ff 52%, #f2f3ff 100%)"
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
