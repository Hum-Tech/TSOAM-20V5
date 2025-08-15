/**
 * Comprehensive Safe Fetch Utility
 * Prevents all "Response body already consumed" errors
 */

/**
 * Safe JSON parsing that handles all edge cases
 */
export async function safeParseResponse(response: Response): Promise<any> {
  // Check if response body has already been consumed
  if (response.bodyUsed) {
    throw new Error(`Response body already consumed for ${response.url}`);
  }

  try {
    // Get response as text first
    const responseText = await response.text();
    
    // Handle empty responses
    if (!responseText || responseText.trim() === '') {
      return {};
    }

    // Try to parse as JSON
    try {
      return JSON.parse(responseText);
    } catch (jsonError) {
      console.error('JSON parse error for response:', responseText);
      // Return the text if it's not valid JSON
      return { message: responseText, text: responseText };
    }
  } catch (error) {
    console.error('Failed to read response:', error);
    throw new Error(`Failed to read response from ${response.url}`);
  }
}

/**
 * Safe fetch wrapper that handles all response consumption safely
 */
export async function safeFetchRequest(url: string, options: RequestInit = {}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}> {
  try {
    console.log(`🌐 Safe fetch: ${options.method || 'GET'} ${url}`);
    
    // Set default headers
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    console.log(`📊 Response status: ${response.status} for ${url}`);

    // Safely parse the response
    const data = await safeParseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        data
      };
    }

    return {
      success: true,
      data,
      status: response.status
    };

  } catch (error) {
    console.error(`❌ Fetch error for ${url}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network request failed',
      status: 0
    };
  }
}

/**
 * Authentication-specific safe fetch
 */
export async function safeAuthFetch(
  email: string,
  password: string,
  otp?: string,
  rememberMe?: boolean
) {
  return safeFetchRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      otp,
      rememberMe,
    }),
  });
}

/**
 * Generic API request wrapper
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const result = await safeFetchRequest(endpoint, options);
  return {
    success: result.success,
    data: result.data,
    error: result.error
  };
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  endpoint: string,
  data: any
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(
  endpoint: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiRequest<T>(endpoint, {
    method: 'GET',
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  endpoint: string,
  data: any
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(
  endpoint: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
  });
}
