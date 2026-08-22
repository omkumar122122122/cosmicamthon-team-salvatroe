/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans:    ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0f172a",
        // Primary navy-blue – trust, government, safety
        civic: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554"
        },
        // Deep navy primary brand
        navy: {
          50:  "#F0F4FF",
          100: "#E0E9FF",
          200: "#C1D3FE",
          300: "#93B4FC",
          400: "#6090F8",
          500: "#3B6EF0",
          600: "#2451E8",
          700: "#1C3FD5",
          800: "#1C35B0",
          900: "#1E3A8A",
          950: "#172554"
        },
        // AI accent – violet/purple
        ai: {
          50:  "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065"
        },
        // Success green
        emerald: {
          50:  "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B"
        },
        // Secondary indigo
        indigo: {
          50:  "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81"
        },
        // Accent cyan
        accent: {
          50:  "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63"
        },
        // Surface & Layout
        surface:  "#F8FAFC",
        sidebar:  "#0F172A",
        border:   "#E2E8F0",
        // Semantic status
        success:  "#16A34A",
        warning:  "#F59E0B",
        danger:   "#DC2626",
        // Legacy aliases
        saffron: "#F59E0B",
        safety:  "#16A34A",
        alert:   "#DC2626"
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }]
      },
      borderRadius: {
        "xl":  "0.75rem",
        "2xl": "1.125rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
        "5xl": "2rem"
      },
      boxShadow: {
        // Cards — multi-layer for depth
        "card":       "0 0 0 1px rgba(15,23,42,0.03), 0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.04)",
        "card-hover": "0 0 0 1px rgba(37,99,235,0.08), 0 4px 16px rgba(15,23,42,0.08), 0 16px 40px rgba(15,23,42,0.10)",
        "card-md":    "0 2px 6px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.08)",
        "card-lg":    "0 8px 24px rgba(15,23,42,0.08), 0 20px 48px rgba(15,23,42,0.10)",
        // Glass / Modals
        "glass":      "0 8px 32px rgba(15,23,42,0.10), 0 1px 2px rgba(15,23,42,0.06)",
        "modal":      "0 0 0 1px rgba(15,23,42,0.06), 0 24px 64px rgba(15,23,42,0.22), 0 4px 16px rgba(15,23,42,0.10)",
        // Sidebar
        "sidebar":    "4px 0 32px rgba(15,23,42,0.20)",
        // Navigation
        "nav":        "0 1px 0 rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)",
        // Buttons
        "btn-primary":  "0 1px 2px rgba(37,99,235,0.25), 0 4px 12px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
        "btn-danger":   "0 1px 2px rgba(220,38,38,0.2), 0 4px 12px rgba(220,38,38,0.2)",
        "btn-success":  "0 1px 2px rgba(22,163,74,0.2), 0 4px 12px rgba(22,163,74,0.2)",
        "btn-ai":       "0 1px 2px rgba(124,58,237,0.2), 0 4px 12px rgba(124,58,237,0.2)",
        // Inner glow
        "inner-glow":   "inset 0 1px 2px rgba(255,255,255,0.15)",
        // Stat cards
        "stat":         "0 0 0 1px rgba(15,23,42,0.04), 0 2px 8px rgba(15,23,42,0.06)"
      },
      backgroundImage: {
        "gradient-primary":  "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
        "gradient-navy":     "linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)",
        "gradient-accent":   "linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)",
        "gradient-success":  "linear-gradient(135deg, #16A34A 0%, #059669 100%)",
        "gradient-ai":       "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
        "gradient-dark":     "linear-gradient(160deg, #0F172A 0%, #1E293B 100%)",
        "gradient-brand":    "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 40%, #2563EB 100%)",
        "mesh-blue":         "radial-gradient(circle at 20% 20%, rgba(37,99,235,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(124,58,237,0.10) 0%, transparent 50%)",
        "hero-pattern":      "linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
      },
      spacing: {
        "4.5":  "1.125rem",
        "13":   "3.25rem",
        "15":   "3.75rem",
        "18":   "4.5rem",
        "22":   "5.5rem",
        "72":   "18rem",
        "80":   "20rem",
        "88":   "22rem",
        "96":   "24rem"
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.16, 1, 0.3, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)"
      },
      animation: {
        "fade-in":      "fadeIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in-up":   "fadeInUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in-down": "fadeInDown 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
        "scale-in":     "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-left":   "slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
        "shimmer":      "shimmer 1.5s ease-in-out infinite",
        "float":        "float 10s ease-in-out infinite",
        "float-r":      "floatReverse 12s ease-in-out infinite",
        "pulse-ring":   "pulseRing 2s cubic-bezier(0.66,0,0,1) infinite",
        "scan-line":    "scanLine 2.5s linear infinite",
        "ping-slow":    "ping 2s cubic-bezier(0,0,0.2,1) infinite",
        "spin-slow":    "spin 3s linear infinite",
        "bounce-dot":   "bounceDot 1.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
