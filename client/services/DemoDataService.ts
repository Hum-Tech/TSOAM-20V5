/**
 * TSOAM Church Management System - Demo Data Service
 *
 * Provides demo data for development and testing when database is not available
 *
 * @author TSOAM Development Team
 * @version 3.0.0
 */

import { FinancialTransaction } from './ApiFinancialService';
import { Member } from './ApiMemberService';
import { Employee } from './ApiHRService';
import { Event } from './ApiEventService';

export class DemoDataService {
  /**
   * Generate demo financial transactions
   */
  static getDemoFinancialTransactions(): FinancialTransaction[] {
    return [
      {
        id: '1',
        transaction_id: 'TXN-2025-001',
        date: '2025-01-15',
        type: 'Income',
        category: 'Tithe',
        description: 'Sunday Service Tithe Collection',
        amount: 250000,
        currency: 'KSh',
        payment_method: 'Cash',
        reference: 'REF-001',
        status: 'Completed',
        created_by: 'Finance Officer',
        account_code: 'INC-001',
        created_at: '2025-01-15T09:00:00Z',
        updated_at: '2025-01-15T09:00:00Z',
      },
      {
        id: '2',
        transaction_id: 'TXN-2025-002',
        date: '2025-01-16',
        type: 'Expense',
        category: 'Equipment',
        subcategory: 'Office Supplies',
        description: 'Purchase of office computers',
        amount: 150000,
        currency: 'KSh',
        payment_method: 'Bank Transfer',
        reference: 'INV-001',
        status: 'Approved',
        created_by: 'IT Manager',
        approved_by: 'Pastor',
        approved_date: '2025-01-16',
        account_code: 'EXP-001',
        created_at: '2025-01-16T10:30:00Z',
        updated_at: '2025-01-16T10:30:00Z',
      },
      {
        id: '3',
        transaction_id: 'TXN-2025-003',
        date: '2025-01-17',
        type: 'Income',
        category: 'Special Offering',
        description: 'Building Fund Collection',
        amount: 75000,
        currency: 'KSh',
        payment_method: 'M-Pesa',
        reference: 'MPESA-001',
        mpesa_transaction_id: 'RKL9A2B3C4',
        status: 'Completed',
        created_by: 'Finance Officer',
        account_code: 'INC-002',
        created_at: '2025-01-17T14:15:00Z',
        updated_at: '2025-01-17T14:15:00Z',
      },
    ];
  }

  /**
   * Generate demo members
   */
  static getDemoMembers(): Member[] {
    return [
      {
        id: '1',
        member_id: 'TSOAM2025-001',
        tithe_number: 'T2025-001',
        full_name: 'John Kamau Njoroge',
        email: 'john.kamau@email.com',
        phone: '+254-700-123-456',
        date_of_birth: '1985-03-15',
        gender: 'Male',
        marital_status: 'Married',
        address: 'P.O. Box 1234, Nairobi',
        occupation: 'Software Engineer',
        department: 'Men Fellowship',
        position: 'Member',
        is_active: true,
        membership_date: '2023-06-15',
        baptism_date: '2023-08-20',
        emergency_contact_name: 'Mary Kamau',
        emergency_contact_phone: '+254-700-654-321',
        created_at: '2023-06-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      },
      {
        id: '2',
        member_id: 'TSOAM2025-002',
        tithe_number: 'T2025-002',
        full_name: 'Grace Wanjiku Mwangi',
        email: 'grace.wanjiku@email.com',
        phone: '+254-722-987-654',
        date_of_birth: '1990-07-22',
        gender: 'Female',
        marital_status: 'Single',
        address: 'P.O. Box 5678, Nairobi',
        occupation: 'Teacher',
        department: 'Women Fellowship',
        position: 'Secretary',
        is_active: true,
        membership_date: '2024-01-10',
        baptism_date: '2024-03-15',
        emergency_contact_name: 'Peter Mwangi',
        emergency_contact_phone: '+254-722-456-789',
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      },
    ];
  }

  /**
   * Generate demo employees
   */
  static getDemoEmployees(): Employee[] {
    return [
      {
        id: '1',
        employee_id: 'TSOAM-EMP-001',
        first_name: 'James',
        last_name: 'Kimani',
        email: 'pastor.james@tsoam.org',
        phone: '+254-700-111-222',
        date_of_birth: '1975-05-10',
        gender: 'Male',
        marital_status: 'Married',
        address: 'P.O. Box 9999, Nairobi',
        national_id: '12345678',
        position: 'Senior Pastor',
        department: 'Ministry',
        employment_type: 'Permanent',
        employment_status: 'Active',
        salary: 120000,
        hire_date: '2015-01-01',
        bank_name: 'KCB Bank',
        bank_account_number: '1234567890',
        next_of_kin_name: 'Sarah Kimani',
        next_of_kin_relationship: 'Spouse',
        next_of_kin_phone: '+254-700-333-444',
        is_active: true,
        created_at: '2015-01-01T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      },
      {
        id: '2',
        employee_id: 'TSOAM-EMP-002',
        first_name: 'Mary',
        last_name: 'Njeri',
        email: 'mary.njeri@tsoam.org',
        phone: '+254-722-555-666',
        date_of_birth: '1988-12-03',
        gender: 'Female',
        marital_status: 'Single',
        address: 'P.O. Box 8888, Nairobi',
        national_id: '87654321',
        position: 'Finance Officer',
        department: 'Finance',
        employment_type: 'Permanent',
        employment_status: 'Active',
        salary: 80000,
        hire_date: '2020-03-15',
        bank_name: 'Equity Bank',
        bank_account_number: '9876543210',
        next_of_kin_name: 'Peter Njeri',
        next_of_kin_relationship: 'Father',
        next_of_kin_phone: '+254-722-777-888',
        is_active: true,
        created_at: '2020-03-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      },
    ];
  }

  /**
   * Generate demo events
   */
  static getDemoEvents(): Event[] {
    return [
      {
        id: '1',
        event_id: 'EVT-2025-001',
        title: 'Sunday Worship Service',
        description: 'Weekly worship service with communion',
        category: 'Worship',
        location: 'Main Sanctuary',
        start_date: '2025-01-19',
        start_time: '09:00',
        end_time: '12:00',
        is_recurring: true,
        recurrence_pattern: 'weekly',
        registration_required: false,
        organizer: 'Pastor James Kimani',
        contact_email: 'pastor.james@tsoam.org',
        contact_phone: '+254-700-111-222',
        budget: 15000,
        actual_cost: 12000,
        status: 'Planned',
        is_active: true,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      },
      {
        id: '2',
        event_id: 'EVT-2025-002',
        title: 'Youth Conference 2025',
        description: 'Annual youth conference with guest speakers',
        category: 'Conference',
        location: 'Conference Hall',
        start_date: '2025-02-15',
        end_date: '2025-02-17',
        start_time: '08:00',
        end_time: '18:00',
        is_recurring: false,
        max_attendees: 200,
        registration_required: true,
        registration_deadline: '2025-02-10',
        organizer: 'Youth Department',
        contact_email: 'youth@tsoam.org',
        contact_phone: '+254-722-999-000',
        budget: 500000,
        actual_cost: 0,
        status: 'Planned',
        is_active: true,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      },
    ];
  }

  /**
   * Get demo financial summary
   */
  static getDemoFinancialSummary(): any {
    return {
      totalIncome: 325000,
      totalExpenses: 150000,
      netAmount: 175000,
      pendingApprovals: 0,
      transactionCount: 3,
      monthlyIncome: {
        January: 325000,
        February: 0,
        March: 0,
      },
      monthlyExpenses: {
        January: 150000,
        February: 0,
        March: 0,
      },
      categoryBreakdown: {
        Tithe: 250000,
        'Special Offering': 75000,
        Equipment: 150000,
      },
    };
  }

  /**
   * Get demo member statistics
   */
  static getDemoMemberStatistics(): any {
    return {
      total: 2,
      active: 2,
      inactive: 0,
      male: 1,
      female: 1,
      byDepartment: {
        'Men Fellowship': 1,
        'Women Fellowship': 1,
      },
      recentJoins: 1,
      recentBaptisms: 2,
    };
  }

  /**
   * Get demo employee statistics
   */
  static getDemoEmployeeStatistics(): any {
    return {
      total: 2,
      active: 2,
      terminated: 0,
      inactive: 0,
      byDepartment: {
        Ministry: 1,
        Finance: 1,
      },
      byEmploymentType: {
        Permanent: 2,
        Contract: 0,
      },
    };
  }

  /**
   * Get demo event statistics
   */
  static getDemoEventStatistics(): any {
    return {
      total: 2,
      upcoming: 2,
      past: 0,
      byCategory: {
        Worship: 1,
        Conference: 1,
      },
      byStatus: {
        Planned: 2,
        'In Progress': 0,
        Completed: 0,
      },
    };
  }
}

export default DemoDataService;
