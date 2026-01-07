import scopeToOverlayRoot from './postcss-scope-plugin.js';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss,
    scopeToOverlayRoot(), // Scope intervention.css to #thinkfast-overlay-root
    autoprefixer,
  ],
}
