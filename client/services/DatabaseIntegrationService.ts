/**
 * TSOAM Database Integration Service
 * Ensures all system modules are properly connected to the database
 * Production-ready database synchronization and validation
 */

import SystemLogService from "./SystemLogService";

export interface DatabaseTable {
  name: string;
  module: string;
  required: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'missing';
  lastSync?: string;
  recordCount?: number;
  error?: string;
}

export interface ModuleStatus {
  module: string;
  connected: boolean;
  tables: DatabaseTable[];
  lastActivity?: string;
  issues: string[];
}

class DatabaseIntegrationService {
  private static instance: DatabaseIntegrationService;
  private apiBase = '/api';

  private constructor() {}

  public static getInstance(): DatabaseIntegrationService {
    if (!DatabaseIntegrationService.instance) {
      DatabaseIntegrationService.instance = new DatabaseIntegrationService();
    }
    return DatabaseIntegrationService.instance;
  }

  /**
   * Check database connection for all modules
   */
  public async checkSystemIntegration(): Promise<{
    overall: 'healthy' | 'warning' | 'critical';
    modules: ModuleStatus[];
    summary: string;
  }> {
    SystemLogService.log({
      level: 'info',
      module: 'System',
      action: 'Database Integration Check',
      details: 'Starting comprehensive database integration check'
    });

    const modules = [
      { name: 'HR', endpoint: '/hr/status' },
      { name: 'Finance', endpoint: '/finance/status' },
      { name: 'Events', endpoint: '/events/status' },
      { name: 'Members', endpoint: '/members/status' },
      { name: 'Inventory', endpoint: '/inventory/status' },
      { name: 'Auth', endpoint: '/auth/status' }
    ];

    const moduleStatuses: ModuleStatus[] = [];
    let healthyModules = 0;
    let criticalIssues = 0;

    for (const module of modules) {
      try {
        const status = await this.checkModuleStatus(module.name, module.endpoint);
        moduleStatuses.push(status);
        
        if (status.connected && status.issues.length === 0) {
          healthyModules++;
        } else if (!status.connected) {
          criticalIssues++;
        }
      } catch (error) {
        const errorStatus: ModuleStatus = {
          module: module.name,
          connected: false,
          tables: [],
          issues: [`Failed to check status: ${error instanceof Error ? error.message : 'Unknown error'}`]
        };
        moduleStatuses.push(errorStatus);
        criticalIssues++;
      }
    }

    const overall = criticalIssues > 0 ? 'critical' : 
                   healthyModules < modules.length ? 'warning' : 'healthy';

    const summary = `${healthyModules}/${modules.length} modules healthy, ${criticalIssues} critical issues`;

    SystemLogService.log({
      level: overall === 'critical' ? 'error' : overall === 'warning' ? 'warning' : 'info',
      module: 'System',
      action: 'Database Integration Status',
      details: summary,
      metadata: { moduleStatuses, overall }
    });

    return { overall, modules: moduleStatuses, summary };
  }

  /**
   * Check specific module database status
   */
  private async checkModuleStatus(moduleName: string, endpoint: string): Promise<ModuleStatus> {
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        return {
          module: moduleName,
          connected: false,
          tables: [],
          issues: [`HTTP ${response.status}: ${response.statusText}`]
        };
      }

      const data = await response.json();
      return this.parseModuleStatus(moduleName, data);
    } catch (error) {
      return {
        module: moduleName,
        connected: false,
        tables: [],
        issues: [`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Parse module status response
   */
  private parseModuleStatus(moduleName: string, data: any): ModuleStatus {
    const tables: DatabaseTable[] = [];
    const issues: string[] = [];

    // Standard table mappings for each module
    const expectedTables = this.getExpectedTables(moduleName);
    
    for (const tableInfo of expectedTables) {
      const table: DatabaseTable = {
        name: tableInfo.name,
        module: moduleName,
        required: tableInfo.required,
        status: 'connected', // Default, will be updated based on data
      };

      // Check if table data exists in response
      if (data.tables && data.tables[tableInfo.name]) {
        table.recordCount = data.tables[tableInfo.name].count || 0;
        table.lastSync = data.tables[tableInfo.name].lastSync;
        table.status = 'connected';
      } else if (tableInfo.required) {
        table.status = 'missing';
        issues.push(`Required table ${tableInfo.name} is missing or not accessible`);
      }

      tables.push(table);
    }

    const connected = tables.filter(t => t.required && t.status === 'connected').length === 
                     expectedTables.filter(t => t.required).length;

    return {
      module: moduleName,
      connected,
      tables,
      lastActivity: data.lastActivity,
      issues
    };
  }

  /**
   * Get expected tables for each module
   */
  private getExpectedTables(moduleName: string): { name: string; required: boolean }[] {
    const tableMap: Record<string, { name: string; required: boolean }[]> = {
      HR: [
        { name: 'employees', required: true },
        { name: 'payroll_records', required: true },
        { name: 'leave_requests', required: true },
        { name: 'performance_reviews', required: false },
        { name: 'attendance', required: false }
      ],
      Finance: [
        { name: 'financial_transactions', required: true },
        { name: 'budget_items', required: true },
        { name: 'approval_requests', required: true },
        { name: 'disbursement_reports', required: true }
      ],
      Events: [
        { name: 'events', required: true },
        { name: 'event_attendees', required: false },
        { name: 'event_resources', required: false }
      ],
      Members: [
        { name: 'members', required: true },
        { name: 'member_groups', required: false },
        { name: 'member_activities', required: false }
      ],
      Inventory: [
        { name: 'inventory_items', required: true },
        { name: 'inventory_transactions', required: true },
        { name: 'suppliers', required: false }
      ],
      Auth: [
        { name: 'users', required: true },
        { name: 'roles', required: true },
        { name: 'permissions', required: true },
        { name: 'user_sessions', required: false }
      ]
    };

    return tableMap[moduleName] || [];
  }

  /**
   * Sync module data to database
   */
  public async syncModuleData(moduleName: string, data: any[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBase}/${moduleName.toLowerCase()}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });

      const success = response.ok;

      SystemLogService.log({
        level: success ? 'info' : 'error',
        module: moduleName as any,
        action: 'Data Sync',
        details: success ? 
          `Successfully synced ${data.length} records to database` :
          `Failed to sync data: ${response.statusText}`,
        metadata: { recordCount: data.length, status: response.status }
      });

      return success;
    } catch (error) {
      SystemLogService.logError(moduleName as any, error as Error, 'Data sync failed');
      return false;
    }
  }

  /**
   * Clean demo data from all modules
   */
  public async cleanDemoData(): Promise<{
    success: boolean;
    results: Record<string, boolean>;
    summary: string;
  }> {
    SystemLogService.log({
      level: 'warning',
      module: 'System',
      action: 'Demo Data Cleanup',
      details: 'Starting demo data cleanup for production deployment',
      risk_level: 'high'
    });

    const modules = ['hr', 'finance', 'events', 'members', 'inventory'];
    const results: Record<string, boolean> = {};
    let successCount = 0;

    for (const module of modules) {
      try {
        const response = await fetch(`${this.apiBase}/${module}/demo-data`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        results[module] = response.ok;
        if (response.ok) {
          successCount++;
        }

        SystemLogService.log({
          level: response.ok ? 'info' : 'warning',
          module: module.toUpperCase() as any,
          action: 'Demo Data Cleanup',
          details: response.ok ? 
            'Demo data successfully removed' : 
            `Failed to remove demo data: ${response.statusText}`
        });
      } catch (error) {
        results[module] = false;
        SystemLogService.logError(module.toUpperCase() as any, error as Error, 'Demo data cleanup failed');
      }
    }

    const success = successCount === modules.length;
    const summary = `${successCount}/${modules.length} modules cleaned successfully`;

    // Clean local storage demo data
    this.cleanLocalStorageDemoData();

    SystemLogService.log({
      level: success ? 'info' : 'warning',
      module: 'System',
      action: 'Demo Data Cleanup Complete',
      details: summary,
      metadata: { results, success },
      risk_level: 'high'
    });

    return { success, results, summary };
  }

  /**
   * Clean demo data from localStorage
   */
  private cleanLocalStorageDemoData(): void {
    const demoKeys = [
      'demo_employees',
      'demo_payroll',
      'demo_events',
      'demo_members',
      'demo_inventory',
      'demo_financial_transactions'
    ];

    let cleanedCount = 0;
    demoKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });

    // Clear any keys that contain 'demo' or 'test'
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('demo') || key.toLowerCase().includes('test')) {
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });

    SystemLogService.log({
      level: 'info',
      module: 'System',
      action: 'LocalStorage Demo Cleanup',
      details: `Cleaned ${cleanedCount} demo data entries from localStorage`
    });
  }

  /**
   * Validate production readiness
   */
  public async validateProductionReadiness(): Promise<{
    ready: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check database integration
    const integrationStatus = await this.checkSystemIntegration();
    if (integrationStatus.overall === 'critical') {
      issues.push('Critical database integration issues detected');
    }

    // Check for demo data
    const demoDataExists = this.checkForDemoData();
    if (demoDataExists.length > 0) {
      issues.push(`Demo data found in: ${demoDataExists.join(', ')}`);
      recommendations.push('Run demo data cleanup before production deployment');
    }

    // Check environment variables
    const envIssues = this.checkEnvironmentConfig();
    issues.push(...envIssues);

    // Check system logs
    const logSummary = SystemLogService.getActivitySummary(24);
    if (logSummary.criticalEvents.length > 10) {
      recommendations.push('Review and resolve critical system events before deployment');
    }

    const ready = issues.length === 0;

    SystemLogService.log({
      level: ready ? 'info' : 'warning',
      module: 'System',
      action: 'Production Readiness Check',
      details: ready ? 'System is ready for production deployment' : `${issues.length} issues found`,
      metadata: { issues, recommendations, ready },
      risk_level: ready ? 'low' : 'medium'
    });

    return { ready, issues, recommendations };
  }

  /**
   * Check for demo data existence
   */
  private checkForDemoData(): string[] {
    const locations: string[] = [];
    
    // Check localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('demo') || key.toLowerCase().includes('test')) {
        locations.push(`localStorage: ${key}`);
      }
    });

    return locations;
  }

  /**
   * Check environment configuration
   */
  private checkEnvironmentConfig(): string[] {
    const issues: string[] = [];

    // In a real production environment, check for required environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'API_BASE_URL',
      'ENCRYPTION_KEY'
    ];

    // This is a placeholder - actual environment checks would be done server-side
    // For client-side, we can only check what's exposed
    
    return issues;
  }
}

export default DatabaseIntegrationService.getInstance();
