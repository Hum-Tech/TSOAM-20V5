/**
 * Response Body Debugging Utility
 * Helps track and prevent "body stream already read" errors
 */

// Track all response objects to monitor their usage
const responseTracker = new WeakMap<Response, {
  url: string;
  method: string;
  consumed: boolean;
  timestamp: number;
}>();

/**
 * Monitor response consumption to prevent duplicate reads
 */
export function trackResponse(response: Response, url: string, method: string = 'GET'): Response {
  responseTracker.set(response, {
    url,
    method,
    consumed: false,
    timestamp: Date.now()
  });
  
  return response;
}

/**
 * Check if response body has been consumed
 */
export function isResponseConsumed(response: Response): boolean {
  const tracking = responseTracker.get(response);
  return response.bodyUsed || (tracking?.consumed ?? false);
}

/**
 * Mark response as consumed
 */
export function markResponseConsumed(response: Response): void {
  const tracking = responseTracker.get(response);
  if (tracking) {
    tracking.consumed = true;
  }
}

/**
 * Enhanced fetch wrapper that tracks response consumption
 */
export async function debugFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    console.log(`🌐 DEBUG FETCH: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, options);
    
    // Track this response
    trackResponse(response, url, options.method || 'GET');
    
    console.log(`✅ RESPONSE: ${response.status} ${response.statusText} for ${url}`);
    console.log(`📊 Body Used: ${response.bodyUsed}`);
    
    return response;
  } catch (error) {
    console.error(`❌ FETCH ERROR for ${url}:`, error);
    throw error;
  }
}

/**
 * Safe response consumption with detailed logging
 */
export async function safeConsumeResponse(response: Response, consumeType: 'json' | 'text' = 'json'): Promise<any> {
  const tracking = responseTracker.get(response);
  const url = tracking?.url || 'unknown';
  
  console.log(`🔍 CONSUMING RESPONSE: ${consumeType} from ${url}`);
  console.log(`📊 Body Used Before: ${response.bodyUsed}`);
  
  if (response.bodyUsed) {
    const error = `❌ BODY ALREADY CONSUMED: ${url}`;
    console.error(error);
    throw new Error(`Response body already consumed for ${url}`);
  }
  
  try {
    let result;
    
    if (consumeType === 'json') {
      const text = await response.text();
      markResponseConsumed(response);
      console.log(`✅ TEXT CONSUMED: ${text.length} chars from ${url}`);
      
      if (!text.trim()) {
        throw new Error(`Empty response from ${url}`);
      }
      
      result = JSON.parse(text);
      console.log(`✅ JSON PARSED: ${url}`);
    } else {
      result = await response.text();
      markResponseConsumed(response);
      console.log(`✅ TEXT CONSUMED: ${result.length} chars from ${url}`);
    }
    
    console.log(`📊 Body Used After: ${response.bodyUsed}`);
    return result;
    
  } catch (error) {
    console.error(`❌ CONSUMPTION ERROR for ${url}:`, error);
    throw error;
  }
}

/**
 * Enhanced authentication fetch with debugging
 */
export async function debugAuthFetch(email: string, password: string, otp?: string, rememberMe: boolean = false): Promise<any> {
  console.log(`🔐 DEBUG AUTH: Attempting login for ${email}`);
  
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
    
    const result = await safeConsumeResponse(response, 'json');
    
    console.log(`🔐 AUTH RESULT:`, result.success ? '✅ SUCCESS' : '❌ FAILED');
    
    return {
      success: result.success || false,
      data: result,
      status: response.status
    };
    
  } catch (error) {
    console.error(`🔐 AUTH ERROR:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      status: 0
    };
  }
}
