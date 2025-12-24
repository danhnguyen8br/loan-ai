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
        // Leadity Primary Colors - Brand Guideline
        primary: {
          DEFAULT: "#7CD734",      // Yellowish Greens Zesty Bold
          dark: "#4DC614",         // Strong green (use for text on light bg)
          hover: "#4DC614",        // Strong green
          light: "#77FF45",        // Light green
          soft: "#F7FFF3",         // Very pale green (backgrounds)
          muted: "#77FF45",
          50: "#F7FFF3",           // Very pale green
          100: "#e8ffd4",
          200: "#c5f599",
          300: "#77FF45",          // Light green
          400: "#7CD734",          // Primary
          500: "#4DC614",          // Strong green
          600: "#3da50f",
          700: "#2d7a0b",          // WCAG AA compliant on white
          800: "#1e5007",
          900: "#0f2803",
        },
        // Leadity Dark Colors - Brand Guideline
        dark: {
          DEFAULT: "#343839",      // Onyx
          darker: "#141718",       // Chinese Black
        },
        // Unified Gray Scale (replacing multiple gray systems)
        // Use these instead of Tailwind default grays for consistency
        leadity: {
          gray: "#343839",         // Onyx - primary text
          "gray-muted": "#525252", // Secondary text
          "gray-light": "#E8ECEF", // Borders, dividers
          "gray-lighter": "#F7F8F9", // Backgrounds
          "gray-bg": "#F7FFF3",    // Primary soft background
        },
        // Semantic status colors - with WCAG compliant text colors
        status: {
          success: "#16a34a",      // Darker green for better contrast
          "success-light": "#dcfce7",
          "success-dark": "#166534",
          warning: "#d97706",      // Darker amber for better contrast
          "warning-light": "#fef3c7",
          "warning-dark": "#92400e",
          error: "#dc2626",        // Darker red for better contrast
          "error-light": "#fee2e2",
          "error-dark": "#991b1b",
          info: "#2563eb",         // Darker blue for better contrast
          "info-light": "#dbeafe",
          "info-dark": "#1e40af",
        },
        // Text color scale for proper contrast
        text: {
          primary: "#141718",      // Match dark-darker for consistency
          secondary: "#525252",    // Match gray-muted
          muted: "#737373",
          disabled: "#a3a3a3",
          inverse: "#ffffff",      // For dark backgrounds
        },
        // Interactive element colors (buttons, links, etc.)
        interactive: {
          focus: "rgba(124, 215, 52, 0.3)", // Focus ring color
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
        // Modern, lighter shadows for reduced visual fatigue
        leadity: "0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.08)",
        "leadity-lg": "0 4px 12px rgba(0, 0, 0, 0.06), 0 16px 32px rgba(0, 0, 0, 0.1)",
        "leadity-button": "0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.06)",
        "leadity-button-hover": "0 4px 8px rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.08)",
        "leadity-header": "0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
        // Additional utility shadows
        "leadity-xs": "0 1px 2px rgba(0, 0, 0, 0.04)",
        "leadity-focus": "0 0 0 3px rgba(124, 215, 52, 0.25)",
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
        "leadity-gradient": "linear-gradient(135deg, #F7FFF3 0%, #77FF45 30%, #7CD734 60%, #4DC614 100%)",
        "leadity-gradient-subtle": "linear-gradient(180deg, #F7FFF3 0%, #e8ffd4 50%, #c5f599 100%)",
        "leadity-hero": "radial-gradient(ellipse at 50% 50%, rgba(124, 215, 52, 0.3) 0%, rgba(255, 255, 255, 0) 70%), radial-gradient(ellipse at 30% 30%, rgba(77, 198, 20, 0.2) 0%, rgba(255, 255, 255, 0) 50%), linear-gradient(180deg, #ffffff 0%, #F7FFF3 100%)",
        "leadity-dark": "linear-gradient(135deg, #141718 0%, #343839 100%)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
