import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep space base
        base: "#05060B",
        void: "#020308",
        surface: {
          DEFAULT: "#0B0E18",
          raised: "#11152200",
          high: "#161B2B",
          glass: "rgba(255,255,255,0.035)",
        },
        ink: {
          DEFAULT: "#EAF0FB",
          muted: "#9DA8C0",
          faint: "#67708A",
        },
        accent: {
          blue: "#3B82F6",
          teal: "#2DD4BF",
          sky: "#38BDF8",
          cyan: "#22D3EE",
          violet: "#8B5CF6",
          indigo: "#6366F1",
          magenta: "#D946EF",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      maxWidth: {
        content: "1200px",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 24px 60px -28px rgba(0,0,0,0.9)",
        glow: "0 0 0 1px rgba(59,130,246,0.16), 0 30px 80px -32px rgba(45,212,191,0.4)",
        "glow-blue": "0 0 40px -8px rgba(59,130,246,0.55)",
        "glow-teal": "0 0 40px -8px rgba(45,212,191,0.5)",
        "glow-violet": "0 0 40px -8px rgba(139,92,246,0.55)",
        "inner-top": "inset 0 1px 0 0 rgba(255,255,255,0.08)",
      },
      backgroundImage: {
        "accent-gradient":
          "linear-gradient(120deg, #3B82F6 0%, #22D3EE 45%, #8B5CF6 100%)",
        "accent-gradient-soft":
          "linear-gradient(120deg, rgba(59,130,246,0.18), rgba(34,211,238,0.14), rgba(139,92,246,0.18))",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-22px) translateX(10px)" },
        },
        aurora: {
          "0%": { transform: "translate3d(-6%, -4%, 0) rotate(0deg) scale(1.1)" },
          "50%": { transform: "translate3d(6%, 4%, 0) rotate(8deg) scale(1.25)" },
          "100%": { transform: "translate3d(-6%, -4%, 0) rotate(0deg) scale(1.1)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.85" },
        },
        "border-flow": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-soft": "pulse-soft 2.6s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 14s ease-in-out infinite",
        aurora: "aurora 22s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        marquee: "marquee 36s linear infinite",
        "spin-slow": "spin-slow 14s linear infinite",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        "border-flow": "border-flow 5s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
