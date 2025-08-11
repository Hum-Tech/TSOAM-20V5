/**
 * TSOAM Church Management System - API HR Service
 *
 * Service for employee and HR management using REST API
 * Replaces localStorage-based operations with database operations
 *
 * @author TSOAM Development Team
 * @version 3.0.0
 */

export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  gender: "Male" | "Female";
  marital_status?: "Single" | "Married" | "Divorced" | "Widowed";
  address?: string;
  national_id: string;
  kra_pin?: string;
  nhif_number?: string;
  nssf_number?: string;
  position: string;
  department: string;
  employment_type: "Permanent" | "Contract" | "Part-time" | "Intern";
  employment_status: "Active" | "Terminated" | "Suspended" | "On Leave";
  salary: number;
  hire_date: string;
  bank_name?: string;
  bank_account_number?: string;
  next_of_kin_name?: string;
  next_of_kin_relationship?: string;
  next_of_kin_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: string;
  payroll_id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  gross_pay: number;
  net_pay: number;
  tax: number;
  nhif: number;
  nssf: number;
  other_deductions: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_pay: number;
  status: "Pending" | "Processed" | "Approved";
  processed_by?: string;
  processed_date?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3002' : '');

export class ApiHRService {
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
   * Get all employees
   */
  static async getAllEmployees(filters?: {
    is_active?: boolean;
    department?: string;
    employment_status?: string;
    search?: string;
    limit?: number;
  }): Promise<Employee[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/api/hr/employees${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error loading employees:', error);
      return [];
    }
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error loading employee:', error);
      return null;
    }
  }

  /**
   * Create new employee
   */
  static async createEmployee(employeeData: Omit<Employee, 'id' | 'employee_id' | 'created_at' | 'updated_at'>): Promise<Employee | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error creating employee:', error);
      return null;
    }
  }

  /**
   * Update employee
   */
  static async updateEmployee(id: string, updateData: Partial<Employee>): Promise<Employee | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees/${id}`, {
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
      console.error('Error updating employee:', error);
      return null;
    }
  }

  /**
   * Delete employee (soft delete)
   */
  static async deleteEmployee(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  }

  /**
   * Search employees
   */
  static async searchEmployees(searchTerm: string): Promise<Employee[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees/search/${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error searching employees:', error);
      return [];
    }
  }

  /**
   * Get employee statistics
   */
  static async getEmployeeStatistics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees/stats/summary`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error loading employee statistics:', error);
      return null;
    }
  }

  /**
   * Create payroll record
   */
  static async createPayrollRecord(payrollData: Omit<PayrollRecord, 'id' | 'payroll_id' | 'created_at' | 'updated_at'>): Promise<PayrollRecord | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/payroll`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payrollData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error creating payroll record:', error);
      return null;
    }
  }

  /**
   * Get payroll records for employee
   */
  static async getEmployeePayroll(employeeId: string, filters?: {
    year?: number;
    month?: number;
  }): Promise<PayrollRecord[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/api/hr/payroll/${employeeId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error loading payroll records:', error);
      return [];
    }
  }

  /**
   * Upload employee document
   */
  static async uploadEmployeeDocument(employeeId: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const token = this.getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/hr/employees/${employeeId}/documents`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error uploading document:', error);
      return null;
    }
  }

  /**
   * Get employee documents
   */
  static async getEmployeeDocuments(employeeId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/employees/${employeeId}/documents`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error loading employee documents:', error);
      return [];
    }
  }
}

export default ApiHRService;
