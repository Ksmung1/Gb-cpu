// tailwind.config.js
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
 theme: {
  extend: {
    colors: {
      background: 'var(--bg)',
      text: 'var(--text)',
      navbar: 'var(--nav-bg)',
      shadow: 'var(--nav-shadow)',
    },
  },
},

  plugins: [],
}
