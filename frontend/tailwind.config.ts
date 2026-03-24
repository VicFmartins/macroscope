import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // === Design System: "The Ethereal Analyst" ===
        // Surface hierarchy — treat as physical layers, no hard borders
        'surface':                   '#0a0e19',
        'surface-dim':               '#0a0e19',
        'surface-container-lowest':  '#000000',
        'surface-container-low':     '#0f131f',
        'surface-container':         '#141927',
        'surface-container-high':    '#1a1f2e',
        'surface-container-highest': '#202535',
        'surface-variant':           '#202535',
        'surface-bright':            '#262c3d',
        'surface-tint':              '#3bbffa',
        // Text
        'on-surface':                '#e8eafb',
        'on-surface-variant':        '#a7aaba',
        'on-background':             '#e8eafb',
        // Borders — always use at low opacity (ghost border rule)
        'outline':                   '#717583',
        'outline-variant':           '#444855',
        // Primary: cyan
        'primary':                   '#3bbffa',
        'primary-dim':               '#05a9e3',
        'primary-fixed':             '#2db7f2',
        'primary-container':         '#22b1ec',
        'on-primary':                '#00374d',
        'inverse-primary':           '#00668b',
        // Secondary: indigo
        'secondary':                 '#8a95ff',
        'secondary-dim':             '#8a95ff',
        'secondary-container':       '#2f3aa3',
        'secondary-fixed':           '#cbceff',
        'on-secondary':              '#000974',
        'on-secondary-container':    '#c9cdff',
        // Tertiary: teal (positive/growth signals)
        'tertiary':                  '#c6fff3',
        'tertiary-dim':              '#48e5d0',
        'tertiary-container':        '#65fde6',
        'tertiary-fixed':            '#65fde6',
        'on-tertiary':               '#00685c',
        'on-tertiary-container':     '#005e54',
        // Error: red (risk/decline signals)
        'error':                     '#ff716c',
        'error-dim':                 '#d7383b',
        'error-container':           '#9f0519',
        'on-error':                  '#490006',
        'on-error-container':        '#ffa8a3',
        // Inverse
        'inverse-surface':           '#faf8ff',
        'inverse-on-surface':        '#515562',
        'background':                '#0a0e19',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body:     ['Inter', 'sans-serif'],
        label:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        sm:      '0.125rem',
        md:      '0.25rem',
        lg:      '0.375rem',
        xl:      '0.5rem',
        '2xl':   '0.75rem',
        full:    '9999px',
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.02em',
        tight:    '-0.01em',
      },
      backgroundImage: {
        'gradient-brand':  'linear-gradient(135deg, #3bbffa 0%, #8a95ff 100%)',
        'gradient-glow':   'radial-gradient(ellipse at top, rgba(59,191,250,0.08) 0%, transparent 70%)',
        'gradient-subtle': 'linear-gradient(180deg, rgba(59,191,250,0.04) 0%, transparent 100%)',
      },
      boxShadow: {
        ambient:         '0 20px 40px rgba(0,102,139,0.15)',
        'glow-primary':  '0 0 12px rgba(59,191,250,0.3)',
        'glow-tertiary': '0 0 12px rgba(101,253,230,0.3)',
        'glow-error':    '0 0 12px rgba(255,113,108,0.3)',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseDot:{ '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
      },
    },
  },
  plugins: [],
}

export default config
