/**
 * Request Debounce Utility
 * Prevents duplicate API requests and "body stream already read" errors
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDebouncer {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly DEBOUNCE_TIME = 1000; // 1 second debounce

  /**
   * Create a unique key for the request
   */
  private createRequestKey(url: string, method: string, body?: any): string {
    const bodyStr = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyStr}`;
  }

  /**
   * Debounced fetch that prevents duplicate requests
   */
  async debouncedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const method = options.method || 'GET';
    const requestKey = this.createRequestKey(url, method, options.body);
    
    // Check if there's a pending request with the same parameters
    const existing = this.pendingRequests.get(requestKey);
    if (existing && Date.now() - existing.timestamp < this.DEBOUNCE_TIME) {
      console.log(`Reusing pending ${method} request to ${url}`);
      return existing.promise;
    }

    // Create new request
    const requestPromise = this.performFetch(url, options);
    
    // Store the pending request
    this.pendingRequests.set(requestKey, {
      promise: requestPromise,
      timestamp: Date.now()
    });

    // Clean up after request completes
    requestPromise.finally(() => {
      setTimeout(() => {
        this.pendingRequests.delete(requestKey);
      }, this.DEBOUNCE_TIME);
    });

    return requestPromise;
  }

  /**
   * Perform the actual fetch with enhanced error handling
   */
  private async performFetch(url: string, options: RequestInit): Promise<Response> {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  /**
   * Clear all pending requests
   */
  clearPendingRequests(): void {
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const requestDebouncer = new RequestDebouncer();

/**
 * Safe JSON parse with error handling
 */
export async function safeJsonParse(response: Response): Promise<any> {
  try {
    // Clone the response to avoid "body stream already read" error
    const responseClone = response.clone();
    
    try {
      return await response.json();
    } catch (firstError) {
      console.warn('First JSON parse failed, trying with cloned response:', firstError);
      try {
        return await responseClone.json();
      } catch (secondError) {
        console.error('Both JSON parse attempts failed:', secondError);
        throw new Error('Invalid JSON response from server');
      }
    }
  } catch (error) {
    console.error('Safe JSON parse error:', error);
    throw new Error('Failed to parse server response');
  }
}

/**
 * Enhanced fetch wrapper with debouncing and error handling
 */
export async function safeFetch(url: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await requestDebouncer.debouncedFetch(url, options);
    
    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error(`Request to ${url} failed:`, error);
    throw error;
  }
}
