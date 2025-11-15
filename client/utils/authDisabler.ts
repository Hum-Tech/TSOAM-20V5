/**
 * Authentication Conflict Disabler
 * DEVELOPMENT ONLY - No-op in production builds
 */

let originalFetch: typeof window.fetch | null = null;
let isInitialized = false;
let authInProgress = false;

// Production-safe implementation that does nothing
export function disableConflictingAuth() {
  // Compile-time check - this entire function becomes empty in production
  if (import.meta.env.DEV) {
    // Only run in actual development environment (localhost)
    if (typeof window !== 'undefined' &&
        window.location.hostname === 'localhost' &&
        window.location.port) {

      console.log("🚫 [DEV] Authentication conflict disabler active");

      // Store original fetch and mark as initialized
      originalFetch = window.fetch;
      isInitialized = true;

      window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        // Only track auth requests
        if (url.includes('/api/auth/login')) {
          if (authInProgress) {
            console.warn("🚫 [DEV] Duplicate auth request blocked");
            return Promise.reject(new Error("Authentication in progress"));
          }

          authInProgress = true;
          const promise = originalFetch!(input, init);

          promise.finally(() => {
            authInProgress = false;
          });

          return promise;
        }

        return originalFetch!(input, init);
      };
    }
  }
  // In production, this function does absolutely nothing
}

export function restoreOriginalFetch() {
  if (!isInitialized || !originalFetch) return;

  console.log("🔄 RESTORING: Original fetch");
  window.fetch = originalFetch;
  isInitialized = false;
}

export function getAuthRequestCount() {
  // This will help debug if multiple requests are happening
  return Array.from(document.querySelectorAll('*')).filter(el =>
    el.toString().includes('auth') || el.toString().includes('login')
  ).length;
}
