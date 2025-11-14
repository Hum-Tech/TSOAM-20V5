/**
 * Minimal Native Authentication
 * Uses only native browser fetch - no wrappers, no utilities, no interference
 */

export async function nativeLogin(
  email: string,
  password: string,
  otp?: string,
  rememberMe?: boolean
): Promise<{
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}> {
  try {
    console.log('🔐 NATIVE: Starting login for', email);

    // Use native fetch directly - no wrappers
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        ...(otp && { otp }),
        ...(rememberMe !== undefined && { rememberMe }),
      }),
    });

    console.log('🔐 NATIVE: Response status:', response.status);

    // Read response text once
    const responseText = await response.text();
    console.log('🔐 NATIVE: Response text length:', responseText.length);

    if (!responseText) {
      console.error('🔐 NATIVE: Empty response');
      return {
        success: false,
        error: 'Empty response from server',
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('🔐 NATIVE: JSON parse failed:', e);
      return {
        success: false,
        error: 'Invalid response format',
      };
    }

    if (!response.ok) {
      console.error('🔐 NATIVE: Server error:', response.status, data);
      return {
        success: false,
        error: data.error || `Server error: ${response.status}`,
      };
    }

    if (!data.success) {
      console.error('🔐 NATIVE: Login failed:', data.error);
      return {
        success: false,
        error: data.error || 'Login failed',
      };
    }

    console.log('🔐 NATIVE: Login successful');
    return {
      success: true,
      user: data.user,
      token: data.token,
    };
  } catch (error) {
    console.error('🔐 NATIVE: Fetch error:', error);
    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
