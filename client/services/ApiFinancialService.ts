/**
 * TSOAM Church Management System - API Financial Service
 *
 * Service for financial transaction management using REST API
 * Replaces localStorage-based operations with database operations
 *
 * @author TSOAM Development Team
 * @version 3.0.0
 */

import DemoDataService from './DemoDataService';

export interface FinancialTransaction {
  id: string;
  transaction_id: string;
  date: string;
  type: "Income" | "Expense";
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  currency: string;
  payment_method: "Cash" | "M-Pesa" | "Bank Transfer" | "Cheque";
  reference: string;
  mpesa_transaction_id?: string;
  status: "Pending" | "Approved" | "Rejected" | "Completed" | "Cancelled";
  created_by: string;
  approved_by?: string;
  approved_date?: string;
  notes?: string;
  account_code?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3002' : '');

export class ApiFinancialService {
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
   * Get all financial transactions
   */
  static async getAllTransactions(filters?: {
    type?: string;
    category?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    limit?: number;
  }): Promise<FinancialTransaction[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/api/finance/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
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
        console.log('API authentication required for transactions, will use demo data');
      } else {
        console.error('Error loading transactions, using demo data:', error);
      }
      // Fallback to demo data when API is not available
      let demoData = DemoDataService.getDemoFinancialTransactions();

      // Apply filters to demo data
      if (filters) {
        if (filters.type) {
          demoData = demoData.filter(t => t.type === filters.type);
        }
        if (filters.category) {
          demoData = demoData.filter(t => t.category === filters.category);
        }
        if (filters.status) {
          demoData = demoData.filter(t => t.status === filters.status);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          demoData = demoData.filter(t =>
            t.description.toLowerCase().includes(searchLower) ||
            t.reference.toLowerCase().includes(searchLower)
          );
        }
        if (filters.limit) {
          demoData = demoData.slice(0, filters.limit);
        }
      }

      return demoData;
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(id: string): Promise<FinancialTransaction | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/transactions/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error loading transaction:', error);
      return null;
    }
  }

  /**
   * Create new transaction
   */
  static async createTransaction(transactionData: Omit<FinancialTransaction, 'id' | 'transaction_id' | 'created_at' | 'updated_at'>): Promise<FinancialTransaction | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/transactions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }

  /**
   * Update transaction
   */
  static async updateTransaction(id: string, updateData: Partial<FinancialTransaction>): Promise<FinancialTransaction | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/transactions/${id}`, {
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
      console.error('Error updating transaction:', error);
      return null;
    }
  }

  /**
   * Delete transaction
   */
  static async deleteTransaction(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/transactions/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }

  /**
   * Get financial summary
   */
  static async getFinancialSummary(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/summary`, {
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
        console.log('API authentication required for financial summary, will use demo data');
      } else {
        console.error('Error loading financial summary, using demo data:', error);
      }
      return DemoDataService.getDemoFinancialSummary();
    }
  }

  /**
   * Search transactions
   */
  static async searchTransactions(searchTerm: string): Promise<FinancialTransaction[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/transactions/search/${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error searching transactions:', error);
      return [];
    }
  }

  /**
   * Approve transaction
   */
  static async approveTransaction(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/transactions/${id}/approve`, {
        method: 'PUT',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error approving transaction:', error);
      return false;
    }
  }

  /**
   * Reject transaction
   */
  static async rejectTransaction(id: string, rejectionReason: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/transactions/${id}/reject`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      return false;
    }
  }

  /**
   * Get pending transactions for approval
   */
  static async getPendingTransactions(): Promise<FinancialTransaction[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/transactions/pending/approval`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error loading pending transactions:', error);
      return [];
    }
  }

  /**
   * Get monthly financial report
   */
  static async getMonthlyReport(year: number, month: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/reports/monthly?year=${year}&month=${month}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error loading monthly report:', error);
      return null;
    }
  }

  /**
   * Get yearly financial report
   */
  static async getYearlyReport(year: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/finance/reports/yearly?year=${year}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error loading yearly report:', error);
      return null;
    }
  }
}

export default ApiFinancialService;
