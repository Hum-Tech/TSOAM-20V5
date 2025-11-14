/**
 * Completely Isolated Authentication Utility
 * Bypasses all other fetch utilities to prevent response consumption conflicts
 */

// Track authentication state to prevent concurrent requests
let isAuthenticating = false;
let currentAuthPromise: Promise<any> | null = null;

/**
 * Completely isolated authentication function
 * Uses native fetch only, no shared utilities
 */
export async function isolatedAuthentication(
  email: string,
  password: string,
  otp?: string,
  rememberMe?: boolean
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}> {
  
  // Prevent concurrent authentication requests
  if (isAuthenticating && currentAuthPromise) {
    console.log("🔐 ISOLATED: Authentication already in progress, waiting...");
    try {
      return await currentAuthPromise;
    } catch (error) {
      // Reset state on error
      isAuthenticating = false;
      currentAuthPromise = null;
      throw error;
    }
  }

  isAuthenticating = true;
  
  const authPromise = performIsolatedAuth(email, password, otp, rememberMe);
  currentAuthPromise = authPromise;
  
  try {
    const result = await authPromise;
    return result;
  } finally {
    // Always reset state
    isAuthenticating = false;
    currentAuthPromise = null;
  }
}

/**
 * Internal authentication function - completely isolated
 */
async function performIsolatedAuth(
  email: string,
  password: string,
  otp?: string,
  rememberMe?: boolean
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}> {
  
  console.log("🔐 ISOLATED: Starting isolated authentication for:", email);
  
  let response: Response;
  
  try {
    // Create completely new fetch request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000); // 15 second timeout
    
    console.log("🔐 ISOLATED: Making fetch request...");
    
    response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        otp,
        rememberMe,
      }),
      signal: controller.signal,
      // Ensure fresh request
      cache: 'no-cache',
      credentials: 'same-origin',
    });
    
    clearTimeout(timeoutId);
    
    console.log(`🔐 ISOLATED: Response received - Status: ${response.status}, BodyUsed: ${response.bodyUsed}`);
    
  } catch (fetchError) {
    console.error("🔐 ISOLATED: Fetch failed:", fetchError);
    
    if (fetchError instanceof Error) {
      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          error: 'Authentication timeout - please try again',
          status: 408
        };
      }
      return {
        success: false,
        error: `Network error: ${fetchError.message}`,
        status: 0
      };
    }
    
    return {
      success: false,
      error: 'Unknown network error',
      status: 0
    };
  }
  
  let responseText: string;

  try {
    console.log("🔐 ISOLATED: Reading response as text...");
    responseText = await response.text();
    console.log(`🔐 ISOLATED: Response text length: ${responseText.length}`);
    
    // Double-check that we successfully consumed the body
    if (!responseText) {
      console.warn("🔐 ISOLATED: Empty response received");
      return {
        success: false,
        error: 'Empty response from server',
        status: response.status
      };
    }
    
  } catch (textError) {
    console.error("🔐 ISOLATED: Failed to read response text:", textError);
    return {
      success: false,
      error: 'Failed to read server response',
      status: response.status
    };
  }
  
  let parsedData: any;
  
  try {
    console.log("🔐 ISOLATED: Parsing JSON...");
    parsedData = JSON.parse(responseText);
    console.log("🔐 ISOLATED: JSON parsing successful");
    
  } catch (parseError) {
    console.error("🔐 ISOLATED: JSON parsing failed:", parseError);
    console.error("🔐 ISOLATED: Response text was:", responseText);
    
    return {
      success: false,
      error: 'Invalid response format from server',
      status: response.status
    };
  }
  
  // Determine success based on response status and data
  const isSuccess = response.ok && (parsedData.success !== false);
  
  const result = {
    success: isSuccess,
    data: parsedData,
    error: !isSuccess ? (parsedData.error || parsedData.message || `HTTP ${response.status}`) : undefined,
    status: response.status
  };
  
  console.log(`🔐 ISOLATED: Authentication result:`, result.success ? '✅ Success' : `❌ Failed: ${result.error}`);
  
  return result;
}

/**
 * Reset authentication state (for debugging)
 */
export function resetAuthState() {
  isAuthenticating = false;
  currentAuthPromise = null;
  console.log("🔐 ISOLATED: Authentication state reset");
}

/**
 * Get authentication state (for debugging)
 */
export function getAuthState() {
  return {
    isAuthenticating,
    hasCurrentPromise: currentAuthPromise !== null
  };
}
