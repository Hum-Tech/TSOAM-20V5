/**
 * Production Error Handler
 * Handles errors that occur in production environment
 */

export function setupProductionErrorHandling() {
  // Only run in production
  if (import.meta.env.DEV) return;

  console.log('🛡️ Production error handling initialized');

  // Aggressively restore native fetch in production
  const nativeFetch = globalThis.fetch || fetch;

  // Force-restore native fetch, removing any dev overrides
  Object.defineProperty(window, 'fetch', {
    value: nativeFetch,
    writable: false,
    configurable: false,
    enumerable: true
  });

  // Block any attempts to override fetch in production
  const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
  if (descriptor && descriptor.set) {
    Object.defineProperty(window, 'fetch', {
      value: nativeFetch,
      writable: false,
      configurable: false
    });
  }

  // Handle WebSocket connection errors for Vite HMR
  const originalWebSocket = window.WebSocket;
  window.WebSocket = class extends WebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      const urlString = typeof url === 'string' ? url : url.toString();

      // Block Vite WebSocket connections in production
      if (urlString.includes('ws://') && urlString.includes('24678')) {
        console.warn('🚫 Blocked Vite WebSocket in production:', urlString);
        throw new Error('Vite WebSocket disabled in production');
      }

      super(url, protocols);
    }
  } as any;

  // Handle unhandled promise rejections specifically for production
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || reason?.toString() || '';

    // Suppress specific production-related errors
    if (message.includes('Vite dev tools disabled') ||
        message.includes('__vite_ping') ||
        message.includes('@vite/client') ||
        message.includes('authDisabler') ||
        message.includes('Authentication already in progress') ||
        (message.includes('Failed to fetch') &&
         (message.includes('fullstory') || message.includes('fs.js')))) {

      console.warn('Production error suppressed:', message);
      event.preventDefault();
      return;
    }

    // Log other errors for debugging
    console.error('Unhandled promise rejection:', reason);
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    const filename = event.filename || '';

    // Suppress specific production-related errors
    if (filename.includes('authDisabler.ts') ||
        filename.includes('@vite/client') ||
        filename.includes('fs.js') ||
        message.includes('Vite dev tools disabled') ||
        message.includes('__vite_ping')) {

      console.warn('Production error suppressed:', message);
      event.preventDefault();
      return false;
    }
  });

  console.log('✅ Production error handling setup complete');
}

// Auto-setup in production
if (import.meta.env.PROD) {
  setupProductionErrorHandling();
}
