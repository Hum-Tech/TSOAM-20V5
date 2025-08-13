/**
 * Robust Response Handler Utility
 * Handles API responses with multiple fallback strategies to prevent stream consumption errors
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * Safely parse response text as JSON with error handling
 */
function parseJsonSafely(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parse error:', error);
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
  }
}

/**
 * Handle fetch response with multiple strategies to avoid stream consumption errors
 */
export async function handleResponse(response: Response): Promise<ApiResponse> {
  const status = response.status;
  
  try {
    // Strategy 1: Check if body is already consumed
    if (response.bodyUsed) {
      return {
        success: false,
        error: "Response body already consumed",
        status
      };
    }

    // Strategy 2: Get response as text first
    let responseText: string;
    try {
      responseText = await response.text();
    } catch (textError) {
      console.error('Failed to read response text:', textError);
      return {
        success: false,
        error: "Failed to read server response",
        status
      };
    }

    // Strategy 3: Handle empty responses
    if (!responseText) {
      return {
        success: false,
        error: "Empty response from server",
        status
      };
    }

    // Strategy 4: Parse JSON safely
    let data: any;
    try {
      data = parseJsonSafely(responseText);
    } catch (parseError) {
      console.error('Response parsing failed:', parseError);
      return {
        success: false,
        error: "Invalid response format from server",
        status
      };
    }

    // Strategy 5: Return based on HTTP status
    if (response.ok) {
      return {
        success: true,
        data,
        status
      };
    } else {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${status} error`,
        status
      };
    }

  } catch (error) {
    console.error('Response handling failed:', error);
    return {
      success: false,
      error: "Failed to process server response",
      status
    };
  }
}

/**
 * Perform authenticated API request with robust error handling
 */
export async function robustFetch(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse> {
  try {
    // Set default headers
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Perform request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return {
          success: false,
          error: "Request timeout - server took too long to respond",
          status: 408
        };
      }
      
      return {
        success: false,
        error: "Network error - unable to connect to server",
        status: 0
      };
    }

    // Handle response using robust strategy
    return await handleResponse(response);

  } catch (error) {
    console.error('Robust fetch failed:', error);
    return {
      success: false,
      error: "Request failed due to unexpected error",
      status: 0
    };
  }
}

/**
 * Authentication-specific fetch with enhanced error handling
 */
export async function authFetch(
  email: string,
  password: string,
  otp?: string,
  rememberMe: boolean = false
): Promise<ApiResponse> {
  return robustFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      otp,
      rememberMe,
    }),
  });
}
