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
function showInterventionOverlay(data: any) {
  console.log('[ThinkFast Content] Showing intervention overlay');

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
