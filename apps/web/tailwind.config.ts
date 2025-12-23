import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Leadity Primary Colors
        primary: {
          DEFAULT: "#8bef2b",
          dark: "#5eb10e",
          hover: "#7dd625",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#8bef2b",
          400: "#7dd625",
          500: "#5eb10e",
          600: "#4d9e0c",
          700: "#3d7e09",
          800: "#2d5e07",
          900: "#1e3e05",
        },
        // Leadity Dark Colors
        dark: {
          DEFAULT: "#1e1e1e",
          darker: "#151313",
        },
        // Leadity Gray Scale
        leadity: {
          gray: "#6b6b6b",
          "gray-light": "#d3d3d3",
        },
        // Legacy support
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Afacad", "sans-serif"],
        afacad: ["Afacad", "sans-serif"],
      },
      borderRadius: {
        leadity: "1.25rem",
        "leadity-md": "0.6875rem",
        "leadity-lg": "0.875rem",
      },
      boxShadow: {
        leadity: "-10px -10px 30px 0px rgba(213, 213, 213, 0.25), 10px 10px 30px 0px rgba(0, 0, 0, 0.25)",
        "leadity-lg": "-20px -20px 59.5px 0px rgba(213, 213, 213, 0.25), 20px 20px 60px 0px rgba(0, 0, 0, 0.25)",
        "leadity-button": "10px 10px 30px 0px rgba(0, 0, 0, 0.25), -10px -10px 20px 0px rgba(255, 255, 255, 0.25)",
        "leadity-header": "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        // Tooltip animations
        "in": "animateIn 0.2s ease-out",
        "out": "animateOut 0.15s ease-in",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        animateIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        animateOut: {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.95)" },
        },
      },
      backgroundImage: {
        "leadity-gradient": "linear-gradient(135deg, #e8ffd4 0%, #b8f587 30%, #8bef2b 60%, #5eb10e 100%)",
        "leadity-gradient-subtle": "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
        "leadity-hero": "radial-gradient(ellipse at 50% 50%, rgba(139, 239, 43, 0.3) 0%, rgba(255, 255, 255, 0) 70%), radial-gradient(ellipse at 30% 30%, rgba(94, 177, 14, 0.2) 0%, rgba(255, 255, 255, 0) 50%), linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)",
        "leadity-dark": "linear-gradient(135deg, #151313 0%, #1e1e1e 100%)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
