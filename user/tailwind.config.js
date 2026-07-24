/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],

  // Preflight resets buttons, inputs and borders, which visibly breaks Angular
  // Material's components. The global `* { margin: 0; padding: 0 }` in
  // styles.scss already covers what we would have wanted from a reset.
  corePlugins: {
    preflight: false,
  },

  // ThemeService toggles `dark-theme` on <body>, not Tailwind's default `dark`,
  // so `dark:` utilities have to be pointed at that class or they silently
  // do nothing. See core/services/theme.service.ts.
  darkMode: ['selector', '.dark-theme'],

  theme: {
    extend: {},
  },
  plugins: [],
};
