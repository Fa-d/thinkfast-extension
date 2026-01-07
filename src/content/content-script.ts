/**
 * Content Script
 * Injected into all web pages to show intervention overlays
 */

import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { OverlayInjector } from './overlay-injector';
import React from 'react';

console.log('[ThinkFast] Content script loaded');

let overlayRoot: Root | null = null;
let overlayContainer: HTMLElement | null = null;
let stylesInjected = false;

/**
 * Inject scoped intervention styles into the page
 * Only called when showing an intervention to prevent polluting host pages
 *
 * APPROACH: Load the compiled theme CSS (with Tailwind) and scope ALL selectors
 * to #thinkfast-overlay-root using regex replacement to prevent pollution
 */
async function injectInterventionStyles() {
  if (stylesInjected) return; // Already injected

  try {
    // Get all CSS files from the extension
    const manifest = chrome.runtime.getManifest();
    const cssFiles: string[] = [];

    // Find theme CSS in web_accessible_resources
    const webResources = manifest.web_accessible_resources;
    if (webResources && Array.isArray(webResources)) {
      const firstResource = webResources[0];
      if (firstResource && typeof firstResource === 'object' && 'resources' in firstResource) {
        const resources = firstResource.resources;
        for (const resource of resources) {
          if (resource.includes('theme') && resource.endsWith('.css')) {
            cssFiles.push(resource);
          }
        }
      }
    }

    // Fallback: Read Vite manifest to find theme CSS dynamically
    if (cssFiles.length === 0) {
      try {
        const manifestUrl = chrome.runtime.getURL('.vite/manifest.json');
        const manifestResponse = await fetch(manifestUrl);
        if (manifestResponse.ok) {
          const viteManifest = await manifestResponse.json();
          // Find the theme CSS file from the manifest
          for (const [key, value] of Object.entries(viteManifest)) {
            if (key.includes('theme') && key.endsWith('.css')) {
              const entry = value as { file: string };
              cssFiles.push(entry.file);
              break;
            }
            // Also check css array in entries
            if (typeof value === 'object' && value !== null && 'css' in value) {
              const entry = value as { css?: string[] };
              if (entry.css && Array.isArray(entry.css)) {
                cssFiles.push(...entry.css);
              }
            }
          }
        }
      } catch (error) {
        console.warn('[ThinkFast] Could not read Vite manifest:', error);
      }
    }

    let allCss = '';

    // Load all CSS files
    for (const cssFile of cssFiles) {
      const cssUrl = chrome.runtime.getURL(cssFile);
      const response = await fetch(cssUrl);
      if (response.ok) {
        allCss += await response.text();
      }
    }

    // Also load intervention variables
    const interventionCssUrl = chrome.runtime.getURL('src/styles/intervention.css');
    try {
      const response = await fetch(interventionCssUrl);
      if (response.ok) {
        const interventionCss = await response.text();
        // Remove the @import line
        const cleanCss = interventionCss.replace(/@import\s+["']tailwindcss["'];?\s*/g, '');
        allCss += cleanCss;
      }
    } catch {
      // Intervention CSS might not exist, that's ok
    }

    // Scope ALL selectors to #thinkfast-overlay-root
    // This comprehensive regex replacement prevents ANY style pollution
    allCss = scopeCSS(allCss);

    // Inject into page
    const styleElement = document.createElement('style');
    styleElement.id = 'thinkfast-intervention-styles';
    styleElement.textContent = allCss;
    document.head.appendChild(styleElement);

    stylesInjected = true;
    console.log('[ThinkFast Content] Intervention styles injected and scoped');
  } catch (error) {
    console.error('[ThinkFast Content] Failed to inject styles:', error);
  }
}

/**
 * Scope all CSS selectors to #thinkfast-overlay-root
 * This prevents the CSS from affecting the host page
 */
function scopeCSS(css: string): string {
  // Process @layer blocks
  css = css.replace(/@layer\s+([\w-]+)\s*{([^}]*(?:{[^}]*}[^}]*)*)}/g, (_match, layerName, layerContent) => {
    return `@layer ${layerName} { ${scopeLayerContent(layerContent)} }`;
  });

  // Process root-level rules
  css = scopeRules(css);

  return css;
}

function scopeLayerContent(content: string): string {
  return scopeRules(content);
}

function scopeRules(css: string): string {
  // Split by rules while preserving media queries
  const lines = css.split('\n');
  let result = '';

  for (const line of lines) {
    // Skip @import, @font-face, @keyframes, etc
    if (line.trim().startsWith('@import') ||
        line.trim().startsWith('@font-face') ||
        line.trim().startsWith('@keyframes') ||
        line.trim().startsWith('@supports') ||
        line.trim().startsWith('@media')) {
      result += line + '\n';
      continue;
    }

    // Detect rule start
    if (line.includes('{') && !line.trim().startsWith('@')) {
      const parts = line.split('{');
      const selector = parts[0].trim();

      if (selector && !selector.startsWith('@')) {
        // Scope the selector
        const scopedSelector = scopeSelector(selector);
        result += scopedSelector + '{' + parts.slice(1).join('{') + '\n';
      } else {
        result += line + '\n';
      }
    } else {
      result += line + '\n';
    }
  }

  return result;
}

function scopeSelector(selector: string): string {
  // Split multiple selectors
  const selectors = selector.split(',').map(s => s.trim());

  return selectors.map(sel => {
    // Already scoped?
    if (sel.includes('#thinkfast-overlay-root')) {
      return sel;
    }

    // Replace :root, html, body with #thinkfast-overlay-root
    if (sel === ':root' || sel === 'html' || sel === 'body' || sel === ':host' || sel === '*') {
      return '#thinkfast-overlay-root';
    }

    // Pseudo-class at start (e.g., :where, :is)
    if (sel.startsWith(':')) {
      return `#thinkfast-overlay-root${sel}`;
    }

    // Regular selector - prepend with space
    return `#thinkfast-overlay-root ${sel}`;
  }).join(', ');
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[ThinkFast Content] Message received:', message.type);

  // Respond to ping to confirm content script is ready
  if (message.type === 'PING') {
    sendResponse({ success: true, ready: true });
    return true;
  }

  if (message.type === 'SHOW_INTERVENTION') {
    showInterventionOverlay(message.data);
    sendResponse({ success: true });
    return true;
  }

  return true;
});

/**
 * Show intervention overlay on page
 */
async function showInterventionOverlay(data: any) {
  console.log('[ThinkFast Content] Showing intervention overlay');

  // Inject styles before showing overlay (only once)
  await injectInterventionStyles();

  // Remove existing overlay if present
  if (overlayContainer) {
    removeOverlay();
  }

  // Create overlay container
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'thinkfast-overlay-root';
  overlayContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  document.body.appendChild(overlayContainer);

  // Don't use shadow DOM - it complicates style injection
  // Instead, render directly in the container with high z-index
  // The overlay components will handle their own full-screen positioning

  // Render React overlay
  overlayRoot = createRoot(overlayContainer);
  overlayRoot.render(
    React.createElement(OverlayInjector, {
      data,
      onClose: removeOverlay
    })
  );
}

/**
 * Remove overlay from page
 */
function removeOverlay() {
  console.log('[ThinkFast Content] Removing overlay');

  if (overlayRoot) {
    overlayRoot.unmount();
    overlayRoot = null;
  }

  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
}

// Notify background script that page loaded
const currentUrl = window.location.href;
chrome.runtime
  .sendMessage({
    type: 'PAGE_LOADED',
    url: currentUrl
  })
  .catch(error => {
    // Extension might not be ready yet
    console.log('[ThinkFast Content] Could not send PAGE_LOADED:', error.message);
  });

// Listen for visibility changes (page hidden/shown)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('[ThinkFast Content] Page hidden');
  } else {
    console.log('[ThinkFast Content] Page shown');
  }
});
