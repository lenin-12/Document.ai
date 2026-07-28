/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        heading: ["'Space Grotesk'", "sans-serif"],
        display: ["'Outfit'", "sans-serif"],
      },
      colors: {
        dark: {
          950: '#050816',
          900: '#0b0f26',
          800: '#121838',
          700: '#1b234d',
        },
        brand: {
          purple: '#7C5CFF',
          cyan: '#4FD1FF',
          accent: '#8B5CF6',
          glow: 'rgba(124, 92, 255, 0.35)',
        },
        card: {
          bg: 'rgba(255, 255, 255, 0.035)',
          hover: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-bright': 'rgba(124, 92, 255, 0.4)',
        }
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(124, 92, 255, 0.15) 0%, rgba(79, 209, 255, 0.05) 50%, transparent 80%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'purple-gradient': 'linear-gradient(135deg, #7C5CFF 0%, #4FD1FF 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 30px -5px rgba(124, 92, 255, 0.3)',
        'glow-cyan': '0 0 30px -5px rgba(79, 209, 255, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
