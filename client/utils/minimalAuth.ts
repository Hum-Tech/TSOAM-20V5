/**
 * Minimal Native Authentication - Using XHR to avoid fetch interception
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
  return new Promise((resolve) => {
    try {
      console.log('🔐 NATIVE: Starting login for', email);

      const xhr = new XMLHttpRequest();
      let timeoutId: NodeJS.Timeout | null = null;

      // Setup timeout
      const setupTimeout = () => {
        timeoutId = setTimeout(() => {
          xhr.abort();
          console.error('🔐 NATIVE: Request timeout');
          resolve({
            success: false,
            error: 'Request timeout - please try again',
          });
        }, 15000); // 15 second timeout
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return; // Not done yet

        if (timeoutId) clearTimeout(timeoutId);

        try {
          console.log('🔐 NATIVE: Response status:', xhr.status);
          console.log('🔐 NATIVE: Response text length:', xhr.responseText.length);

          if (!xhr.responseText) {
            console.error('🔐 NATIVE: Empty response');
            resolve({
              success: false,
              error: 'Empty response from server',
            });
            return;
          }

          let data;
          try {
            data = JSON.parse(xhr.responseText);
            console.log('🔐 NATIVE: JSON parsed successfully');
          } catch (parseError) {
            console.error('🔐 NATIVE: JSON parse failed:', parseError);
            resolve({
              success: false,
              error: 'Invalid response format from server',
            });
            return;
          }

          // Check for success flag in response
          if (data.success === false) {
            console.error('🔐 NATIVE: Login failed:', data.error);
            resolve({
              success: false,
              error: data.error || 'Login failed',
            });
            return;
          }

          // Handle HTTP errors
          if (xhr.status < 200 || xhr.status >= 300) {
            console.error('🔐 NATIVE: Server error:', xhr.status, data);
            resolve({
              success: false,
              error: data.error || `Server error: ${xhr.status}`,
            });
            return;
          }

          // Check required fields in response
          if (!data.token || !data.user) {
            console.error('🔐 NATIVE: Missing token or user in response');
            resolve({
              success: false,
              error: 'Invalid response from server - missing token or user',
            });
            return;
          }

          console.log('🔐 NATIVE: Login successful');
          resolve({
            success: true,
            user: data.user,
            token: data.token,
          });
        } catch (error) {
          console.error('🔐 NATIVE: Error processing response:', error);
          resolve({
            success: false,
            error: `Error processing response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      };

      xhr.onerror = () => {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('🔐 NATIVE: XHR error');
        resolve({
          success: false,
          error: 'Network error occurred',
        });
      };

      xhr.onabort = () => {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('🔐 NATIVE: XHR aborted');
        resolve({
          success: false,
          error: 'Request was cancelled',
        });
      };

      // Prepare request
      xhr.open('POST', '/api/auth/login', true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      // Start timeout
      setupTimeout();

      // Send request
      const body = JSON.stringify({
        email,
        password,
        ...(otp && { otp }),
        ...(rememberMe !== undefined && { rememberMe }),
      });

      console.log('🔐 NATIVE: Sending request...');
      xhr.send(body);
    } catch (error) {
      console.error('🔐 NATIVE: Setup error:', error);
      resolve({
        success: false,
        error: `Setup error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });
}
