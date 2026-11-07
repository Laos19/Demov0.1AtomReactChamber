/** Tokens de diseño "Tablero periódico" (ver docs/diseno/direcciones-de-arte.md). */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        tinta: v('tinta'),
        'tinta-suave': v('tinta-suave'),
        papel: v('papel'),
        superficie: v('superficie'),
        linea: v('linea'),
        cobre: v('cobre'),
        calcio: v('calcio'),
        litio: v('litio'),
        potasio: v('potasio'),
        sodio: v('sodio'),
        visor: v('visor'),
        exito: v('exito'),
        peligro: v('peligro'),
      },
      fontFamily: {
        display: ['Unbounded', 'system-ui', 'sans-serif'],
        sans: ['"Atkinson Hyperlegible Next"', 'system-ui', 'sans-serif'],
        mono: ['"Atkinson Hyperlegible Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { ficha: '10px' },
      boxShadow: {
        ficha: '0 3px 0 0 rgb(var(--tinta) / 0.85)',
        'ficha-presionada': '0 1px 0 0 rgb(var(--tinta) / 0.85)',
      },
    },
  },
  plugins: [],
};
