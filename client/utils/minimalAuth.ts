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
  requireOTP?: boolean;
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

    // Clone the response immediately to prevent body consumption issues
    const clonedResponse = response.clone();

    let data;

    // Try to parse as JSON using cloned response
    try {
      console.log('🔐 NATIVE: Parsing response as JSON...');
      data = await clonedResponse.json();
      console.log('🔐 NATIVE: JSON parsing successful, data:', data);
    } catch (jsonError) {
      console.error('🔐 NATIVE: JSON parse failed:', jsonError);

      // Last resort: try to read as text
      try {
        console.log('🔐 NATIVE: Attempting text fallback...');
        const responseText = await response.text();
        if (!responseText) {
          throw new Error('Empty response');
        }
        console.log('🔐 NATIVE: Response text:', responseText.substring(0, 100));
        data = JSON.parse(responseText);
        console.log('🔐 NATIVE: Text fallback successful');
      } catch (fallbackError) {
        console.error('🔐 NATIVE: Text fallback also failed:', fallbackError);
        return {
          success: false,
          error: 'Failed to read server response',
        };
      }
    }

    if (!response.ok) {
      console.error('🔐 NATIVE: Server error:', response.status, data);
      return {
        success: false,
        error: data.error || `Server error: ${response.status}`,
        requireOTP: data.requireOTP || false,
      };
    }

    if (!data.success && !data.requireOTP) {
      console.error('🔐 NATIVE: Login failed:', data.error);
      return {
        success: false,
        error: data.error || 'Login failed',
      };
    }

    // Check if OTP is required
    if (data.requireOTP) {
      console.log('🔐 NATIVE: OTP required for this user');
      return {
        success: false,
        error: data.error || 'OTP required',
        requireOTP: true,
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
