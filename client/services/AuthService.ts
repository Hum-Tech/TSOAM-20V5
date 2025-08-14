/**
 * TSOAM Church Management System - Authentication Service
 *
 * Service for user authentication and session management
 *
 * @author TSOAM Development Team
 * @version 3.0.0
 */

import { safeJsonParse } from '../utils/requestDebounce';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'HR Officer' | 'Finance Officer' | 'User';
  department?: string;
  employee_id?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3002' : '');

export class AuthService {
  private static currentUser: User | null = null;

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await safeJsonParse(response);

      if (result.success && result.token) {
        // Store token and user data
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('user_data', JSON.stringify(result.user));
        this.currentUser = result.user;

        return {
          success: true,
          user: result.user,
          token: result.token,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);

      // Fallback for development - demo login
      if (credentials.email === 'admin@tsoam.org' && credentials.password === 'admin123') {
        const demoUser: User = {
          id: 'demo-admin-001',
          name: 'Demo Administrator',
          email: 'admin@tsoam.org',
          role: 'Admin',
          department: 'Administration',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };

        const demoToken = 'demo-token-' + Date.now();
        localStorage.setItem('auth_token', demoToken);
        localStorage.setItem('user_data', JSON.stringify(demoUser));
        this.currentUser = demoUser;

        return {
          success: true,
          user: demoUser,
          token: demoToken,
        };
      }

      return {
        success: false,
        error: 'Connection error. Please try again.',
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');

      if (token && token.startsWith('demo-token-')) {
        // Demo mode - just clear local storage
        this.clearLocalAuth();
        return;
      }

      // Attempt server logout
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearLocalAuth();
    }
  }

  /**
   * Clear local authentication data
   */
  private static clearLocalAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    this.currentUser = null;
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearLocalAuth();
      }
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Get authentication token
   */
  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Check if user has specific role
   */
  static hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Register new user (admin only)
   */
  static async register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
  }): Promise<AuthResponse> {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(userData),
      });

      const result = await safeJsonParse(response);
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    }
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await safeJsonParse(response);
      return result;
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Password change failed. Please try again.',
      };
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await safeJsonParse(response);
      return result;
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: 'Password reset request failed. Please try again.',
      };
    }
  }

  /**
   * Verify authentication token
   */
  static async verifyToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      if (token.startsWith('demo-token-')) {
        // Demo mode - always valid
        return true;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await safeJsonParse(response);
        return result.success;
      } else {
        this.clearLocalAuth();
        return false;
      }
    } catch (error) {
      console.error('Token verification error:', error);
      // In case of network error, assume token is still valid if it exists
      return !!this.getToken();
    }
  }
}

export default AuthService;
