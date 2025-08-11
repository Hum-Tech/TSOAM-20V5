/**
 * Finance Approval Service - Production Grade
 * Handles all Finance approval workflows for payroll and other HR requests
 */

export interface PayrollApprovalRequest {
  batchId: string;
  period: string;
  totalEmployees: number;
  totalGrossAmount: number;
  totalNetAmount: number;
  status: 'Pending' | 'Partially_Approved' | 'Fully_Approved' | 'Rejected';
  submittedDate: string;
  submittedBy: string;
  employees: EmployeePayrollItem[];
  summary: PayrollSummary;
  metadata: {
    approvalDeadline: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    department: string;
    fiscalYear: number;
    quarter: number;
  };
}

export interface EmployeePayrollItem {
  id: string;
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  netSalary: number;
  deductions: {
    paye: number;
    nssf: number;
    sha: number;
    housingLevy: number;
    loan?: number;
    insurance?: number;
    total: number;
  };
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  rejectionReason?: string;
  paymentReference?: string;
}

export interface PayrollSummary {
  totalBasicSalary: number;
  totalAllowances: number;
  totalPAYE: number;
  totalNSSF: number;
  totalSHA: number;
  totalHousingLevy: number;
  totalLoans: number;
  totalInsurance: number;
  totalDeductions: number;
  projectedCashFlow: number;
  bankBalance: number;
  approvalRequired: boolean;
}

export interface ApprovalAction {
  type: 'approve' | 'reject' | 'approve_partial';
  performedBy: string;
  timestamp: string;
  reason?: string;
  employeeIds?: string[]; // For partial approvals
  notes?: string;
}

export interface FinanceApprovalNotification {
  id: string;
  type: 'payroll_approval' | 'payroll_approved' | 'payroll_rejected' | 'payment_disbursed';
  title: string;
  message: string;
  batchId?: string;
  employeeId?: string;
  amount: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: any;
}

class FinanceApprovalService {
  private static instance: FinanceApprovalService;
  private pendingApprovals: PayrollApprovalRequest[] = [];
  private approvalHistory: (PayrollApprovalRequest & { actions: ApprovalAction[] })[] = [];
  private notifications: FinanceApprovalNotification[] = [];

  private constructor() {
    this.loadData();
    this.initEventListeners();
  }

  public static getInstance(): FinanceApprovalService {
    if (!FinanceApprovalService.instance) {
      FinanceApprovalService.instance = new FinanceApprovalService();
    }
    return FinanceApprovalService.instance;
  }

  private loadData(): void {
    try {
      const pending = localStorage.getItem('finance_pending_approvals');
      const history = localStorage.getItem('finance_approval_history');
      const notifications = localStorage.getItem('finance_notifications');

      if (pending) this.pendingApprovals = JSON.parse(pending);
      if (history) this.approvalHistory = JSON.parse(history);
      if (notifications) this.notifications = JSON.parse(notifications);
    } catch (error) {
      console.error('Error loading Finance approval data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem('finance_pending_approvals', JSON.stringify(this.pendingApprovals));
      localStorage.setItem('finance_approval_history', JSON.stringify(this.approvalHistory));
      localStorage.setItem('finance_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving Finance approval data:', error);
    }
  }

  private initEventListeners(): void {
    // Listen for payroll submissions from HR
    window.addEventListener('hr_payroll_batch', this.handlePayrollSubmission.bind(this));

    // Listen for approval actions from Finance module
    window.addEventListener('finance_approval_action', this.handleApprovalAction.bind(this));
  }

  /**
   * Submit payroll batch for Finance approval
   */
  public submitPayrollForApproval(payrollData: Omit<PayrollApprovalRequest, 'status' | 'submittedDate'>): string {
    // Validate input data
    if (!payrollData || !payrollData.batchId) {
      throw new Error('Invalid payroll data: missing batchId');
    }

    if (!payrollData.employees || payrollData.employees.length === 0) {
      throw new Error('Invalid payroll data: no employees provided');
    }

    // Ensure metadata exists with defaults
    const metadata = {
      approvalDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      priority: 'medium' as const,
      department: 'HR',
      fiscalYear: new Date().getFullYear(),
      quarter: Math.ceil((new Date().getMonth() + 1) / 3),
      ...payrollData.metadata
    };

    // Ensure summary exists with defaults
    const summary = {
      totalBasicSalary: 0,
      totalAllowances: 0,
      totalPAYE: 0,
      totalNSSF: 0,
      totalSHA: 0,
      totalHousingLevy: 0,
      totalLoans: 0,
      totalInsurance: 0,
      totalDeductions: 0,
      projectedCashFlow: payrollData.totalNetAmount || 0,
      bankBalance: 0,
      approvalRequired: true,
      ...payrollData.summary
    };

    const approvalRequest: PayrollApprovalRequest = {
      ...payrollData,
      metadata,
      summary,
      status: 'Pending',
      submittedDate: new Date().toISOString(),
      employees: payrollData.employees.map(emp => ({
        ...emp,
        status: 'Pending'
      }))
    };

    // Add to pending approvals
    this.pendingApprovals.push(approvalRequest);

    // Create notification for Finance team
    this.createNotification({
      type: 'payroll_approval',
      title: 'New Payroll Batch for Approval',
      message: `Payroll batch ${payrollData.batchId} requires approval: ${payrollData.totalEmployees} employees, KSh ${payrollData.totalNetAmount.toLocaleString()}`,
      batchId: payrollData.batchId,
      amount: payrollData.totalNetAmount,
      priority: this.calculatePriority(payrollData.totalNetAmount, payrollData.totalEmployees),
      metadata: {
        submittedBy: payrollData.submittedBy,
        department: payrollData.metadata?.department || 'HR',
        deadline: payrollData.metadata?.approvalDeadline || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      }
    });

    // Save data and notify Finance module
    this.saveData();
    this.notifyFinanceModule(approvalRequest);

    console.log(`✅ Payroll batch ${payrollData.batchId} submitted for Finance approval`);
    return approvalRequest.batchId;
  }

  /**
   * Approve entire payroll batch
   */
  public approveBatch(batchId: string, approvedBy: string, notes?: string): boolean {
    const batch = this.findPendingBatch(batchId);
    if (!batch) return false;

    const action: ApprovalAction = {
      type: 'approve',
      performedBy: approvedBy,
      timestamp: new Date().toISOString(),
      notes
    };

    // Update batch status
    batch.status = 'Fully_Approved';
    batch.employees.forEach(emp => {
      emp.status = 'Approved';
      emp.approvedBy = approvedBy;
      emp.approvedDate = action.timestamp;
    });

    // Move to history and remove from pending
    this.moveToHistory(batch, [action]);
    this.removePendingBatch(batchId);

    // Create notifications
    this.createNotification({
      type: 'payroll_approved',
      title: 'Payroll Batch Approved',
      message: `Batch ${batchId} fully approved by ${approvedBy}`,
      batchId,
      amount: batch.totalNetAmount,
      priority: 'medium'
    });

    // Notify HR module of approval
    this.notifyHRModule('batch_approved', {
      batchId,
      approvedBy,
      approvedDate: action.timestamp,
      totalAmount: batch.totalNetAmount,
      employeeCount: batch.totalEmployees,
      notes
    });

    this.saveData();
    console.log(`✅ Batch ${batchId} fully approved by ${approvedBy}`);
    return true;
  }

  /**
   * Reject entire payroll batch
   */
  public rejectBatch(batchId: string, rejectedBy: string, reason: string): boolean {
    const batch = this.findPendingBatch(batchId);
    if (!batch) return false;

    const action: ApprovalAction = {
      type: 'reject',
      performedBy: rejectedBy,
      timestamp: new Date().toISOString(),
      reason
    };

    // Update batch status
    batch.status = 'Rejected';
    batch.employees.forEach(emp => {
      emp.status = 'Rejected';
      emp.rejectedBy = rejectedBy;
      emp.rejectedDate = action.timestamp;
      emp.rejectionReason = reason;
    });

    // Move to history and remove from pending
    this.moveToHistory(batch, [action]);
    this.removePendingBatch(batchId);

    // Create notification
    this.createNotification({
      type: 'payroll_rejected',
      title: 'Payroll Batch Rejected',
      message: `Batch ${batchId} rejected: ${reason}`,
      batchId,
      amount: batch.totalNetAmount,
      priority: 'high'
    });

    // Notify HR module of rejection
    this.notifyHRModule('batch_rejected', {
      batchId,
      rejectedBy,
      rejectedDate: action.timestamp,
      reason,
      totalAmount: batch.totalNetAmount,
      employeeCount: batch.totalEmployees
    });

    this.saveData();
    console.log(`❌ Batch ${batchId} rejected by ${rejectedBy}: ${reason}`);
    return true;
  }

  /**
   * Approve individual employees within a batch
   */
  public approveIndividualPayments(
    batchId: string,
    employeeIds: string[],
    approvedBy: string,
    notes?: string
  ): boolean {
    const batch = this.findPendingBatch(batchId);
    if (!batch) return false;

    const action: ApprovalAction = {
      type: 'approve_partial',
      performedBy: approvedBy,
      timestamp: new Date().toISOString(),
      employeeIds,
      notes
    };

    let approvedCount = 0;
    let approvedAmount = 0;

    // Update individual employee statuses
    batch.employees.forEach(emp => {
      if (employeeIds.includes(emp.employeeId) && emp.status === 'Pending') {
        emp.status = 'Approved';
        emp.approvedBy = approvedBy;
        emp.approvedDate = action.timestamp;
        approvedCount++;
        approvedAmount += emp.netSalary;

        // Notify HR of individual approval
        this.notifyHRModule('individual_approved', {
          batchId,
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          amount: emp.netSalary,
          approvedBy,
          approvedDate: action.timestamp
        });
      }
    });

    // Update batch status based on approval state
    const pendingCount = batch.employees.filter(emp => emp.status === 'Pending').length;
    const approvedTotal = batch.employees.filter(emp => emp.status === 'Approved').length;
    const rejectedTotal = batch.employees.filter(emp => emp.status === 'Rejected').length;

    if (pendingCount === 0) {
      // All payments have been processed - create disbursement reports
      if (approvedTotal > 0 || rejectedTotal > 0) {
        this.createDisbursementReport(batchId, approvedBy);
      }

      batch.status = approvedTotal > 0 ? 'Fully_Approved' : 'Rejected';
      this.moveToHistory(batch, [action]);
      this.removePendingBatch(batchId);
    } else if (approvedTotal > 0) {
      batch.status = 'Partially_Approved';
    }

    // Create notification
    this.createNotification({
      type: 'payroll_approved',
      title: 'Individual Payments Approved',
      message: `${approvedCount} payments approved in batch ${batchId} (KSh ${approvedAmount.toLocaleString()})`,
      batchId,
      amount: approvedAmount,
      priority: 'medium'
    });

    this.saveData();
    console.log(`✅ ${approvedCount} individual payments approved in batch ${batchId}`);
    return true;
  }

  /**
   * Reject individual employees within a batch
   */
  public rejectIndividualPayments(
    batchId: string,
    rejections: { employeeId: string; reason: string }[],
    rejectedBy: string
  ): boolean {
    const batch = this.findPendingBatch(batchId);
    if (!batch) return false;

    const action: ApprovalAction = {
      type: 'reject',
      performedBy: rejectedBy,
      timestamp: new Date().toISOString(),
      employeeIds: rejections.map(r => r.employeeId),
      reason: 'Individual rejections - see employee details'
    };

    let rejectedCount = 0;
    let rejectedAmount = 0;

    // Update individual employee statuses
    batch.employees.forEach(emp => {
      const rejection = rejections.find(r => r.employeeId === emp.employeeId);
      if (rejection && emp.status === 'Pending') {
        emp.status = 'Rejected';
        emp.rejectedBy = rejectedBy;
        emp.rejectedDate = action.timestamp;
        emp.rejectionReason = rejection.reason;
        rejectedCount++;
        rejectedAmount += emp.netSalary;

        // Notify HR of individual rejection
        this.notifyHRModule('individual_rejected', {
          batchId,
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          amount: emp.netSalary,
          rejectedBy,
          rejectedDate: action.timestamp,
          reason: rejection.reason
        });
      }
    });

    // Update batch status
    const pendingCount = batch.employees.filter(emp => emp.status === 'Pending').length;
    const approvedCount = batch.employees.filter(emp => emp.status === 'Approved').length;

    if (pendingCount === 0 && approvedCount === 0) {
      batch.status = 'Rejected';
      this.moveToHistory(batch, [action]);
      this.removePendingBatch(batchId);
    } else if (approvedCount > 0) {
      batch.status = 'Partially_Approved';
    }

    this.saveData();
    console.log(`❌ ${rejectedCount} individual payments rejected in batch ${batchId}`);
    return true;
  }

  /**
   * Get all pending approval requests
   */
  public getPendingApprovals(): PayrollApprovalRequest[] {
    return [...this.pendingApprovals];
  }

  /**
   * Get approval history
   */
  public getApprovalHistory(): (PayrollApprovalRequest & { actions: ApprovalAction[] })[] {
    return [...this.approvalHistory];
  }

  /**
   * Get notifications for Finance module
   */
  public getNotifications(): FinanceApprovalNotification[] {
    return [...this.notifications].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Calculate financial impact of approvals/rejections
   */
  public calculateFinancialImpact(batchId: string): {
    approved: { count: number; amount: number };
    rejected: { count: number; amount: number };
    pending: { count: number; amount: number };
    cashFlowImpact: number;
  } {
    const batch = this.findPendingBatch(batchId) ||
                  this.approvalHistory.find(h => h.batchId === batchId);

    if (!batch) {
      return { approved: { count: 0, amount: 0 }, rejected: { count: 0, amount: 0 },
               pending: { count: 0, amount: 0 }, cashFlowImpact: 0 };
    }

    const approved = batch.employees.filter(emp => emp.status === 'Approved');
    const rejected = batch.employees.filter(emp => emp.status === 'Rejected');
    const pending = batch.employees.filter(emp => emp.status === 'Pending');

    const approvedAmount = approved.reduce((sum, emp) => sum + emp.netSalary, 0);
    const rejectedAmount = rejected.reduce((sum, emp) => sum + emp.netSalary, 0);
    const pendingAmount = pending.reduce((sum, emp) => sum + emp.netSalary, 0);

    return {
      approved: { count: approved.length, amount: approvedAmount },
      rejected: { count: rejected.length, amount: rejectedAmount },
      pending: { count: pending.length, amount: pendingAmount },
      cashFlowImpact: approvedAmount // Immediate cash flow impact
    };
  }

  // Private helper methods
  private findPendingBatch(batchId: string): PayrollApprovalRequest | undefined {
    return this.pendingApprovals.find(batch => batch.batchId === batchId);
  }

  private removePendingBatch(batchId: string): void {
    this.pendingApprovals = this.pendingApprovals.filter(batch => batch.batchId !== batchId);
  }

  private moveToHistory(batch: PayrollApprovalRequest, actions: ApprovalAction[]): void {
    this.approvalHistory.push({ ...batch, actions });
  }

  private createNotification(notification: Omit<FinanceApprovalNotification, 'id' | 'read' | 'createdAt'>): void {
    this.notifications.unshift({
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date().toISOString()
    });

    // Keep only latest 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
  }

  private calculatePriority(amount: number, employeeCount: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (amount > 5000000 || employeeCount > 50) return 'urgent';
    if (amount > 2000000 || employeeCount > 20) return 'high';
    if (amount > 500000 || employeeCount > 10) return 'medium';
    return 'low';
  }

  private handlePayrollSubmission(event: CustomEvent): void {
    try {
      this.submitPayrollForApproval(event.detail);
    } catch (error) {
      console.error('Error handling payroll submission:', error);
    }
  }

  private handleApprovalAction(event: CustomEvent): void {
    try {
      const { action, batchId, data } = event.detail;

      switch (action) {
        case 'approve_batch':
          this.approveBatch(batchId, data.approvedBy, data.notes);
          break;
        case 'reject_batch':
          this.rejectBatch(batchId, data.rejectedBy, data.reason);
          break;
        case 'approve_individual':
          this.approveIndividualPayments(batchId, data.employeeIds, data.approvedBy, data.notes);
          break;
        case 'reject_individual':
          this.rejectIndividualPayments(batchId, data.rejections, data.rejectedBy);
          break;
      }
    } catch (error) {
      console.error('Error handling approval action:', error);
    }
  }

  private notifyFinanceModule(request: PayrollApprovalRequest): void {
    // Trigger Finance module update
    const financeEvent = new CustomEvent('finance_payroll_received', {
      detail: request
    });
    window.dispatchEvent(financeEvent);
  }

  /**
   * Create disbursement report with accurate individual statuses
   */
  public createDisbursementReport(batchId: string, disbursedBy: string): boolean {
    const batch = this.findPendingBatch(batchId) ||
                  this.approvalHistory.find(h => h.batchId === batchId);

    if (!batch) {
      console.error(`Batch ${batchId} not found for disbursement`);
      return false;
    }

    // Separate approved and rejected payments
    const approvedEmployees = batch.employees.filter(emp => emp.status === 'Approved');
    const rejectedEmployees = batch.employees.filter(emp => emp.status === 'Rejected');

    // Calculate accurate totals for approved payments only
    const approvedGrossAmount = approvedEmployees.reduce((sum, emp) => sum + emp.grossSalary, 0);
    const approvedNetAmount = approvedEmployees.reduce((sum, emp) => sum + emp.netSalary, 0);
    const approvedDeductions = approvedEmployees.reduce((sum, emp) => sum + emp.deductions.total, 0);

    // Create disbursement report for approved payments
    if (approvedEmployees.length > 0) {
      const approvedDisbursementReport = {
        reportId: `DISB-APPROVED-${batchId}-${Date.now()}`,
        batchId,
        period: batch.period,
        totalEmployees: approvedEmployees.length,
        totalGrossAmount: Math.round(approvedGrossAmount),
        totalDeductions: Math.round(approvedDeductions),
        totalNetAmount: Math.round(approvedNetAmount),
        approvedBy: disbursedBy,
        approvedDate: new Date().toISOString(),
        disbursementDate: new Date().toISOString(),
        disbursementMethod: "Bank Transfer",
        status: "Approved",
        employees: approvedEmployees.map(emp => ({
          ...emp,
          disbursementStatus: "Disbursed",
          disbursedDate: new Date().toISOString(),
          paymentReference: `PAY-${emp.employeeId}-${Date.now()}`
        })),
        notes: `Approved disbursement for ${approvedEmployees.length} employees from batch ${batchId}`,
        type: 'approved_disbursement'
      };

      // Notify HR module of approved disbursement
      this.notifyHRModule('disbursement_approved', approvedDisbursementReport);
    }

    // Create disbursement report for rejected payments (if any)
    if (rejectedEmployees.length > 0) {
      const rejectedDisbursementReport = {
        reportId: `DISB-REJECTED-${batchId}-${Date.now()}`,
        batchId,
        period: batch.period,
        totalEmployees: rejectedEmployees.length,
        totalGrossAmount: 0, // Rejected payments don't contribute to disbursed amounts
        totalDeductions: 0,
        totalNetAmount: 0,
        rejectedBy: disbursedBy,
        rejectedDate: new Date().toISOString(),
        disbursementMethod: "Not Applicable",
        status: "Rejected",
        employees: rejectedEmployees.map(emp => ({
          ...emp,
          disbursementStatus: "Rejected",
          rejectedDate: new Date().toISOString(),
          rejectionReason: emp.rejectionReason || 'Payment rejected by Finance'
        })),
        notes: `Rejected disbursement for ${rejectedEmployees.length} employees from batch ${batchId}`,
        type: 'rejected_disbursement'
      };

      // Notify HR module of rejected disbursement
      this.notifyHRModule('disbursement_rejected', rejectedDisbursementReport);
    }

    console.log(`✅ Disbursement reports created for batch ${batchId}:`, {
      approved: approvedEmployees.length,
      rejected: rejectedEmployees.length,
      approvedAmount: approvedNetAmount,
      rejectedAmount: 0 // Rejected payments don't count toward disbursed amounts
    });

    return true;
  }

  private notifyHRModule(eventType: string, data: any): void {
    // Trigger HR module update
    const hrEvent = new CustomEvent('hr_finance_response', {
      detail: { eventType, data }
    });
    window.dispatchEvent(hrEvent);

    // Also store in localStorage for persistence
    const storageKey = `hr_${eventType}_${Date.now()}`;
    localStorage.setItem(storageKey, JSON.stringify(data));

    // Clean up old events (keep only last 10)
    Object.keys(localStorage).filter(key => key.startsWith('hr_')).slice(10).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export default FinanceApprovalService.getInstance();
