/**
 * Production Authentication Debugging Utility
 * Helps track and prevent response consumption issues
 */

// Track authentication attempts
const authAttempts = new Map<string, number>();
const responseTracker = new Map<string, boolean>();

/**
 * Debug wrapper for fetch requests
 */
export async function debugFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🔍 DEBUG: Starting request ${requestId} to ${url}`);
  
  try {
    const response = await fetch(url, options);
    
    // Track this response
    responseTracker.set(requestId, false);
    
    console.log(`📊 DEBUG: Response ${requestId} - Status: ${response.status}, BodyUsed: ${response.bodyUsed}`);
    
    // Create a proxy to track body consumption
    const originalJson = response.json.bind(response);
    const originalText = response.text.bind(response);
    
    (response as any)._debugId = requestId;
    
    response.json = function() {
      const wasUsed = responseTracker.get(requestId);
      if (wasUsed) {
        console.error(`❌ DEBUG: Response body already consumed for ${requestId} (${url})`);
        throw new Error(`Response body already consumed for ${url}`);
      }
      responseTracker.set(requestId, true);
      console.log(`📖 DEBUG: Consuming response body as JSON for ${requestId}`);
      return originalJson();
    };
    
    response.text = function() {
      const wasUsed = responseTracker.get(requestId);
      if (wasUsed) {
        console.error(`❌ DEBUG: Response body already consumed for ${requestId} (${url})`);
        throw new Error(`Response body already consumed for ${url}`);
      }
      responseTracker.set(requestId, true);
      console.log(`📖 DEBUG: Consuming response body as text for ${requestId}`);
      return originalText();
    };
    
    return response;
  } catch (error) {
    console.error(`❌ DEBUG: Fetch failed for ${requestId} (${url}):`, error);
    throw error;
  }
}

/**
 * Safe authentication with detailed debugging
 */
export async function debugAuthLogin(email: string, password: string, otp?: string, rememberMe?: boolean) {
  const attemptKey = `${email}-${Date.now()}`;
  const currentAttempts = authAttempts.get(email) || 0;
  
  console.log(`🔐 DEBUG: Auth attempt #${currentAttempts + 1} for ${email}`);
  authAttempts.set(email, currentAttempts + 1);
  
  try {
    const response = await debugFetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        otp,
        rememberMe,
      }),
    });
    
    console.log(`🔐 DEBUG: Auth response received - Status: ${response.status}, BodyUsed: ${response.bodyUsed}`);
    
    // Use safe text-first consumption
    const responseText = await response.text();
    console.log(`🔐 DEBUG: Response text length: ${responseText.length}`);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log(`🔐 DEBUG: JSON parsing successful`);
    } catch (jsonError) {
      console.error(`🔐 DEBUG: JSON parsing failed:`, jsonError);
      throw new Error('Invalid response format');
    }
    
    const result = {
      success: response.ok && data.success,
      data,
      status: response.status,
      error: data.error
    };
    
    console.log(`🔐 DEBUG: Auth result:`, result.success ? '✅ Success' : '❌ Failed');
    if (!result.success) {
      console.log(`🔐 DEBUG: Error:`, result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error(`🔐 DEBUG: Auth failed for ${email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      status: 0
    };
  }
}

/**
 * Production-safe authentication method
 */
export async function productionSafeAuth(email: string, password: string, otp?: string, rememberMe?: boolean) {
  try {
    console.log(`🔐 SAFE AUTH: Attempting login for ${email}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        otp,
        rememberMe,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Always consume as text first to prevent body consumption conflicts
    const responseText = await response.text();
    
    if (!responseText) {
      throw new Error('Empty response from server');
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Invalid server response format');
    }
    
    return {
      success: response.ok && parsedData.success,
      data: parsedData,
      status: response.status,
      error: parsedData.error || (!response.ok ? `HTTP ${response.status}` : undefined)
    };
    
  } catch (error) {
    console.error('🔐 SAFE AUTH ERROR:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout', status: 408 };
      }
      return { success: false, error: error.message, status: 0 };
    }
    
    return { success: false, error: 'Unknown error occurred', status: 0 };
  }
}

/**
 * Reset debug tracking
 */
export function resetDebugTracking() {
  authAttempts.clear();
  responseTracker.clear();
  console.log('🔍 DEBUG: Tracking reset');
}

/**
 * Get debug statistics
 */
export function getDebugStats() {
  return {
    authAttempts: Object.fromEntries(authAttempts),
    activeResponses: responseTracker.size,
  };
}
