/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safe: 'var(--color-safe)',
        slight: 'var(--color-slight)',
        moderate: 'var(--color-moderate)',
        severe: 'var(--color-severe)',
        'no-response': 'var(--color-no-response)',
        'accent-primary': 'var(--color-accent-primary)',
        'accent-light': 'var(--color-accent-light)',
        'accent-hover': 'var(--color-accent-hover)',
      },
      boxShadow: {
        'premium': 'var(--shadow-premium)',
        'glow': 'var(--shadow-glow)',
      }
    },
  },
  plugins: [],
}
