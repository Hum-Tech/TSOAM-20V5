/**
 * TSOAM Role-Based Access Control Service
 * Manages user permissions and data access based on roles
 */

export type UserRole = 'admin' | 'pastor' | 'hr' | 'finance' | 'user';

export interface UserPermissions {
  canAccessDashboard: boolean;
  canAccessFullDashboard: boolean;
  canAccessHR: boolean;
  canAccessFinance: boolean;
  canAccessEvents: boolean;
  canAccessMembers: boolean;
  canAccessNewMembers: boolean;
  canAccessInventory: boolean;
  canAccessWelfare: boolean;
  canAccessMessaging: boolean;
  canAccessAppointments: boolean;
  canAccessAllAppointments: boolean;
  canAccessSystemLogs: boolean;
  canAccessSettings: boolean;
  canAccessUsers: boolean;
  canExportData: boolean;
  canDeleteData: boolean;
  canApprovePayroll: boolean;
  canProcessPayroll: boolean;
  canViewSalaries: boolean;
  canViewFinancialReports: boolean;
  canManageEmployees: boolean;
  dashboardSections: string[];
}

export interface SecurityContext {
  userId: string;
  role: UserRole;
  permissions: UserPermissions;
  restrictedData: {
    hideFinancialAmounts: boolean;
    hideSalaryDetails: boolean;
    hidePersonalData: boolean;
    showOnlyOwnData: boolean;
  };
}

class RoleBasedAccessService {
  private static instance: RoleBasedAccessService;
  private currentUser: SecurityContext | null = null;

  private constructor() {
    this.loadCurrentUser();
  }

  public static getInstance(): RoleBasedAccessService {
    if (!RoleBasedAccessService.instance) {
      RoleBasedAccessService.instance = new RoleBasedAccessService();
    }
    return RoleBasedAccessService.instance;
  }

  /**
   * Set current user context
   */
  public setCurrentUser(userId: string, role: UserRole): void {
    this.currentUser = {
      userId,
      role,
      permissions: this.getPermissions(role),
      restrictedData: this.getDataRestrictions(role)
    };

    // Save to localStorage for persistence
    localStorage.setItem('user_security_context', JSON.stringify(this.currentUser));
  }

  /**
   * Get current user context
   */
  public getCurrentUser(): SecurityContext | null {
    return this.currentUser;
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(permission: keyof UserPermissions): boolean {
    return this.currentUser?.permissions[permission] ?? false;
  }

  /**
   * Get user role
   */
  public getUserRole(): UserRole | null {
    return this.currentUser?.role ?? null;
  }

  /**
   * Check if data should be hidden based on user role
   */
  public shouldHideData(dataType: keyof SecurityContext['restrictedData']): boolean {
    return this.currentUser?.restrictedData[dataType] ?? true;
  }

  /**
   * Filter dashboard data based on role
   */
  public filterDashboardData(data: any): any {
    if (!this.currentUser) return {};

    const role = this.currentUser.role;
    const filtered: any = {};

    switch (role) {
      case 'admin':
      case 'pastor':
        // Full access to all dashboard data
        return data;

      case 'hr':
        // HR sees relevant HR and employee data
        return {
          totalEmployees: data.totalEmployees,
          activeEmployees: data.activeEmployees,
          pendingLeaves: data.pendingLeaves,
          upcomingEvents: data.upcomingEvents,
          recentActivities: data.recentActivities?.filter((activity: any) =>
            ['HR', 'Events', 'Welfare'].includes(activity.module)
          ),
          systemHealth: data.systemHealth,
          // Hide financial totals
          totalRevenue: null,
          totalExpenses: null,
          monthlyGrowth: null
        };

      case 'finance':
        // Finance sees financial and relevant operational data
        return {
          totalRevenue: data.totalRevenue,
          totalExpenses: data.totalExpenses,
          monthlyGrowth: data.monthlyGrowth,
          upcomingEvents: data.upcomingEvents,
          recentActivities: data.recentActivities?.filter((activity: any) =>
            ['Finance', 'Events', 'Inventory'].includes(activity.module)
          ),
          systemHealth: data.systemHealth,
          // Hide HR specifics
          totalEmployees: null,
          pendingLeaves: null
        };

      case 'user':
        // Regular users see minimal dashboard data
        return {
          upcomingEvents: data.upcomingEvents,
          recentActivities: data.recentActivities?.filter((activity: any) =>
            ['Events', 'Members'].includes(activity.module)
          ),
          // Hide all sensitive data
          totalEmployees: null,
          totalRevenue: null,
          totalExpenses: null,
          monthlyGrowth: null,
          pendingLeaves: null
        };

      default:
        return {};
    }
  }

  /**
   * Filter appointment data based on role
   */
  public filterAppointmentData(appointments: any[], currentUserId: string): any[] {
    if (!this.currentUser) return [];

    const role = this.currentUser.role;

    switch (role) {
      case 'admin':
      case 'pastor':
        // Full access to all appointments
        return appointments;

      case 'hr':
      case 'finance':
      case 'user':
        // Only see their own appointments
        return appointments.filter(apt =>
          apt.createdBy === currentUserId ||
          apt.assignedTo === currentUserId ||
          apt.attendees?.includes(currentUserId)
        );

      default:
        return [];
    }
  }

  /**
   * Get navigation items based on role
   */
  public getNavigationItems(): string[] {
    if (!this.currentUser) return [];

    const role = this.currentUser.role;

    switch (role) {
      case 'admin':
        return [
          'Dashboard', 'Members', 'NewMembers', 'Events', 'HR', 'Finance',
          'Inventory', 'Welfare', 'Messaging', 'Appointments', 'Settings',
          'Users', 'SystemLogs'
        ];

      case 'pastor':
        return [
          'Dashboard', 'Members', 'NewMembers', 'Events', 'HR', 'Finance',
          'Inventory', 'Welfare', 'Messaging', 'Appointments'
        ];

      case 'hr':
        return [
          'Dashboard', 'HR', 'Events', 'Messaging', 'Appointments',
          'Welfare', 'Inventory', 'Settings'
        ];

      case 'finance':
        return [
          'Dashboard', 'Finance', 'Inventory', 'Events', 'Settings'
        ];

      case 'user':
        return [
          'Dashboard', 'Members', 'NewMembers', 'Events', 'Inventory', 'Welfare'
        ];

      default:
        return ['Dashboard'];
    }
  }

  /**
   * Sanitize financial data based on role
   */
  public sanitizeFinancialData(data: any): any {
    if (!this.currentUser) return null;

    if (this.shouldHideData('hideFinancialAmounts')) {
      if (typeof data === 'object' && data !== null) {
        const sanitized = { ...data };
        // Remove financial amounts
        delete sanitized.amount;
        delete sanitized.totalAmount;
        delete sanitized.netSalary;
        delete sanitized.grossSalary;
        delete sanitized.basicSalary;
        return sanitized;
      }
      return null;
    }

    return data;
  }

  // Private helper methods
  private loadCurrentUser(): void {
    try {
      const saved = localStorage.getItem('user_security_context');
      if (saved) {
        this.currentUser = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load user security context:', error);
      this.currentUser = null;
    }
  }

  private getPermissions(role: UserRole): UserPermissions {
    const basePermissions: UserPermissions = {
      canAccessDashboard: false,
      canAccessFullDashboard: false,
      canAccessHR: false,
      canAccessFinance: false,
      canAccessEvents: false,
      canAccessMembers: false,
      canAccessNewMembers: false,
      canAccessInventory: false,
      canAccessWelfare: false,
      canAccessMessaging: false,
      canAccessAppointments: false,
      canAccessAllAppointments: false,
      canAccessSystemLogs: false,
      canAccessSettings: false,
      canAccessUsers: false,
      canExportData: false,
      canDeleteData: false,
      canApprovePayroll: false,
      canProcessPayroll: false,
      canViewSalaries: false,
      canViewFinancialReports: false,
      canManageEmployees: false,
      dashboardSections: []
    };

    switch (role) {
      case 'admin':
        return {
          ...basePermissions,
          canAccessDashboard: true,
          canAccessFullDashboard: true,
          canAccessHR: true,
          canAccessFinance: true,
          canAccessEvents: true,
          canAccessMembers: true,
          canAccessNewMembers: true,
          canAccessInventory: true,
          canAccessWelfare: true,
          canAccessMessaging: true,
          canAccessAppointments: true,
          canAccessAllAppointments: true,
          canAccessSystemLogs: true,
          canAccessSettings: true,
          canAccessUsers: true,
          canExportData: true,
          canDeleteData: true,
          canApprovePayroll: true,
          canProcessPayroll: true,
          canViewSalaries: true,
          canViewFinancialReports: true,
          canManageEmployees: true,
          dashboardSections: ['all']
        };

      case 'pastor':
        return {
          ...basePermissions,
          canAccessDashboard: true,
          canAccessFullDashboard: true,
          canAccessHR: true,
          canAccessFinance: true,
          canAccessEvents: true,
          canAccessMembers: true,
          canAccessNewMembers: true,
          canAccessInventory: true,
          canAccessWelfare: true,
          canAccessMessaging: true,
          canAccessAppointments: true,
          canAccessAllAppointments: true,
          canExportData: true,
          canViewSalaries: true,
          canViewFinancialReports: true,
          canManageEmployees: true,
          dashboardSections: ['all']
        };

      case 'hr':
        return {
          ...basePermissions,
          canAccessDashboard: true,
          canAccessHR: true,
          canAccessEvents: true,
          canAccessMessaging: true,
          canAccessAppointments: true,
          canAccessWelfare: true,
          canAccessInventory: true,
          canAccessSettings: true,
          canProcessPayroll: true,
          canViewSalaries: true,
          canManageEmployees: true,
          canExportData: true,
          dashboardSections: ['employees', 'events', 'welfare']
        };

      case 'finance':
        return {
          ...basePermissions,
          canAccessDashboard: true,
          canAccessFinance: true,
          canAccessInventory: true,
          canAccessEvents: true,
          canAccessSettings: true,
          canApprovePayroll: true,
          canViewFinancialReports: true,
          canExportData: true,
          dashboardSections: ['finance', 'events', 'inventory']
        };

      case 'user':
        return {
          ...basePermissions,
          canAccessDashboard: true,
          canAccessMembers: true,
          canAccessNewMembers: true,
          canAccessEvents: true,
          canAccessInventory: true,
          canAccessWelfare: true,
          dashboardSections: ['events', 'members']
        };

      default:
        return basePermissions;
    }
  }

  private getDataRestrictions(role: UserRole): SecurityContext['restrictedData'] {
    switch (role) {
      case 'admin':
      case 'pastor':
        return {
          hideFinancialAmounts: false,
          hideSalaryDetails: false,
          hidePersonalData: false,
          showOnlyOwnData: false
        };

      case 'hr':
        return {
          hideFinancialAmounts: false,
          hideSalaryDetails: false,
          hidePersonalData: false,
          showOnlyOwnData: false
        };

      case 'finance':
        return {
          hideFinancialAmounts: false,
          hideSalaryDetails: true,
          hidePersonalData: true,
          showOnlyOwnData: true
        };

      case 'user':
        return {
          hideFinancialAmounts: true,
          hideSalaryDetails: true,
          hidePersonalData: true,
          showOnlyOwnData: true
        };

      default:
        return {
          hideFinancialAmounts: true,
          hideSalaryDetails: true,
          hidePersonalData: true,
          showOnlyOwnData: true
        };
    }
  }
}

export default RoleBasedAccessService.getInstance();
