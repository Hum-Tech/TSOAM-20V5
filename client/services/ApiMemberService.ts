/**
 * TSOAM Church Management System - API Member Service
 *
 * Service for member management using REST API
 * Replaces localStorage-based operations with database operations
 *
 * @author TSOAM Development Team
 * @version 3.0.0
 */

export interface Member {
  id: string;
  member_id: string;
  tithe_number: string;
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender: "Male" | "Female";
  marital_status?: "Single" | "Married" | "Divorced" | "Widowed";
  address?: string;
  occupation?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_date?: string;
  baptism_date?: string;
  confirmation_date?: string;
  department?: string;
  position?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3002' : '');

export class ApiMemberService {
  /**
   * Get authentication token from localStorage
   */
  private static getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Get API headers with authorization
   */
  private static getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  /**
   * Get all members
   */
  static async getAllMembers(filters?: {
    is_active?: boolean;
    department?: string;
    search?: string;
    limit?: number;
  }): Promise<Member[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/api/members${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`Authentication required - HTTP error! status: ${response.status}`);
        } else if (response.status === 403) {
          throw new Error(`Access forbidden - HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      // Don't log authentication errors as errors - they're expected in production
      if (error instanceof Error && error.message.includes('401')) {
        console.log('API authentication required for members, will use demo data');
      } else {
        console.error('Error loading members:', error);
      }
      return [];
    }
  }

  /**
   * Get member by ID
   */
  static async getMemberById(id: string): Promise<Member | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`Authentication required - HTTP error! status: ${response.status}`);
        } else if (response.status === 403) {
          throw new Error(`Access forbidden - HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      // Don't log authentication errors as errors - they're expected in production
      if (error instanceof Error && error.message.includes('401')) {
        console.log('API authentication required for member details, will use demo data');
      } else {
        console.error('Error loading member:', error);
      }
      return null;
    }
  }

  /**
   * Create new member
   */
  static async createMember(memberData: Omit<Member, 'id' | 'member_id' | 'tithe_number' | 'created_at' | 'updated_at'>): Promise<Member | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(memberData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`Authentication required - HTTP error! status: ${response.status}`);
        } else if (response.status === 403) {
          throw new Error(`Access forbidden - HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      // Don't log authentication errors as errors - they're expected in production
      if (error instanceof Error && error.message.includes('401')) {
        console.log('API authentication required for creating member, will use local fallback');
      } else {
        console.error('Error creating member:', error);
      }
      return null;
    }
  }

  /**
   * Update member
   */
  static async updateMember(id: string, updateData: Partial<Member>): Promise<Member | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error updating member:', error);
      return null;
    }
  }

  /**
   * Delete member (soft delete)
   */
  static async deleteMember(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting member:', error);
      return false;
    }
  }

  /**
   * Search members
   */
  static async searchMembers(searchTerm: string): Promise<Member[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/search/${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error searching members:', error);
      return [];
    }
  }

  /**
   * Get member statistics
   */
  static async getMemberStatistics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/stats/summary`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error loading member statistics:', error);
      return null;
    }
  }

  /**
   * Transfer new member to full member
   */
  static async transferToFullMember(newMemberId: string): Promise<Member | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/transfer/${newMemberId}`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error transferring member:', error);
      return null;
    }
  }

  /**
   * Get eligible members for transfer
   */
  static async getEligibleForTransfer(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/eligible-for-transfer`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error loading eligible members:', error);
      return [];
    }
  }
}

export default ApiMemberService;
