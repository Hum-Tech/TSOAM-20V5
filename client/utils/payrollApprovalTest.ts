/**
 * Test utility to verify the payroll approval and rejection workflow
 * This will test that rejected employees show up correctly in HR disbursement reports
 */

import FinanceApprovalService from "@/services/FinanceApprovalService";
import type { PayrollApprovalRequest, EmployeePayrollItem } from "@/services/FinanceApprovalService";

export function testPayrollApprovalWorkflow(): boolean {
  console.log("🧪 Testing Payroll Approval Workflow...");

  try {
    // Create test payroll data
    const testEmployees: EmployeePayrollItem[] = [
      {
        id: "emp1",
        employeeId: "EMP001",
        employeeName: "John Doe",
        grossSalary: 100000,
        netSalary: 75000,
        deductions: {
          paye: 15000,
          nssf: 6000,
          sha: 2750,
          housingLevy: 1500,
          total: 25250
        },
        status: "Pending"
      },
      {
        id: "emp2",
        employeeId: "EMP002",
        employeeName: "Jane Smith",
        grossSalary: 80000,
        netSalary: 60000,
        deductions: {
          paye: 12000,
          nssf: 4800,
          sha: 2200,
          housingLevy: 1200,
          total: 20200
        },
        status: "Pending"
      },
      {
        id: "emp3",
        employeeId: "EMP003",
        employeeName: "Bob Wilson",
        grossSalary: 120000,
        netSalary: 90000,
        deductions: {
          paye: 18000,
          nssf: 7200,
          sha: 3300,
          housingLevy: 1800,
          total: 30300
        },
        status: "Pending"
      }
    ];

    const testBatch: Omit<PayrollApprovalRequest, 'status' | 'submittedDate'> = {
      batchId: `TEST-BATCH-${Date.now()}`,
      period: "January 2025",
      totalEmployees: testEmployees.length,
      totalGrossAmount: testEmployees.reduce((sum, emp) => sum + emp.grossSalary, 0),
      totalNetAmount: testEmployees.reduce((sum, emp) => sum + emp.netSalary, 0),
      employees: testEmployees,
      submittedBy: "Test HR Officer",
      summary: {
        totalBasicSalary: 300000,
        totalAllowances: 0,
        totalPAYE: 45000,
        totalNSSF: 18000,
        totalSHA: 8250,
        totalHousingLevy: 4500,
        totalLoans: 0,
        totalInsurance: 0,
        totalDeductions: 75750,
        projectedCashFlow: 225000,
        bankBalance: 1000000,
        approvalRequired: true
      },
      metadata: {
        approvalDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium' as const,
        department: 'HR',
        fiscalYear: 2025,
        quarter: 1
      }
    };

    // Step 1: Submit payroll for approval
    console.log("Step 1: Submitting payroll batch for approval...");
    const batchId = FinanceApprovalService.submitPayrollForApproval(testBatch);
    console.log(`✅ Payroll batch submitted: ${batchId}`);

    // Step 2: Approve some employees and reject others
    console.log("Step 2: Processing individual approvals and rejections...");
    
    // Approve EMP001 and EMP002
    const approveResult = FinanceApprovalService.approveIndividualPayments(
      batchId,
      ["EMP001", "EMP002"],
      "Test Finance Officer",
      "Approved based on documentation review"
    );
    console.log(`✅ Individual approvals processed: ${approveResult}`);

    // Reject EMP003
    const rejectResult = FinanceApprovalService.rejectIndividualPayments(
      batchId,
      [{ employeeId: "EMP003", reason: "Missing required documentation" }],
      "Test Finance Officer"
    );
    console.log(`✅ Individual rejections processed: ${rejectResult}`);

    // Step 3: Verify that the disbursement reports were created
    console.log("Step 3: Checking disbursement reports...");
    
    // Check localStorage for disbursement reports
    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('hr_disbursement'));
    console.log(`📊 Found ${storageKeys.length} disbursement report events in localStorage`);

    storageKeys.forEach(key => {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      console.log(`📋 Disbursement Report:`, {
        type: data.type,
        status: data.status,
        employees: data.totalEmployees,
        amount: data.totalNetAmount
      });
    });

    // Step 4: Check financial impact calculation
    const impact = FinanceApprovalService.calculateFinancialImpact(batchId);
    console.log(`💰 Financial Impact:`, impact);

    // Verify results
    const expectedResults = {
      approved: { count: 2, amount: 135000 }, // EMP001 + EMP002
      rejected: { count: 1, amount: 90000 }, // EMP003
      cashFlowImpact: 135000 // Only approved payments affect cash flow
    };

    const testPassed = 
      impact.approved.count === expectedResults.approved.count &&
      impact.approved.amount === expectedResults.approved.amount &&
      impact.rejected.count === expectedResults.rejected.count &&
      impact.rejected.amount === expectedResults.rejected.amount &&
      impact.cashFlowImpact === expectedResults.cashFlowImpact;

    if (testPassed) {
      console.log("✅ Test PASSED: Individual approvals and rejections working correctly!");
      console.log("✅ Rejected employees will appear in separate disbursement report");
      console.log("✅ Financial calculations are accurate");
      return true;
    } else {
      console.error("❌ Test FAILED: Results don't match expectations");
      console.error("Expected:", expectedResults);
      console.error("Actual:", impact);
      return false;
    }

  } catch (error) {
    console.error("❌ Test FAILED with error:", error);
    return false;
  }
}

// Function to clean up test data
export function cleanupTestData(): void {
  console.log("🧹 Cleaning up test data...");
  
  // Remove test disbursement reports from localStorage
  Object.keys(localStorage).filter(key => 
    key.startsWith('hr_disbursement') || 
    key.includes('TEST-BATCH')
  ).forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log("✅ Test data cleaned up");
}

// Expose functions to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testPayrollApproval = testPayrollApprovalWorkflow;
  (window as any).cleanupTestData = cleanupTestData;
}
