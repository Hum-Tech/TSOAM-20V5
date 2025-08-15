/**
 * Authentication Conflict Disabler
 * Prevents other authentication utilities from interfering
 * DEVELOPMENT ONLY - Completely disabled in production
 */

// Override all other authentication methods to prevent conflicts
let originalFetch: typeof fetch;
let isInitialized = false;

export function disableConflictingAuth() {
  // COMPLETELY DISABLE IN PRODUCTION
  if (typeof window === 'undefined' ||
      isInitialized ||
      import.meta.env.PROD ||
      window.location.hostname.includes('fly.dev') ||
      window.location.hostname !== 'localhost') {
    console.log("🏭 Production mode: AuthDisabler disabled");
    return;
  }

  console.log("🚫 DISABLING: Conflicting authentication methods (dev mode only)");

  // Store original fetch
  originalFetch = window.fetch;

  // Track auth requests
  const authRequests = new Set<string>();

  // Override fetch for auth endpoints only
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Only intercept auth/login requests in development
    if (url.includes('/api/auth/login')) {
      const requestId = `${Date.now()}-${Math.random()}`;

      // Check if we already have a pending auth request
      if (authRequests.size > 0) {
        console.warn("🚫 BLOCKED: Duplicate auth request prevented");
        return Promise.reject(new Error("Authentication already in progress"));
      }

      console.log("🔍 TRACKING: Auth request", requestId);
      authRequests.add(requestId);

      // Call original fetch and clean up when done
      const promise = originalFetch(input, init);

      promise.finally(() => {
        authRequests.delete(requestId);
        console.log("🧹 CLEANUP: Auth request completed", requestId);
      });

      return promise;
    }

    // For all other requests, use original fetch
    return originalFetch(input, init);
  };

  isInitialized = true;
}

export function restoreOriginalFetch() {
  if (!isInitialized || !originalFetch) return;

  console.log("�� RESTORING: Original fetch");
  window.fetch = originalFetch;
  isInitialized = false;
}

export function getAuthRequestCount() {
  // This will help debug if multiple requests are happening
  return Array.from(document.querySelectorAll('*')).filter(el =>
    el.toString().includes('auth') || el.toString().includes('login')
  ).length;
}
