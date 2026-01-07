/**
 * PostCSS plugin to scope all CSS to #thinkfast-overlay-root
 * ONLY for intervention.css to prevent polluting host pages
 */
export default function scopeToOverlayRoot(opts = {}) {
  return {
    postcssPlugin: 'scope-to-overlay-root',

    Rule(rule) {
      // Only process rules from intervention.css
      const inputFile = rule.source?.input?.file || '';
      if (!inputFile.includes('intervention.css')) {
        return;
      }

      // Skip if already scoped to #thinkfast-overlay-root
      if (rule.selector.includes('#thinkfast-overlay-root')) {
        return;
      }

      // Skip @layer, @media, @keyframes, etc
      if (rule.parent?.type === 'atrule') {
        return;
      }

      // Prefix selector with #thinkfast-overlay-root
      const selectors = rule.selector.split(',').map(s => s.trim());
      rule.selector = selectors
        .map(selector => {
          // Handle pseudo-elements and pseudo-classes
          if (selector.startsWith(':')) {
            return `#thinkfast-overlay-root${selector}`;
          }
          // Handle html, body, * selectors
          if (selector === '*' || selector === 'html' || selector === 'body' || selector === ':root' || selector === ':host') {
            return `#thinkfast-overlay-root`;
          }
          // Regular selectors
          return `#thinkfast-overlay-root ${selector}`;
        })
        .join(', ');
    }
  };
}

scopeToOverlayRoot.postcss = true;
