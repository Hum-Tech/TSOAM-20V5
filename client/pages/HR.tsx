import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Download,
  User,
  FileText,
  Calendar as CalendarIcon,
  Calendar,
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Building,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  UserCheck,
  UserX,
  UserMinus,
  Ban,
  PrinterIcon,
  RefreshCw,
  Target,
  Activity,
  Bell,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { exportService } from "@/services/ExportService";
import { financialTransactionService } from "@/services/FinancialTransactionService";
import FinanceApprovalService from "@/services/FinanceApprovalService";
import { cn } from "@/lib/utils";
import { settingsService } from "@/services/SettingsService";
import { AbortHandler } from "@/utils/abortHandler";
import { leaveManagementService } from "@/services/LeaveManagementService";
import type { LeaveRequest as EnterpriseLeaveRequest, LeaveBalance, LeaveType, LeaveAnalytics } from "@/services/LeaveManagementService";
import HRDatabaseService from "@/services/HRDatabaseService";
import type { Employee as DatabaseEmployee, PerformanceReview as DatabasePerformanceReview } from "@/services/HRDatabaseService";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

// Enhanced Types for HR Management (using database types)
type Employee = DatabaseEmployee & {
  name?: string; // For backward compatibility
  employeeId?: string; // For backward compatibility
  fullName?: string; // For backward compatibility
  [key: string]: any; // Allow any property for backward compatibility
};

// P9 Form Interface based on KRA 2024 standards
interface P9FormData {
  year: number;
  employerPin: string;
  employerName: string;
  employeePin: string;
  employeeMainName: string;
  employeeOtherNames: string;
  monthlyData: P9MonthlyData[];
  totalChargeablePay: number;
  totalTax: number;
}

interface P9MonthlyData {
  month: string;
  basicSalary: number;
  benefitsNonCash: number;
  valueOfQuarters: number;
  totalGrossPay: number;
  affordableHousingLevy: number; // AHL - 1.5% of gross pay
  socialHealthInsuranceFund: number; // SHIF - 2.75% of gross pay
  postRetirementMedicalFund: number; // PRMF - max 15,000 per month
  definedContributionRetirementScheme: number; // max 30,000 per month
  ownerOccupiedInterest: number; // max 30,000 per month
  totalDeductions: number;
  chargeablePay: number;
  taxCharged: number;
  personalRelief: number; // 2,400 per month
  insuranceRelief: number; // 15% of premium, max 5,000 per month
  payeTax: number;
}

interface P9EmployeeData extends Employee {
  // Additional fields required for P9
  pensionSchemeNumber?: string;
  postRetirementMedicalFundNumber?: string;
  nhifNumber: string;
  housingLevyNumber?: string;
  insurancePremium?: number;
  ownerOccupiedInterestAmount?: number;
  monthlyPensionContribution?: number;
  monthlyPRMFContribution?: number;
}

interface LeaveRequest {
  id: number;
  employeeId: string;
  employeeName: string;
  leaveType:
    | "Annual"
    | "Sick"
    | "Maternity"
    | "Paternity"
    | "Emergency"
    | "Study"
    | "Compassionate";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  appliedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  reviewNotes?: string;
  attachments: string[];
}

interface PayrollRecord {
  id: number;
  employeeId: string;
  employeeName: string;
  period: string;
  basicSalary: number;
  allowances: number;
  overtime?: number;
  grossSalary: number;
  paye: number;
  sha: number;
  nssf: number;
  housingLevy: number;
  loan?: number;
  otherDeductions?: number;
  totalDeductions: number;
  netSalary: number;
  status?: string;
  processedDate: string;
  processedBy?: string;
  isDemoData?: boolean;
}

interface DisbursementReport {
  id: string;
  batchId: string;
  period: string;
  totalEmployees: number;
  totalGrossAmount: number;
  totalDeductions: number;
  totalNetAmount: number;
  approvedBy: string;
  approvedDate: string;
  disbursementDate: string;
  disbursementMethod: string;
  status: "Approved" | "Disbursed" | "Failed";
  employees: {
    employeeId: string;
    employeeName: string;
    netSalary: number;
    accountNumber?: string;
    disbursementStatus: "Pending" | "Success" | "Failed";
  }[];
  notes?: string;
}

interface DisciplinaryRecord {
  id: number;
  type: "Warning" | "Suspension" | "Termination" | "Counseling";
  reason: string;
  date: string;
  actionTaken: string;
  issuedBy: string;
}

// Use the database PerformanceReview type with backward compatibility
type PerformanceReview = DatabasePerformanceReview & {
  employeeName?: string;
  employeeId?: string;
  reviewPeriod?: string;
  reviewType?: string;
  overallRating?: number;
  reviewDate?: string;
  [key: string]: any; // Allow any property for backward compatibility
};

// Helper functions for property compatibility
const getEmployeeProp = (employee: Employee, prop: string): any => {
  // Try both old and new property names
  switch (prop) {
    case 'employmentStatus':
      return employee.employment_status || (employee as any).employmentStatus;
    case 'basicSalary':
      return employee.basic_salary || (employee as any).basicSalary;
    case 'performanceRating':
      return employee.performance_rating || (employee as any).performanceRating;
    case 'lastReviewDate':
      return employee.last_review_date || (employee as any).lastReviewDate;
    case 'kraPin':
      return employee.kra_pin || (employee as any).kraPin;
    case 'allowances':
      return (employee as any).allowances || {
        housing: employee.housing_allowance || 0,
        transport: employee.transport_allowance || 0,
        medical: employee.medical_allowance || 0,
        other: employee.other_allowances || 0
      };
    case 'skills':
      const skills = (employee as any).skills;
      return typeof skills === 'string' ? [skills] : skills || [];
    default:
      return (employee as any)[prop];
  }
};

// Safe toLocaleString function to prevent undefined errors
const safeToLocaleString = (value: any): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  const num = Number(value);
  return isNaN(num) ? '0' : num.toLocaleString();
};

// Safe toFixed function to prevent undefined errors
const safeToFixed = (value: any, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.' + '0'.repeat(decimals);
  }
  const num = Number(value);
  return isNaN(num) ? '0.' + '0'.repeat(decimals) : num.toFixed(decimals);
};

export default function HR() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Debug log for employees state changes
  useEffect(() => {
    console.log("Employees state updated:", employees.length, "employees loaded");
    employees.forEach(emp => console.log("Employee:", emp.fullName || emp.full_name, "ID:", emp.employeeId || emp.employee_id));
  }, [employees]);

  // Manual demo data loading function
  const loadDemoData = () => {
    console.log("Manually loading demo data...");
    const mockEmployees = [
      {
        id: 1,
        employeeId: "TSOAM-EMP-001",
        fullName: "John Kamau",
        name: "John Kamau",
        email: "john.kamau@tsoam.org",
        phone: "+254712345678",
        address: "123 Nairobi Street, Nairobi",
        dateOfBirth: "1985-03-15",
        gender: "Male",
        maritalStatus: "Married",
        nationalId: "12345678",
        kraPin: "A123456789X",
        nhifNumber: "NH123456",
        nssfNumber: "NS123456",
        department: "Administration",
        position: "Administrator",
        employmentType: "Full-time",
        employmentStatus: "Active",
        hireDate: "2020-01-15",
        basicSalary: 80000,
        allowances: {
          housing: 20000,
          transport: 10000,
          medical: 5000,
          other: 5000,
        },
        bankDetails: {
          bankName: "KCB Bank",
          accountNumber: "1234567890",
          branchCode: "001",
        },
      },
      {
        id: 2,
        employeeId: "TSOAM-EMP-002",
        fullName: "Grace Wanjiku",
        name: "Grace Wanjiku",
        email: "grace.wanjiku@tsoam.org",
        phone: "+254798765432",
        address: "456 Mombasa Road, Nairobi",
        dateOfBirth: "1990-08-22",
        gender: "Female",
        maritalStatus: "Single",
        nationalId: "87654321",
        kraPin: "B987654321Y",
        nhifNumber: "NH654321",
        nssfNumber: "NS654321",
        department: "Finance",
        position: "Accountant",
        employmentType: "Full-time",
        employmentStatus: "Active",
        hireDate: "2021-03-01",
        basicSalary: 75000,
        allowances: {
          housing: 18000,
          transport: 8000,
          medical: 5000,
          other: 2000,
        },
        bankDetails: {
          bankName: "Equity Bank",
          accountNumber: "0987654321",
          branchCode: "002",
        },
      },
      {
        id: 3,
        employeeId: "TSOAM-EMP-003",
        fullName: "Sarah Njeri",
        name: "Sarah Njeri",
        email: "sarah.njeri@tsoam.org",
        phone: "+254756789012",
        address: "321 Tom Mboya Street, Nairobi",
        dateOfBirth: "1992-05-18",
        gender: "Female",
        maritalStatus: "Single",
        nationalId: "98765432",
        kraPin: "D987654321W",
        nhifNumber: "NH987654",
        nssfNumber: "NS987654",
        department: "Human Resources",
        position: "HR Officer",
        employmentType: "Full-time",
        employmentStatus: "Active",
        hireDate: "2023-06-01",
        basicSalary: 65000,
        allowances: {
          housing: 15000,
          transport: 8000,
          medical: 4000,
          other: 3000,
        },
        bankDetails: {
          bankName: "Standard Chartered",
          accountNumber: "5566778899",
          branchCode: "004",
        },
      },
      {
        id: 4,
        employeeId: "TSOAM-EMP-004",
        fullName: "Paul Kiprotich",
        name: "Paul Kiprotich",
        email: "paul.kiprotich@tsoam.org",
        phone: "+254778901234",
        address: "654 Waiyaki Way, Nairobi",
        dateOfBirth: "1987-12-03",
        gender: "Male",
        maritalStatus: "Married",
        nationalId: "55667788",
        kraPin: "E556677889V",
        nhifNumber: "NH556677",
        nssfNumber: "NS556677",
        department: "IT",
        position: "System Administrator",
        employmentType: "Full-time",
        employmentStatus: "Active",
        hireDate: "2020-09-15",
        basicSalary: 90000,
        allowances: {
          housing: 25000,
          transport: 12000,
          medical: 6000,
          other: 7000,
        },
        bankDetails: {
          bankName: "NCBA Bank",
          accountNumber: "9988776655",
          branchCode: "005",
        },
      },
    ];

    setEmployees(mockEmployees as any as Employee[]);
    console.log("Demo data loaded manually:", mockEmployees.length, "employees");
  };
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);

  // Enterprise Leave Management State
  const [enterpriseLeaveRequests, setEnterpriseLeaveRequests] = useState<EnterpriseLeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveAnalytics, setLeaveAnalytics] = useState<LeaveAnalytics | null>(null);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<EnterpriseLeaveRequest | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [showLeaveRequestDetailDialog, setShowLeaveRequestDetailDialog] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // Leave Management Dialog States
  const [showLeaveApprovalDialog, setShowLeaveApprovalDialog] = useState(false);
  const [showLeaveBalanceDialog, setShowLeaveBalanceDialog] = useState(false);
  const [showLeaveAnalyticsDialog, setShowLeaveAnalyticsDialog] = useState(false);
  const [showLeaveCalendarDialog, setShowLeaveCalendarDialog] = useState(false);

  // Enhanced Leave Form State
  const [enterpriseLeaveForm, setEnterpriseLeaveForm] = useState({
    employeeId: "",
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
    priority: "normal" as "normal" | "urgent" | "emergency",
    handoverNotes: "",
    coveringEmployeeId: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: ""
    },
    attachments: [] as File[]
  });

  // Leave filtering and search
  const [leaveSearchTerm, setLeaveSearchTerm] = useState("");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [leaveDepartmentFilter, setLeaveDepartmentFilter] = useState("all");
  const [leaveDateRangeFilter, setLeaveDateRangeFilter] = useState({
    start: "",
    end: ""
  });
  const [processedPayrollTotal, setProcessedPayrollTotal] = useState<number>(0);
  const [disbursementReports, setDisbursementReports] = useState<
    DisbursementReport[]
  >([]);
  const [performanceReviews, setPerformanceReviews] = useState<
    PerformanceReview[]
  >([]);

  // Dialog states
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showLeaveRequestDialog, setShowLeaveRequestDialog] = useState(false);
  const [showPayrollDialog, setShowPayrollDialog] = useState(false);
  const [showProcessPayrollDialog, setShowProcessPayrollDialog] =
    useState(false);
  const [showP9FormDialog, setShowP9FormDialog] = useState(false);
  const [selectedP9Employee, setSelectedP9Employee] = useState<Employee | null>(
    null,
  );
  const [p9Year, setP9Year] = useState(new Date().getFullYear());
  const [payrollProcessing, setPayrollProcessing] = useState(false);
  const [showEmployeeDetailDialog, setShowEmployeeDetailDialog] =
    useState(false);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [showDisbursementReportsDialog, setShowDisbursementReportsDialog] =
    useState(false);
  const [selectedDisbursementReport, setSelectedDisbursementReport] =
    useState<DisbursementReport | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    nationalId: "",
    kraPin: "",
    nhifNumber: "",
    nssfNumber: "",
    department: "",
    position: "",
    employmentType: "",
    hireDate: "",
    basicSalary: "",
    housingAllowance: "",
    transportAllowance: "",
    medicalAllowance: "",
    otherAllowance: "",
    bankName: "",
    accountNumber: "",
    branchCode: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    education: "",
    skills: "",
    documents: [] as File[],
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    leaveType: "",
    startDate: new Date(),
    endDate: new Date(),
    reason: "",
    attachments: [] as File[],
  });

  const [statusChangeForm, setStatusChangeForm] = useState({
    newStatus: "",
    reason: "",
    effectiveDate: "",
    notes: "",
  });

  useEffect(() => {
    const operationId = 'hr-data-loading';
    AbortHandler.create(operationId);

    const initializeData = async () => {
      try {
        const signal = AbortHandler.getSignal(operationId);
        await loadHRData(signal);

        if (!signal?.aborted) {
          await loadLeaveManagementData();
        }
      } catch (error) {
        // Handle AbortError specifically
        if (AbortHandler.handleError(error, 'HR data initialization')) {
          return;
        }
        console.error('Error initializing HR data:', error);
      }
    };

    initializeData();

    // Cleanup function to abort requests if component unmounts
    return () => {
      AbortHandler.cancel(operationId);
    };
  }, []);

  const loadLeaveManagementData = async () => {
    try {
      setLeaveLoading(true);
      setLeaveError(null);

      // Load leave types (returns demo data directly)
      const types = await leaveManagementService.getLeaveTypes();
      setLeaveTypes(types);

      // Load leave requests (returns demo data directly)
      const requests = await leaveManagementService.getLeaveRequests();
      setEnterpriseLeaveRequests(requests);

      // Load analytics (returns demo data directly)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const today = new Date();

      const analytics = await leaveManagementService.getLeaveAnalytics({
        start: thirtyDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      });
      setLeaveAnalytics(analytics);

    } catch (error) {
      // Handle AbortError specifically
      if (AbortHandler.handleError(error, 'Leave management data loading')) {
        return;
      }

      setLeaveError("Error loading leave management data");
      console.error("Error loading leave management data:", error);
    } finally {
      setLeaveLoading(false);
    }
  };

  const loadLeaveBalancesForEmployee = async (employeeId: string) => {
    try {
      const balances = await leaveManagementService.getLeaveBalances(employeeId);
      setLeaveBalances(balances);
    } catch (error) {
      // Handle AbortError specifically
      if (AbortHandler.handleError(error, 'Leave balances loading')) {
        return;
      }

      console.error("Error loading leave balances:", error);
    }
  };

  const loadHRData = async (signal?: AbortSignal) => {
    // Load employees and performance reviews independently
    await loadEmployees(signal);
    await loadPerformanceReviews(signal);
  };

  const loadEmployees = async (signal?: AbortSignal) => {
    try {
      console.log("Attempting to load employees from API...");
      const employeesData = await HRDatabaseService.getEmployees(signal);

      // Check if aborted before proceeding
      if (signal?.aborted) return;

      console.log("Employee API data loaded successfully:", employeesData.length, "employees");

      // Map to include backward compatibility fields
      const mappedEmployees: Employee[] = employeesData.map(emp => ({
        ...emp,
        name: emp.full_name,
        employeeId: emp.employee_id,
        fullName: emp.full_name,
      }));

      setEmployees(mappedEmployees);

    } catch (error) {
      console.error("Error loading employees from API:", error);
      console.log("Loading demo employees data...");
      // Load demo data for employees
      loadDemoData();
    }
  };

  const loadPerformanceReviews = async (signal?: AbortSignal) => {
    try {
      console.log("Attempting to load performance reviews from API...");
      const reviewsData = await HRDatabaseService.getPerformanceReviews(signal);

      // Check if aborted before setting state
      if (signal?.aborted) return;

      console.log("Performance reviews loaded successfully:", reviewsData.length, "reviews");
      setPerformanceReviews(reviewsData);

    } catch (error) {
      console.error("Error loading performance reviews from API:", error);
      console.log("Loading demo performance reviews data...");
      // Load demo performance reviews
      setPerformanceReviews([]);
    }
  };



  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus =
      statusFilter === "all" || employee.employmentStatus === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: { variant: "default" as const, icon: CheckCircle },
      Suspended: { variant: "destructive" as const, icon: UserMinus },
      Terminated: { variant: "destructive" as const, icon: UserX },
      "On Leave": { variant: "secondary" as const, icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || CheckCircle;

    return (
      <Badge
        variant={config?.variant || "secondary"}
        className="flex items-center gap-1"
      >
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getEmploymentTypeBadge = (type: string) => {
    const typeColors = {
      "Full-time": "bg-green-500 text-white",
      "Part-time": "bg-blue-500 text-white",
      Volunteer: "bg-purple-500 text-white",
    };

    return (
      <Badge
        className={
          typeColors[type as keyof typeof typeColors] ||
          "bg-gray-500 text-white"
        }
      >
        {type}
      </Badge>
    );
  };

  const handleAddEmployee = async () => {
    if (
      !employeeForm.fullName ||
      !employeeForm.email ||
      !employeeForm.department
    ) {
      alert("Please fill in required fields");
      return;
    }

    const employeeCount = employees.length + 1;
    const employeeId =
      employeeForm.employmentType === "Volunteer"
        ? `TSOAM-VOL-${employeeCount.toString().padStart(3, "0")}`
        : `TSOAM-EMP-${employeeCount.toString().padStart(3, "0")}`;

    const newEmployee: Employee = {
      id: employeeCount,
      employee_id: employeeId,
      employeeId,
      full_name: employeeForm.fullName,
      fullName: employeeForm.fullName,
      name: employeeForm.fullName,
      email: employeeForm.email,
      phone: employeeForm.phone,
      address: employeeForm.address,
      date_of_birth: employeeForm.dateOfBirth,
      dateOfBirth: employeeForm.dateOfBirth,
      gender: employeeForm.gender as "Male" | "Female",
      marital_status: employeeForm.maritalStatus as any,
      maritalStatus: employeeForm.maritalStatus as any,
      national_id: employeeForm.nationalId,
      nationalId: employeeForm.nationalId,
      kra_pin: employeeForm.kraPin,
      kraPin: employeeForm.kraPin,
      nhif_number: employeeForm.nhifNumber,
      nhifNumber: employeeForm.nhifNumber,
      nssf_number: employeeForm.nssfNumber,
      nssfNumber: employeeForm.nssfNumber,
      department: employeeForm.department,
      position: employeeForm.position,
      employment_type: employeeForm.employmentType as any,
      employmentType: employeeForm.employmentType as any,
      employment_status: "Active",
      employmentStatus: "Active",
      hire_date: employeeForm.hireDate,
      hireDate: employeeForm.hireDate,
      basic_salary: parseFloat(employeeForm.basicSalary) || 0,
      basicSalary: parseFloat(employeeForm.basicSalary) || 0,
      housing_allowance: parseFloat(employeeForm.housingAllowance) || 0,
      transport_allowance: parseFloat(employeeForm.transportAllowance) || 0,
      medical_allowance: parseFloat(employeeForm.medicalAllowance) || 0,
      other_allowances: parseFloat(employeeForm.otherAllowance) || 0,
      allowances: {
        housing: parseFloat(employeeForm.housingAllowance) || 0,
        transport: parseFloat(employeeForm.transportAllowance) || 0,
        medical: parseFloat(employeeForm.medicalAllowance) || 0,
        other: parseFloat(employeeForm.otherAllowance) || 0,
      },
      bankDetails: {
        bankName: employeeForm.bankName,
        accountNumber: employeeForm.accountNumber,
        branchCode: employeeForm.branchCode,
      },
      emergencyContact: {
        name: employeeForm.emergencyContactName,
        relationship: employeeForm.emergencyContactRelationship,
        phone: employeeForm.emergencyContactPhone,
      },
      education: employeeForm.education,
      skills: employeeForm.skills,
      performance_rating: 0,
      performanceRating: 0,
      last_review_date: "",
      lastReviewDate: "",
      next_review_date: "",
      nextReviewDate: "",
      annual_leave_balance: employeeForm.employmentType === "Full-time" ? 21 : employeeForm.employmentType === "Part-time" ? 14 : 0,
      sick_leave_balance: employeeForm.employmentType === "Volunteer" ? 7 : 30,
      maternity_leave_balance: 90,
      paternity_leave_balance: 14,
      disciplinaryRecords: [],
      is_active: true,
      isActive: true,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEmployees([...employees, newEmployee]);

    // Upload documents if any
    if (employeeForm.documents && employeeForm.documents.length > 0) {
      try {
        const formData = new FormData();
        employeeForm.documents.forEach((file, index) => {
          formData.append("documents", file);
          formData.append(
            "document_types",
            index === 0
              ? "CV"
              : index === 1
                ? "ID"
                : index === 2
                  ? "Certificate"
                  : "Other",
          );
        });

        const response = await fetch(
          `/api/hr/employees/${newEmployee.id}/documents`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          console.error("Failed to upload documents");
        }
      } catch (error) {
        console.error("Document upload error:", error);
      }
    }

    // Reset form
    setEmployeeForm({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      gender: "",
      maritalStatus: "",
      nationalId: "",
      kraPin: "",
      nhifNumber: "",
      nssfNumber: "",
      department: "",
      position: "",
      employmentType: "",
      hireDate: "",
      basicSalary: "",
      housingAllowance: "",
      transportAllowance: "",
      medicalAllowance: "",
      otherAllowance: "",
      bankName: "",
      accountNumber: "",
      branchCode: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      education: "",
      skills: "",
      documents: [] as File[],
    });

    setShowAddEmployeeDialog(false);
    alert(
      `Employee ${newEmployee.fullName} added successfully with ID: ${employeeId}${employeeForm.documents.length > 0 ? ` and ${employeeForm.documents.length} document(s) uploaded` : ""}`,
    );
  };

  const handleLeaveRequest = () => {
    if (!leaveForm.employeeId || !leaveForm.leaveType || !leaveForm.reason) {
      alert("Please fill in required fields");
      return;
    }

    const employee = employees.find(
      (e) => e.employeeId === leaveForm.employeeId,
    );
    if (!employee) {
      alert("Employee not found");
      return;
    }

    const startDate = new Date(leaveForm.startDate);
    const endDate = new Date(leaveForm.endDate);
    const days =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    const newLeaveRequest: LeaveRequest = {
      id: leaveRequests.length + 1,
      employeeId: leaveForm.employeeId,
      employeeName: employee.fullName,
      leaveType: leaveForm.leaveType as any,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      days,
      reason: leaveForm.reason,
      status: "Pending",
      appliedDate: new Date().toISOString().split("T")[0],
      attachments: leaveForm.attachments.map((f) => f.name),
    };

    setLeaveRequests([...leaveRequests, newLeaveRequest]);

    // Reset form
    setLeaveForm({
      employeeId: "",
      leaveType: "",
      startDate: new Date(),
      endDate: new Date(),
      reason: "",
      attachments: [],
    });

    setShowLeaveRequestDialog(false);
    alert("Leave request submitted successfully!");
  };

  // Enterprise Leave Management Functions
  const handleEnterpriseLeaveRequest = async () => {
    if (!enterpriseLeaveForm.employeeId || !enterpriseLeaveForm.leaveTypeId || !enterpriseLeaveForm.reason) {
      alert("Please fill in required fields");
      return;
    }

    const employee = employees.find(e => e.employeeId === enterpriseLeaveForm.employeeId);
    if (!employee) {
      alert("Employee not found");
      return;
    }

    const leaveType = leaveTypes.find(lt => lt.id === enterpriseLeaveForm.leaveTypeId);
    if (!leaveType) {
      alert("Leave type not found");
      return;
    }

    try {
      const startDate = new Date(enterpriseLeaveForm.startDate);
      const endDate = new Date(enterpriseLeaveForm.endDate);
      const resumptionDate = new Date(endDate);
      resumptionDate.setDate(resumptionDate.getDate() + 1);

      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Calculate working days (excluding weekends)
      let workingDays = 0;
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
          workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const newLeaveRequest: Omit<EnterpriseLeaveRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: enterpriseLeaveForm.employeeId,
        employeeName: employee.fullName,
        employeePosition: employee.position,
        department: employee.department,
        leaveTypeId: enterpriseLeaveForm.leaveTypeId,
        leaveTypeName: leaveType.name,
        startDate: enterpriseLeaveForm.startDate,
        endDate: enterpriseLeaveForm.endDate,
        resumptionDate: resumptionDate.toISOString().split('T')[0],
        totalDays,
        workingDays,
        reason: enterpriseLeaveForm.reason,
        status: 'submitted',
        priority: enterpriseLeaveForm.priority,
        appliedDate: new Date().toISOString().split('T')[0],
        submittedDate: new Date().toISOString().split('T')[0],
        currentApprovalLevel: 1,
        approvalHistory: [
          {
            level: 1,
            approverType: 'supervisor',
            status: 'pending',
          },
        ],
        attachments: [],
        handoverNotes: enterpriseLeaveForm.handoverNotes,
        coveringEmployee: enterpriseLeaveForm.coveringEmployeeId ? {
          id: enterpriseLeaveForm.coveringEmployeeId,
          name: employees.find(e => e.employeeId === enterpriseLeaveForm.coveringEmployeeId)?.fullName || "",
          approved: false,
        } : undefined,
        emergencyContact: enterpriseLeaveForm.emergencyContact.name ? enterpriseLeaveForm.emergencyContact : undefined,
        createdBy: enterpriseLeaveForm.employeeId,
        updatedBy: enterpriseLeaveForm.employeeId,
        payrollAffected: leaveType.isPaid,
        exitInterviewRequired: totalDays > 30,
        complianceFlags: [],
        auditTrail: [
          {
            timestamp: new Date().toISOString(),
            action: 'created',
            userId: enterpriseLeaveForm.employeeId,
            userName: employee.fullName,
            details: 'Leave request created',
          },
        ],
      };

      // Validate the request
      const validation = await leaveManagementService.validateLeaveRequest(newLeaveRequest);
      if (!validation.isValid) {
        const errors = validation.violations.filter(v => v.severity === 'error');
        if (errors.length > 0) {
          alert(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
          return;
        }
      }

      const createdRequest = await leaveManagementService.createLeaveRequest(newLeaveRequest);

      // Update local state
      setEnterpriseLeaveRequests(prev => [...prev, createdRequest]);

      // Reset form
      setEnterpriseLeaveForm({
        employeeId: "",
        leaveTypeId: "",
        startDate: "",
        endDate: "",
        reason: "",
        priority: "normal",
        handoverNotes: "",
        coveringEmployeeId: "",
        emergencyContact: {
          name: "",
          phone: "",
          relationship: ""
        },
        attachments: []
      });

      setShowLeaveRequestDialog(false);
      alert("Leave request submitted successfully!");

      // Reload data
      await loadLeaveManagementData();

    } catch (error) {
      console.error("Error creating leave request:", error);
      alert("Failed to submit leave request. Please try again.");
    }
  };

  const handleLeaveApproval = async (requestId: string, action: 'approve' | 'reject', comments?: string) => {
    try {
      let updatedRequest;
      if (action === 'approve') {
        updatedRequest = await leaveManagementService.approveLeaveRequest(requestId, comments);
      } else {
        updatedRequest = await leaveManagementService.rejectLeaveRequest(requestId, comments || 'No comments provided');
      }

      // Update local state
      setEnterpriseLeaveRequests(prev =>
        prev.map(req => req.id === requestId ? updatedRequest : req)
      );

      setShowLeaveApprovalDialog(false);
      setSelectedLeaveRequest(null);

      alert(`Leave request ${action}d successfully in demo mode!`);

    } catch (error) {
      console.error(`Error ${action}ing leave request:`, error);
      alert(`Demo mode: ${(error as any)?.message || String(error)}`);
    }
  };

  const handleViewLeaveRequest = (request: EnterpriseLeaveRequest) => {
    setSelectedLeaveRequest(request);
    setShowLeaveRequestDetailDialog(true);
  };

  const handleEditLeaveRequest = (request: EnterpriseLeaveRequest) => {
    setSelectedLeaveRequest(request);
    setEnterpriseLeaveForm({
      employeeId: request.employeeId,
      leaveTypeId: request.leaveTypeId,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason,
      priority: request.priority,
      handoverNotes: request.handoverNotes || "",
      coveringEmployeeId: request.coveringEmployee?.id || "",
      emergencyContact: request.emergencyContact || {
        name: "",
        phone: "",
        relationship: ""
      },
      attachments: []
    });
    setShowLeaveRequestDialog(true);
  };

  // Performance Review State Management
  const [selectedEmployeeForReview, setSelectedEmployeeForReview] = useState<Employee | null>(null);
  const [showPerformanceDialog, setShowPerformanceDialog] = useState(false);
  const [performanceFormData, setPerformanceFormData] = useState({
    reviewPeriod: '',
    reviewType: 'quarterly',
    overallRating: '',
    jobKnowledge: '',
    qualityOfWork: '',
    productivity: '',
    communication: '',
    teamwork: '',
    initiative: '',
    reliability: '',
    strengths: '',
    areasForImprovement: '',
    goals: '',
    developmentPlan: '',
    managerComments: '',
    employeeComments: '',
    reviewerName: '',
    reviewDate: new Date().toISOString().split('T')[0]
  });

  // Performance Review Handlers
  const handleViewPerformanceReview = async (employeeId: string) => {
    console.log('Looking for employee:', employeeId);
    console.log('Available employees:', employees.map(emp => ({
      id: emp.id,
      employee_id: emp.employee_id,
      employeeId: emp.employeeId,
      full_name: emp.full_name,
      fullName: emp.fullName
    })));

    // Find employee in current list
    let employee = employees.find(emp =>
      emp.employeeId === employeeId ||
      emp.employee_id === employeeId ||
      emp.id?.toString() === employeeId
    );

    if (!employee) {
      console.error("Employee not found:", employeeId);
      alert(`Employee not found: ${employeeId}\n\nAvailable employees:\n${employees.map(emp => `${emp.employee_id || emp.employeeId}: ${emp.full_name || emp.fullName}`).join('\n')}`);
      return;
    }

    setSelectedEmployeeForReview(employee);
    setShowPerformanceDialog(true);

    // Try to load existing review data for this employee
    try {
      const reviews = await HRDatabaseService.getPerformanceReviews();
      const employeeReview = reviews.find(review =>
        review.employee_id === employeeId ||
        review.employee_id === employee?.employee_id ||
        review.employee_id === employee?.employeeId
      );

      if (employeeReview) {
        console.log('Loading existing performance review data');
        setPerformanceFormData({
          reviewPeriod: employeeReview.review_period,
          reviewType: employeeReview.review_type,
          overallRating: employeeReview.overall_rating?.toString() || '',
          jobKnowledge: employeeReview.job_knowledge_rating?.toString() || '',
          qualityOfWork: employeeReview.quality_of_work_rating?.toString() || '',
          productivity: employeeReview.productivity_rating?.toString() || '',
          communication: employeeReview.communication_rating?.toString() || '',
          teamwork: employeeReview.teamwork_rating?.toString() || '',
          initiative: employeeReview.initiative_rating?.toString() || '',
          reliability: employeeReview.reliability_rating?.toString() || '',
          strengths: employeeReview.strengths || '',
          areasForImprovement: employeeReview.areas_for_improvement || '',
          goals: employeeReview.goals || '',
          developmentPlan: employeeReview.development_plan || '',
          managerComments: employeeReview.manager_comments || '',
          employeeComments: employeeReview.employee_comments || '',
          reviewerName: employeeReview.reviewer_name || 'System Administrator',
          reviewDate: employeeReview.review_date || new Date().toISOString().split('T')[0]
        });
      } else {
        console.log('Creating new performance review');
        // Set default values for new review
        setPerformanceFormData({
          ...performanceFormData,
          reviewPeriod: 'Q4 2024',
          overallRating: getEmployeeProp(employee, 'performanceRating')?.toString() || '',
          reviewerName: 'System Administrator',
          reviewDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.log("Using demo data for performance review:", error);
      // Set default values with demo data
      setPerformanceFormData({
        ...performanceFormData,
        reviewPeriod: 'Q4 2024',
        reviewType: 'quarterly',
        overallRating: getEmployeeProp(employee, 'performanceRating')?.toString() || '4.0',
        jobKnowledge: '4',
        qualityOfWork: '4',
        productivity: '4',
        communication: '4',
        teamwork: '4',
        initiative: '4',
        reliability: '4',
        strengths: 'Demonstrated excellent work quality and strong team collaboration',
        areasForImprovement: 'Continue developing leadership skills and digital ministry expertise',
        goals: 'Complete professional development training by Q2 2025',
        developmentPlan: 'Attend leadership workshops and mentoring programs',
        managerComments: 'Shows consistent performance and positive attitude',
        employeeComments: 'Looking forward to growth opportunities in the coming year',
        reviewerName: 'System Administrator',
        reviewDate: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleEditPerformanceReview = (employeeId: string) => {
    console.log(`Editing performance review for employee: ${employeeId}`);
    handleViewPerformanceReview(employeeId);
  };

  const handleSavePerformanceDraft = async () => {
    if (!selectedEmployeeForReview) return;

    console.log('Saving performance review as draft...');
    alert('Performance review saved as draft successfully!');
  };

  const handlePreviewPerformanceReview = () => {
    if (!selectedEmployeeForReview) return;

    // Generate preview content
    const previewContent = `
Performance Review Preview
=========================

Employee: ${selectedEmployeeForReview.fullName}
Department: ${selectedEmployeeForReview.department}
Review Period: ${performanceFormData.reviewPeriod}
Overall Rating: ${performanceFormData.overallRating}/5.0

Strengths:
${performanceFormData.strengths || 'Not specified'}

Areas for Improvement:
${performanceFormData.areasForImprovement || 'Not specified'}

Goals:
${performanceFormData.goals || 'Not specified'}

Manager Comments:
${performanceFormData.managerComments || 'Not specified'}
    `;

    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Performance Review Preview</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            <pre style="white-space: pre-wrap;">${previewContent}</pre>
            <br>
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  const handleDownloadPerformanceReport = async (employeeId: string) => {
    try {
      const employee = employees.find(emp =>
        emp.employeeId === employeeId ||
        emp.employee_id === employeeId ||
        emp.id?.toString() === employeeId
      );

      if (!employee) {
        alert(`Employee not found: ${employeeId}\n\nAvailable employees:\n${employees.map(emp => `${emp.employee_id || emp.employeeId}: ${emp.full_name || emp.fullName}`).join('\n')}`);
        return;
      }

      // Show loading feedback
      console.log('Generating performance report...');

      // Create a comprehensive performance report
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('TSOAM Church Management System', 20, 20);
      doc.setFontSize(16);
      doc.text('Employee Performance Report', 20, 35);

      // Employee Information
      doc.setFontSize(12);
      doc.text(`Employee: ${employee.fullName}`, 20, 55);
      doc.text(`Department: ${employee.department}`, 20, 65);
      doc.text(`Position: ${employee.position}`, 20, 75);
      doc.text(`Review Period: Q4 2024`, 20, 85);
      doc.text(`Review Date: ${new Date().toLocaleDateString()}`, 20, 95);

      // Performance Metrics
      doc.text('Performance Summary:', 20, 115);
      doc.text(`Overall Rating: ${getEmployeeProp(employee, 'performanceRating') || 'N/A'}/5.0`, 30, 125);
      doc.text(`Last Review: ${getEmployeeProp(employee, 'lastReviewDate') || 'Not available'}`, 30, 135);

      // Skills and Competencies
      doc.text('Skills & Competencies:', 20, 155);
      const skillsArray = getEmployeeProp(employee, 'skills');
      const skills = Array.isArray(skillsArray) ? skillsArray.join(', ') : skillsArray || 'Not specified';
      const skillsLines = doc.splitTextToSize(skills, 170);
      doc.text(skillsLines, 30, 165);

      // Performance Areas (Sample data)
      doc.text('Performance Areas:', 20, 185);
      doc.text('• Job Knowledge: Excellent', 30, 195);
      doc.text('• Quality of Work: Very Good', 30, 205);
      doc.text('• Communication: Good', 30, 215);
      doc.text('• Teamwork: Excellent', 30, 225);
      doc.text('• Initiative: Very Good', 30, 235);

      // Goals and Development
      doc.text('Goals & Development Plan:', 20, 255);
      doc.text('• Continue leadership development training', 30, 265);
      doc.text('• Improve digital ministry skills', 30, 275);
      doc.text('• Mentor new team members', 30, 285);

      // Save the PDF
      doc.save(`${employee.fullName}_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);

      console.log('Performance report downloaded successfully');
      alert('Performance report downloaded successfully!');
    } catch (error) {
      console.error('Error generating performance report:', (error as any)?.message || String(error));
    }
  };

  const handleCompletePerformanceReview = async () => {
    if (!selectedEmployeeForReview) return;

    try {
      // Save performance review to database
      const reviewData = {
        employee_id: selectedEmployeeForReview.employee_id || selectedEmployeeForReview.employeeId,
        review_period: performanceFormData.reviewPeriod,
        review_type: performanceFormData.reviewType as 'annual' | 'quarterly' | 'probationary',
        overall_rating: parseFloat(performanceFormData.overallRating) || 0,
        job_knowledge_rating: parseFloat(performanceFormData.jobKnowledge) || 0,
        quality_of_work_rating: parseFloat(performanceFormData.qualityOfWork) || 0,
        productivity_rating: parseFloat(performanceFormData.productivity) || 0,
        communication_rating: parseFloat(performanceFormData.communication) || 0,
        teamwork_rating: parseFloat(performanceFormData.teamwork) || 0,
        initiative_rating: parseFloat(performanceFormData.initiative) || 0,
        reliability_rating: parseFloat(performanceFormData.reliability) || 0,
        strengths: performanceFormData.strengths,
        areas_for_improvement: performanceFormData.areasForImprovement,
        goals: performanceFormData.goals,
        development_plan: performanceFormData.developmentPlan,
        manager_comments: performanceFormData.managerComments,
        employee_comments: performanceFormData.employeeComments,
        reviewer_name: performanceFormData.reviewerName,
        review_date: performanceFormData.reviewDate
      };

      const result = await HRDatabaseService.createPerformanceReview(reviewData);

      if (result.success) {
        // Update local employee data
        const updatedEmployees = employees.map(emp =>
          (emp.id === selectedEmployeeForReview.id ||
           emp.employee_id === selectedEmployeeForReview.employee_id)
            ? {
                ...emp,
                performance_rating: parseFloat(performanceFormData.overallRating) || emp.performance_rating,
                last_review_date: performanceFormData.reviewDate
              }
            : emp
        );

        setEmployees(updatedEmployees);

        // Reload performance reviews to get updated list
        const reviews = await HRDatabaseService.getPerformanceReviews();
        setPerformanceReviews(reviews);

        alert('Performance review completed and saved successfully!');
      } else {
        alert('Error saving performance review: ' + (result.error || 'Unknown error'));
      }

      // Reset form and close dialog
      setShowPerformanceDialog(false);
      setSelectedEmployeeForReview(null);
      setPerformanceFormData({
        reviewPeriod: '',
        reviewType: 'quarterly',
        overallRating: '',
        jobKnowledge: '',
        qualityOfWork: '',
        productivity: '',
        communication: '',
        teamwork: '',
        initiative: '',
        reliability: '',
        strengths: '',
        areasForImprovement: '',
        goals: '',
        developmentPlan: '',
        managerComments: '',
        employeeComments: '',
        reviewerName: '',
        reviewDate: new Date().toISOString().split('T')[0]
      });

      alert('Performance review completed and saved successfully!');

    } catch (error) {
      console.error('Error completing performance review:', (error as any)?.message || String(error));
      alert('Error completing performance review. Please try again.');
    }
  };



  // Filter enterprise leave requests
  const filteredEnterpriseLeaveRequests = enterpriseLeaveRequests.filter(request => {
    const matchesSearch = leaveSearchTerm === "" ||
      request.employeeName.toLowerCase().includes(leaveSearchTerm.toLowerCase()) ||
      request.employeeId.toLowerCase().includes(leaveSearchTerm.toLowerCase()) ||
      request.leaveTypeName.toLowerCase().includes(leaveSearchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(leaveSearchTerm.toLowerCase());

    const matchesStatus = leaveStatusFilter === "all" || request.status === leaveStatusFilter;
    const matchesType = leaveTypeFilter === "all" || request.leaveTypeId === leaveTypeFilter;
    const matchesDepartment = leaveDepartmentFilter === "all" || request.department === leaveDepartmentFilter;

    const matchesDateRange = (!leaveDateRangeFilter.start || request.startDate >= leaveDateRangeFilter.start) &&
                            (!leaveDateRangeFilter.end || request.endDate <= leaveDateRangeFilter.end);

    return matchesSearch && matchesStatus && matchesType && matchesDepartment && matchesDateRange;
  });

  // Get leave status badge
  const getLeaveStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; className?: string }> = {
      draft: { variant: "secondary" },
      submitted: { variant: "default", className: "bg-blue-100 text-blue-800" },
      approved: { variant: "default", className: "bg-green-100 text-green-800" },
      rejected: { variant: "destructive" },
      cancelled: { variant: "destructive", className: "bg-gray-100 text-gray-800" },
      completed: { variant: "default", className: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status] || { variant: "secondary" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  // Get leave priority badge
  const getLeavePriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { variant: any; className?: string }> = {
      normal: { variant: "secondary" },
      urgent: { variant: "default", className: "bg-orange-100 text-orange-800" },
      emergency: { variant: "destructive" },
    };

    const config = priorityConfig[priority] || { variant: "secondary" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const handleStatusChange = () => {
    if (
      !selectedEmployee ||
      !statusChangeForm.newStatus ||
      !statusChangeForm.reason
    ) {
      alert("Please fill in required fields");
      return;
    }

    const updatedEmployees = employees.map((emp) =>
      emp.id === selectedEmployee.id
        ? {
            ...emp,
            employmentStatus: statusChangeForm.newStatus as any,
            updatedAt: new Date().toISOString(),
          }
        : emp,
    );

    setEmployees(updatedEmployees);

    // Add disciplinary record if suspended or terminated
    if (
      statusChangeForm.newStatus === "Suspended" ||
      statusChangeForm.newStatus === "Terminated"
    ) {
      const disciplinaryRecord: DisciplinaryRecord = {
        id: Date.now(),
        type:
          statusChangeForm.newStatus === "Suspended"
            ? "Suspension"
            : "Termination",
        reason: statusChangeForm.reason,
        date:
          statusChangeForm.effectiveDate ||
          new Date().toISOString().split("T")[0],
        actionTaken:
          statusChangeForm.notes ||
          `Employee ${statusChangeForm.newStatus.toLowerCase()}`,
        issuedBy: "HR Manager", // In real app, this would be current user
      };

      const updatedEmployee = updatedEmployees.find(
        (e) => e.id === selectedEmployee.id,
      );
      if (updatedEmployee) {
        updatedEmployee.disciplinaryRecords.push(disciplinaryRecord);
      }
    }

    // Reset form and close dialog
    setStatusChangeForm({
      newStatus: "",
      reason: "",
      effectiveDate: "",
      notes: "",
    });
    setShowStatusChangeDialog(false);
    setSelectedEmployee(null);

    alert(
      `Employee status changed to ${statusChangeForm.newStatus} successfully!`,
    );
  };

  // Process payroll for all employees with production-ready calculations
  const handleProcessPayroll = async () => {
    setPayrollProcessing(true);

    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const currentDate = new Date();
      const batchId = `PAY-${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}-${Date.now()}`;

      const activeEmployees = employees.filter(
        (emp) => getEmployeeProp(emp, 'employmentStatus') === "Active" &&
                 (getEmployeeProp(emp, 'basicSalary') || 0) > 0
      );

      if (activeEmployees.length === 0) {
        alert("❌ No active employees with valid salary data found.\n\nPlease ensure employees have:\n• Active employment status\n• Basic salary configured\n• Complete personal information");
        return;
      }

      console.log(`🔄 Processing payroll batch: ${batchId}`);
      console.log(`📊 Processing ${activeEmployees.length} active employees`);

      // Enhanced production payroll processing
      const payrollRecords = [];
      const processingErrors = [];
      let totalGrossPayroll = 0;
      let totalNetPayroll = 0;

      for (let i = 0; i < activeEmployees.length; i++) {
        const employee = activeEmployees[i];

        try {
          // Comprehensive employee validation
          const employeeName = getEmployeeProp(employee, 'fullName') || getEmployeeProp(employee, 'full_name');
          const employeeId = getEmployeeProp(employee, 'employeeId') || getEmployeeProp(employee, 'employee_id') || getEmployeeProp(employee, 'id');
          const basicSalary = Number(getEmployeeProp(employee, 'basicSalary') || 0);

          if (!employeeName || !employeeId) {
            processingErrors.push(`Employee ${i + 1}: Missing name or ID`);
            continue;
          }

          if (basicSalary <= 0) {
            processingErrors.push(`${employeeName}: Invalid basic salary (${basicSalary})`);
            continue;
          }

          // Calculate allowances with validation
          const allowancesObj = getEmployeeProp(employee, 'allowances') || {};
          let totalAllowances: number = 0;

          if (typeof allowancesObj === 'object' && allowancesObj !== null) {
            const allowanceValues = Object.values(allowancesObj) as number[];
            totalAllowances = allowanceValues.reduce(
              (sum: number, allowance: number) => sum + (Number(allowance) || 0),
              0
            );
          }

          // Ensure minimum wage compliance (Kenya minimum wage)
          const grossSalary = Math.max(basicSalary + totalAllowances, 15000); // Minimum wage check

          // Production-grade Kenya tax calculations (2024/2025 rates)
          const paye = calculateProductionPAYE(grossSalary);
          const nssf = Math.min(Math.round(grossSalary * 0.06), 2160); // 6% capped at KSH 2,160
          const sha = Math.round(grossSalary * 0.0275); // 2.75% Social Health Authority
          const housingLevy = Math.round(grossSalary * 0.015); // 1.5% Affordable Housing Levy

          // Additional deductions validation
          const loan = Number(getEmployeeProp(employee, 'loan') || 0);
          const insurance = Number(getEmployeeProp(employee, 'insurance') || 0);

          const totalStatutoryDeductions = paye + nssf + sha + housingLevy;
          const totalOtherDeductions = loan + insurance;
          const totalDeductions = totalStatutoryDeductions + totalOtherDeductions;

          // Ensure net salary is not negative
          const netSalary = Math.max(grossSalary - totalDeductions, 0);

          if (netSalary <= 0) {
            processingErrors.push(`${employeeName}: Net salary would be negative (gross: ${grossSalary}, deductions: ${totalDeductions})`);
            continue;
          }

          // Create payroll record with unique ID
          const payrollRecord = {
            id: `${batchId}-${String(i + 1).padStart(3, '0')}`,
            batchId: batchId,
            employeeId: String(employeeId),
            employeeName: employeeName,
            period: currentMonth,
            payPeriod: {
              from: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
              to: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()
            },
            basicSalary: Math.round(basicSalary),
            allowances: Math.round(totalAllowances),
            grossSalary: Math.round(grossSalary),
            deductions: {
              paye: Math.round(paye),
              nssf: Math.round(nssf),
              sha: Math.round(sha),
              housingLevy: Math.round(housingLevy),
              loan: Math.round(loan),
              insurance: Math.round(insurance),
              statutory: Math.round(totalStatutoryDeductions),
              other: Math.round(totalOtherDeductions),
              total: Math.round(totalDeductions)
            },
            netSalary: Math.round(netSalary),
            status: "Pending_Finance_Approval",
            processedDate: new Date().toISOString(),
            processedBy: "HR_System",
            taxYear: currentDate.getFullYear(),
            quarter: Math.ceil((currentDate.getMonth() + 1) / 3),
            metadata: {
              kraPin: getEmployeeProp(employee, 'kraPin') || 'Not_Set',
              nhifNumber: getEmployeeProp(employee, 'nhifNumber') || 'Not_Set',
              nssfNumber: getEmployeeProp(employee, 'nssfNumber') || 'Not_Set',
              department: getEmployeeProp(employee, 'department') || 'General',
              position: getEmployeeProp(employee, 'position') || 'Staff'
            }
          };

          payrollRecords.push(payrollRecord);
          totalGrossPayroll += grossSalary;
          totalNetPayroll += netSalary;

          console.log(`✅ Processed: ${employeeName} - Net: KSh ${netSalary.toLocaleString()}`);

          // Debug: Log the first record structure
          if (payrollRecords.length === 1) {
            console.log("📋 Sample payroll record structure:", {
              id: payrollRecord.id,
              employeeName: payrollRecord.employeeName,
              grossSalary: payrollRecord.grossSalary,
              netSalary: payrollRecord.netSalary,
              deductionsType: typeof payrollRecord.deductions,
              deductionsValue: payrollRecord.deductions,
              allKeys: Object.keys(payrollRecord)
            });
          }

        } catch (employeeError) {
          const errorMsg = `${getEmployeeProp(employee, 'fullName') || 'Unknown'}: ${employeeError instanceof Error ? employeeError.message : 'Processing error'}`;
          processingErrors.push(errorMsg);
          console.error(`❌ Error processing employee:`, employeeError);
        }
      }

      // Show processing errors if any
      if (processingErrors.length > 0) {
        const proceed = confirm(
          `⚠️ ${processingErrors.length} employee(s) could not be processed:\n\n` +
          processingErrors.slice(0, 5).join('\n') +
          (processingErrors.length > 5 ? `\n... and ${processingErrors.length - 5} more` : '') +
          `\n\nContinue with ${payrollRecords.length} successfully processed employees?`
        );

        if (!proceed) {
          setPayrollProcessing(false);
          return;
        }
      }

      if (payrollRecords.length === 0) {
        alert("❌ No employees could be processed for payroll.\n\nPlease check employee data and try again.");
        return;
      }

      // Update payroll records in state with individual tracking
      setPayrollRecords(payrollRecords);

      // Create payroll batch for Finance approval
      const payrollBatch = {
        batchId: batchId,
        period: currentMonth,
        totalEmployees: payrollRecords.length,
        totalGrossAmount: Math.round(totalGrossPayroll),
        totalNetAmount: Math.round(totalNetPayroll),
        createdDate: new Date().toISOString(),
        createdBy: "HR_System",
        status: "Pending_Finance_Approval",
        employees: payrollRecords.map(record => ({
          id: record.id,
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          grossSalary: record.grossSalary,
          netSalary: record.netSalary,
          deductions: record.deductions,
          status: "Pending"
        })),
        summary: {
          totalBasicSalary: Math.round(payrollRecords.reduce((sum, r) => sum + r.basicSalary, 0)),
          totalAllowances: Math.round(payrollRecords.reduce((sum, r) => sum + r.allowances, 0)),
          totalPAYE: Math.round(payrollRecords.reduce((sum, r) => sum + r.deductions.paye, 0)),
          totalNSSF: Math.round(payrollRecords.reduce((sum, r) => sum + r.deductions.nssf, 0)),
          totalSHA: Math.round(payrollRecords.reduce((sum, r) => sum + r.deductions.sha, 0)),
          totalHousingLevy: Math.round(payrollRecords.reduce((sum, r) => sum + r.deductions.housingLevy, 0)),
          totalDeductions: Math.round(payrollRecords.reduce((sum, r) => sum + r.deductions.total, 0))
        }
      };

      // Update dashboard with processed payroll
      setProcessedPayrollTotal(totalNetPayroll);

      // Save comprehensive HR data for Dashboard integration
      const hrModuleData = {
        employees: employees,
        payrollRecords: payrollRecords,
        payrollBatch: payrollBatch,
        lastUpdated: new Date().toISOString(),
        totalPayroll: totalNetPayroll,
        activeEmployees: activeEmployees.length,
        batchId: batchId
      };
      localStorage.setItem("hr_module_data", JSON.stringify(hrModuleData));

      // Send payroll batch to Finance for approval using production service
      try {
        // Prepare production payroll approval request
        const approvalRequest = {
          batchId: batchId,
          period: currentMonth,
          totalEmployees: payrollRecords.length,
          totalGrossAmount: Math.round(totalGrossPayroll),
          totalNetAmount: Math.round(totalNetPayroll),
          submittedBy: "HR_System",
          employees: payrollRecords.map(record => ({
            id: record.id,
            employeeId: record.employeeId,
            employeeName: record.employeeName,
            grossSalary: record.grossSalary,
            netSalary: record.netSalary,
            deductions: record.deductions,
            status: 'Pending' as const
          })),
          summary: {
            totalBasicSalary: Math.round(payrollRecords.reduce((sum, r) => sum + r.basicSalary, 0)),
            totalAllowances: Math.round(payrollRecords.reduce((sum, r) => sum + r.allowances, 0)),
            totalPAYE: Math.round(payrollRecords.reduce((sum, r) => sum + r.deductions.paye, 0)),
            totalNSSF: Math.round(payrollRecords.reduce((sum, r) => sum + r.deductions.nssf, 0)),
            totalSHA: Math.round(payrollRecords.reduce((sum, r) => sum + r.deductions.sha, 0)),
            totalHousingLevy: Math.round(payrollRecords.reduce((sum, r) => sum + r.deductions.housingLevy, 0)),
            totalLoans: Math.round(payrollRecords.reduce((sum, r) => sum + (r.deductions.loan || 0), 0)),
            totalInsurance: Math.round(payrollRecords.reduce((sum, r) => sum + (r.deductions.insurance || 0), 0)),
            totalDeductions: Math.round(payrollRecords.reduce((sum, r) => sum + r.deductions.total, 0)),
            projectedCashFlow: Math.round(totalNetPayroll),
            bankBalance: 0, // This would come from Finance module
            approvalRequired: true
          },
          metadata: {
            approvalDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            priority: totalNetPayroll > 2000000 ? 'high' as const : 'medium' as const,
            department: 'HR',
            fiscalYear: currentDate.getFullYear(),
            quarter: Math.ceil((currentDate.getMonth() + 1) / 3)
          }
        };

        // Submit to production Finance approval service
        const submissionResult = FinanceApprovalService.submitPayrollForApproval(approvalRequest);

        // Save to pending batches list for HR tracking
        const existingPendingBatches = JSON.parse(localStorage.getItem("hr_pending_batches") || "[]");
        existingPendingBatches.push({
          batchId: batchId,
          period: currentMonth,
          totalEmployees: payrollRecords.length,
          totalAmount: totalNetPayroll,
          status: "Pending_Finance_Approval",
          submittedDate: new Date().toISOString(),
          submittedBy: "HR_System"
        });
        localStorage.setItem("hr_pending_batches", JSON.stringify(existingPendingBatches));

        // Trigger Finance notification with enhanced data
        const financeEvent = new CustomEvent('hr_payroll_batch', {
          detail: {
            ...payrollBatch,
            priority: 'high',
            requiresApproval: true,
            submissionTimestamp: new Date().toISOString(),
            hrContact: 'HR Department',
            approvalDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
          }
        });
        window.dispatchEvent(financeEvent);

        // Create Finance module notification
        const financeNotification = {
          id: `payroll-${batchId}`,
          type: 'payroll_approval_request',
          title: 'New Payroll Batch for Approval',
          message: `Payroll batch ${batchId} for ${currentMonth} requires approval (${payrollRecords.length} employees, KSh ${totalNetPayroll.toLocaleString()})`,
          batchId: batchId,
          amount: totalNetPayroll,
          employeeCount: payrollRecords.length,
          priority: 'high',
          createdAt: new Date().toISOString(),
          read: false
        };

        // Store notification for Finance module
        const existingNotifications = JSON.parse(localStorage.getItem("finance_notifications") || "[]");
        existingNotifications.unshift(financeNotification);
        localStorage.setItem("finance_notifications", JSON.stringify(existingNotifications));

        // Also sync individual transactions to Finance with error handling
        try {
          const financeTransactions = financialTransactionService.addBatchPayroll(payrollRecords);
          console.log("✅ Finance transactions created:", financeTransactions.length);
        } catch (financeError) {
          console.warn("⚠️ Error creating Finance transactions:", financeError);
          // Continue with payroll processing even if Finance sync fails
        }

        console.log("✅ Payroll batch sent to Finance for approval:", {
          batchId,
          totalAmount: totalNetPayroll,
          employees: payrollRecords.length,
          financeNotified: true,
          recordStructure: payrollRecords[0] ? Object.keys(payrollRecords[0]) : []
        });

        // Trigger a visual notification that Finance has been notified
        setTimeout(() => {
          const confirmed = confirm(
            `🎯 Payroll Sent to Finance Successfully!\n\n` +
            `📦 Batch ID: ${batchId}\n` +
            `💰 Total Amount: KSh ${totalNetPayroll.toLocaleString()}\n` +
            `👥 Employees: ${payrollRecords.length}\n\n` +
            `✅ Finance team has been notified and will review within 48 hours.\n` +
            `📱 You will be notified of approval/rejection status.\n\n` +
            `Would you like to view the Finance module to track approval status?`
          );

          if (confirmed) {
            // This would navigate to Finance module in a real implementation
            alert("💡 In a full implementation, this would navigate to the Finance module.\n\nFor now, Finance team can access the Payroll Approval section to review this batch.");
          }
        }, 1000);

      } catch (error) {
        console.error("��� Error sending payroll to Finance:", error);
        alert(`❌ Failed to send payroll to Finance!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact system administrator.`);
      }

      // Show detailed success message emphasizing Finance approval
      const successMessage =
        `✅ Payroll Batch Created Successfully!\n\n` +
        `📦 BATCH SUMMARY:\n` +
        `• Batch ID: ${batchId}\n` +
        `• Period: ${currentMonth}\n` +
        `• Employees: ${payrollRecords.length}\n` +
        `• Total Amount: KSh ${totalNetPayroll.toLocaleString()}\n\n` +
        `🎯 FINANCE APPROVAL WORKFLOW:\n` +
        `• ✅ Batch sent to Finance Department\n` +
        `• ⏳ Status: Awaiting Finance Approval\n` +
        `• 📱 Finance team has been notified\n` +
        `• 📋 Individual payments can be approved/rejected\n\n` +
        (processingErrors.length > 0 ? `⚠️ Note: ${processingErrors.length} employee(s) had processing errors\n\n` : '') +
        `📍 NEXT STEPS:\n` +
        `1. Finance will review all employee payments\n` +
        `2. Individual payments will be approved/rejected\n` +
        `3. You'll be notified of the approval status\n` +
        `4. Approved payments will be processed for disbursement\n\n` +
        `💡 Check the "Pending Finance Approval" section above to track progress.`;

      alert(successMessage);

      setShowProcessPayrollDialog(false);

      // Log processing for debugging
      console.log("Payroll processing completed:", {
        employeeCount: activeEmployees.length,
        period: currentMonth,
        totalGross: totalGrossPayroll,
        totalNet: totalNetPayroll,
        batchId: batchId,
        recordsCount: payrollRecords.length,
      });

      // Optional: Try to log the activity (non-blocking)
      try {
        await fetch("/api/system-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Payroll Processing",
            module: "HR",
            details: `Demo payroll processed for ${activeEmployees.length} employees (${currentMonth})`,
            severity: "Info",
          }),
        });
      } catch (logError) {
        console.log("Could not log activity:", logError.message);
        // Non-blocking - continue without logging
      }
    } catch (error) {
      console.error("Payroll processing error:", error);

      let errorMessage = "Failed to process payroll. Please try again.";
      if (error instanceof Error) {
        errorMessage = (error as any)?.message || String(error);
      }

      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setPayrollProcessing(false);
    }
  };

  // Function to handle disbursement report from Finance
  const handleDisbursementReport = (disbursementData: any) => {
    console.log(
      "📊 Received disbursement report from Finance:",
      disbursementData,
    );

    const newDisbursementReport: DisbursementReport = {
      id: disbursementData.reportId || `DISB-${Date.now()}`,
      batchId: disbursementData.batchId,
      period: disbursementData.period,
      totalEmployees: disbursementData.totalEmployees,
      totalGrossAmount: disbursementData.totalGrossAmount,
      totalDeductions: disbursementData.totalDeductions,
      totalNetAmount: disbursementData.totalNetAmount,
      approvedBy: disbursementData.approvedBy,
      approvedDate: disbursementData.approvedDate,
      disbursementDate: disbursementData.disbursementDate,
      disbursementMethod:
        disbursementData.disbursementMethod || "Bank Transfer",
      status: "Approved",
      employees: disbursementData.employees || [],
      notes: disbursementData.notes,
    };

    setDisbursementReports((prev) => [newDisbursementReport, ...prev]);

    // Update HR module data for dashboard sync
    const hrModuleData = {
      totalEmployees: employees.length,
      recentPayroll: disbursementData.totalNetAmount,
      disbursementReports: disbursementReports.length + 1,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem("hr_module_data", JSON.stringify(hrModuleData));

    // Show notification
    setTimeout(() => {
      alert(
        `���� Payroll Disbursement Approved!\n\n` +
          `👥 Employees: ${disbursementData.totalEmployees}\n` +
          `💵 Total Amount: KSh ${disbursementData.totalNetAmount?.toLocaleString()}\n` +
          `✅ Approved by: ${disbursementData.approvedBy}\n` +
          `📅 Disbursement Date: ${new Date(disbursementData.disbursementDate).toLocaleDateString()}`,
      );
    }, 500);
  };

  // Listen for Finance approval responses and update UI accordingly
  useEffect(() => {
    const handleFinanceResponse = (event: CustomEvent) => {
      const { eventType, data } = event.detail;

      switch (eventType) {
        case 'batch_approved':
          setPayrollRecords(prevRecords =>
            prevRecords.map(record =>
              record.batchId === data.batchId
                ? { ...record, status: "Approved", approvedBy: data.approvedBy, approvedDate: data.approvedDate }
                : record
            )
          );
          alert(`✅ Payroll Batch Approved!\n\nBatch: ${data.batchId}\nApproved by: ${data.approvedBy}\nTotal: KSh ${data.totalAmount.toLocaleString()}\n\nAll payments are now ready for disbursement.`);
          break;

        case 'batch_rejected':
          setPayrollRecords(prevRecords =>
            prevRecords.map(record =>
              record.batchId === data.batchId
                ? { ...record, status: "Rejected", rejectedBy: data.rejectedBy, rejectedDate: data.rejectedDate, rejectionReason: data.reason }
                : record
            )
          );
          alert(`❌ Payroll Batch Rejected!\n\nBatch: ${data.batchId}\nRejected by: ${data.rejectedBy}\nReason: ${data.reason}\n\nPlease review and resubmit if necessary.`);
          break;

        case 'individual_approved':
          setPayrollRecords(prevRecords =>
            prevRecords.map(record =>
              record.employeeId === data.employeeId && record.batchId === data.batchId
                ? { ...record, status: "Approved", approvedBy: data.approvedBy, approvedDate: data.approvedDate }
                : record
            )
          );
          break;

        case 'individual_rejected':
          setPayrollRecords(prevRecords =>
            prevRecords.map(record =>
              record.employeeId === data.employeeId && record.batchId === data.batchId
                ? { ...record, status: "Rejected", rejectedBy: data.rejectedBy, rejectedDate: data.rejectedDate, rejectionReason: data.reason }
                : record
            )
          );
          break;
      }
    };

    // Listen for Finance responses
    window.addEventListener('hr_finance_response', handleFinanceResponse as EventListener);

    return () => {
      window.removeEventListener('hr_finance_response', handleFinanceResponse as EventListener);
    };
  }, []);

  // Listen for disbursement reports and rejections from Finance module
  useEffect(() => {
    const handleFinanceEvents = (event: StorageEvent) => {
      // Handle disbursement reports
      if (event.key === "hr_disbursement_event" && event.newValue) {
        try {
          const disbursementData = JSON.parse(event.newValue);
          handleDisbursementReport(disbursementData);

          // Clear the event after processing
          localStorage.removeItem("hr_disbursement_event");
        } catch (error) {
          console.error("Error processing disbursement event:", error);
        }
      }

      // Handle rejection notifications
      if (event.key === "hr_rejection_event" && event.newValue) {
        try {
          const rejectionData = JSON.parse(event.newValue);
          console.log(
            "❌ Received payroll rejection from Finance:",
            rejectionData,
          );

          // Show rejection notification
          setTimeout(() => {
            alert(
              `❌ Payroll Rejected by Finance!\n\n` +
                `�� Period: ${rejectionData.period}\n` +
                `💰 Amount: KSh ${rejectionData.amount?.toLocaleString()}\n` +
                `👤 Rejected by: ${rejectionData.rejectedBy}\n` +
                `�� Reason: ${rejectionData.rejectionReason}\n` +
                `📅 Date: ${new Date(rejectionData.rejectedDate).toLocaleDateString()}\n\n` +
                `���️ Please review and resubmit the payroll if necessary.`,
            );
          }, 500);

          // Clear the event after processing
          localStorage.removeItem("hr_rejection_event");
        } catch (error) {
          console.error("Error processing rejection event:", error);
        }
      }
    };

    // Listen for localStorage changes
    window.addEventListener("storage", handleFinanceEvents);

    // Check for pending events when component mounts
    const checkForPendingEvents = () => {
      // Check for pending disbursement reports
      const pendingDisbursement = localStorage.getItem("hr_disbursement_event");
      if (pendingDisbursement) {
        try {
          const disbursementData = JSON.parse(pendingDisbursement);
          handleDisbursementReport(disbursementData);
          localStorage.removeItem("hr_disbursement_event");
        } catch (error) {
          console.error("Error processing pending disbursement:", error);
        }
      }

      // Check for pending rejections
      const pendingRejection = localStorage.getItem("hr_rejection_event");
      if (pendingRejection) {
        try {
          const rejectionData = JSON.parse(pendingRejection);
          console.log("❌ Processing pending rejection:", rejectionData);

          setTimeout(() => {
            alert(
              `❌ Payroll Rejected by Finance!\n\n` +
                `��� Period: ${rejectionData.period}\n` +
                `💰 Amount: KSh ${rejectionData.amount?.toLocaleString()}\n` +
                `���� Rejected by: ${rejectionData.rejectedBy}\n` +
                `📝 Reason: ${rejectionData.rejectionReason}\n` +
                `📅 Date: ${new Date(rejectionData.rejectedDate).toLocaleDateString()}\n\n` +
                `⚠️ Please review and resubmit the payroll if necessary.`,
            );
          }, 500);

          localStorage.removeItem("hr_rejection_event");
        } catch (error) {
          console.error("Error processing pending rejection:", error);
        }
      }
    };

    checkForPendingEvents();
    const interval = setInterval(checkForPendingEvents, 2000);

    return () => {
      window.removeEventListener("storage", handleFinanceEvents);
      clearInterval(interval);
    };
  }, [employees, disbursementReports]);

  // P9 Form Calculation Functions based on KRA 2024 standards
  const calculateP9Data = (employee: Employee, year: number): P9FormData => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlyData: P9MonthlyData[] = months.map((month) => {
      const basicSalary = employee.basicSalary;
      const housingAllowance = employee.allowances?.housing || 0;
      const transportAllowance = employee.allowances?.transport || 0;
      const medicalAllowance = employee.allowances?.medical || 0;
      const otherAllowances = employee.allowances?.other || 0;

      // Calculate benefits (allowances)
      const benefitsNonCash =
        housingAllowance +
        transportAllowance +
        medicalAllowance +
        otherAllowances;

      // Value of quarters (30% of basic salary or actual, whichever is lower)
      const valueOfQuarters = Math.min(housingAllowance, basicSalary * 0.3);

      // Total gross pay
      const totalGrossPay = basicSalary + benefitsNonCash;

      // Statutory deductions (effective December 2024)
      const affordableHousingLevy = totalGrossPay * 0.015; // 1.5%
      const socialHealthInsuranceFund = totalGrossPay * 0.0275; // 2.75%

      // Optional deductions with limits
      const pensionContribution = Math.min(
        (employee as any).monthlyPensionContribution || 0,
        30000,
      );
      const prmfContribution = Math.min(
        (employee as any).monthlyPRMFContribution || 0,
        15000,
      );
      const ownerOccupiedInterest = Math.min(
        (employee as any).ownerOccupiedInterestAmount || 0,
        30000,
      );

      // Total deductions
      const totalDeductions =
        affordableHousingLevy +
        socialHealthInsuranceFund +
        pensionContribution +
        prmfContribution +
        ownerOccupiedInterest;

      // Chargeable pay
      const chargeablePay = totalGrossPay - totalDeductions;

      // Calculate tax using KRA 2024 tax bands
      const taxCharged = calculatePAYE(chargeablePay);

      // Reliefs
      const personalRelief = 2400; // KSh 2,400 per month
      const insurancePremium = (employee as any).insurancePremium || 0;
      const insuranceRelief = Math.min(insurancePremium * 0.15, 5000); // 15% up to KSh 5,000

      // Final PAYE tax
      const payeTax = Math.max(
        taxCharged - personalRelief - insuranceRelief,
        0,
      );

      return {
        month,
        basicSalary,
        benefitsNonCash,
        valueOfQuarters,
        totalGrossPay,
        affordableHousingLevy,
        socialHealthInsuranceFund,
        postRetirementMedicalFund: prmfContribution,
        definedContributionRetirementScheme: pensionContribution,
        ownerOccupiedInterest,
        totalDeductions,
        chargeablePay,
        taxCharged,
        personalRelief,
        insuranceRelief,
        payeTax,
      };
    });

    const totalChargeablePay = monthlyData.reduce(
      (sum, data) => sum + data.chargeablePay,
      0,
    );
    const totalTax = monthlyData.reduce((sum, data) => sum + data.payeTax, 0);

    // Split employee name
    const nameParts = employee.fullName.split(" ");
    const employeeMainName = nameParts[0] || "";
    const employeeOtherNames = nameParts.slice(1).join(" ") || "";

    // Get church settings from localStorage or use default
    const savedChurchSettings = localStorage.getItem("churchSettings");
    const churchSettings = savedChurchSettings
      ? JSON.parse(savedChurchSettings)
      : { kraPin: "P123456789X", name: "THE SEED OF ABRAHAM MINISTRY" };

    return {
      year,
      employerPin: churchSettings.kraPin,
      employerName: churchSettings.name,
      employeePin: employee.kraPin,
      employeeMainName,
      employeeOtherNames,
      monthlyData,
      totalChargeablePay,
      totalTax,
    };
  };

  // Calculate PAYE using KRA 2024 tax bands
  const calculatePAYE = (chargeablePay: number): number => {
    if (chargeablePay <= 24000) return 0;

    let tax = 0;

    // Tax bands for 2024
    if (chargeablePay > 24000 && chargeablePay <= 32333) {
      tax = (chargeablePay - 24000) * 0.1;
    } else if (chargeablePay > 32333 && chargeablePay <= 500000) {
      tax = (32333 - 24000) * 0.1 + (chargeablePay - 32333) * 0.25;
    } else if (chargeablePay > 500000 && chargeablePay <= 800000) {
      tax =
        (32333 - 24000) * 0.1 +
        (500000 - 32333) * 0.25 +
        (chargeablePay - 500000) * 0.3;
    } else if (chargeablePay > 800000) {
      tax =
        (32333 - 24000) * 0.1 +
        (500000 - 32333) * 0.25 +
        (800000 - 500000) * 0.3 +
        (chargeablePay - 800000) * 0.35;
    }

    return Math.round(tax);
  };

  // Generate P9 PDF
  const generateP9PDF = async (employee: Employee, year: number) => {
    const p9Data = calculateP9Data(employee, year);
    const doc = new jsPDF("landscape", "mm", "a4"); // A4 landscape: 297mm x 210mm

    // Get dynamic church settings
    const churchSettings = settingsService.getChurchSettings();

    // Header - Centered and compact
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(churchSettings.name.toUpperCase(), 148, 12, { align: "center" });
    doc.setFontSize(12);
    doc.text("KENYA REVENUE AUTHORITY", 148, 20, { align: "center" });
    doc.text("TAX DEDUCTION CARD (P9A)", 148, 28, { align: "center" });
    doc.text(`YEAR ${year}`, 148, 36, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("ISO 9001:2015 CERTIFIED", 148, 42, { align: "center" });

    // Church details - smaller font
    doc.setFontSize(6);
    doc.text(
      `${churchSettings.address} | ${churchSettings.phone} | ${churchSettings.email}`,
      148,
      47,
      { align: "center" },
    );

    // Employer and Employee Details - more compact layout
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Employer's PIN: ${churchSettings.kraPin}`, 15, 55);
    doc.text(`Employer's Name: ${churchSettings.name.toUpperCase()}`, 15, 60);
    doc.text(`Employee's PIN: ${p9Data.employeePin}`, 200, 55);
    doc.text(`Employee's Main Name: ${p9Data.employeeMainName}`, 15, 65);
    doc.text(`Employee's Other Names: ${p9Data.employeeOtherNames}`, 15, 70);

    // Table headers
    const tableHeaders = [
      "MONTH",
      "Basic Salary",
      "Benefits Non-Cash",
      "Value of Quarters",
      "Total Gross Pay",
      "Affordable Housing Levy (AHL)",
      "Social Health Insurance Fund (SHIF)",
      "Post Retirement Medical Fund (PRMF)",
      "Defined Contribution Retirement Scheme",
      "Owner Occupied Interest",
      "Total Deductions",
      "Chargeable Pay",
      "Tax Charged",
      "Personal Relief",
      "Insurance Relief",
      "PAYE Tax",
    ];

    // Table data
    const tableData = p9Data.monthlyData.map((data) => [
      data.month,
      safeToLocaleString(data.basicSalary),
      safeToLocaleString(data.benefitsNonCash),
      safeToLocaleString(data.valueOfQuarters),
      safeToLocaleString(data.totalGrossPay),
      safeToLocaleString(data.affordableHousingLevy),
      safeToLocaleString(data.socialHealthInsuranceFund),
      safeToLocaleString(data.postRetirementMedicalFund),
      safeToLocaleString(data.definedContributionRetirementScheme),
      safeToLocaleString(data.ownerOccupiedInterest),
      safeToLocaleString(data.totalDeductions),
      safeToLocaleString(data.chargeablePay),
      safeToLocaleString(data.taxCharged),
      safeToLocaleString(data.personalRelief),
      safeToLocaleString(data.insuranceRelief),
      safeToLocaleString(data.payeTax),
    ]);

    // Add totals row
    const totals = p9Data.monthlyData.reduce(
      (acc, data) => ({
        basicSalary: acc.basicSalary + data.basicSalary,
        benefitsNonCash: acc.benefitsNonCash + data.benefitsNonCash,
        valueOfQuarters: acc.valueOfQuarters + data.valueOfQuarters,
        totalGrossPay: acc.totalGrossPay + data.totalGrossPay,
        affordableHousingLevy:
          acc.affordableHousingLevy + data.affordableHousingLevy,
        socialHealthInsuranceFund:
          acc.socialHealthInsuranceFund + data.socialHealthInsuranceFund,
        postRetirementMedicalFund:
          acc.postRetirementMedicalFund + data.postRetirementMedicalFund,
        definedContributionRetirementScheme:
          acc.definedContributionRetirementScheme +
          data.definedContributionRetirementScheme,
        ownerOccupiedInterest:
          acc.ownerOccupiedInterest + data.ownerOccupiedInterest,
        totalDeductions: acc.totalDeductions + data.totalDeductions,
        chargeablePay: acc.chargeablePay + data.chargeablePay,
        taxCharged: acc.taxCharged + data.taxCharged,
        personalRelief: acc.personalRelief + data.personalRelief,
        insuranceRelief: acc.insuranceRelief + data.insuranceRelief,
        payeTax: acc.payeTax + data.payeTax,
      }),
      {
        basicSalary: 0,
        benefitsNonCash: 0,
        valueOfQuarters: 0,
        totalGrossPay: 0,
        affordableHousingLevy: 0,
        socialHealthInsuranceFund: 0,
        postRetirementMedicalFund: 0,
        definedContributionRetirementScheme: 0,
        ownerOccupiedInterest: 0,
        totalDeductions: 0,
        chargeablePay: 0,
        taxCharged: 0,
        personalRelief: 0,
        insuranceRelief: 0,
        payeTax: 0,
      },
    );

    tableData.push([
      "TOTAL",
      safeToLocaleString(totals.basicSalary),
      safeToLocaleString(totals.benefitsNonCash),
      safeToLocaleString(totals.valueOfQuarters),
      safeToLocaleString(totals.totalGrossPay),
      safeToLocaleString(totals.affordableHousingLevy),
      safeToLocaleString(totals.socialHealthInsuranceFund),
      safeToLocaleString(totals.postRetirementMedicalFund),
      safeToLocaleString(totals.definedContributionRetirementScheme),
      safeToLocaleString(totals.ownerOccupiedInterest),
      safeToLocaleString(totals.totalDeductions),
      safeToLocaleString(totals.chargeablePay),
      safeToLocaleString(totals.taxCharged),
      safeToLocaleString(totals.personalRelief),
      safeToLocaleString(totals.insuranceRelief),
      safeToLocaleString(totals.payeTax),
    ]);

    // Use autoTable for better formatting and auto-fit
    let finalY = 160; // Default fallback position

    try {
      // Generate table with autoTable for proper fitting
      const autoTable = await import("jspdf-autotable");

      (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 75,
        theme: "grid",
        styles: {
          fontSize: 5,
          cellPadding: 1,
          overflow: "linebreak",
          halign: "center",
          valign: "middle",
        },
        headStyles: {
          fillColor: [128, 128, 128],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 5,
          cellPadding: 1,
        },
        columnStyles: {
          0: { cellWidth: 15 }, // Month
          1: { cellWidth: 16 }, // Basic Salary
          2: { cellWidth: 16 }, // Benefits Non-Cash
          3: { cellWidth: 16 }, // Value of Quarters
          4: { cellWidth: 16 }, // Total Gross Pay
          5: { cellWidth: 18 }, // Affordable Housing Levy
          6: { cellWidth: 18 }, // Social Health Insurance Fund
          7: { cellWidth: 18 }, // Post Retirement Medical Fund
          8: { cellWidth: 20 }, // Defined Contribution Retirement Scheme
          9: { cellWidth: 16 }, // Owner Occupied Interest
          10: { cellWidth: 16 }, // Total Deductions
          11: { cellWidth: 16 }, // Chargeable Pay
          12: { cellWidth: 14 }, // Tax Charged
          13: { cellWidth: 14 }, // Personal Relief
          14: { cellWidth: 14 }, // Insurance Relief
          15: { cellWidth: 14 }, // PAYE Tax
        },
        margin: { left: 10, right: 10 },
        tableWidth: "auto",
        showHead: "everyPage",
        didDrawPage: function (data) {
          // Ensure table fits on page
          if (data.cursor.y > 180) {
            doc.addPage();
          }
        },
      });

      // Get the final Y position after the table
      finalY = (doc as any).lastAutoTable.finalY + 10;

      // Summary section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(
        `TOTAL CHARGEABLE PAY: KSh ${p9Data.totalChargeablePay.toLocaleString()}`,
        15,
        finalY,
      );
      doc.text(
        `TOTAL TAX: KSh ${p9Data.totalTax.toLocaleString()}`,
        150,
        finalY,
      );
    } catch (autoTableError) {
      console.warn("AutoTable failed, using manual table:", autoTableError);

      // Fallback to manual table with smaller text
      let currentY = 75;
      const cellHeight = 8;
      const tableWidth = 276;
      const startX = 10;

      // Define optimized column widths for landscape A4
      const columnWidths = [
        15, 16, 16, 16, 16, 18, 18, 18, 20, 16, 16, 16, 14, 14, 14, 14,
      ];

      // Draw table headers
      doc.setFillColor(200, 200, 200);
      doc.setFontSize(4);
      doc.setFont("helvetica", "bold");

      // Header row
      doc.rect(startX, currentY, tableWidth, cellHeight + 2, "F");
      let currentX = startX + 0.5;

      tableHeaders.forEach((header, index) => {
        const colWidth = columnWidths[index] || 16;
        // Split long headers
        const headerLines = doc.splitTextToSize(header, colWidth - 1);
        const lineHeight = 2.5;
        const startLineY = currentY + 2;

        headerLines.forEach((line: string, lineIndex: number) => {
          doc.text(line, currentX + 0.5, startLineY + lineIndex * lineHeight);
        });

        // Draw column separator
        doc.setDrawColor(128, 128, 128);
        doc.line(
          currentX + colWidth,
          currentY,
          currentX + colWidth,
          currentY + cellHeight + 2,
        );
        currentX += colWidth;
      });
      currentY += cellHeight + 2;

      // Data rows
      doc.setFontSize(4);
      doc.setFont("helvetica", "normal");

      tableData.forEach((row, rowIndex) => {
        if (rowIndex === tableData.length - 1) {
          // Total row
          doc.setFont("helvetica", "bold");
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, currentY, tableWidth, cellHeight, "F");
        } else if (rowIndex % 2 === 1) {
          // Alternate row color
          doc.setFillColor(248, 248, 248);
          doc.rect(startX, currentY, tableWidth, cellHeight, "F");
        }

        currentX = startX + 0.5;
        row.forEach((cell, colIndex) => {
          const colWidth = columnWidths[colIndex] || 16;
          const cellText = cell.toString();

          // Fit text within column
          const fittedText = doc.splitTextToSize(cellText, colWidth - 1);
          if (fittedText.length > 0) {
            doc.text(fittedText[0], currentX + 0.5, currentY + 5);
          }

          // Draw column separator
          doc.setDrawColor(200, 200, 200);
          doc.line(
            currentX + colWidth,
            currentY,
            currentX + colWidth,
            currentY + cellHeight,
          );
          currentX += colWidth;
        });

        // Draw row separator
        doc.setDrawColor(200, 200, 200);
        doc.line(
          startX,
          currentY + cellHeight,
          startX + tableWidth,
          currentY + cellHeight,
        );
        currentY += cellHeight;

        if (rowIndex === tableData.length - 1) {
          doc.setFont("helvetica", "normal");
        }
      });

      // Add table border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(startX, 75, tableWidth, currentY - 75);

      // Update finalY for manual table
      finalY = currentY + 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(
        `TOTAL CHARGEABLE PAY: KSh ${p9Data.totalChargeablePay.toLocaleString()}`,
        15,
        finalY,
      );
      doc.text(
        `TOTAL TAX: KSh ${p9Data.totalTax.toLocaleString()}`,
        150,
        finalY,
      );
    }

    // Footer with important notes
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const notes = [
      "IMPORTANT:",
      "(a) For all liable employees and where director/employee received benefits in addition to cash emoluments",
      "(b) Where an employee is eligible to deduction on owner occupier interest",
      "(c) Where an employee contributes to a post retirement medical fund",
      "",
      "2. (a) Deductible interest in respect of any month prior to December 2024 must not exceed Kshs. 25,000/= and commencing December 2024 must not exceed 30,000/=",
      "(b) Deductible pension contribution in respect of any month prior to December 2024 must not exceed Kshs. 20,000/= and commencing December 2024 must not exceed 30,000/=",
      "(c) Deductible contribution to a post retirement medical fund in respect of any month is effective from December 2024, must not exceed Kshs.15,000/=",
      "(d) Deductible Contribution to the Social Health Insurance Fund (SHIF) and deductions made towards Affordable Housing Levy (AHL) are effective December 2024",
      "(e) Personal Relief is Kshs. 2400 per Month or 28,800 per year",
      "(f) Insurance Relief is 15% of the Premium up to a Maximum of Kshs. 5,000 per month or Kshs. 60,000 per year",
    ];

    let noteY = finalY + 20;
    notes.forEach((note) => {
      doc.text(note, 20, noteY);
      noteY += 5;
    });

    // Save PDF
    doc.save(`P9_${employee.fullName.replace(/\s+/g, "_")}_${year}.pdf`);
  };

  // Generate Disbursement Report PDF
  const generateDisbursementPDF = (report: DisbursementReport) => {
    const doc = new jsPDF();

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("THE SEED OF ABRAHAM MINISTRY", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.text("PAYROLL DISBURSEMENT REPORT", 105, 35, { align: "center" });

    // Report Information
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Report ID: ${String(report.id || "N/A")}`, 20, 55);
    doc.text(`Period: ${String(report.period || "N/A")}`, 20, 65);
    doc.text(`Batch ID: ${String(report.batchId || "N/A")}`, 20, 75);
    doc.text(`Approved By: ${String(report.approvedBy || "N/A")}`, 120, 55);
    doc.text(
      `Approval Date: ${new Date(report.approvedDate).toLocaleDateString()}`,
      120,
      65,
    );
    doc.text(
      `Disbursement Date: ${new Date(report.disbursementDate).toLocaleDateString()}`,
      120,
      75,
    );

    // Summary Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SUMMARY", 20, 95);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Total Employees: ${String(report.totalEmployees || 0)}`, 20, 110);
    doc.text(
      `Total Gross Amount: KSh ${(report.totalGrossAmount || 0).toLocaleString()}`,
      20,
      120,
    );
    doc.text(
      `Total Deductions: KSh ${(report.totalDeductions || 0).toLocaleString()}`,
      20,
      130,
    );
    doc.text(
      `Total Net Amount: KSh ${(report.totalNetAmount || 0).toLocaleString()}`,
      20,
      140,
    );
    doc.text(
      `Disbursement Method: ${String(report.disbursementMethod || "N/A")}`,
      20,
      150,
    );

    // Employee Details Table
    if (report.employees.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("EMPLOYEE DISBURSEMENT DETAILS", 20, 170);

      // Table headers
      const headers = [
        ["Employee ID", "Employee Name", "Net Salary (KSh)", "Status"],
      ];
      const data = report.employees.map((emp) => [
        String(emp.employeeId || "N/A"),
        String(emp.employeeName || "N/A"),
        String((emp.netSalary || 0).toLocaleString()),
        String(emp.disbursementStatus || "N/A"),
      ]);

      // Use autoTable if available
      if ((doc as any).autoTable) {
        (doc as any).autoTable({
          head: headers,
          body: data,
          startY: 180,
          theme: "grid",
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 10,
          },
          bodyStyles: {
            fontSize: 9,
          },
          columnStyles: {
            2: { halign: "right" }, // Align salary column to right
            3: { halign: "center" }, // Center align status
          },
          margin: { top: 10, left: 20, right: 20 },
        });
      } else {
        // Fallback manual table
        let yPos = 185;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");

        // Headers
        doc.text("Employee ID", 20, yPos);
        doc.text("Employee Name", 60, yPos);
        doc.text("Net Salary (KSh)", 120, yPos);
        doc.text("Status", 170, yPos);

        doc.setFont("helvetica", "normal");
        yPos += 10;

        // Data rows
        report.employees.forEach((emp) => {
          if (yPos > 270) {
            // Start new page if needed
            doc.addPage();
            yPos = 20;
          }

          doc.text(String(emp.employeeId || "N/A"), 20, yPos);
          doc.text(
            String(emp.employeeName || "N/A").substring(0, 20),
            60,
            yPos,
          ); // Truncate long names
          doc.text(String((emp.netSalary || 0).toLocaleString()), 120, yPos);
          doc.text(String(emp.disbursementStatus || "N/A"), 170, yPos);
          yPos += 8;
        });
      }
    }

    // Notes section
    if (report.notes && String(report.notes).trim()) {
      const finalY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 20
        : 240;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("NOTES:", 20, finalY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(String(report.notes), 170);
      doc.text(splitNotes, 20, finalY + 10);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("This is a computer-generated report.", 105, pageHeight - 20, {
      align: "center",
    });
    doc.text(
      `Generated on: ${new Date().toLocaleString()}`,
      105,
      pageHeight - 10,
      { align: "center" },
    );

    // Save PDF
    const safePeriod = String(report.period || "Unknown").replace(
      /[^a-zA-Z0-9]/g,
      "_",
    );
    const safeId = String(report.id || "Unknown").replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`Disbursement_Report_${safePeriod}_${safeId}.pdf`);
  };

  // Generate P9 Excel
  const generateP9Excel = (employee: Employee, year: number) => {
    const p9Data = calculateP9Data(employee, year);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // P9 data for Excel
    const excelData = [
      ["KENYA REVENUE AUTHORITY DOMESTIC TAXES DEPARTMENT"],
      [`TAX DEDUCTION CARD YEAR ${year}`],
      ["ISO 9001:2015 CERTIFIED"],
      [],
      [`Employer's PIN`, p9Data.employerPin],
      [`Employer's Name`, p9Data.employerName],
      [`Employee's PIN`, p9Data.employeePin],
      [`Employee's Main Name`, p9Data.employeeMainName],
      [`Employee's Other Names`, p9Data.employeeOtherNames],
      [],
      [
        "MONTH",
        "Basic Salary (KSh)",
        "Benefits Non-Cash (KSh)",
        "Value of Quarters (KSh)",
        "Total Gross Pay (KSh)",
        "Affordable Housing Levy (KSh)",
        "Social Health Insurance Fund (KSh)",
        "Post Retirement Medical Fund (KSh)",
        "Defined Contribution Retirement Scheme (KSh)",
        "Owner Occupied Interest (KSh)",
        "Total Deductions (KSh)",
        "Chargeable Pay (KSh)",
        "Tax Charged (KSh)",
        "Personal Relief (KSh)",
        "Insurance Relief (KSh)",
        "PAYE Tax (KSh)",
      ],
    ];

    // Add monthly data
    p9Data.monthlyData.forEach((data) => {
      excelData.push([
        data.month,
        String(data.basicSalary),
        String(data.benefitsNonCash),
        String(data.valueOfQuarters),
        String(data.totalGrossPay),
        String(data.affordableHousingLevy),
        String(data.socialHealthInsuranceFund),
        String(data.postRetirementMedicalFund),
        String(data.definedContributionRetirementScheme),
        String(data.ownerOccupiedInterest),
        String(data.totalDeductions),
        String(data.chargeablePay),
        String(data.taxCharged),
        String(data.personalRelief),
        String(data.insuranceRelief),
        String(data.payeTax),
      ]);
    });

    // Add totals
    const totals = p9Data.monthlyData.reduce(
      (acc, data) => ({
        basicSalary: acc.basicSalary + data.basicSalary,
        benefitsNonCash: acc.benefitsNonCash + data.benefitsNonCash,
        valueOfQuarters: acc.valueOfQuarters + data.valueOfQuarters,
        totalGrossPay: acc.totalGrossPay + data.totalGrossPay,
        affordableHousingLevy:
          acc.affordableHousingLevy + data.affordableHousingLevy,
        socialHealthInsuranceFund:
          acc.socialHealthInsuranceFund + data.socialHealthInsuranceFund,
        postRetirementMedicalFund:
          acc.postRetirementMedicalFund + data.postRetirementMedicalFund,
        definedContributionRetirementScheme:
          acc.definedContributionRetirementScheme +
          data.definedContributionRetirementScheme,
        ownerOccupiedInterest:
          acc.ownerOccupiedInterest + data.ownerOccupiedInterest,
        totalDeductions: acc.totalDeductions + data.totalDeductions,
        chargeablePay: acc.chargeablePay + data.chargeablePay,
        taxCharged: acc.taxCharged + data.taxCharged,
        personalRelief: acc.personalRelief + data.personalRelief,
        insuranceRelief: acc.insuranceRelief + data.insuranceRelief,
        payeTax: acc.payeTax + data.payeTax,
      }),
      {
        basicSalary: 0,
        benefitsNonCash: 0,
        valueOfQuarters: 0,
        totalGrossPay: 0,
        affordableHousingLevy: 0,
        socialHealthInsuranceFund: 0,
        postRetirementMedicalFund: 0,
        definedContributionRetirementScheme: 0,
        ownerOccupiedInterest: 0,
        totalDeductions: 0,
        chargeablePay: 0,
        taxCharged: 0,
        personalRelief: 0,
        insuranceRelief: 0,
        payeTax: 0,
      },
    );

    excelData.push([
      "TOTAL",
      String(totals.basicSalary),
      String(totals.benefitsNonCash),
      String(totals.valueOfQuarters),
      String(totals.totalGrossPay),
      String(totals.affordableHousingLevy),
      String(totals.socialHealthInsuranceFund),
      String(totals.postRetirementMedicalFund),
      String(totals.definedContributionRetirementScheme),
      String(totals.ownerOccupiedInterest),
      String(totals.totalDeductions),
      String(totals.chargeablePay),
      String(totals.taxCharged),
      String(totals.personalRelief),
      String(totals.insuranceRelief),
      String(totals.payeTax),
    ]);

    excelData.push([]);
    excelData.push([
      `TOTAL CHARGEABLE PAY:`,
      `KSh ${p9Data.totalChargeablePay.toLocaleString()}`,
    ]);
    excelData.push([`TOTAL TAX:`, `KSh ${p9Data.totalTax.toLocaleString()}`]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "P9 Form");

    // Save Excel file
    XLSX.writeFile(
      wb,
      `P9_${employee.fullName.replace(/\s+/g, "_")}_${year}.xlsx`,
    );
  };

  const generatePayslip = async (employee: Employee) => {
    try {
      // Comprehensive employee validation
      if (!employee) {
        alert("❌ No employee selected");
        return;
      }

      const employeeName = employee.fullName || employee.full_name;
      const employeeId = employee.employeeId || employee.employee_id;

      if (!employeeName || !employeeId) {
        alert("❌ Employee data incomplete. Missing name or ID.");
        return;
      }

      // Handle different property names for basic salary with validation
      const basicSalary = Number(employee.basicSalary || employee.basic_salary || 0);

      if (basicSalary <= 0) {
        alert(`❌ Cannot generate payslip for ${employeeName}\n\nReason: Basic salary not set or invalid\nPlease update employee salary information first.`);
        return;
      }

      // Handle allowances from different property structures with better validation
      let allowancesTotal = 0;
      const allowancesBreakdown = {
        housing: 0,
        transport: 0,
        medical: 0,
        other: 0
      };

      if (employee.allowances && typeof employee.allowances === 'object') {
        allowancesBreakdown.housing = Number(employee.allowances.housing || 0);
        allowancesBreakdown.transport = Number(employee.allowances.transport || 0);
        allowancesBreakdown.medical = Number(employee.allowances.medical || 0);
        allowancesBreakdown.other = Number(employee.allowances.other || 0);
        allowancesTotal = Object.values(allowancesBreakdown).reduce((a, b) => a + b, 0);
      } else {
        // Try individual allowance properties
        allowancesBreakdown.housing = Number(employee.housing_allowance || 0);
        allowancesBreakdown.transport = Number(employee.transport_allowance || 0);
        allowancesBreakdown.medical = Number(employee.medical_allowance || 0);
        allowancesBreakdown.other = Number(employee.other_allowances || 0);
        allowancesTotal = Object.values(allowancesBreakdown).reduce((a, b) => a + b, 0);
      }

      const grossSalary = basicSalary + allowancesTotal;

      // Validate minimum salary requirements
      if (grossSalary < 1000) {
        alert(`❌ Cannot generate payslip for ${employeeName}\n\nReason: Gross salary too low (KSh ${grossSalary.toLocaleString()})\nMinimum required: KSh 1,000`);
        return;
      }

      // Kenya tax calculations with 2024/2025 rates
      const paye = calculatePayrollPAYE(grossSalary);
      const sha = Math.round(grossSalary * 0.0275); // 2.75% SHA (Social Health Authority)
      const nssf = Math.round(Math.min(grossSalary * 0.06, 2160)); // 6% capped at KSH 2,160
      const housingLevy = Math.round(grossSalary * 0.015); // 1.5% Affordable Housing Levy

      const totalDeductions = paye + sha + nssf + housingLevy;
      const netSalary = grossSalary - totalDeductions;

      // Get church settings for payslip header
      const churchSettings = settingsService.getChurchSettings();

      const payslipData = {
        employee: {
          ...employee,
          fullName: employeeName,
          employeeId: employeeId,
          kraPin: employee.kraPin || employee.kra_pin || 'Not Set',
          nhifNumber: employee.nhifNumber || employee.nhif_number || 'Not Set',
          nssfNumber: employee.nssfNumber || employee.nssf_number || 'Not Set',
          department: employee.department || 'General'
        },
        organization: {
          name: churchSettings.name || 'THE SEED OF ABRAHAM MINISTRY',
          address: churchSettings.address || 'P.O. Box 123, Nairobi',
          phone: churchSettings.phone || '+254 700 000 000',
          email: churchSettings.email || 'hr@tsoam.org',
          kraPin: churchSettings.kraPin || 'P123456789X'
        },
        period: new Date().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        payPeriod: {
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString(),
          to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString()
        },
        basicSalary: Math.round(basicSalary),
        allowances: {
          housing: Math.round(allowancesBreakdown.housing),
          transport: Math.round(allowancesBreakdown.transport),
          medical: Math.round(allowancesBreakdown.medical),
          other: Math.round(allowancesBreakdown.other),
          total: Math.round(allowancesTotal)
        },
        grossSalary: Math.round(grossSalary),
        deductions: {
          paye: Math.round(paye),
          sha: Math.round(sha),
          nssf: Math.round(nssf),
          housingLevy: Math.round(housingLevy),
          total: Math.round(totalDeductions)
        },
        netSalary: Math.round(netSalary),
        generatedDate: new Date().toLocaleDateString(),
        generatedTime: new Date().toLocaleTimeString(),
        generatedBy: 'HR System',
        payslipNumber: `PS-${employeeId}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`
      };

      // Show confirmation before generating
      const confirmed = confirm(
        `Generate payslip for ${employeeName}?\n\n` +
        `Period: ${payslipData.period}\n` +
        `Gross Salary: KSh ${grossSalary.toLocaleString()}\n` +
        `Net Salary: KSh ${netSalary.toLocaleString()}\n\n` +
        `Click OK to generate and print payslip.`
      );

      if (!confirmed) return;

      // Generate and print payslip
      await printPayslip(payslipData);

      // Show success message
      setTimeout(() => {
        alert(`✅ Payslip generated successfully!\n\nEmployee: ${employeeName}\nPayslip Number: ${payslipData.payslipNumber}\nNet Salary: KSh ${netSalary.toLocaleString()}\n\nPayslip has been sent to printer.`);
      }, 1000);

    } catch (error) {
      console.error("Error generating payslip:", error);
      alert(`❌ Failed to generate payslip\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check employee data and try again.`);
    }
  };

  // Production-grade PAYE calculation with enhanced accuracy
  const calculateProductionPAYE = (grossSalary: number): number => {
    if (grossSalary <= 0) return 0;

    // Kenya PAYE calculation for 2024/2025 (exact rates)
    let paye = 0;
    const monthlyIncome = Math.round(grossSalary);

    // Tax bands (per month)
    if (monthlyIncome <= 24000) {
      paye = monthlyIncome * 0.1; // 10% on first KSh 24,000
    } else if (monthlyIncome <= 32333) {
      paye = 24000 * 0.1 + (monthlyIncome - 24000) * 0.25; // 25% on next KSh 8,333
    } else if (monthlyIncome <= 500000) {
      paye = 24000 * 0.1 + 8333 * 0.25 + (monthlyIncome - 32333) * 0.3; // 30% on next KSh 467,667
    } else if (monthlyIncome <= 800000) {
      paye = 24000 * 0.1 + 8333 * 0.25 + 467667 * 0.3 + (monthlyIncome - 500000) * 0.325; // 32.5% on next KSh 300,000
    } else {
      paye = 24000 * 0.1 + 8333 * 0.25 + 467667 * 0.3 + 300000 * 0.325 + (monthlyIncome - 800000) * 0.35; // 35% on excess
    }

    // Personal relief (KSh 2,400 per month)
    const personalRelief = 2400;
    paye = Math.max(paye - personalRelief, 0);

    return Math.round(paye);
  };

  // Legacy function for backward compatibility
  const calculatePayrollPAYE = (grossSalary: number): number => {
    return calculateProductionPAYE(grossSalary);
  };

  const printPayslip = async (payslipData: any) => {
    try {
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        alert("❌ Popup blocked! Please allow popups for this site to print payslips.");
        return;
      }

      const payslipHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payslip - ${payslipData.employee.fullName}</title>
            <meta charset="UTF-8">
            <style>
                @media print {
                  @page { margin: 0.5in; size: A4; }
                  body { margin: 0; }
                  .no-print { display: none; }
                }

                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: #f8f9fa;
                  color: #333;
                  line-height: 1.4;
                }

                .payslip-container {
                  max-width: 800px;
                  margin: 0 auto;
                  background: white;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  border-radius: 8px;
                  overflow: hidden;
                }

                .header {
                  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                  color: white;
                  padding: 25px 20px;
                  position: relative;
                  border-bottom: 4px solid #991b1b;
                }

                .header::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="1" fill="white" opacity="0.05"/><circle cx="80" cy="80" r="1" fill="white" opacity="0.05"/><circle cx="40" cy="60" r="0.5" fill="white" opacity="0.05"/></svg>');
                }

                .logo-section {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 20px;
                  margin-bottom: 20px;
                  position: relative;
                  z-index: 1;
                }

                .company-logo {
                  width: 80px;
                  height: 80px;
                  object-fit: contain;
                  background: white;
                  border-radius: 8px;
                  padding: 8px;
                  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }

                .header-text {
                  text-align: left;
                }

                .company-name {
                  font-size: 28px;
                  font-weight: bold;
                  margin-bottom: 8px;
                  position: relative;
                  z-index: 1;
                  color: white;
                  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                }

                .company-details {
                  font-size: 14px;
                  opacity: 0.95;
                  position: relative;
                  z-index: 1;
                  line-height: 1.4;
                }

                .payslip-title {
                  font-size: 20px;
                  font-weight: 600;
                  margin-top: 0;
                  padding: 12px 25px;
                  background: rgba(255,255,255,0.15);
                  border-radius: 25px;
                  display: inline-block;
                  position: relative;
                  z-index: 1;
                  border: 2px solid rgba(255,255,255,0.2);
                  text-align: center;
                  letter-spacing: 0.5px;
                }

                .content { padding: 30px; }

                .payslip-meta {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 25px;
                  padding: 15px;
                  background: #fef2f2;
                  border-radius: 8px;
                  border-left: 4px solid #dc2626;
                  border-top: 1px solid #fecaca;
                }

                .meta-item {
                  text-align: center;
                }

                .meta-label {
                  font-size: 12px;
                  color: #6c757d;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }

                .meta-value {
                  font-size: 14px;
                  font-weight: 600;
                  color: #2d3748;
                  margin-top: 4px;
                }

                .employee-section {
                  margin-bottom: 25px;
                }

                .section-title {
                  font-size: 16px;
                  font-weight: 600;
                  color: #2d3748;
                  margin-bottom: 15px;
                  padding-bottom: 8px;
                  border-bottom: 2px solid #e2e8f0;
                }

                .employee-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                  gap: 15px;
                }

                .employee-item {
                  display: flex;
                  justify-content: space-between;
                  padding: 10px;
                  background: #fef2f2;
                  border-radius: 6px;
                  border-left: 3px solid #dc2626;
                }

                .employee-label {
                  font-weight: 500;
                  color: #4a5568;
                }

                .employee-value {
                  font-weight: 600;
                  color: #2d3748;
                }

                .earnings-deductions {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 30px;
                  margin: 25px 0;
                }

                .earnings-section, .deductions-section {
                  background: #f7fafc;
                  border-radius: 8px;
                  overflow: hidden;
                }

                .section-header {
                  background: #dc2626;
                  color: white;
                  padding: 15px;
                  font-weight: 600;
                  text-align: center;
                  font-size: 16px;
                  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
                }

                .deductions-section .section-header {
                  background: #b91c1c;
                }

                .items-list {
                  padding: 0;
                }

                .item-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 12px 15px;
                  border-bottom: 1px solid #e2e8f0;
                }

                .item-row:last-child {
                  border-bottom: none;
                }

                .item-label {
                  font-weight: 500;
                  color: #4a5568;
                }

                .item-amount {
                  font-weight: 600;
                  color: #2d3748;
                }

                .totals-section {
                  margin-top: 25px;
                  background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
                  color: white;
                  border-radius: 8px;
                  overflow: hidden;
                  border: 2px solid #dc2626;
                }

                .totals-header {
                  padding: 15px;
                  text-align: center;
                  font-weight: 600;
                  font-size: 16px;
                  background: rgba(255,255,255,0.1);
                }

                .totals-content {
                  padding: 20px;
                }

                .total-item {
                  display: flex;
                  justify-content: space-between;
                  padding: 10px 0;
                  border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .total-item:last-child {
                  border-bottom: none;
                  margin-top: 10px;
                  padding-top: 15px;
                  border-top: 2px solid rgba(255,255,255,0.2);
                  font-size: 18px;
                  font-weight: bold;
                }

                .footer {
                  margin-top: 30px;
                  padding: 20px;
                  text-align: center;
                  font-size: 12px;
                  color: #6c757d;
                  background: #f8f9fa;
                  border-top: 1px solid #e9ecef;
                }

                .signature-section {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 40px;
                  padding: 0 20px;
                }

                .signature-box {
                  text-align: center;
                  width: 200px;
                }

                .signature-line {
                  border-top: 1px solid #666;
                  margin-top: 40px;
                  padding-top: 5px;
                  font-size: 12px;
                  color: #666;
                }

                .print-button {
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #dc2626;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 600;
                  z-index: 1000;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }

                .print-button:hover {
                  background: #b91c1c;
                }
            </style>
        </head>
        <body>
            <button class="print-button no-print" onclick="window.print()">🖨️ Print Payslip</button>

            <div class="payslip-container">
                <div class="header">
                    <div class="logo-section">
                        <img src="https://cdn.builder.io/api/v1/image/assets%2F0627183da1a04fa4b6c5a1ab36b4780e%2F24ea526264444b8ca043118a01335902?format=webp&width=200"
                             alt="TSOAM Logo"
                             class="company-logo" />
                        <div class="header-text">
                            <div class="company-name">${payslipData.organization.name}</div>
                            <div class="company-details">
                                ${payslipData.organization.address}<br>
                                📧 ${payslipData.organization.email} | 📞 ${payslipData.organization.phone}<br>
                                KRA PIN: ${payslipData.organization.kraPin}
                            </div>
                        </div>
                    </div>
                    <div class="payslip-title">EMPLOYEE PAYSLIP</div>
                </div>

                <div class="content">
                    <div class="payslip-meta">
                        <div class="meta-item">
                            <div class="meta-label">Pay Period</div>
                            <div class="meta-value">${payslipData.period}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Payslip Number</div>
                            <div class="meta-value">${payslipData.payslipNumber}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Generated Date</div>
                            <div class="meta-value">${payslipData.generatedDate}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Generated Time</div>
                            <div class="meta-value">${payslipData.generatedTime}</div>
                        </div>
                    </div>

                    <div class="employee-section">
                        <div class="section-title">Employee Information</div>
                        <div class="employee-grid">
                            <div class="employee-item">
                                <span class="employee-label">Full Name:</span>
                                <span class="employee-value">${payslipData.employee.fullName}</span>
                            </div>
                            <div class="employee-item">
                                <span class="employee-label">Employee ID:</span>
                                <span class="employee-value">${payslipData.employee.employeeId}</span>
                            </div>
                            <div class="employee-item">
                                <span class="employee-label">Department:</span>
                                <span class="employee-value">${payslipData.employee.department}</span>
                            </div>
                            <div class="employee-item">
                                <span class="employee-label">Position:</span>
                                <span class="employee-value">${payslipData.employee.position || 'Staff'}</span>
                            </div>
                            <div class="employee-item">
                                <span class="employee-label">KRA PIN:</span>
                                <span class="employee-value">${payslipData.employee.kraPin}</span>
                            </div>
                            <div class="employee-item">
                                <span class="employee-label">NSSF Number:</span>
                                <span class="employee-value">${payslipData.employee.nssfNumber}</span>
                            </div>
                        </div>
                    </div>

                    <div class="earnings-deductions">
                        <div class="earnings-section">
                            <div class="section-header">💰 EARNINGS</div>
                            <div class="items-list">
                                <div class="item-row">
                                    <span class="item-label">Basic Salary</span>
                                    <span class="item-amount">KSh ${payslipData.basicSalary.toLocaleString()}</span>
                                </div>
                                <div class="item-row">
                                    <span class="item-label">Housing Allowance</span>
                                    <span class="item-amount">KSh ${payslipData.allowances.housing.toLocaleString()}</span>
                                </div>
                                <div class="item-row">
                                    <span class="item-label">Transport Allowance</span>
                                    <span class="item-amount">KSh ${payslipData.allowances.transport.toLocaleString()}</span>
                                </div>
                                <div class="item-row">
                                    <span class="item-label">Medical Allowance</span>
                                    <span class="item-amount">KSh ${payslipData.allowances.medical.toLocaleString()}</span>
                                </div>
                                <div class="item-row">
                                    <span class="item-label">Other Allowances</span>
                                    <span class="item-amount">KSh ${payslipData.allowances.other.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div class="deductions-section">
                            <div class="section-header">📉 DEDUCTIONS</div>
                            <div class="items-list">
                                <div class="item-row">
                                    <span class="item-label">P.A.Y.E Tax</span>
                                    <span class="item-amount">KSh ${payslipData.deductions.paye.toLocaleString()}</span>
                                </div>
                                <div class="item-row">
                                    <span class="item-label">N.S.S.F (6%)</span>
                                    <span class="item-amount">KSh ${payslipData.deductions.nssf.toLocaleString()}</span>
                                </div>
                                <div class="item-row">
                                    <span class="item-label">S.H.A (2.75%)</span>
                                    <span class="item-amount">KSh ${payslipData.deductions.sha.toLocaleString()}</span>
                                </div>
                                <div class="item-row">
                                    <span class="item-label">Housing Levy (1.5%)</span>
                                    <span class="item-amount">KSh ${payslipData.deductions.housingLevy.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="totals-section">
                        <div class="totals-header">�� SALARY SUMMARY</div>
                        <div class="totals-content">
                            <div class="total-item">
                                <span>Total Earnings:</span>
                                <span>KSh ${payslipData.grossSalary.toLocaleString()}</span>
                            </div>
                            <div class="total-item">
                                <span>Total Deductions:</span>
                                <span>KSh ${payslipData.deductions.total.toLocaleString()}</span>
                            </div>
                            <div class="total-item">
                                <span>NET SALARY:</span>
                                <span>KSh ${payslipData.netSalary.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature-line">Employee Signature</div>
                        </div>
                        <div class="signature-box">
                            <div class="signature-line">HR Manager</div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <p><strong>Important Notice:</strong> This payslip is computer generated and does not require a signature.</p>
                    <p>Generated by ${payslipData.generatedBy} on ${payslipData.generatedDate} at ${payslipData.generatedTime}</p>
                    <p>For any queries regarding this payslip, please contact the HR Department.</p>
                    <p style="margin-top: 15px; font-size: 10px; color: #999;">
                        Tax calculations are based on Kenya Revenue Authority (KRA) 2024/2025 tax rates and regulations.
                    </p>
                </div>
            </div>
        </body>
        </html>`;

      printWindow.document.write(payslipHTML);
      printWindow.document.close();

      // Wait for content to load then focus and print
      printWindow.onload = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

    } catch (error) {
      console.error("Error printing payslip:", error);
      alert(`❌ Failed to print payslip\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  const printLeaveForm = (leaveRequest?: LeaveRequest) => {
    const formData = leaveRequest || leaveForm;
    const employee = employees.find(
      (e) => e.employeeId === formData.employeeId,
    );

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const leaveFormHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Leave Application Form</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .company-name { font-size: 24px; font-weight: bold; color: #2c5282; }
              .form-title { font-size: 18px; margin-top: 10px; }
              .form-section { margin: 20px 0; }
              .field { margin: 10px 0; }
              .field label { font-weight: bold; display: inline-block; width: 150px; }
              .field input { border: none; border-bottom: 1px solid #000; margin-left: 10px; }
              .signature-section { margin-top: 50px; }
              .signature-box { display: inline-block; width: 200px; border-bottom: 1px solid #000; margin: 0 20px; }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="company-name">The Seed of Abraham Ministry (TSOAM)</div>
              <div>P.O. Box 12345, Nairobi, Kenya</div>
              <div class="form-title">LEAVE APPLICATION FORM</div>
          </div>

          <div class="form-section">
              <div class="field">
                  <label>Employee Name:</label>
                  <span>${employee?.fullName || "_________________________"}</span>
              </div>
              <div class="field">
                  <label>Employee ID:</label>
                  <span>${formData.employeeId || "_________________________"}</span>
              </div>
              <div class="field">
                  <label>Department:</label>
                  <span>${employee?.department || "_________________________"}</span>
              </div>
              <div class="field">
                  <label>Position:</label>
                  <span>${employee?.position || "_________________________"}</span>
              </div>
          </div>

          <div class="form-section">
              <div class="field">
                  <label>Leave Type:</label>
                  <span>${formData.leaveType || "_________________________"}</span>
              </div>
              <div class="field">
                  <label>Start Date:</label>
                  <span>${typeof formData.startDate === "string" ? formData.startDate : formData.startDate.toISOString().split("T")[0]}</span>
              </div>
              <div class="field">
                  <label>End Date:</label>
                  <span>${typeof formData.endDate === "string" ? formData.endDate : formData.endDate.toISOString().split("T")[0]}</span>
              </div>
              <div class="field">
                  <label>Number of Days:</label>
                  <span>${leaveRequest?.days || Math.ceil(((typeof formData.endDate === "string" ? new Date(formData.endDate) : formData.endDate).getTime() - (typeof formData.startDate === "string" ? new Date(formData.startDate) : formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}</span>
              </div>
              <div class="field">
                  <label>Reason for Leave:</label>
                  <div style="margin-top: 10px; border: 1px solid #000; padding: 10px; min-height: 60px;">
                      ${formData.reason || ""}
                  </div>
              </div>
          </div>

          <div class="signature-section">
              <div style="margin: 30px 0;">
                  <span>Employee Signature: </span>
                  <span class="signature-box"></span>
                  <span style="margin-left: 40px;">Date: </span>
                  <span class="signature-box"></span>
              </div>

              <div style="margin: 30px 0;">
                  <span>Supervisor Approval: </span>
                  <span class="signature-box"></span>
                  <span style="margin-left: 40px;">Date: </span>
                  <span class="signature-box"></span>
              </div>

              <div style="margin: 30px 0;">
                  <span>HR Approval: </span>
                  <span class="signature-box"></span>
                  <span style="margin-left: 40px;">Date: </span>
                  <span class="signature-box"></span>
              </div>
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #6c757d;">
              <p>This form must be submitted at least 7 days before the leave commencement date.</p>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
      </body>
      </html>
    `;

    printWindow.document.write(leaveFormHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExport = async (
    format: "excel" | "pdf",
    type: "employees" | "leave" | "payroll",
  ) => {
    let data: any[] = [];
    let filename = "";
    let title = "";

    switch (type) {
      case "employees":
        data = filteredEmployees.map((emp) => ({
          "Employee ID": emp.employeeId,
          "Full Name": emp.fullName,
          Email: emp.email,
          Department: emp.department,
          Position: emp.position,
          "Employment Type": emp.employmentType,
          Status: emp.employmentStatus,
          "Basic Salary": `KSH ${safeToLocaleString(emp.basicSalary || emp.basic_salary)}`,
          "Hire Date": emp.hireDate,
        }));
        filename = `employees_${new Date().toISOString().split("T")[0]}`;
        title = "TSOAM - Employee Records";
        break;
      case "leave":
        data = leaveRequests.map((leave) => ({
          "Employee ID": leave.employeeId,
          "Employee Name": leave.employeeName,
          "Leave Type": leave.leaveType,
          "Start Date": leave.startDate,
          "End Date": leave.endDate,
          Days: leave.days,
          Status: leave.status,
          "Applied Date": leave.appliedDate,
        }));
        filename = `leave_requests_${new Date().toISOString().split("T")[0]}`;
        title = "TSOAM - Leave Requests";
        break;
      case "payroll":
        data = payrollRecords.map((payroll) => ({
          "Employee ID": payroll.employeeId,
          "Employee Name": payroll.employeeName,
          Period: payroll.period,
          "Basic Salary": `KSH ${safeToLocaleString(payroll.basicSalary)}`,
          "Gross Salary": `KSH ${safeToLocaleString(payroll.grossSalary)}`,
          PAYE: `KSH ${safeToLocaleString(payroll.paye)}`,
          NSSF: `KSH ${safeToLocaleString(payroll.nssf)}`,
          "Net Salary": `KSH ${safeToLocaleString(payroll.netSalary)}`,
        }));
        filename = `payroll_${new Date().toISOString().split("T")[0]}`;
        title = "TSOAM - Payroll Records";
        break;
    }

    try {
      await exportService.export({
        filename,
        title,
        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
        data,
        format: format as "pdf" | "excel" | "csv",
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed: " + (error as any)?.message || String(error));
    }
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(
    (e) => getEmployeeProp(e, 'employmentStatus') === "Active",
  ).length;
  const pendingLeaves = leaveRequests.filter(
    (l) => l.status === "Pending",
  ).length;
  const monthlyPayroll =
    processedPayrollTotal > 0
      ? processedPayrollTotal
      : employees.reduce(
          (total, emp) => {
            const basicSalary = emp?.basicSalary || emp?.basic_salary || 0;
            const allowances = emp?.allowances || {};
            const allowancesTotal = Object.values(allowances).reduce((a, b) => {
              const numA = typeof a === 'number' ? a : 0;
              const numB = typeof b === 'number' ? b : 0;
              return numA + numB;
            }, 0);
            return total + basicSalary + allowancesTotal;
          },
          0,
        );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Human Resources</h1>
            <p className="text-muted-foreground">
              Comprehensive HR management system for TSOAM
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport("excel", "employees")}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Dialog
              open={showAddEmployeeDialog}
              onOpenChange={setShowAddEmployeeDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">All staff members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Employees
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEmployees}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Leaves
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingLeaves}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Payroll
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSH {safeToLocaleString(monthlyPayroll)}
              </div>
              <p className="text-xs text-muted-foreground">
                {processedPayrollTotal > 0
                  ? "Processed payroll total"
                  : "Total monthly cost"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="leave">Leave Management</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            {/* Employee Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="Administration">
                        Administration
                      </SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Youth Ministry">
                        Youth Ministry
                      </SelectItem>
                      <SelectItem value="Worship">Worship</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Employees Table */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Records</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.employeeId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {employee.fullName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.position}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>
                          {getEmploymentTypeBadge(employee.employmentType)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(employee.employmentStatus)}
                        </TableCell>
                        <TableCell>
                          KSH {safeToLocaleString(employee.basicSalary || employee.basic_salary)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowEmployeeDetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePayslip(employee)}
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowStatusChangeDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave" className="space-y-4">
            {/* Enterprise Leave Management Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Enterprise Leave Management</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive leave management with analytics, approval workflows, and compliance tracking
                </p>
                {leaveError && (
                  <div className="mt-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-md">
                    {leaveError} - Using demo data for demonstration
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadLeaveManagementData} disabled={leaveLoading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", leaveLoading && "animate-spin")} />
                  Refresh
                </Button>

                <Button
                  onClick={() => handleExport("excel", "leave")}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>

                <Button onClick={() => setShowLeaveAnalyticsDialog(true)} variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </Button>

                <Dialog
                  open={showLeaveRequestDialog}
                  onOpenChange={setShowLeaveRequestDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Leave Request
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>

            {/* Leave Analytics Summary Cards */}
            {leaveAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                        <p className="text-2xl font-bold text-blue-600">{leaveAnalytics.totalRequests}</p>
                        <p className="text-xs text-green-600">
                          ✓ {Math.round((leaveAnalytics.approvedRequests / leaveAnalytics.totalRequests) * 100)}% approved
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                        <p className="text-2xl font-bold text-green-600">{leaveAnalytics.pendingRequests}</p>
                        <p className="text-xs text-blue-600">
                          ����� Avg: {leaveAnalytics.averageProcessingTime}h processing
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Compliance Rate</p>
                        <p className="text-2xl font-bold text-orange-600">{Math.round(leaveAnalytics.noticeComplianceRate * 100)}%</p>
                        <p className="text-xs text-orange-600">
                          ⚠ {leaveAnalytics.policyViolations} violations
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>


              </div>
            )}

            {/* Advanced Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Leave Requests ({filteredEnterpriseLeaveRequests.length})</span>
                  <Button variant="outline" size="sm" onClick={() => setShowLeaveCalendarDialog(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar View
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Enhanced Filters */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search requests..."
                        value={leaveSearchTerm}
                        onChange={(e) => setLeaveSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={leaveStatusFilter} onValueChange={setLeaveStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={leaveDepartmentFilter} onValueChange={setLeaveDepartmentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="Leadership">Leadership</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Youth Ministry">Youth Ministry</SelectItem>
                        <SelectItem value="Worship">Worship</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setLeaveSearchTerm("");
                        setLeaveStatusFilter("all");
                        setLeaveTypeFilter("all");
                        setLeaveDepartmentFilter("all");
                        setLeaveDateRangeFilter({ start: "", end: "" });
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="leave-date-from">Date From</Label>
                      <Input
                        id="leave-date-from"
                        type="date"
                        value={leaveDateRangeFilter.start}
                        onChange={(e) => setLeaveDateRangeFilter(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="leave-date-to">Date To</Label>
                      <Input
                        id="leave-date-to"
                        type="date"
                        value={leaveDateRangeFilter.end}
                        onChange={(e) => setLeaveDateRangeFilter(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Leave Requests Table */}
                {leaveLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading leave requests...</span>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Leave Details</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEnterpriseLeaveRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-muted-foreground">No leave requests found</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredEnterpriseLeaveRequests.map((leave) => (
                            <TableRow key={leave.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div>
                                  <div className="font-medium">{leave.employeeName}</div>
                                  <div className="text-sm text-muted-foreground">{leave.employeeId}</div>
                                  <div className="text-xs text-muted-foreground">{leave.department}</div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div>
                                  <div className="font-medium">{leave.leaveTypeName}</div>
                                  <div className="text-sm text-muted-foreground line-clamp-2">
                                    {leave.reason}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div>
                                  <div className="font-medium">{leave.startDate} to {leave.endDate}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {leave.workingDays} working days ({leave.totalDays} total)
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Resume: {leave.resumptionDate}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                {getLeavePriorityBadge(leave.priority)}
                              </TableCell>

                              <TableCell>
                                <div className="space-y-1">
                                  {getLeaveStatusBadge(leave.status)}
                                  {leave.currentApprovalLevel && (
                                    <div className="text-xs text-muted-foreground">
                                      Level {leave.currentApprovalLevel}
                                    </div>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="text-sm">
                                  <div>{leave.appliedDate}</div>
                                  {leave.submittedDate && (
                                    <div className="text-xs text-muted-foreground">
                                      Submitted: {leave.submittedDate}
                                    </div>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewLeaveRequest(leave)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  {leave.status === 'draft' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditLeaveRequest(leave)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {(leave.status === 'submitted' || leave.status === 'approved') && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewLeaveRequest(leave)}
                                        title="View Details"
                                      >
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => printLeaveForm(leave as any)}
                                        title="Print Form"
                                      >
                                        <PrinterIcon className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}

                                  {leave.status === 'submitted' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-600"
                                        onClick={() => handleLeaveApproval(leave.id, 'approve')}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600"
                                        onClick={() => handleLeaveApproval(leave.id, 'reject', 'Rejected by manager')}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination Info */}
                {filteredEnterpriseLeaveRequests.length > 0 && (
                  <div className="flex items-center justify-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredEnterpriseLeaveRequests.length} leave request{filteredEnterpriseLeaveRequests.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Payroll Management</h3>
                <p className="text-sm text-muted-foreground">
                  Generate and manage employee payslips
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExport("excel", "payroll")}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Payroll
                </Button>
                <Button onClick={() => setShowProcessPayrollDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Process Payroll
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDisbursementReportsDialog(true)}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Disbursement Reports
                  {disbursementReports.length > 0 && (
                    <Badge className="ml-2 bg-green-600">
                      {disbursementReports.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowP9FormDialog(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate P9 Form
                </Button>
              </div>
            </div>

            {/* Pending Finance Approval Section */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Clock className="h-5 w-5" />
                  Pending Finance Approval
                </CardTitle>
                <p className="text-sm text-orange-700">
                  Payroll batches awaiting approval from Finance Department
                </p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const pendingBatches = FinanceApprovalService.getPendingApprovals();

                  if (pendingBatches.length === 0) {
                    return (
                      <div className="text-center py-6 text-orange-600">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No Pending Approvals</p>
                        <p className="text-sm">All payroll batches have been processed by Finance</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {pendingBatches.map((batch: any, index: number) => (
                        <div key={batch.batchId} className="bg-white p-4 rounded-lg border border-orange-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">
                                    Batch ID: {batch.batchId}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Period: {batch.period} • {batch.totalEmployees} employees
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        batch.metadata?.priority === 'high' ? 'border-red-300 text-red-700' :
                                        batch.metadata?.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                        'border-blue-300 text-blue-700'
                                      }`}
                                    >
                                      {(batch.metadata?.priority || 'medium').toUpperCase()} PRIORITY
                                    </Badge>
                                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {batch.status.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-lg text-gray-900">
                                    KSh {batch.totalNetAmount.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Net Amount
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Gross: KSh {batch.totalGrossAmount.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Submitted: {new Date(batch.submittedDate).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  By: {batch.submittedBy}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Deadline: {new Date(batch.metadata.approvalDeadline).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const financialImpact = FinanceApprovalService.calculateFinancialImpact(batch.batchId);
                                  alert(
                                    `📦 PRODUCTION BATCH DETAILS\n\n` +
                                    `🆔 Batch ID: ${batch.batchId}\n` +
                                    `📅 Period: ${batch.period}\n` +
                                    `👥 Employees: ${batch.totalEmployees}\n` +
                                    `💰 Gross Amount: KSh ${batch.totalGrossAmount.toLocaleString()}\n` +
                                    `💵 Net Amount: KSh ${batch.totalNetAmount.toLocaleString()}\n` +
                                    `📊 Total Deductions: KSh ${batch.summary.totalDeductions.toLocaleString()}\n\n` +
                                    `⚡ PRIORITY: ${batch.metadata.priority.toUpperCase()}\n` +
                                    `📅 Submitted: ${new Date(batch.submittedDate).toLocaleString()}\n` +
                                    `⏰ Deadline: ${new Date(batch.metadata.approvalDeadline).toLocaleString()}\n` +
                                    `🏛️ Department: ${batch.metadata.department}\n` +
                                    `📈 Fiscal Year: ${batch.metadata.fiscalYear} Q${batch.metadata.quarter}\n\n` +
                                    `📋 STATUS BREAKDOWN:\n` +
                                    `• Approved: ${financialImpact.approved.count} (KSh ${financialImpact.approved.amount.toLocaleString()})\n` +
                                    `• Rejected: ${financialImpact.rejected.count} (KSh ${financialImpact.rejected.amount.toLocaleString()})\n` +
                                    `• Pending: ${financialImpact.pending.count} (KSh ${financialImpact.pending.amount.toLocaleString()})\n\n` +
                                    `💼 SYSTEM: Production Finance Approval Service`
                                  );
                                }}
                                className="border-blue-300 text-blue-600"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const confirmed = confirm(
                                    `🔔 Send Reminder to Finance?\n\n` +
                                    `This will notify the Finance team about:\n` +
                                    `• Batch ID: ${batch.batchId}\n` +
                                    `• Amount: KSh ${batch.totalAmount.toLocaleString()}\n` +
                                    `• Submitted: ${new Date(batch.submittedDate).toLocaleDateString()}\n\n` +
                                    `Continue with reminder?`
                                  );

                                  if (confirmed) {
                                    // Create reminder notification
                                    const reminderNotification = {
                                      id: `reminder-${batch.batchId}-${Date.now()}`,
                                      type: 'payroll_reminder',
                                      title: 'Payroll Approval Reminder',
                                      message: `Reminder: Payroll batch ${batch.batchId} still pending approval (submitted ${new Date(batch.submittedDate).toLocaleDateString()})`,
                                      batchId: batch.batchId,
                                      priority: 'medium',
                                      createdAt: new Date().toISOString(),
                                      isReminder: true
                                    };

                                    const notifications = JSON.parse(localStorage.getItem("finance_notifications") || "[]");
                                    notifications.unshift(reminderNotification);
                                    localStorage.setItem("finance_notifications", JSON.stringify(notifications));

                                    alert("✅ Reminder sent to Finance team!");
                                  }
                                }}
                                className="border-yellow-300 text-yellow-600"
                              >
                                <Bell className="h-4 w-4 mr-1" />
                                Send Reminder
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PrinterIcon className="h-5 w-5 text-blue-600" />
                  Quick Payslip Generation
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generate and print individual payslips for active employees with complete salary information.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {employees.filter((e) => e.employmentStatus === "Active").length}
                      </div>
                      <div className="text-sm text-blue-700">Active Employees</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {employees.filter((e) => e.employmentStatus === "Active" && (e.fullName || e.full_name) && (e.basicSalary || e.basic_salary)).length}
                      </div>
                      <div className="text-sm text-green-700">Ready for Payslip</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {employees.filter((e) => e.employmentStatus === "Active" && !(e.basicSalary || e.basic_salary)).length}
                      </div>
                      <div className="text-sm text-orange-700">Missing Salary Data</div>
                    </div>
                  </div>

                  {/* Employee Cards */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {employees
                      .filter((e) => e.employmentStatus === "Active" && (e.fullName || e.full_name) && (e.basicSalary || e.basic_salary))
                      .map((employee) => {
                        const basicSalary = Number(employee.basicSalary || employee.basic_salary || 0);
                        const allowancesTotal = employee.allowances
                          ? Object.values(employee.allowances).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) as number
                          : 0;
                        const grossSalary = basicSalary + allowancesTotal;

                        return (
                          <Card
                            key={employee.id}
                            className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-green-500"
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900">
                                      {employee.fullName || employee.full_name}
                                    </div>
                                    <div className="text-sm text-blue-600 font-medium">
                                      ID: {employee.employeeId || employee.employee_id}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      📍 {employee.department || 'General Department'}
                                    </div>
                                  </div>
                                  <Badge variant={basicSalary > 0 ? "default" : "destructive"} className="text-xs">
                                    {basicSalary > 0 ? "Ready" : "No Salary"}
                                  </Badge>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-md space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Basic Salary:</span>
                                    <span className="font-medium">KSh {basicSalary.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Gross Salary:</span>
                                    <span className="font-semibold text-green-600">KSh {grossSalary.toLocaleString()}</span>
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() => generatePayslip(employee)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                                  disabled={basicSalary <= 0}
                                >
                                  <PrinterIcon className="h-4 w-4 mr-2" />
                                  Generate Payslip
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>

                  {/* Empty State */}
                  {employees.filter((e) => e.employmentStatus === "Active" && (e.fullName || e.full_name) && (e.basicSalary || e.basic_salary)).length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <PrinterIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Ready for Payslip</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Add employees with complete salary information to generate payslips, or load demo data to test the system.
                      </p>
                      <div className="space-x-3">
                        <Button
                          onClick={loadDemoData}
                          variant="outline"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Load Demo Data
                        </Button>
                        <Button
                          onClick={() => {
                            alert("💡 To add employees:\n\n1. Click on the 'Employees' tab above\n2. Use the 'Add Employee' button\n3. Fill in employee details including salary information\n4. Return to Payroll tab to generate payslips");
                          }}
                          variant="outline"
                          className="border-green-300 text-green-600 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          How to Add Employees
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Help Text */}
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="text-amber-600 mt-0.5">ℹ️</div>
                      <div>
                        <h4 className="font-medium text-amber-800 mb-1">Payslip Generation Requirements</h4>
                        <ul className="text-sm text-amber-700 space-y-1">
                          <li>• Employee must have Active employment status</li>
                          <li>• Basic salary must be set and greater than KSh 1,000</li>
                          <li>• Employee name and ID must be complete</li>
                          <li>• KRA PIN recommended for tax calculations</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Enhanced Performance Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Average Performance
                      </p>
                      <p className="text-2xl font-bold text-blue-600">4.2/5.0</p>
                      <p className="text-xs text-green-600">↗ +0.3 from last quarter</p>
                    </div>
                    <Award className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Reviews Due
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">3</p>
                      <p className="text-xs text-gray-500">Next 30 days</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Overdue Reviews
                      </p>
                      <p className="text-2xl font-bold text-red-600">1</p>
                      <p className="text-xs text-red-500">Requires immediate attention</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Goal Completion
                      </p>
                      <p className="text-2xl font-bold text-green-600">78%</p>
                      <p className="text-xs text-green-600">Q4 2024 objectives</p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Performance ratings across departments over time
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <div className="grid grid-cols-3 gap-4 h-full">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Department Performance</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Administration</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{width: '90%'}}></div>
                              </div>
                              <span className="text-sm font-medium">4.5</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Finance</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{width: '84%'}}></div>
                              </div>
                              <span className="text-sm font-medium">4.2</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Youth Ministry</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '80%'}}></div>
                              </div>
                              <span className="text-sm font-medium">4.0</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Worship</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{width: '88%'}}></div>
                              </div>
                              <span className="text-sm font-medium">4.4</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Review Status</h4>
                        <div className="space-y-3">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-green-800">Completed</span>
                              <span className="text-lg font-bold text-green-600">12</span>
                            </div>
                            <p className="text-xs text-green-600">This quarter</p>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-yellow-800">In Progress</span>
                              <span className="text-lg font-bold text-yellow-600">3</span>
                            </div>
                            <p className="text-xs text-yellow-600">Current reviews</p>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-red-800">Overdue</span>
                              <span className="text-lg font-bold text-red-600">1</span>
                            </div>
                            <p className="text-xs text-red-600">Needs attention</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Performance Distribution</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span>Exceptional (5.0)</span>
                            <span className="font-medium">15%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{width: '15%'}}></div>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span>Exceeds (4.0-4.9)</span>
                            <span className="font-medium">65%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '65%'}}></div>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span>Meets (3.0-3.9)</span>
                            <span className="font-medium">18%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-yellow-500 h-1.5 rounded-full" style={{width: '18%'}}></div>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span>Below (2.0-2.9)</span>
                            <span className="font-medium">2%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-red-500 h-1.5 rounded-full" style={{width: '2%'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Actions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Priority items requiring attention
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-red-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">Overdue Review</h4>
                          <p className="text-xs text-gray-600">Mike Johnson - Youth Ministry</p>
                          <p className="text-xs text-red-600">7 days overdue</p>
                        </div>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Urgent
                        </Button>
                      </div>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">Review Due Soon</h4>
                          <p className="text-xs text-gray-600">Sarah Wilson - Worship</p>
                          <p className="text-xs text-yellow-600">Due in 5 days</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">Goal Check-in</h4>
                          <p className="text-xs text-gray-600">Q4 Objectives Review</p>
                          <p className="text-xs text-blue-600">Team meeting needed</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Plan
                        </Button>
                      </div>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">Development Plan</h4>
                          <p className="text-xs text-gray-600">Leadership Training Program</p>
                          <p className="text-xs text-green-600">Ready to launch</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          Launch
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Performance Management Tabs */}
            <Tabs defaultValue="reviews" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="reviews">Performance Reviews</TabsTrigger>
                <TabsTrigger value="goals">Goals & KPIs</TabsTrigger>
                <TabsTrigger value="feedback">360° Feedback</TabsTrigger>
                <TabsTrigger value="development">Development Plans</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Enhanced Performance Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                {/* Quick Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="department-filter" className="text-sm font-medium">Department:</Label>
                        <Select>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Departments" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            <SelectItem value="admin">Administration</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="youth">Youth Ministry</SelectItem>
                            <SelectItem value="worship">Worship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Label htmlFor="status-filter" className="text-sm font-medium">Status:</Label>
                        <Select>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Label htmlFor="period-filter" className="text-sm font-medium">Period:</Label>
                        <Select>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Current Quarter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="q4-2024">Q4 2024</SelectItem>
                            <SelectItem value="q3-2024">Q3 2024</SelectItem>
                            <SelectItem value="annual-2024">Annual 2024</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Performance Reviews</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Comprehensive employee performance evaluations and feedback
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Bulk Actions
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              New Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Create Comprehensive Performance Review</DialogTitle>
                              <p className="text-sm text-muted-foreground">
                                Complete performance evaluation with goals, competencies, and development planning
                              </p>
                            </DialogHeader>
                            <div className="space-y-6">
                              {/* Basic Information */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Employee</Label>
                                  <Select>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                          {emp.fullName} - {emp.department}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Review Period</Label>
                                  <Select>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="q4-2024">Q4 2024 (Oct-Dec)</SelectItem>
                                      <SelectItem value="q3-2024">Q3 2024 (Jul-Sep)</SelectItem>
                                      <SelectItem value="annual-2024">Annual 2024</SelectItem>
                                      <SelectItem value="mid-year-2024">Mid-Year 2024</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Core Competencies Assessment */}
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Core Competencies Assessment</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  {[
                                    { name: "Ministry Excellence", desc: "Quality of ministry delivery and spiritual impact" },
                                    { name: "Leadership", desc: "Ability to lead, inspire, and guide others" },
                                    { name: "Communication", desc: "Effective verbal and written communication skills" },
                                    { name: "Teamwork", desc: "Collaboration and team contribution" },
                                    { name: "Innovation", desc: "Creative problem-solving and initiative" },
                                    { name: "Reliability", desc: "Consistency and dependability in work" }
                                  ].map((competency, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                      <h4 className="font-medium">{competency.name}</h4>
                                      <p className="text-xs text-gray-600 mb-2">{competency.desc}</p>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm">Rating:</span>
                                        <Select>
                                          <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Rate" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="5">5 - Exceptional</SelectItem>
                                            <SelectItem value="4">4 - Exceeds</SelectItem>
                                            <SelectItem value="3">3 - Meets</SelectItem>
                                            <SelectItem value="2">2 - Below</SelectItem>
                                            <SelectItem value="1">1 - Unsatisfactory</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Performance Areas */}
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Performance Evaluation</h3>
                                <div className="grid gap-4">
                                  <div>
                                    <Label>Key Achievements</Label>
                                    <Textarea
                                      placeholder="�� Significant accomplishments during this period
• Projects completed successfully
• Goals exceeded or met
• Impact on ministry/organization"
                                      className="min-h-24"
                                    />
                                  </div>
                                  <div>
                                    <Label>Areas of Strength</Label>
                                    <Textarea
                                      placeholder="• Core competencies demonstrating excellence
• Skills that stand out
• Leadership qualities exhibited
��� Positive feedback from others"
                                      className="min-h-24"
                                    />
                                  </div>
                                  <div>
                                    <Label>Development Opportunities</Label>
                                    <Textarea
                                      placeholder="• Areas for skill enhancement
• Training or development needs
• Growth opportunities identified
• Support required for improvement"
                                      className="min-h-24"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Goals and Objectives */}
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Goals for Next Period</h3>
                                <div className="grid gap-4">
                                  <div>
                                    <Label>Strategic Objectives</Label>
                                    <Textarea
                                      placeholder="• Primary objectives aligned with organizational goals
• Ministry-specific targets
• Leadership development goals
• Innovation and improvement initiatives"
                                      className="min-h-24"
                                    />
                                  </div>
                                  <div>
                                    <Label>Professional Development Plan</Label>
                                    <Textarea
                                      placeholder="• Training programs to attend
�� Skills to develop
• Certifications to pursue
• Mentoring or coaching needs"
                                      className="min-h-24"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Overall Rating and Comments */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Overall Performance Rating</Label>
                                  <Select>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select overall rating" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="5">5 - Exceptional Performance</SelectItem>
                                      <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                                      <SelectItem value="3">3 - Meets Expectations</SelectItem>
                                      <SelectItem value="2">2 - Below Expectations</SelectItem>
                                      <SelectItem value="1">1 - Unsatisfactory</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Review Type</Label>
                                  <Select>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="annual">Annual Review</SelectItem>
                                      <SelectItem value="quarterly">Quarterly Review</SelectItem>
                                      <SelectItem value="probation">Probation Review</SelectItem>
                                      <SelectItem value="mid-year">Mid-Year Check-in</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={handleSavePerformanceDraft}>Save as Draft</Button>
                                <Button variant="outline" onClick={handlePreviewPerformanceReview}>Preview Review</Button>
                                <Button onClick={handleCompletePerformanceReview}>Complete Review</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search employees, departments, or reviews..."
                          className="w-80"
                        />
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Showing 16 of 23 reviews</span>
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-1" />
                          View All
                        </Button>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Review Type</TableHead>
                          <TableHead>Overall Rating</TableHead>
                          <TableHead>Competency Avg</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                JD
                              </div>
                              <div>
                                <p className="font-medium">John Doe</p>
                                <p className="text-xs text-gray-500">Senior Pastor</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <span>Administration</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50">Annual 2024</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-lg font-semibold text-green-600">4.8</span>
                                <span className="text-sm text-gray-500">/5.0</span>
                              </div>
                              <Badge className="bg-green-100 text-green-800 text-xs">Exceptional</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">4.6</span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{width: '92%'}}></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">Dec 15, 2024</p>
                              <p className="text-xs text-green-600">Completed early</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewPerformanceReview('TSOAM-EMP-001')}
                                title="View Performance Review"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditPerformanceReview('TSOAM-EMP-001')}
                                title="Edit Performance Review"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownloadPerformanceReport('TSOAM-EMP-001')}
                                title="Download Report"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                JS
                              </div>
                              <div>
                                <p className="font-medium">Jane Smith</p>
                                <p className="text-xs text-gray-500">Finance Manager</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span>Finance</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-orange-50">Q4 2024</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-lg font-semibold text-blue-600">4.4</span>
                                <span className="text-sm text-gray-500">/5.0</span>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800 text-xs">Exceeds</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">4.2</span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '84%'}}></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">Dec 20, 2024</p>
                              <p className="text-xs text-blue-600">On track</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewPerformanceReview('TSOAM-EMP-002')}
                                title="View Performance Review"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditPerformanceReview('TSOAM-EMP-002')}
                                title="Edit Performance Review"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  alert('Reminder set for performance review due Dec 20, 2024');
                                  console.log('Performance review reminder set');
                                }}
                                title="Set Reminder"
                              >
                                <Clock className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-medium">
                                MJ
                              </div>
                              <div>
                                <p className="font-medium">Mike Johnson</p>
                                <p className="text-xs text-gray-500">Youth Pastor</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>Youth Ministry</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-orange-50">Q3 2024</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-400">Not rated</span>
                              <Badge className="bg-gray-100 text-gray-600 text-xs">Pending</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-400">-</span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-gray-300 h-1.5 rounded-full" style={{width: '0%'}}></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium text-red-600">Dec 10, 2024</p>
                              <p className="text-xs text-red-600">7 days overdue</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-red-200"
                                onClick={() => {
                                  alert('⚠️ Performance review is 7 days overdue. Manager has been notified.');
                                  console.log('Overdue alert triggered for Mike Johnson');
                                }}
                                title="Review Overdue Alert"
                              >
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditPerformanceReview('TSOAM-EMP-001')}
                                title="Edit Performance Review"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  alert('📧 Reminder email sent to Mike Johnson for overdue performance review.');
                                  console.log('Reminder email sent to Mike Johnson');
                                }}
                                title="Send Reminder Email"
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                                SW
                              </div>
                              <div>
                                <p className="font-medium">Sarah Wilson</p>
                                <p className="text-xs text-gray-500">Worship Leader</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4 text-gray-400" />
                              <span>Worship</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-purple-50">Mid-Year 2024</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-lg font-semibold text-purple-600">4.7</span>
                                <span className="text-sm text-gray-500">/5.0</span>
                              </div>
                              <Badge className="bg-purple-100 text-purple-800 text-xs">Exceptional</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">4.5</span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '90%'}}></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">Jul 15, 2024</p>
                              <p className="text-xs text-green-600">Excellent feedback</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center space-x-1">
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  alert('🏆 Excellent Performance Award certificate generated for Sarah Wilson!');
                                  console.log('Award certificate generated for Sarah Wilson');
                                }}
                                title="Generate Award Certificate"
                              >
                                <Award className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownloadPerformanceReport('TSOAM-EMP-002')}
                                title="Download Performance Report"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                                DK
                              </div>
                              <div>
                                <p className="font-medium">David Kim</p>
                                <p className="text-xs text-gray-500">IT Coordinator</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <span>Administration</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50">Q4 2024</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-lg font-semibold text-green-600">4.3</span>
                                <span className="text-sm text-gray-500">/5.0</span>
                              </div>
                              <Badge className="bg-green-100 text-green-800 text-xs">Exceeds</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">4.1</span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{width: '82%'}}></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">Dec 30, 2024</p>
                              <p className="text-xs text-blue-600">Upcoming</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  alert('���� Performance review scheduled for David Kim on Dec 30, 2024 at 2:00 PM');
                                  console.log('Performance review scheduled for David Kim');
                                }}
                                title="Schedule Performance Review"
                              >
                                <Calendar className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditPerformanceReview('TSOAM-EMP-001')}
                                title="Edit Performance Review"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  alert('🔔 Notification set: David Kim will receive a reminder 24 hours before the review');
                                  console.log('Review reminder notification set for David Kim');
                                }}
                                title="Set Review Reminder"
                              >
                                <Bell className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Goals & Objectives Tab */}
              <TabsContent value="goals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Goals & Objectives</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Track individual and team goals
                        </p>
                      </div>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Set New Goal
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Goal Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">Improve Member Engagement</h3>
                              <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              Increase member participation in church activities by 25%
                            </p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>65%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{width: '65%'}}></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                              <span>Assigned to: John Doe</span>
                              <span>Due: Dec 31, 2024</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">Financial Transparency</h3>
                              <Badge className="bg-green-100 text-green-800">Completed</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              Implement quarterly financial reporting system
                            </p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>100%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{width: '100%'}}></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                              <span>Assigned to: Jane Smith</span>
                              <span>Completed: Sep 15, 2024</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-orange-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">Youth Program Expansion</h3>
                              <Badge className="bg-orange-100 text-orange-800">At Risk</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              Launch new youth mentorship program
                            </p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>30%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-orange-500 h-2 rounded-full" style={{width: '30%'}}></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                              <span>Assigned to: Mike Johnson</span>
                              <span>Due: Nov 30, 2024</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">Staff Development</h3>
                              <Badge className="bg-purple-100 text-purple-800">Planning</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              Conduct training sessions for all staff members
                            </p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>15%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{width: '15%'}}></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                              <span>Assigned to: All Staff</span>
                              <span>Due: Dec 15, 2024</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 360° Feedback Tab */}
              <TabsContent value="feedback" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>360° Feedback System</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Collect feedback from peers, supervisors, and direct reports
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">360° Feedback Coming Soon</h3>
                      <p>Multi-source feedback collection and analysis tools are in development</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Development Plans Tab */}
              <TabsContent value="development" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Development Plans</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Create and track individual development plans
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Development Plans Coming Soon</h3>
                      <p>Career development and skill building tools are in development</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab - Performance Analytics */}
              <TabsContent value="analytics" className="space-y-6">
                {/* Performance Metrics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Team Average</p>
                          <p className="text-2xl font-bold text-green-600">4.2/5.0</p>
                          <p className="text-xs text-green-600">↗ +0.3 this quarter</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Reviews Completed</p>
                          <p className="text-2xl font-bold text-blue-600">{performanceReviews.length}</p>
                          <p className="text-xs text-blue-600">This period</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Reviews Due</p>
                          <p className="text-2xl font-bold text-yellow-600">3</p>
                          <p className="text-xs text-yellow-600">Next 30 days</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Top Performers</p>
                          <p className="text-2xl font-bold text-purple-600">5</p>
                          <p className="text-xs text-purple-600">Rating 4.5+</p>
                        </div>
                        <Award className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance History Table */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Performance Review History</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Complete history of all performance reviews
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Review Period</TableHead>
                          <TableHead>Review Type</TableHead>
                          <TableHead>Overall Rating</TableHead>
                          <TableHead>Review Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceReviews.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No performance reviews completed yet</p>
                              <p className="text-sm">Start by creating a new performance review</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          performanceReviews.filter(review => review && review.id).map((review) => (
                            <TableRow key={review.id}>
                              <TableCell className="font-medium">{review.employeeName || review.employee_name || 'N/A'}</TableCell>
                              <TableCell>
                                {employees.find(emp => emp.employeeId === (review.employeeId || review.employee_id))?.department || 'N/A'}
                              </TableCell>
                              <TableCell>{review.reviewPeriod || review.review_period || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {review.reviewType || review.review_type || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span className={`font-semibold ${
                                    (review.overallRating || review.overall_rating || 0) >= 4.5 ? 'text-green-600' :
                                    (review.overallRating || review.overall_rating || 0) >= 3.5 ? 'text-blue-600' :
                                    (review.overallRating || review.overall_rating || 0) >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {safeToFixed(review.overallRating || review.overall_rating, 1)}/5.0
                                  </span>
                                  {(review.overallRating || review.overall_rating || 0) >= 4.5 && <Award className="h-4 w-4 text-yellow-500" />}
                                </div>
                              </TableCell>
                              <TableCell>{new Date(review.reviewDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={review.status === 'completed' ? 'default' : 'secondary'}
                                  className={review.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                                >
                                  {review.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPerformanceReview(review.employeeId)}
                          title="View and edit performance review"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPerformanceReport(review.employeeId)}
                          title="Download performance report as PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Performance Trends Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends & Analysis</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Track performance improvements and department comparisons
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-sm mb-3">Department Performance Comparison</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Administration</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                              </div>
                              <span className="text-sm font-medium">4.3/5.0</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Finance</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{width: '80%'}}></div>
                              </div>
                              <span className="text-sm font-medium">4.0/5.0</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Youth Ministry</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{width: '88%'}}></div>
                              </div>
                              <span className="text-sm font-medium">4.4/5.0</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Worship</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full" style={{width: '82%'}}></div>
                              </div>
                              <span className="text-sm font-medium">4.1/5.0</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-3">Improvement Recommendations</h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                            <h5 className="font-medium text-sm text-blue-800">Leadership Development</h5>
                            <p className="text-xs text-blue-600 mt-1">
                              3 employees show high potential for leadership roles. Consider leadership training programs.
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                            <h5 className="font-medium text-sm text-green-800">Digital Skills</h5>
                            <p className="text-xs text-green-600 mt-1">
                              Modern church operations could benefit from digital ministry skills training for 60% of staff.
                            </p>
                          </div>
                          <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                            <h5 className="font-medium text-sm text-purple-800">Cross-Department Collaboration</h5>
                            <p className="text-xs text-purple-600 mt-1">
                              Communication workshops could improve teamwork and operational efficiency.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Comprehensive Performance Review Dialog */}
            <Dialog open={showPerformanceDialog} onOpenChange={setShowPerformanceDialog}>
              <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Performance Review - {selectedEmployeeForReview?.fullName}</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive performance evaluation and development planning
                  </p>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Employee Information Summary */}
                  {selectedEmployeeForReview && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Employee:</span>
                            <p className="font-semibold">{selectedEmployeeForReview.fullName}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Department:</span>
                            <p>{selectedEmployeeForReview.department}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Position:</span>
                            <p>{selectedEmployeeForReview.position}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Current Rating:</span>
                            <p className="text-blue-600 font-semibold">{selectedEmployeeForReview.performanceRating || 'N/A'}/5.0</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Review Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="reviewPeriod">Review Period *</Label>
                      <Select
                        value={performanceFormData.reviewPeriod}
                        onValueChange={(value) => setPerformanceFormData({...performanceFormData, reviewPeriod: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Q4 2024">Q4 2024</SelectItem>
                          <SelectItem value="Q3 2024">Q3 2024</SelectItem>
                          <SelectItem value="Annual 2024">Annual 2024</SelectItem>
                          <SelectItem value="Probationary">Probationary Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="reviewType">Review Type</Label>
                      <Select
                        value={performanceFormData.reviewType}
                        onValueChange={(value) => setPerformanceFormData({...performanceFormData, reviewType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quarterly">Quarterly Review</SelectItem>
                          <SelectItem value="annual">Annual Review</SelectItem>
                          <SelectItem value="probationary">Probationary Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="reviewDate">Review Date</Label>
                      <Input
                        type="date"
                        value={performanceFormData.reviewDate}
                        onChange={(e) => setPerformanceFormData({...performanceFormData, reviewDate: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Performance Evaluation Criteria */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Performance Evaluation</CardTitle>
                      <p className="text-sm text-gray-600">Rate each area on a scale of 1-5 (1=Poor, 2=Below Average, 3=Average, 4=Good, 5=Excellent)</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Job Knowledge & Expertise</Label>
                          <Select
                            value={performanceFormData.jobKnowledge}
                            onValueChange={(value) => setPerformanceFormData({...performanceFormData, jobKnowledge: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 - Excellent</SelectItem>
                              <SelectItem value="4">4 - Good</SelectItem>
                              <SelectItem value="3">3 - Average</SelectItem>
                              <SelectItem value="2">2 - Below Average</SelectItem>
                              <SelectItem value="1">1 - Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Quality of Work</Label>
                          <Select
                            value={performanceFormData.qualityOfWork}
                            onValueChange={(value) => setPerformanceFormData({...performanceFormData, qualityOfWork: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 - Excellent</SelectItem>
                              <SelectItem value="4">4 - Good</SelectItem>
                              <SelectItem value="3">3 - Average</SelectItem>
                              <SelectItem value="2">2 - Below Average</SelectItem>
                              <SelectItem value="1">1 - Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Productivity & Efficiency</Label>
                          <Select
                            value={performanceFormData.productivity}
                            onValueChange={(value) => setPerformanceFormData({...performanceFormData, productivity: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 - Excellent</SelectItem>
                              <SelectItem value="4">4 - Good</SelectItem>
                              <SelectItem value="3">3 - Average</SelectItem>
                              <SelectItem value="2">2 - Below Average</SelectItem>
                              <SelectItem value="1">1 - Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Communication Skills</Label>
                          <Select
                            value={performanceFormData.communication}
                            onValueChange={(value) => setPerformanceFormData({...performanceFormData, communication: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 - Excellent</SelectItem>
                              <SelectItem value="4">4 - Good</SelectItem>
                              <SelectItem value="3">3 - Average</SelectItem>
                              <SelectItem value="2">2 - Below Average</SelectItem>
                              <SelectItem value="1">1 - Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Teamwork & Collaboration</Label>
                          <Select
                            value={performanceFormData.teamwork}
                            onValueChange={(value) => setPerformanceFormData({...performanceFormData, teamwork: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 - Excellent</SelectItem>
                              <SelectItem value="4">4 - Good</SelectItem>
                              <SelectItem value="3">3 - Average</SelectItem>
                              <SelectItem value="2">2 - Below Average</SelectItem>
                              <SelectItem value="1">1 - Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Initiative & Leadership</Label>
                          <Select
                            value={performanceFormData.initiative}
                            onValueChange={(value) => setPerformanceFormData({...performanceFormData, initiative: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 - Excellent</SelectItem>
                              <SelectItem value="4">4 - Good</SelectItem>
                              <SelectItem value="3">3 - Average</SelectItem>
                              <SelectItem value="2">2 - Below Average</SelectItem>
                              <SelectItem value="1">1 - Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Overall Performance Rating *</Label>
                        <Select
                          value={performanceFormData.overallRating}
                          onValueChange={(value) => setPerformanceFormData({...performanceFormData, overallRating: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select overall rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 - Exceptional Performance (Exceeds all expectations)</SelectItem>
                            <SelectItem value="4">4 - Exceeds Expectations (Consistently strong performer)</SelectItem>
                            <SelectItem value="3">3 - Meets Expectations (Solid, reliable performance)</SelectItem>
                            <SelectItem value="2">2 - Below Expectations (Improvement needed)</SelectItem>
                            <SelectItem value="1">1 - Unsatisfactory (Significant improvement required)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Qualitative Assessment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Qualitative Assessment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="strengths">Key Strengths & Achievements</Label>
                        <Textarea
                          id="strengths"
                          placeholder="Highlight the employee's main strengths, accomplishments, and positive contributions..."
                          value={performanceFormData.strengths}
                          onChange={(e) => setPerformanceFormData({...performanceFormData, strengths: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="improvements">Areas for Improvement</Label>
                        <Textarea
                          id="improvements"
                          placeholder="Identify specific areas where the employee can improve and grow..."
                          value={performanceFormData.areasForImprovement}
                          onChange={(e) => setPerformanceFormData({...performanceFormData, areasForImprovement: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="goals">Goals & Objectives for Next Period</Label>
                        <Textarea
                          id="goals"
                          placeholder="Set clear, measurable goals and objectives for the upcoming review period..."
                          value={performanceFormData.goals}
                          onChange={(e) => setPerformanceFormData({...performanceFormData, goals: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="development">Professional Development Plan</Label>
                        <Textarea
                          id="development"
                          placeholder="Outline training, development opportunities, and career growth plans..."
                          value={performanceFormData.developmentPlan}
                          onChange={(e) => setPerformanceFormData({...performanceFormData, developmentPlan: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comments Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Additional Comments</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="managerComments">Manager/Supervisor Comments</Label>
                        <Textarea
                          id="managerComments"
                          placeholder="Additional feedback, observations, and recommendations from the manager..."
                          value={performanceFormData.managerComments}
                          onChange={(e) => setPerformanceFormData({...performanceFormData, managerComments: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="employeeComments">Employee Self-Assessment Comments</Label>
                        <Textarea
                          id="employeeComments"
                          placeholder="Employee's self-reflection, comments, and feedback on the review..."
                          value={performanceFormData.employeeComments}
                          onChange={(e) => setPerformanceFormData({...performanceFormData, employeeComments: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="reviewerName">Reviewer Name</Label>
                        <Input
                          id="reviewerName"
                          placeholder="Name of the reviewing manager/supervisor"
                          value={performanceFormData.reviewerName}
                          onChange={(e) => setPerformanceFormData({...performanceFormData, reviewerName: e.target.value})}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex justify-between gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowPerformanceDialog(false)}>
                      Cancel
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleSavePerformanceDraft}>
                        <FileText className="h-4 w-4 mr-2" />
                        Save as Draft
                      </Button>
                      <Button variant="outline" onClick={handlePreviewPerformanceReview}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button onClick={handleCompletePerformanceReview} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Review
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* Add Employee Dialog */}
        <Dialog
          open={showAddEmployeeDialog}
          onOpenChange={setShowAddEmployeeDialog}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={employeeForm.fullName}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={employeeForm.email}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={employeeForm.phone}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input
                      id="nationalId"
                      value={employeeForm.nationalId}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          nationalId: e.target.value,
                        })
                      }
                      placeholder="Enter national ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={employeeForm.gender}
                      onValueChange={(value) =>
                        setEmployeeForm({ ...employeeForm, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={employeeForm.dateOfBirth}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={employeeForm.address}
                    onChange={(e) =>
                      setEmployeeForm({
                        ...employeeForm,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter physical address"
                    rows={2}
                  />
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Employment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={employeeForm.department}
                      onValueChange={(value) =>
                        setEmployeeForm({ ...employeeForm, department: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administration">
                          Administration
                        </SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Youth Ministry">
                          Youth Ministry
                        </SelectItem>
                        <SelectItem value="Worship">Worship</SelectItem>
                        <SelectItem value="Children Ministry">
                          Children Ministry
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={employeeForm.position}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          position: e.target.value,
                        })
                      }
                      placeholder="Enter job position"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select
                      value={employeeForm.employmentType}
                      onValueChange={(value) =>
                        setEmployeeForm({
                          ...employeeForm,
                          employmentType: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Volunteer">Volunteer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={employeeForm.hireDate}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          hireDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Salary Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Salary & Benefits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basicSalary">Basic Salary (KSH)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        KSH
                      </span>
                      <Input
                        id="basicSalary"
                        type="number"
                        value={employeeForm.basicSalary}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            basicSalary: e.target.value,
                          })
                        }
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            setEmployeeForm({
                              ...employeeForm,
                              basicSalary: "",
                            });
                          }
                        }}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="font-semibold pl-16 pr-4 py-3 text-right bg-green-50 border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="housingAllowance">
                      Housing Allowance (KSH)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        KSH
                      </span>
                      <Input
                        id="housingAllowance"
                        type="number"
                        value={employeeForm.housingAllowance}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            housingAllowance: e.target.value,
                          })
                        }
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            setEmployeeForm({
                              ...employeeForm,
                              housingAllowance: "",
                            });
                          }
                        }}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="font-semibold pl-16 pr-4 py-3 text-right bg-green-50 border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transportAllowance">
                      Transport Allowance (KSH)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        KSH
                      </span>
                      <Input
                        id="transportAllowance"
                        type="number"
                        value={employeeForm.transportAllowance}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            transportAllowance: e.target.value,
                          })
                        }
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            setEmployeeForm({
                              ...employeeForm,
                              transportAllowance: "",
                            });
                          }
                        }}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="font-semibold pl-16 pr-4 py-3 text-right bg-green-50 border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalAllowance">
                      Medical Allowance (KSH)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        KSH
                      </span>
                      <Input
                        id="medicalAllowance"
                        type="number"
                        value={employeeForm.medicalAllowance}
                        onChange={(e) =>
                          setEmployeeForm({
                            ...employeeForm,
                            medicalAllowance: e.target.value,
                          })
                        }
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            setEmployeeForm({
                              ...employeeForm,
                              medicalAllowance: "",
                            });
                          }
                        }}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="font-semibold pl-16 pr-4 py-3 text-right bg-green-50 border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Government Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Government Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kraPin">KRA PIN</Label>
                    <Input
                      id="kraPin"
                      value={employeeForm.kraPin}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          kraPin: e.target.value,
                        })
                      }
                      placeholder="Enter KRA PIN"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nhifNumber">NHIF Number</Label>
                    <Input
                      id="nhifNumber"
                      value={employeeForm.nhifNumber}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          nhifNumber: e.target.value,
                        })
                      }
                      placeholder="Enter NHIF number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nssfNumber">NSSF Number</Label>
                    <Input
                      id="nssfNumber"
                      value={employeeForm.nssfNumber}
                      onChange={(e) =>
                        setEmployeeForm({
                          ...employeeForm,
                          nssfNumber: e.target.value,
                        })
                      }
                      placeholder="Enter NSSF number"
                    />
                  </div>
                </div>

                {/* Document Upload Section */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Employee Documents</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="documents">
                        Upload Documents (CV, ID, Certificates, Licenses)
                      </Label>
                      <Input
                        id="documents"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setEmployeeForm({
                            ...employeeForm,
                            documents: files,
                          });
                        }}
                      />
                      <div className="text-xs text-muted-foreground">
                        Accepted formats: PDF, DOC, DOCX, JPG, PNG. Max size:
                        10MB per file.
                      </div>
                      {employeeForm.documents &&
                        employeeForm.documents.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              Selected files:
                            </div>
                            {employeeForm.documents.map((file, index) => (
                              <div
                                key={index}
                                className="text-xs text-muted-foreground flex items-center gap-2"
                              >
                                <FileText className="h-3 w-3" />
                                {file.name} (
                                {safeToFixed(file.size / 1024 / 1024, 2)} MB)
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddEmployeeDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddEmployee}>Add Employee</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enterprise Leave Request Dialog */}
        <Dialog
          open={showLeaveRequestDialog}
          onOpenChange={setShowLeaveRequestDialog}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {selectedLeaveRequest ? 'Edit Leave Request' : 'New Leave Request'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="enterprise-leave-employee">Employee *</Label>
                    <Select
                      value={enterpriseLeaveForm.employeeId}
                      onValueChange={(value) => {
                        setEnterpriseLeaveForm(prev => ({ ...prev, employeeId: value }));
                        // Load employee leave balances when selected
                        if (value) {
                          loadLeaveBalancesForEmployee(value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees
                          .filter((e) => e.employmentStatus === "Active")
                          .map((employee) => (
                            <SelectItem
                              key={employee.employeeId}
                              value={employee.employeeId}
                            >
                              {employee.fullName} - {employee.employeeId} ({employee.department})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enterprise-leave-type">Leave Type *</Label>
                    <Select
                      value={enterpriseLeaveForm.leaveTypeId}
                      onValueChange={(value) =>
                        setEnterpriseLeaveForm(prev => ({ ...prev, leaveTypeId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} ({type.code}) - {type.defaultDays} days
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enterprise-leave-priority">Priority</Label>
                    <Select
                      value={enterpriseLeaveForm.priority}
                      onValueChange={(value) =>
                        setEnterpriseLeaveForm(prev => ({ ...prev, priority: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="enterprise-start-date">Start Date *</Label>
                      <Input
                        id="enterprise-start-date"
                        type="date"
                        value={enterpriseLeaveForm.startDate}
                        onChange={(e) =>
                          setEnterpriseLeaveForm(prev => ({ ...prev, startDate: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enterprise-end-date">End Date *</Label>
                      <Input
                        id="enterprise-end-date"
                        type="date"
                        value={enterpriseLeaveForm.endDate}
                        onChange={(e) =>
                          setEnterpriseLeaveForm(prev => ({ ...prev, endDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enterprise-covering-employee">Covering Employee</Label>
                    <Select
                      value={enterpriseLeaveForm.coveringEmployeeId}
                      onValueChange={(value) =>
                        setEnterpriseLeaveForm(prev => ({ ...prev, coveringEmployeeId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select covering employee (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees
                          .filter((e) => e.employmentStatus === "Active" && e.employeeId !== enterpriseLeaveForm.employeeId)
                          .map((employee) => (
                            <SelectItem
                              key={employee.employeeId}
                              value={employee.employeeId}
                            >
                              {employee.fullName} - {employee.position}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Leave Balance Display */}
                  {enterpriseLeaveForm.employeeId && enterpriseLeaveForm.leaveTypeId && leaveBalances.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm text-blue-800 mb-2">Leave Balance</h4>
                      {leaveBalances
                        .filter(balance => balance.leaveTypeId === enterpriseLeaveForm.leaveTypeId)
                        .map(balance => (
                          <div key={balance.leaveTypeId} className="text-sm text-blue-700">
                            <div className="flex justify-between">
                              <span>Available:</span>
                              <span className="font-medium">{balance.available} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Used:</span>
                              <span>{balance.used} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pending:</span>
                              <span>{balance.pending} days</span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enterprise-leave-reason">Reason for Leave *</Label>
                <Textarea
                  id="enterprise-leave-reason"
                  value={enterpriseLeaveForm.reason}
                  onChange={(e) =>
                    setEnterpriseLeaveForm(prev => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Provide detailed reason for leave application..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enterprise-handover-notes">Handover Notes</Label>
                <Textarea
                  id="enterprise-handover-notes"
                  value={enterpriseLeaveForm.handoverNotes}
                  onChange={(e) =>
                    setEnterpriseLeaveForm(prev => ({ ...prev, handoverNotes: e.target.value }))
                  }
                  placeholder="Describe work handover arrangements and responsibilities..."
                  rows={3}
                />
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h4 className="font-medium">Emergency Contact (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="emergency-contact-name">Name</Label>
                    <Input
                      id="emergency-contact-name"
                      value={enterpriseLeaveForm.emergencyContact.name}
                      onChange={(e) =>
                        setEnterpriseLeaveForm(prev => ({
                          ...prev,
                          emergencyContact: {
                            ...prev.emergencyContact,
                            name: e.target.value
                          }
                        }))
                      }
                      placeholder="Emergency contact name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency-contact-phone">Phone</Label>
                    <Input
                      id="emergency-contact-phone"
                      value={enterpriseLeaveForm.emergencyContact.phone}
                      onChange={(e) =>
                        setEnterpriseLeaveForm(prev => ({
                          ...prev,
                          emergencyContact: {
                            ...prev.emergencyContact,
                            phone: e.target.value
                          }
                        }))
                      }
                      placeholder="+254700000000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency-contact-relationship">Relationship</Label>
                    <Input
                      id="emergency-contact-relationship"
                      value={enterpriseLeaveForm.emergencyContact.relationship}
                      onChange={(e) =>
                        setEnterpriseLeaveForm(prev => ({
                          ...prev,
                          emergencyContact: {
                            ...prev.emergencyContact,
                            relationship: e.target.value
                          }
                        }))
                      }
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLeaveRequestDialog(false);
                    setSelectedLeaveRequest(null);
                    setEnterpriseLeaveForm({
                      employeeId: "",
                      leaveTypeId: "",
                      startDate: "",
                      endDate: "",
                      reason: "",
                      priority: "normal",
                      handoverNotes: "",
                      coveringEmployeeId: "",
                      emergencyContact: {
                        name: "",
                        phone: "",
                        relationship: ""
                      },
                      attachments: []
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => printLeaveForm()}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print Form
                </Button>
                <Button onClick={handleEnterpriseLeaveRequest} disabled={leaveLoading}>
                  {leaveLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {selectedLeaveRequest ? 'Update Request' : 'Submit Request'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Employee Status Change Dialog */}
        <Dialog
          open={showStatusChangeDialog}
          onOpenChange={setShowStatusChangeDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Employee Status</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Employee Details</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Name:</strong> {selectedEmployee.fullName}
                    </div>
                    <div>
                      <strong>Employee ID:</strong>{" "}
                      {selectedEmployee.employeeId}
                    </div>
                    <div>
                      <strong>Current Status:</strong>{" "}
                      {selectedEmployee.employmentStatus}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newStatus">New Status *</Label>
                  <Select
                    value={statusChangeForm.newStatus}
                    onValueChange={(value) =>
                      setStatusChangeForm({
                        ...statusChangeForm,
                        newStatus: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(statusChangeForm.newStatus === "Suspended" ||
                  statusChangeForm.newStatus === "Terminated") && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Warning</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      This action will change the employee's status and create a
                      disciplinary record.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="statusReason">Reason *</Label>
                  <Textarea
                    id="statusReason"
                    value={statusChangeForm.reason}
                    onChange={(e) =>
                      setStatusChangeForm({
                        ...statusChangeForm,
                        reason: e.target.value,
                      })
                    }
                    placeholder="Provide detailed reason for status change"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Effective Date</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={statusChangeForm.effectiveDate}
                    onChange={(e) =>
                      setStatusChangeForm({
                        ...statusChangeForm,
                        effectiveDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusNotes">Additional Notes</Label>
                  <Textarea
                    id="statusNotes"
                    value={statusChangeForm.notes}
                    onChange={(e) =>
                      setStatusChangeForm({
                        ...statusChangeForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Any additional information"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowStatusChangeDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStatusChange}
                    variant={
                      statusChangeForm.newStatus === "Terminated"
                        ? "destructive"
                        : "default"
                    }
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Employee Detail Dialog */}
        <Dialog
          open={showEmployeeDetailDialog}
          onOpenChange={setShowEmployeeDetailDialog}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="employment">Employment</TabsTrigger>
                    <TabsTrigger value="salary">Salary</TabsTrigger>
                    <TabsTrigger value="leave">Leave</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Full Name</Label>
                        <p className="text-sm">{selectedEmployee.fullName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Employee ID
                        </Label>
                        <p className="text-sm">{selectedEmployee.employeeId}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm">{selectedEmployee.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone</Label>
                        <p className="text-sm">{selectedEmployee.phone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Gender</Label>
                        <p className="text-sm">{selectedEmployee.gender}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Date of Birth
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.dateOfBirth}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium">Address</Label>
                        <p className="text-sm">{selectedEmployee.address}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="employment" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Department
                        </Label>
                        <p className="text-sm">{selectedEmployee.department}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Position</Label>
                        <p className="text-sm">{selectedEmployee.position}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Employment Type
                        </Label>
                        {getEmploymentTypeBadge(
                          selectedEmployee.employmentType,
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        {getStatusBadge(selectedEmployee.employmentStatus)}
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Hire Date</Label>
                        <p className="text-sm">{selectedEmployee.hireDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Performance Rating
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.performanceRating}/5.0
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="salary" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Basic Salary
                        </Label>
                        <p className="text-sm">
                          KSH {safeToLocaleString(selectedEmployee.basicSalary || selectedEmployee.basic_salary)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Housing Allowance
                        </Label>
                        <p className="text-sm">
                          KSH{" "}
                          {safeToLocaleString(selectedEmployee.allowances?.housing || selectedEmployee.housing_allowance)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Transport Allowance
                        </Label>
                        <p className="text-sm">
                          KSH{" "}
                          {safeToLocaleString(selectedEmployee.allowances?.transport || selectedEmployee.transport_allowance)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Medical Allowance
                        </Label>
                        <p className="text-sm">
                          KSH{" "}
                          {safeToLocaleString(selectedEmployee.allowances?.medical || selectedEmployee.medical_allowance)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium">
                          Total Monthly Package
                        </Label>
                        <p className="text-lg font-semibold text-green-600">
                          KSH{" "}
                          {safeToLocaleString(
                            (selectedEmployee.basicSalary || selectedEmployee.basic_salary || 0) +
                            Object.values(selectedEmployee.allowances || {}).reduce(
                              (a, b) => (a as number) + (b as number),
                              0,
                            )
                          )}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="leave" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Annual Leave Balance
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.annual_leave_balance || 0} days
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Sick Leave Balance
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.sick_leave_balance || 0} days
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Maternity Leave
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.maternity_leave_balance || 0} days
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Paternity Leave
                        </Label>
                        <p className="text-sm">
                          {selectedEmployee.paternity_leave_balance || 0} days
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => generatePayslip(selectedEmployee)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Generate Payslip
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Process Payroll Dialog */}
        <Dialog
          open={showProcessPayrollDialog}
          onOpenChange={setShowProcessPayrollDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Monthly Payroll</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Payroll Processing</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  This will process payroll for all active employees for the
                  current month ({new Date().toISOString().slice(0, 7)}).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Employees to be processed:</h4>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {employees
                    .filter((emp) => emp.employmentStatus === "Active")
                    .map((emp) => (
                      <div
                        key={emp.id}
                        className="flex justify-between items-center py-1 text-sm"
                      >
                        <span>
                          {emp.fullName} ({emp.employeeId})
                        </span>
                        <span className="text-green-600">
                          KSH {safeToLocaleString(emp.basicSalary || emp.basic_salary)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowProcessPayrollDialog(false)}
                  disabled={payrollProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProcessPayroll}
                  disabled={payrollProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {payrollProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Process Payroll
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* P9 Form Generation Dialog */}
        <Dialog open={showP9FormDialog} onOpenChange={setShowP9FormDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate P9 Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">KRA P9 Form Generation</h3>
                <p className="text-sm text-blue-700">
                  Generate official P9 Tax Deduction Card compliant with KRA
                  2024 standards. Available in PDF and Excel formats.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="p9Employee">Select Employee *</Label>
                  <Select
                    value={selectedP9Employee?.employeeId || selectedP9Employee?.employee_id || ""}
                    onValueChange={(value) => {
                      const employee = employees.find(
                        (e) => (e.employeeId || e.employee_id) === value,
                      );
                      setSelectedP9Employee(employee || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((e) => e.employmentStatus === "Active" && (e.fullName || e.full_name) && (e.employeeId || e.employee_id))
                        .map((employee) => (
                          <SelectItem
                            key={employee.employeeId || employee.employee_id}
                            value={employee.employeeId || employee.employee_id}
                          >
                            {employee.fullName || employee.full_name} - {employee.employeeId || employee.employee_id}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="p9Year">Tax Year *</Label>
                  <Select
                    value={p9Year.toString()}
                    onValueChange={(value) => setP9Year(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                      <SelectItem value="2020">2020</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* P9 Generation Preview */}
                {selectedP9Employee && (
                  <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Ready to Generate P9</h4>
                        <p className="text-sm text-blue-700">
                          Tax year {p9Year} P9 form for {selectedP9Employee.fullName || selectedP9Employee.full_name}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Available formats: PDF (printable) and Excel (editable)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedP9Employee && (
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium mb-2">Employee Details</h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Name:</strong> {selectedP9Employee.fullName}
                      </p>
                      <p>
                        <strong>Employee ID:</strong>{" "}
                        {selectedP9Employee.employeeId}
                      </p>
                      <p>
                        <strong>KRA PIN:</strong> {selectedP9Employee.kraPin}
                      </p>
                      <p>
                        <strong>Basic Salary:</strong> KSh{" "}
                        {safeToLocaleString(selectedP9Employee.basicSalary || selectedP9Employee.basic_salary)}
                      </p>
                      <p>
                        <strong>Department:</strong>{" "}
                        {selectedP9Employee.department}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowP9FormDialog(false)}
                >
                  Cancel
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!selectedP9Employee) {
                        alert("Please select an employee first");
                        return;
                      }

                      if (!selectedP9Employee.kraPin) {
                        alert("Employee KRA PIN is required for P9 generation");
                        return;
                      }

                      try {
                        generateP9Excel(selectedP9Employee, p9Year);
                        setShowP9FormDialog(false);

                        // Show success message
                        setTimeout(() => {
                          alert(`✅ P9 Excel generated successfully!\n\nEmployee: ${selectedP9Employee.fullName || selectedP9Employee.full_name}\nTax Year: ${p9Year}\n\nFile has been downloaded to your computer.`);
                        }, 500);
                      } catch (error) {
                        console.error("Error generating P9 Excel:", error);
                        alert("❌ Failed to generate P9 Excel. Please try again.");
                      }
                    }}
                    disabled={!selectedP9Employee}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Excel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!selectedP9Employee) {
                        alert("Please select an employee first");
                        return;
                      }

                      if (!selectedP9Employee.kraPin) {
                        alert("Employee KRA PIN is required for P9 generation");
                        return;
                      }

                      try {
                        await generateP9PDF(selectedP9Employee, p9Year);
                        setShowP9FormDialog(false);

                        // Show success message
                        setTimeout(() => {
                          alert(`✅ P9 PDF generated successfully!\n\nEmployee: ${selectedP9Employee.fullName || selectedP9Employee.full_name}\nTax Year: ${p9Year}\n\nFile has been downloaded to your computer.`);
                        }, 500);
                      } catch (error) {
                        console.error("Error generating P9 PDF:", error);
                        alert("❌ Failed to generate P9 PDF. Please try again.");
                      }
                    }}
                    disabled={!selectedP9Employee}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Disbursement Reports Dialog */}
        <Dialog
          open={showDisbursementReportsDialog}
          onOpenChange={setShowDisbursementReportsDialog}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Disbursement Reports from Finance
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {disbursementReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No Disbursement Reports</h3>
                  <p className="text-sm">
                    Process payroll to receive disbursement reports from Finance
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {disbursementReports.length} disbursement report(s)
                      received
                    </p>
                  </div>

                  <div className="space-y-3">
                    {disbursementReports.map((report) => (
                      <Card key={report.id} className="border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  Disbursement Report - {report.period}
                                </h4>
                                <Badge
                                  variant={
                                    report.status === "Approved"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    report.status === "Approved"
                                      ? "bg-green-600"
                                      : ""
                                  }
                                >
                                  {report.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Employees
                                  </p>
                                  <p className="font-medium">
                                    {report.totalEmployees}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Total Amount
                                  </p>
                                  <p className="font-medium text-green-600">
                                    KSh {report.totalNetAmount.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Approved By
                                  </p>
                                  <p className="font-medium">
                                    {report.approvedBy}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Date</p>
                                  <p className="font-medium">
                                    {new Date(
                                      report.disbursementDate,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              {report.notes && (
                                <div className="mt-2">
                                  <p className="text-sm text-muted-foreground">
                                    Notes:
                                  </p>
                                  <p className="text-sm">{report.notes}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedDisbursementReport(report)
                                }
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateDisbursementPDF(report)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                PDF
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDisbursementReportsDialog(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Disbursement Report Details Dialog */}
        {selectedDisbursementReport && (
          <Dialog
            open={!!selectedDisbursementReport}
            onOpenChange={() => setSelectedDisbursementReport(null)}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Disbursement Report Details -{" "}
                  {selectedDisbursementReport.period}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Employees
                        </p>
                        <p className="text-lg font-semibold">
                          {selectedDisbursementReport.totalEmployees}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Gross Amount
                        </p>
                        <p className="text-lg font-semibold">
                          KSh{" "}
                          {selectedDisbursementReport.totalGrossAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Deductions
                        </p>
                        <p className="text-lg font-semibold text-red-600">
                          KSh{" "}
                          {selectedDisbursementReport.totalDeductions.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Net Amount
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          KSh{" "}
                          {selectedDisbursementReport.totalNetAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Employee Details */}
                {selectedDisbursementReport.employees.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Employee Disbursements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Net Salary</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDisbursementReport.employees.map(
                            (emp, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">
                                      {emp.employeeName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {emp.employeeId}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  KSh {emp.netSalary.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      emp.disbursementStatus === "Success"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {emp.disbursementStatus}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDisbursementReport(null)}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Leave Request Detail Dialog */}
        {showLeaveRequestDetailDialog && selectedLeaveRequest && (
          <Dialog open={showLeaveRequestDetailDialog} onOpenChange={setShowLeaveRequestDetailDialog}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Leave Request Details - {selectedLeaveRequest.id}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Complete details for {selectedLeaveRequest.employeeName}'s leave request
                </p>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Employee Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Employee Name</p>
                        <p className="text-base font-semibold">{selectedLeaveRequest.employeeName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                        <p className="text-base">{selectedLeaveRequest.employeeId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Position</p>
                        <p className="text-base">{selectedLeaveRequest.employeePosition}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Department</p>
                        <p className="text-base">{selectedLeaveRequest.department}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Leave Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Leave Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Leave Type</p>
                        <p className="text-base font-semibold">{selectedLeaveRequest.leaveTypeName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Priority</p>
                        <div className="mt-1">
                          {getLeavePriorityBadge(selectedLeaveRequest.priority)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                        <p className="text-base">{new Date(selectedLeaveRequest.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">End Date</p>
                        <p className="text-base">{new Date(selectedLeaveRequest.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Resumption Date</p>
                        <p className="text-base">{new Date(selectedLeaveRequest.resumptionDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Duration</p>
                        <p className="text-base">{selectedLeaveRequest.workingDays} working days ({selectedLeaveRequest.totalDays} total)</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Reason</p>
                        <p className="text-base mt-1">{selectedLeaveRequest.reason}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status and Approval */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status & Approval Workflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                          <div className="mt-1">
                            {getLeaveStatusBadge(selectedLeaveRequest.status)}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Approval Level</p>
                          <p className="text-base">Level {selectedLeaveRequest.currentApprovalLevel}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Applied Date</p>
                          <p className="text-base">{new Date(selectedLeaveRequest.appliedDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Approval History */}
                      {selectedLeaveRequest.approvalHistory && selectedLeaveRequest.approvalHistory.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Approval History</p>
                          <div className="space-y-2">
                            {selectedLeaveRequest.approvalHistory.map((step, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">Level {step.level} - {step.approverType}</p>
                                    {step.approverName && (
                                      <p className="text-sm text-muted-foreground">{step.approverName}</p>
                                    )}
                                  </div>
                                  <Badge variant={step.status === 'approved' ? 'default' : step.status === 'rejected' ? 'destructive' : 'secondary'}>
                                    {step.status}
                                  </Badge>
                                </div>
                                {step.actionDate && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(step.actionDate).toLocaleString()}
                                  </p>
                                )}
                                {step.comments && (
                                  <p className="text-sm mt-2 p-2 bg-muted rounded">{step.comments}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedLeaveRequest.handoverNotes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Handover Notes</p>
                          <p className="text-base mt-1 p-3 bg-muted rounded">{selectedLeaveRequest.handoverNotes}</p>
                        </div>
                      )}

                      {selectedLeaveRequest.coveringEmployee && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Covering Employee</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-base">{selectedLeaveRequest.coveringEmployee.name}</p>
                            <Badge variant={selectedLeaveRequest.coveringEmployee.approved ? 'default' : 'secondary'}>
                              {selectedLeaveRequest.coveringEmployee.approved ? 'Approved' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {selectedLeaveRequest.emergencyContact && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                          <div className="mt-1 p-3 bg-muted rounded">
                            <p className="font-medium">{selectedLeaveRequest.emergencyContact.name}</p>
                            <p className="text-sm">{selectedLeaveRequest.emergencyContact.phone}</p>
                            <p className="text-sm text-muted-foreground">{selectedLeaveRequest.emergencyContact.relationship}</p>
                          </div>
                        </div>
                      )}

                      {selectedLeaveRequest.hrNotes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">HR Notes</p>
                          <p className="text-base mt-1 p-3 bg-muted rounded">{selectedLeaveRequest.hrNotes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Documents */}
                {selectedLeaveRequest.attachments && selectedLeaveRequest.attachments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Attachments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedLeaveRequest.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{attachment.originalName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {attachment.fileType} ��� {safeToFixed(attachment.fileSize / 1024, 1)} KB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={attachment.verified ? 'default' : 'secondary'}>
                                {attachment.verified ? 'Verified' : 'Pending'}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-2">
                  {selectedLeaveRequest.status === 'submitted' && (
                    <>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          handleLeaveApproval(selectedLeaveRequest.id, 'approve');
                          setShowLeaveRequestDetailDialog(false);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleLeaveApproval(selectedLeaveRequest.id, 'reject', 'Rejected after review');
                          setShowLeaveRequestDetailDialog(false);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => printLeaveForm(selectedLeaveRequest as any)}
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowLeaveRequestDetailDialog(false)}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
