/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./options.html",
    "./overlay.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2196F3',
          dark: '#1565C0',
          light: '#64B5F6',
          container: '#E3F2FD'
        },
        secondary: {
          DEFAULT: '#9C27B0',
          dark: '#7B1FA2',
          light: '#BA68C8',
          container: '#F3E5F5'
        },
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        progress: {
          onTrack: '#4CAF50',
          approaching: '#FFA726',
          overLimit: '#FF5252'
        },
        streak: {
          bronze: '#FF9800',
          silver: '#FF5722',
          gold: '#F44336',
          platinum: '#9C27B0'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace']
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px'
      },
      borderRadius: {
        card: '12px',
        button: '12px',
        dialog: '24px',
        chip: '8px'
      },
      animation: {
        pulse: 'pulse 1.5s ease-in-out infinite',
        bounce: 'bounce 0.6s ease-in-out',
        fadeIn: 'fadeIn 0.4s ease-out',
        shimmer: 'shimmer 1.5s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      }
    }
  },
  plugins: []
}
