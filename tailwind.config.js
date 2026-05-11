/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Magazine palette
        paper:      '#F4EFE6',
        'paper-deep': '#EBE3D5',
        ink:        '#1A1410',
        'ink-soft': '#3D332A',
        muted:      '#8A7E72',
        rule:       '#D8CFC0',
        accent:     '#B5462E',  // terracotta
        'accent-ink': '#7A2E1C',
        olive:      '#6B6A2B',
        // Keep primary for back-compat with any old class refs
        primary: {
          50:  '#fbf3ef', 100: '#f5e2d9', 200: '#ecc4b4',
          300: '#dd9a7e', 400: '#cb6e4d', 500: '#B5462E',
          600: '#9a3b27', 700: '#7A2E1C', 800: '#5e2417', 900: '#3f180f',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', '"Noto Serif KR"', 'Georgia', 'serif'],
        sans:  ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        widest: '0.18em',
      },
    },
  },
  plugins: [],
}
