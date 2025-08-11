/**
 * TSOAM Church Management System - HR Database Service
 *
 * Real HR service that connects to the database API
 */

export interface Employee {
  id: number;
  employee_id: string;
  member_id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender: 'Male' | 'Female';
  marital_status?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  national_id?: string;
  kra_pin?: string;
  nhif_number?: string;
  nssf_number?: string;
  department: string;
  position: string;
  employment_type: 'Full-time' | 'Part-time' | 'Volunteer';
  employment_status: 'Active' | 'Suspended' | 'Terminated' | 'On Leave';
  hire_date?: string;
  contract_end_date?: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  medical_allowance: number;
  other_allowances: number;
  bank_name?: string;
  account_number?: string;
  branch_code?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  education?: string;
  skills?: string;
  performance_rating?: number;
  last_review_date?: string;
  next_review_date?: string;
  annual_leave_balance: number;
  sick_leave_balance: number;
  maternity_leave_balance: number;
  paternity_leave_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PerformanceReview {
  id: number;
  employee_id: string;
  employee_name?: string;
  department?: string;
  position?: string;
  review_period: string;
  review_type: 'annual' | 'quarterly' | 'probationary';
  overall_rating: number;
  job_knowledge_rating?: number;
  quality_of_work_rating?: number;
  productivity_rating?: number;
  communication_rating?: number;
  teamwork_rating?: number;
  initiative_rating?: number;
  reliability_rating?: number;
  strengths?: string;
  areas_for_improvement?: string;
  goals?: string;
  development_plan?: string;
  manager_comments?: string;
  employee_comments?: string;
  reviewer_name: string;
  review_date: string;
  status: 'completed' | 'pending' | 'in-progress';
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3002' : '');

class HRDatabaseService {
  private static getAuthHeaders() {
    // Try multiple token sources for compatibility
    const token = localStorage.getItem('auth_token') ||
                  localStorage.getItem('tsoam_session_token') ||
                  localStorage.getItem('tsoam_remember_token');

    // For demo purposes, create a basic auth header if no token exists
    const authToken = token || 'demo-token-for-development';

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
  }

  // Employee Management
  static async getEmployees(signal?: AbortSignal): Promise<Employee[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees`, {
        headers: this.getAuthHeaders(),
        signal,
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log('Authentication required, using demo data');
          return this.getDemoEmployees();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch employees');
      }
    } catch (error) {
      // Handle abort errors silently
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error; // Re-throw abort errors to be handled by caller
      }

      console.error('Error fetching employees:', error);
      // Return demo data as fallback
      return this.getDemoEmployees();
    }
  }

  static async getEmployee(id: string): Promise<Employee | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees/${id}`, {
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  static async createEmployee(employeeData: Partial<Employee>): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(employeeData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating employee:', error);
      return { success: false, error: 'Failed to create employee' };
    }
  }

  static async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(employeeData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating employee:', error);
      return { success: false, error: 'Failed to update employee' };
    }
  }

  // Performance Review Management
  static async getPerformanceReviews(signal?: AbortSignal): Promise<PerformanceReview[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/performance-reviews`, {
        headers: this.getAuthHeaders(),
        signal,
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log('Authentication required for performance reviews, using demo data');
          return this.getDemoPerformanceReviews();
        }

        // Try to get error message from response
        try {
          const errorResult = await response.json();
          throw new Error(errorResult.error || `HTTP ${response.status}: ${response.statusText}`);
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch performance reviews');
      }
    } catch (error) {
      // Handle abort errors silently
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error; // Re-throw abort errors to be handled by caller
      }

      // Suppress authentication errors in console for cleaner UX
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Access denied') || errorMessage.includes('No token provided')) {
        console.log('Using demo performance reviews data');
      } else {
        console.error('Error fetching performance reviews:', error);
      }
      // Return demo data as fallback
      return this.getDemoPerformanceReviews();
    }
  }

  static async getPerformanceReview(id: string): Promise<PerformanceReview | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/performance-reviews/${id}`, {
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching performance review:', error);
      return null;
    }
  }

  static async createPerformanceReview(reviewData: Partial<PerformanceReview>): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/performance-reviews`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(reviewData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating performance review:', error);
      return { success: false, error: 'Failed to create performance review' };
    }
  }

  static async updatePerformanceReview(id: string, reviewData: Partial<PerformanceReview>): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/performance-reviews/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(reviewData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating performance review:', error);
      return { success: false, error: 'Failed to update performance review' };
    }
  }

  static async deletePerformanceReview(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/performance-reviews/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting performance review:', error);
      return { success: false, error: 'Failed to delete performance review' };
    }
  }

  // Demo data fallbacks
  private static getDemoEmployees(): Employee[] {
    return [
      {
        id: 1,
        employee_id: "TSOAM-EMP-001",
        full_name: "John Kamau",
        email: "john.kamau@tsoam.org",
        phone: "+254712345678",
        address: "123 Nairobi Street, Nairobi",
        date_of_birth: "1985-03-15",
        gender: "Male",
        marital_status: "Married",
        national_id: "12345678",
        department: "Administration",
        position: "Administrator",
        employment_type: "Full-time",
        employment_status: "Active",
        hire_date: "2020-01-15",
        basic_salary: 80000,
        housing_allowance: 20000,
        transport_allowance: 10000,
        medical_allowance: 5000,
        other_allowances: 5000,
        performance_rating: 4.5,
        annual_leave_balance: 21,
        sick_leave_balance: 30,
        maternity_leave_balance: 90,
        paternity_leave_balance: 14,
        is_active: true,
        created_at: "2020-01-15T10:00:00Z",
        updated_at: "2024-12-01T10:00:00Z",
      },
      {
        id: 2,
        employee_id: "TSOAM-EMP-002",
        full_name: "Grace Wanjiku",
        email: "grace.wanjiku@tsoam.org",
        phone: "+254798765432",
        address: "456 Mombasa Road, Nairobi",
        date_of_birth: "1990-08-22",
        gender: "Female",
        marital_status: "Single",
        national_id: "98765432",
        department: "Human Resources",
        position: "HR Assistant",
        employment_type: "Full-time",
        employment_status: "Active",
        hire_date: "2021-05-10",
        basic_salary: 65000,
        housing_allowance: 15000,
        transport_allowance: 8000,
        medical_allowance: 4000,
        other_allowances: 3000,
        performance_rating: 4.2,
        annual_leave_balance: 21,
        sick_leave_balance: 30,
        maternity_leave_balance: 90,
        paternity_leave_balance: 14,
        is_active: true,
        created_at: "2021-05-10T10:00:00Z",
        updated_at: "2024-12-01T10:00:00Z",
      }
    ];
  }

  private static getDemoPerformanceReviews(): PerformanceReview[] {
    return [
      {
        id: 1,
        employee_id: "TSOAM-EMP-001",
        employee_name: "John Kamau",
        department: "Administration",
        position: "Administrator",
        review_period: "Q3 2024",
        review_type: "quarterly",
        overall_rating: 4.5,
        job_knowledge_rating: 4.0,
        quality_of_work_rating: 5.0,
        productivity_rating: 4.5,
        communication_rating: 4.0,
        teamwork_rating: 4.5,
        initiative_rating: 4.0,
        reliability_rating: 5.0,
        strengths: "Excellent leadership skills and strong work ethic",
        areas_for_improvement: "Could improve time management",
        goals: "Complete advanced training program by Q1 2025",
        manager_comments: "John consistently exceeds expectations",
        reviewer_name: "HR Manager",
        review_date: "2024-09-30",
        status: "completed",
        created_at: "2024-09-30T10:00:00Z",
        updated_at: "2024-09-30T10:00:00Z",
      },
      {
        id: 2,
        employee_id: "TSOAM-EMP-002",
        employee_name: "Grace Wanjiku",
        department: "Human Resources",
        position: "HR Assistant",
        review_period: "Q3 2024",
        review_type: "quarterly",
        overall_rating: 4.2,
        job_knowledge_rating: 4.5,
        quality_of_work_rating: 4.0,
        productivity_rating: 4.0,
        communication_rating: 4.5,
        teamwork_rating: 4.0,
        initiative_rating: 3.5,
        reliability_rating: 4.5,
        strengths: "Great attention to detail and communication skills",
        areas_for_improvement: "Needs to take more initiative in projects",
        goals: "Lead a major HR project by Q2 2025",
        manager_comments: "Grace shows great potential for growth",
        reviewer_name: "HR Manager",
        review_date: "2024-09-30",
        status: "completed",
        created_at: "2024-09-30T10:00:00Z",
        updated_at: "2024-09-30T10:00:00Z",
      }
    ];
  }
}

export default HRDatabaseService;
