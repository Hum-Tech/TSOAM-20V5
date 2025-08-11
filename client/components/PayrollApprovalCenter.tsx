import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Eye,
  Bell,
  Users,
  FileText,
  Calculator,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import FinanceApprovalService from "@/services/FinanceApprovalService";
import type { PayrollApprovalRequest, EmployeePayrollItem } from "@/services/FinanceApprovalService";
import { useAuth } from "@/contexts/AuthContext";

interface PayrollApprovalCenterProps {
  className?: string;
}

export function PayrollApprovalCenter({ className }: PayrollApprovalCenterProps) {
  const [pendingApprovals, setPendingApprovals] = useState<PayrollApprovalRequest[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<PayrollApprovalRequest | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showIndividualDialog, setShowIndividualDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [notes, setNotes] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    loadPendingApprovals();

    // Listen for new payroll submissions
    const handleFinanceResponse = (event: CustomEvent) => {
      if (event.detail.type === 'payroll_approval') {
        loadPendingApprovals();
      }
    };

    window.addEventListener('finance_payroll_received', handleFinanceResponse as EventListener);
    return () => {
      window.removeEventListener('finance_payroll_received', handleFinanceResponse as EventListener);
    };
  }, []);

  const loadPendingApprovals = () => {
    const pending = FinanceApprovalService.getPendingApprovals();
    setPendingApprovals(pending);
  };

  const handleBatchAction = (batch: PayrollApprovalRequest, action: "approve" | "reject") => {
    setSelectedBatch(batch);
    setApprovalAction(action);
    setNotes("");
    setShowBatchDialog(true);
  };

  const handleIndividualAction = (batch: PayrollApprovalRequest) => {
    setSelectedBatch(batch);
    setSelectedEmployees([]);
    setRejectionReasons({});
    setShowIndividualDialog(true);
  };

  const processBatchApproval = () => {
    if (!selectedBatch || !user) return;

    const financeOfficer = user.name || "Finance Officer";

    if (approvalAction === "approve") {
      const success = FinanceApprovalService.approveBatch(
        selectedBatch.batchId,
        financeOfficer,
        notes
      );

      if (success) {
        toast({
          title: "✅ Payroll Batch Approved",
          description: `Batch ${selectedBatch.batchId} approved for ${selectedBatch.totalEmployees} employees (KSh ${selectedBatch.totalNetAmount.toLocaleString()})`,
        });
        // Immediate refresh to show status change
        setTimeout(() => loadPendingApprovals(), 100);
      }
    } else {
      if (!notes.trim()) {
        toast({
          title: "Rejection Reason Required",
          description: "Please provide a reason for rejecting this payroll batch.",
          variant: "destructive",
        });
        return;
      }

      const success = FinanceApprovalService.rejectBatch(
        selectedBatch.batchId,
        financeOfficer,
        notes
      );

      if (success) {
        toast({
          title: "❌ Payroll Batch Rejected",
          description: `Batch ${selectedBatch.batchId} rejected: ${notes}`,
          variant: "destructive",
        });
        loadPendingApprovals();
      }
    }

    setShowBatchDialog(false);
    setSelectedBatch(null);
  };

  const processIndividualApprovals = () => {
    if (!selectedBatch || !user) return;

    const financeOfficer = user.name || "Finance Officer";
    const approvedEmployees = selectedEmployees;
    const rejectedEmployees = selectedBatch.employees
      .filter(emp => !selectedEmployees.includes(emp.employeeId) && rejectionReasons[emp.employeeId])
      .map(emp => ({
        employeeId: emp.employeeId,
        reason: rejectionReasons[emp.employeeId]
      }));

    let success = true;

    // Process approvals
    if (approvedEmployees.length > 0) {
      success = FinanceApprovalService.approveIndividualPayments(
        selectedBatch.batchId,
        approvedEmployees,
        financeOfficer,
        notes
      ) && success;
    }

    // Process rejections
    if (rejectedEmployees.length > 0) {
      success = FinanceApprovalService.rejectIndividualPayments(
        selectedBatch.batchId,
        rejectedEmployees,
        financeOfficer
      ) && success;
    }

    if (success) {
      toast({
        title: "✅ Individual Payments Processed",
        description: `Approved: ${approvedEmployees.length}, Rejected: ${rejectedEmployees.length}`,
      });
      // Immediate refresh to show status change
      setTimeout(() => loadPendingApprovals(), 100);
    } else {
      toast({
        title: "Error Processing Payments",
        description: "Some payments could not be processed. Please try again.",
        variant: "destructive",
      });
    }

    setShowIndividualDialog(false);
    setSelectedBatch(null);
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const updateRejectionReason = (employeeId: string, reason: string) => {
    setRejectionReasons(prev => ({
      ...prev,
      [employeeId]: reason
    }));
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-600">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-600">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              HR Payroll Approval Center
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {pendingApprovals.length} Pending
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No payroll batches pending approval</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((batch) => (
                <Card key={batch.batchId} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">Payroll Batch {batch.batchId}</h4>
                          {getPriorityBadge(batch.metadata?.priority || 'medium')}
                          <Badge variant="outline">{batch.period}</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Employees</p>
                            <p className="font-medium flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {batch.totalEmployees}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Gross Amount</p>
                            <p className="font-medium">KSh {batch.totalGrossAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Net Amount</p>
                            <p className="font-medium text-green-600">KSh {batch.totalNetAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Submitted By</p>
                            <p className="font-medium">{batch.submittedBy}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Department</p>
                            <p className="font-medium">{batch.metadata?.department || 'HR'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Submitted Date</p>
                            <p className="font-medium">{new Date(batch.submittedDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Deadline</p>
                            <p className="font-medium text-orange-600">
                              {new Date(batch.metadata?.approvalDeadline || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cash Flow Impact</p>
                            <p className="font-medium">KSh {batch.summary?.projectedCashFlow?.toLocaleString() || '0'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleBatchAction(batch, "approve")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve All
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleBatchAction(batch, "reject")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleIndividualAction(batch)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Individual Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Approval Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Approve" : "Reject"} Payroll Batch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBatch && (
              <div className="p-4 border rounded-lg bg-muted">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Batch ID:</strong> {selectedBatch.batchId}</div>
                  <div><strong>Period:</strong> {selectedBatch.period}</div>
                  <div><strong>Employees:</strong> {selectedBatch.totalEmployees}</div>
                  <div><strong>Total Amount:</strong> KSh {selectedBatch.totalNetAmount.toLocaleString()}</div>
                  <div className="col-span-2"><strong>Submitted By:</strong> {selectedBatch.submittedBy}</div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">
                {approvalAction === "approve" ? "Approval Notes (Optional)" : "Rejection Reason (Required)"}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  approvalAction === "approve"
                    ? "Any notes about this approval..."
                    : "Please provide a reason for rejecting this payroll batch..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={processBatchApproval}
                variant={approvalAction === "approve" ? "default" : "destructive"}
              >
                {approvalAction === "approve" ? "Approve Batch" : "Reject Batch"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Approval Dialog */}
      <Dialog open={showIndividualDialog} onOpenChange={setShowIndividualDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Individual Employee Review - {selectedBatch?.batchId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBatch && (
              <>
                <div className="p-4 border rounded-lg bg-muted">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div><strong>Batch ID:</strong> {selectedBatch.batchId}</div>
                    <div><strong>Period:</strong> {selectedBatch.period}</div>
                    <div><strong>Total Employees:</strong> {selectedBatch.totalEmployees}</div>
                    <div><strong>Total Amount:</strong> KSh {selectedBatch.totalNetAmount.toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <Label>Select employees to APPROVE (unchecked employees can be rejected with reasons below):</Label>
                  <div className="mt-2 max-h-96 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Approve</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Gross Salary</TableHead>
                          <TableHead>Net Salary</TableHead>
                          <TableHead>Rejection Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBatch.employees.map((employee) => (
                          <TableRow key={employee.employeeId}>
                            <TableCell>
                              <Checkbox
                                checked={selectedEmployees.includes(employee.employeeId)}
                                onCheckedChange={() => toggleEmployeeSelection(employee.employeeId)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{employee.employeeName}</p>
                                <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
                              </div>
                            </TableCell>
                            <TableCell>KSh {employee.grossSalary.toLocaleString()}</TableCell>
                            <TableCell className="font-medium">KSh {employee.netSalary.toLocaleString()}</TableCell>
                            <TableCell>
                              {!selectedEmployees.includes(employee.employeeId) && (
                                <Textarea
                                  placeholder="Reason for rejection..."
                                  value={rejectionReasons[employee.employeeId] || ""}
                                  onChange={(e) => updateRejectionReason(employee.employeeId, e.target.value)}
                                  className="min-h-[60px]"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div>
                  <Label htmlFor="batch-notes">General Notes (Optional)</Label>
                  <Textarea
                    id="batch-notes"
                    placeholder="Any general notes about these approvals/rejections..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowIndividualDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={processIndividualApprovals} className="bg-blue-600 hover:bg-blue-700">
                    Process Selections
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
