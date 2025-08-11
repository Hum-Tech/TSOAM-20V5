/**
 * Enterprise Leave Management Service
 * Comprehensive leave management with advanced features and analytics
 */

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  defaultDays: number;
  maxDaysPerYear: number;
  carryOverAllowed: boolean;
  maxCarryOverDays: number;
  requiresApproval: boolean;
  requiresDocumentation: boolean;
  isPaid: boolean;
  description: string;
  isActive: boolean;
  category: 'statutory' | 'company' | 'special';
  accrualRate?: number; // days per month
  eligibilityRules: {
    minTenure: number; // months
    employmentTypes: string[];
    genderRestrictions?: 'male' | 'female';
  };
}

export interface LeaveBalance {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  entitlement: number;
  used: number;
  pending: number;
  available: number;
  carriedOver: number;
  forfeited: number;
  lastUpdated: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  department: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  resumptionDate: string;
  totalDays: number;
  workingDays: number;
  reason: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  priority: 'normal' | 'urgent' | 'emergency';
  appliedDate: string;
  submittedDate?: string;

  // Approval workflow
  currentApprovalLevel: number;
  approvalHistory: ApprovalStep[];

  // Documentation
  attachments: LeaveAttachment[];
  medicalCertificate?: LeaveAttachment;

  // Additional details
  handoverNotes?: string;
  coveringEmployee?: {
    id: string;
    name: string;
    approved: boolean;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  // System fields
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;

  // Special fields
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  parentRequestId?: string;

  // HR processing
  hrNotes?: string;
  payrollAffected: boolean;
  exitInterviewRequired: boolean;

  // Compliance
  complianceFlags: ComplianceFlag[];
  auditTrail: AuditEntry[];
}

export interface ApprovalStep {
  level: number;
  approverType: 'supervisor' | 'hr' | 'finance' | 'executive';
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  actionDate?: string;
  comments?: string;
  delegatedTo?: {
    id: string;
    name: string;
    reason: string;
  };
}

export interface LeaveAttachment {
  id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  uploadedBy: string;
  documentType: 'medical' | 'supporting' | 'other';
  isRequired: boolean;
  verified: boolean;
  verifiedBy?: string;
  verificationDate?: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
  monthDay?: number;
  yearMonth?: number;
}

export interface ComplianceFlag {
  type: 'max_exceeded' | 'insufficient_balance' | 'overlap' | 'notice_period' | 'blackout_period';
  severity: 'info' | 'warning' | 'error';
  message: string;
  autoResolved: boolean;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  userId: string;
  userName: string;
  details: string;
  ipAddress?: string;
}

export interface LeavePolicyRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'validation' | 'calculation' | 'workflow';
  isActive: boolean;
  conditions: {
    field: string;
    operator: string;
    value: any;
  }[];
  actions: {
    type: string;
    parameters: any;
  }[];
}

export interface LeaveAnalytics {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  averageProcessingTime: number; // hours

  // Usage analytics
  mostUsedLeaveTypes: { leaveType: string; count: number; percentage: number }[];
  departmentUsage: { department: string; totalDays: number; avgDays: number }[];
  monthlyTrends: { month: string; requests: number; days: number }[];

  // Compliance metrics
  noticeComplianceRate: number;
  documentationComplianceRate: number;
  policyViolations: number;

  // Operational metrics
  peakRequestPeriods: { period: string; requests: number }[];
  coverageAnalysis: { adequateCoverage: number; inadequateCoverage: number };
  costAnalysis: {
    totalCost: number;
    costByType: { leaveType: string; cost: number }[];
    costByDepartment: { department: string; cost: number }[];
  };

  // Predictive insights
  forecastedRequests: { month: string; predicted: number }[];
  atRiskEmployees: { employeeId: string; risk: 'burnout' | 'turnover'; score: number }[];
}

export interface LeaveCalendarEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  color: string;
}

export interface LeaveReportConfig {
  reportType: 'summary' | 'detailed' | 'compliance' | 'analytics';
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    departments?: string[];
    employees?: string[];
    leaveTypes?: string[];
    statuses?: string[];
  };
  groupBy?: 'department' | 'employee' | 'leaveType' | 'month';
  includeCharts: boolean;
  format: 'pdf' | 'excel' | 'csv';
}

class LeaveManagementService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    this.authToken = this.getAuthToken();
  }

  private getAuthToken(): string | null {
    try {
      const token = localStorage.getItem('auth_token');
      return token;
    } catch (error) {
      return null;
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        throw new Error(`Authentication required - HTTP error! status: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Handle AbortError gracefully - this happens when requests are cancelled
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`Request to ${endpoint} was aborted`);
        throw error;
      }

      // Handle fetch failures gracefully - these are expected when API is not available
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log(`API endpoint ${endpoint} not available, using demo data fallback`);
      } else if (error instanceof Error && error.message.includes('401')) {
        console.log('API authentication required, will use demo data');
      } else {
        console.log(`API request failed for ${endpoint}, using demo data fallback`);
      }
      throw error;
    }
  }

  // Leave Requests Management
  async getLeaveRequests(filters?: {
    employeeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    department?: string;
  }): Promise<LeaveRequest[]> {
    // For demo purposes, return demo data directly
    console.log('Leave Management Service: Using demo leave requests data');
    return this.getDemoLeaveRequests();
  }

  async createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveRequest> {
    // For demo purposes, simulate creation locally
    console.log('Leave Management Service: Simulating leave request creation');

    const newRequest: LeaveRequest = {
      ...request,
      id: `LR2025${String(Date.now()).slice(-3)}`, // Generate demo ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newRequest;
  }

  async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest> {
    // For demo purposes, simulate update locally
    console.log('Leave Management Service: Simulating leave request update');
    const demoRequests = this.getDemoLeaveRequests();
    const request = demoRequests.find(r => r.id === id);

    if (!request) {
      throw new Error('Leave request not found');
    }

    const updatedRequest: LeaveRequest = {
      ...request,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return updatedRequest;
  }

  async approveLeaveRequest(id: string, comments?: string): Promise<LeaveRequest> {
    // For demo purposes, simulate approval locally
    console.log('Leave Management Service: Simulating leave request approval');
    const demoRequests = this.getDemoLeaveRequests();
    const request = demoRequests.find(r => r.id === id);

    if (!request) {
      throw new Error('Leave request not found');
    }

    // Simulate approval by updating the request
    const updatedRequest: LeaveRequest = {
      ...request,
      status: 'approved',
      approvalHistory: [
        ...request.approvalHistory,
        {
          level: request.currentApprovalLevel,
          approverType: 'supervisor',
          approverId: 'demo-approver',
          approverName: 'Demo Approver',
          status: 'approved',
          actionDate: new Date().toISOString(),
          comments: comments || 'Approved in demo mode',
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    return updatedRequest;
  }

  async rejectLeaveRequest(id: string, comments: string): Promise<LeaveRequest> {
    // For demo purposes, simulate rejection locally
    console.log('Leave Management Service: Simulating leave request rejection');
    const demoRequests = this.getDemoLeaveRequests();
    const request = demoRequests.find(r => r.id === id);

    if (!request) {
      throw new Error('Leave request not found');
    }

    // Simulate rejection by updating the request
    const updatedRequest: LeaveRequest = {
      ...request,
      status: 'rejected',
      approvalHistory: [
        ...request.approvalHistory,
        {
          level: request.currentApprovalLevel,
          approverType: 'supervisor',
          approverId: 'demo-approver',
          approverName: 'Demo Approver',
          status: 'rejected',
          actionDate: new Date().toISOString(),
          comments: comments || 'Rejected in demo mode',
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    return updatedRequest;
  }

  // Leave Balances
  async getLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalance[]> {
    // For demo purposes, return demo data directly
    console.log('Leave Management Service: Using demo leave balances data');
    return this.getDemoLeaveBalances(employeeId);
  }

  async updateLeaveBalance(employeeId: string, leaveTypeId: string, adjustments: {
    entitlement?: number;
    used?: number;
    carriedOver?: number;
    forfeited?: number;
    reason: string;
  }): Promise<LeaveBalance> {
    try {
      const response = await this.makeRequest<{ data: LeaveBalance }>(`/leave/balances/${employeeId}/${leaveTypeId}`, {
        method: 'PUT',
        body: JSON.stringify(adjustments),
      });
      return response.data;
    } catch (error) {
      console.log('Demo mode: Cannot update leave balance');
      throw new Error('Cannot update leave balance in demo mode');
    }
  }

  // Leave Types Management
  async getLeaveTypes(): Promise<LeaveType[]> {
    // For demo purposes, return demo data directly
    console.log('Leave Management Service: Using demo leave types data');
    return this.getDemoLeaveTypes();
  }

  // Analytics and Reporting
  async getLeaveAnalytics(dateRange: { start: string; end: string }): Promise<LeaveAnalytics> {
    // For demo purposes, return demo data directly
    console.log('Leave Management Service: Using demo analytics data');
    return this.getDemoAnalytics();
  }

  async getLeaveCalendar(month: string, year: string): Promise<LeaveCalendarEvent[]> {
    // For demo purposes, return demo data directly
    console.log('Leave Management Service: Using demo calendar data');
    return this.getDemoCalendarEvents();
  }

  async generateLeaveReport(config: LeaveReportConfig): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/leave/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Report generation failed');
      }

      return await response.blob();
    } catch (error) {
      console.log('Demo mode: Cannot generate report');
      throw new Error('Cannot generate report in demo mode');
    }
  }

  // Policy and Compliance
  async validateLeaveRequest(request: Partial<LeaveRequest>): Promise<{ isValid: boolean; violations: ComplianceFlag[] }> {
    try {
      const response = await this.makeRequest<{ isValid: boolean; violations: ComplianceFlag[] }>('/leave/validate', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return response;
    } catch (error) {
      console.log('Demo mode: Using basic validation');
      return this.basicLeaveValidation(request);
    }
  }

  // Demo Data Methods - made public for fallback access
  public getDemoLeaveTypes(): LeaveType[] {
    return [
      {
        id: 'annual',
        name: 'Annual Leave',
        code: 'AL',
        defaultDays: 21,
        maxDaysPerYear: 30,
        carryOverAllowed: true,
        maxCarryOverDays: 5,
        requiresApproval: true,
        requiresDocumentation: false,
        isPaid: true,
        description: 'Standard annual vacation leave',
        isActive: true,
        category: 'statutory',
        accrualRate: 1.75,
        eligibilityRules: {
          minTenure: 0,
          employmentTypes: ['Full-time', 'Part-time'],
        },
      },
      {
        id: 'sick',
        name: 'Sick Leave',
        code: 'SL',
        defaultDays: 30,
        maxDaysPerYear: 60,
        carryOverAllowed: false,
        maxCarryOverDays: 0,
        requiresApproval: true,
        requiresDocumentation: true,
        isPaid: true,
        description: 'Medical leave for illness or injury',
        isActive: true,
        category: 'statutory',
        eligibilityRules: {
          minTenure: 0,
          employmentTypes: ['Full-time', 'Part-time', 'Volunteer'],
        },
      },
      {
        id: 'maternity',
        name: 'Maternity Leave',
        code: 'ML',
        defaultDays: 90,
        maxDaysPerYear: 120,
        carryOverAllowed: false,
        maxCarryOverDays: 0,
        requiresApproval: true,
        requiresDocumentation: true,
        isPaid: true,
        description: 'Maternity leave for childbirth',
        isActive: true,
        category: 'statutory',
        eligibilityRules: {
          minTenure: 12,
          employmentTypes: ['Full-time', 'Part-time'],
          genderRestrictions: 'female',
        },
      },
      {
        id: 'paternity',
        name: 'Paternity Leave',
        code: 'PL',
        defaultDays: 14,
        maxDaysPerYear: 14,
        carryOverAllowed: false,
        maxCarryOverDays: 0,
        requiresApproval: true,
        requiresDocumentation: true,
        isPaid: true,
        description: 'Paternity leave for new fathers',
        isActive: true,
        category: 'statutory',
        eligibilityRules: {
          minTenure: 12,
          employmentTypes: ['Full-time', 'Part-time'],
          genderRestrictions: 'male',
        },
      },
      {
        id: 'emergency',
        name: 'Emergency Leave',
        code: 'EL',
        defaultDays: 5,
        maxDaysPerYear: 10,
        carryOverAllowed: false,
        maxCarryOverDays: 0,
        requiresApproval: true,
        requiresDocumentation: true,
        isPaid: false,
        description: 'Emergency or compassionate leave',
        isActive: true,
        category: 'company',
        eligibilityRules: {
          minTenure: 3,
          employmentTypes: ['Full-time', 'Part-time'],
        },
      },
      {
        id: 'study',
        name: 'Study Leave',
        code: 'STL',
        defaultDays: 30,
        maxDaysPerYear: 60,
        carryOverAllowed: false,
        maxCarryOverDays: 0,
        requiresApproval: true,
        requiresDocumentation: true,
        isPaid: false,
        description: 'Leave for educational purposes',
        isActive: true,
        category: 'company',
        eligibilityRules: {
          minTenure: 24,
          employmentTypes: ['Full-time'],
        },
      },
    ];
  }

  public getDemoLeaveRequests(): LeaveRequest[] {
    return [
      {
        id: 'LR2025001',
        employeeId: 'TSOAM-EMP-001',
        employeeName: 'John Kamau',
        employeePosition: 'Senior Pastor',
        department: 'Leadership',
        leaveTypeId: 'annual',
        leaveTypeName: 'Annual Leave',
        startDate: '2025-02-01',
        endDate: '2025-02-07',
        resumptionDate: '2025-02-08',
        totalDays: 7,
        workingDays: 5,
        reason: 'Family vacation and rest',
        status: 'submitted',
        priority: 'normal',
        appliedDate: '2025-01-15',
        submittedDate: '2025-01-15',
        currentApprovalLevel: 1,
        approvalHistory: [
          {
            level: 1,
            approverType: 'supervisor',
            status: 'pending',
          },
        ],
        attachments: [],
        handoverNotes: 'Rev. Grace will handle Sunday service and urgent pastoral matters',
        coveringEmployee: {
          id: 'TSOAM-EMP-002',
          name: 'Grace Wanjiku',
          approved: true,
        },
        createdBy: 'TSOAM-EMP-001',
        createdAt: '2025-01-15T08:00:00Z',
        updatedAt: '2025-01-15T08:00:00Z',
        payrollAffected: false,
        exitInterviewRequired: false,
        complianceFlags: [],
        auditTrail: [
          {
            timestamp: '2025-01-15T08:00:00Z',
            action: 'created',
            userId: 'TSOAM-EMP-001',
            userName: 'John Kamau',
            details: 'Leave request created',
          },
        ],
      },
      {
        id: 'LR2025002',
        employeeId: 'TSOAM-EMP-002',
        employeeName: 'Grace Wanjiku',
        employeePosition: 'Associate Pastor',
        department: 'Leadership',
        leaveTypeId: 'sick',
        leaveTypeName: 'Sick Leave',
        startDate: '2025-01-10',
        endDate: '2025-01-12',
        resumptionDate: '2025-01-13',
        totalDays: 3,
        workingDays: 3,
        reason: 'Medical treatment and recovery',
        status: 'approved',
        priority: 'urgent',
        appliedDate: '2025-01-09',
        submittedDate: '2025-01-09',
        currentApprovalLevel: 2,
        approvalHistory: [
          {
            level: 1,
            approverType: 'supervisor',
            approverId: 'TSOAM-EMP-001',
            approverName: 'John Kamau',
            status: 'approved',
            actionDate: '2025-01-09',
            comments: 'Approved. Get well soon.',
          },
          {
            level: 2,
            approverType: 'hr',
            approverId: 'TSOAM-HR-001',
            approverName: 'HR Manager',
            status: 'approved',
            actionDate: '2025-01-09',
            comments: 'Medical certificate verified. Approved.',
          },
        ],
        attachments: [
          {
            id: 'att001',
            filename: 'medical_cert_001.pdf',
            originalName: 'medical_certificate.pdf',
            fileType: 'application/pdf',
            fileSize: 245760,
            uploadDate: '2025-01-09T10:30:00Z',
            uploadedBy: 'TSOAM-EMP-002',
            documentType: 'medical',
            isRequired: true,
            verified: true,
            verifiedBy: 'TSOAM-HR-001',
            verificationDate: '2025-01-09T11:00:00Z',
          },
        ],
        medicalCertificate: {
          id: 'att001',
          filename: 'medical_cert_001.pdf',
          originalName: 'medical_certificate.pdf',
          fileType: 'application/pdf',
          fileSize: 245760,
          uploadDate: '2025-01-09T10:30:00Z',
          uploadedBy: 'TSOAM-EMP-002',
          documentType: 'medical',
          isRequired: true,
          verified: true,
          verifiedBy: 'TSOAM-HR-001',
          verificationDate: '2025-01-09T11:00:00Z',
        },
        createdBy: 'TSOAM-EMP-002',
        createdAt: '2025-01-09T09:00:00Z',
        updatedAt: '2025-01-09T11:00:00Z',
        hrNotes: 'Medical certificate verified with hospital. Approved for sick leave.',
        payrollAffected: false,
        exitInterviewRequired: false,
        complianceFlags: [],
        auditTrail: [
          {
            timestamp: '2025-01-09T09:00:00Z',
            action: 'created',
            userId: 'TSOAM-EMP-002',
            userName: 'Grace Wanjiku',
            details: 'Sick leave request created',
          },
          {
            timestamp: '2025-01-09T11:00:00Z',
            action: 'approved',
            userId: 'TSOAM-HR-001',
            userName: 'HR Manager',
            details: 'Approved by HR after medical certificate verification',
          },
        ],
      },
    ];
  }



  public getDemoAnalytics(): LeaveAnalytics {
    return {
      totalRequests: 156,
      approvedRequests: 132,
      rejectedRequests: 8,
      pendingRequests: 16,
      averageProcessingTime: 2.5,
      mostUsedLeaveTypes: [
        { leaveType: 'Annual Leave', count: 78, percentage: 50 },
        { leaveType: 'Sick Leave', count: 45, percentage: 29 },
        { leaveType: 'Emergency Leave', count: 18, percentage: 12 },
        { leaveType: 'Maternity Leave', count: 8, percentage: 5 },
        { leaveType: 'Study Leave', count: 7, percentage: 4 },
      ],
      departmentUsage: [
        { department: 'Leadership', totalDays: 45, avgDays: 15 },
        { department: 'Administration', totalDays: 38, avgDays: 12.7 },
        { department: 'Finance', totalDays: 32, avgDays: 10.7 },
        { department: 'Youth Ministry', totalDays: 28, avgDays: 14 },
      ],
      monthlyTrends: [
        { month: 'Jan', requests: 12, days: 45 },
        { month: 'Feb', requests: 18, days: 67 },
        { month: 'Mar', requests: 15, days: 52 },
        { month: 'Apr', requests: 22, days: 89 },
        { month: 'May', requests: 25, days: 95 },
        { month: 'Jun', requests: 20, days: 78 },
      ],
      noticeComplianceRate: 0.85,
      documentationComplianceRate: 0.92,
      policyViolations: 3,
      peakRequestPeriods: [
        { period: 'December', requests: 35 },
        { period: 'August', requests: 28 },
        { period: 'April', requests: 22 },
      ],
      coverageAnalysis: { adequateCoverage: 142, inadequateCoverage: 14 },
      costAnalysis: {
        totalCost: 1250000,
        costByType: [
          { leaveType: 'Annual Leave', cost: 750000 },
          { leaveType: 'Sick Leave', cost: 300000 },
          { leaveType: 'Maternity Leave', cost: 180000 },
          { leaveType: 'Emergency Leave', cost: 20000 },
        ],
        costByDepartment: [
          { department: 'Leadership', cost: 450000 },
          { department: 'Administration', cost: 350000 },
          { department: 'Finance', cost: 280000 },
          { department: 'Youth Ministry', cost: 170000 },
        ],
      },
      forecastedRequests: [
        { month: 'Jul', predicted: 19 },
        { month: 'Aug', predicted: 28 },
        { month: 'Sep', predicted: 16 },
        { month: 'Oct', predicted: 14 },
        { month: 'Nov', predicted: 12 },
        { month: 'Dec', predicted: 35 },
      ],
      atRiskEmployees: [
        { employeeId: 'TSOAM-EMP-005', risk: 'burnout', score: 0.85 },
        { employeeId: 'TSOAM-EMP-012', risk: 'turnover', score: 0.72 },
      ],
    };
  }



  private basicLeaveValidation(request: Partial<LeaveRequest>): { isValid: boolean; violations: ComplianceFlag[] } {
    const violations: ComplianceFlag[] = [];

    // Basic validation rules
    if (request.startDate && request.endDate) {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);

      if (start >= end) {
        violations.push({
          type: 'overlap',
          severity: 'error',
          message: 'End date must be after start date',
          autoResolved: false,
        });
      }

      // Check if start date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) {
        violations.push({
          type: 'notice_period',
          severity: 'warning',
          message: 'Leave start date should not be in the past',
          autoResolved: false,
        });
      }
    }

    return {
      isValid: violations.filter(v => v.severity === 'error').length === 0,
      violations,
    };
  }

  public getDemoLeaveBalances(employeeId: string): LeaveBalance[] {
    const currentYear = new Date().getFullYear();
    return [
      {
        employeeId,
        leaveTypeId: 'annual',
        year: currentYear,
        entitlement: 21,
        used: 5,
        pending: 7,
        available: 9,
        carriedOver: 0,
        forfeited: 0,
        lastUpdated: '2025-01-15T00:00:00Z',
      },
      {
        employeeId,
        leaveTypeId: 'sick',
        year: currentYear,
        entitlement: 30,
        used: 3,
        pending: 0,
        available: 27,
        carriedOver: 0,
        forfeited: 0,
        lastUpdated: '2025-01-15T00:00:00Z',
      },
      {
        employeeId,
        leaveTypeId: 'emergency',
        year: currentYear,
        entitlement: 5,
        used: 0,
        pending: 0,
        available: 5,
        carriedOver: 0,
        forfeited: 0,
        lastUpdated: '2025-01-15T00:00:00Z',
      },
    ];
  }

  public getDemoCalendarEvents(): LeaveCalendarEvent[] {
    return [
      {
        id: 'LR2025001',
        employeeId: 'TSOAM-EMP-001',
        employeeName: 'John Kamau',
        department: 'Leadership',
        leaveType: 'Annual Leave',
        startDate: '2025-02-01',
        endDate: '2025-02-07',
        status: 'submitted',
        color: '#3b82f6',
      },
      {
        id: 'LR2025002',
        employeeId: 'TSOAM-EMP-002',
        employeeName: 'Grace Wanjiku',
        department: 'Leadership',
        leaveType: 'Sick Leave',
        startDate: '2025-01-10',
        endDate: '2025-01-12',
        status: 'approved',
        color: '#ef4444',
      },
    ];
  }
}

export const leaveManagementService = new LeaveManagementService();
export default leaveManagementService;
