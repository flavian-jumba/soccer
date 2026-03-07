/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Premium dark backgrounds
        dark: {
          DEFAULT: "#0B0F19",
          100: "#0B0F19",
          200: "#121212",
          300: "#1A1F2C",
          400: "#252A3C",
          500: "#2E3449",
        },
        // Accent colors
        accent: {
          DEFAULT: "#3B82F6",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          cyan: "#06B6D4",
        },
        // VIP Gold accents
        gold: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
          glow: "#FCD34D",
        },
        // Status colors
        status: {
          won: "#10B981",
          wonGlow: "#34D399",
          lost: "#EF4444",
          lostGlow: "#F87171",
          pending: "#3B82F6",
          pendingGlow: "#60A5FA",
        },
        // Glass effect colors
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          light: "rgba(255, 255, 255, 0.08)",
          border: "rgba(255, 255, 255, 0.1)",
          borderLight: "rgba(255, 255, 255, 0.15)",
        },
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-gold": "0 0 20px rgba(245, 158, 11, 0.5)",
        "glow-green": "0 0 15px rgba(16, 185, 129, 0.6)",
        "glow-red": "0 0 15px rgba(239, 68, 68, 0.6)",
      },
    },
  },
  plugins: [],
};
