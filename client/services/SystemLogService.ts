/**
 * TSOAM System Logging Service - Production Grade
 * Comprehensive activity tracking for all system operations
 */

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'security' | 'audit';
  module: 'HR' | 'Finance' | 'Inventory' | 'Events' | 'Members' | 'Auth' | 'System';
  action: string;
  details: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
}

export interface LogFilter {
  startDate?: string;
  endDate?: string;
  level?: string;
  module?: string;
  userId?: string;
  action?: string;
  riskLevel?: string;
}

class SystemLogService {
  private static instance: SystemLogService;
  private logs: SystemLogEntry[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory
  private isProduction = process.env.NODE_ENV === 'production';

  private constructor() {
    this.loadLogs();
    this.setupAutoSave();
  }

  public static getInstance(): SystemLogService {
    if (!SystemLogService.instance) {
      SystemLogService.instance = new SystemLogService();
    }
    return SystemLogService.instance;
  }

  /**
   * Log system activity
   */
  public log(entry: Omit<SystemLogEntry, 'id' | 'timestamp'>): void {
    const logEntry: SystemLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
      ...entry
    };

    this.logs.unshift(logEntry);

    // Trim logs if too many
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Save to localStorage for persistence
    this.saveLogs();

    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('systemLogUpdated', {
      detail: { logEntry, totalLogs: this.logs.length }
    }));

    // Send to server in production
    if (this.isProduction) {
      this.sendToServer(logEntry);
    }

    // Console log in development
    if (!this.isProduction) {
      console.log(`[${logEntry.level.toUpperCase()}] ${logEntry.module}: ${logEntry.action}`, logEntry);
    }
  }

  /**
   * Log HR activities
   */
  public logHR(action: string, details: string, userId?: string, userName?: string, metadata?: any): void {
    this.log({
      level: 'audit',
      module: 'HR',
      action,
      details,
      userId,
      userName,
      metadata,
      risk_level: this.assessRiskLevel('HR', action)
    });
  }

  /**
   * Log Finance activities
   */
  public logFinance(action: string, details: string, userId?: string, userName?: string, metadata?: any): void {
    this.log({
      level: 'audit',
      module: 'Finance',
      action,
      details,
      userId,
      userName,
      metadata,
      risk_level: this.assessRiskLevel('Finance', action)
    });
  }

  /**
   * Log security events
   */
  public logSecurity(action: string, details: string, userId?: string, userName?: string, metadata?: any): void {
    this.log({
      level: 'security',
      module: 'Auth',
      action,
      details,
      userId,
      userName,
      metadata,
      risk_level: 'high'
    });
  }

  /**
   * Log errors
   */
  public logError(module: SystemLogEntry['module'], error: Error, context?: string, userId?: string): void {
    this.log({
      level: 'error',
      module,
      action: 'Error',
      details: `${context ? context + ': ' : ''}${error.message}`,
      userId,
      metadata: {
        stack: error.stack,
        name: error.name,
        context
      },
      risk_level: 'medium'
    });
  }

  /**
   * Get filtered logs
   */
  public getLogs(filter?: LogFilter): SystemLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endDate!);
      }
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
      if (filter.module) {
        filteredLogs = filteredLogs.filter(log => log.module === filter.module);
      }
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
      }
      if (filter.action) {
        filteredLogs = filteredLogs.filter(log => log.action.toLowerCase().includes(filter.action!.toLowerCase()));
      }
      if (filter.riskLevel) {
        filteredLogs = filteredLogs.filter(log => log.risk_level === filter.riskLevel);
      }
    }

    return filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get recent activity summary
   */
  public getActivitySummary(hours: number = 24): {
    total: number;
    byLevel: Record<string, number>;
    byModule: Record<string, number>;
    criticalEvents: SystemLogEntry[];
  } {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const recentLogs = this.logs.filter(log => log.timestamp >= since);

    const byLevel: Record<string, number> = {};
    const byModule: Record<string, number> = {};

    recentLogs.forEach(log => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      byModule[log.module] = (byModule[log.module] || 0) + 1;
    });

    const criticalEvents = recentLogs.filter(log =>
      log.level === 'security' ||
      log.level === 'error' ||
      log.risk_level === 'critical' ||
      log.risk_level === 'high'
    );

    return {
      total: recentLogs.length,
      byLevel,
      byModule,
      criticalEvents
    };
  }

  /**
   * Export logs for compliance
   */
  public exportLogs(filter?: LogFilter, format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs(filter);

    if (format === 'csv') {
      const headers = ['Timestamp', 'Level', 'Module', 'Action', 'User', 'Details', 'IP Address', 'Risk Level'];
      const rows = logs.map(log => [
        log.timestamp,
        log.level,
        log.module,
        log.action,
        log.userName || log.userId || 'System',
        log.details,
        log.ipAddress || '',
        log.risk_level || ''
      ]);

      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clear old logs (for maintenance)
   */
  public clearOldLogs(days: number = 90): number {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= cutoff);
    const clearedCount = initialCount - this.logs.length;

    this.saveLogs();

    this.log({
      level: 'info',
      module: 'System',
      action: 'Log Cleanup',
      details: `Cleared ${clearedCount} logs older than ${days} days`,
      risk_level: 'low'
    });

    return clearedCount;
  }

  // Private helper methods
  private loadLogs(): void {
    try {
      const saved = localStorage.getItem('system_logs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load system logs:', error);
      this.logs = [];
    }
  }

  private saveLogs(): void {
    try {
      localStorage.setItem('system_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save system logs:', error);
    }
  }

  private setupAutoSave(): void {
    // Auto-save every 5 minutes
    setInterval(() => {
      this.saveLogs();
    }, 5 * 60 * 1000);
  }

  private getClientIP(): string {
    // In a real production environment, this would be handled by the server
    return 'client-side';
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('tsoam_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('tsoam_session_id', sessionId);
    }
    return sessionId;
  }

  private assessRiskLevel(module: string, action: string): 'low' | 'medium' | 'high' | 'critical' {
    const highRiskActions = [
      'delete', 'remove', 'terminate', 'reject', 'suspend', 'approve_batch', 'disbursement',
      'salary_change', 'role_change', 'permission_change', 'system_config'
    ];

    const criticalActions = [
      'admin_login', 'bulk_delete', 'database_change', 'security_breach', 'unauthorized_access'
    ];

    const actionLower = action.toLowerCase();

    if (criticalActions.some(critical => actionLower.includes(critical))) {
      return 'critical';
    }

    if (highRiskActions.some(high => actionLower.includes(high))) {
      return 'high';
    }

    if (module === 'Finance' || module === 'HR') {
      return 'medium';
    }

    return 'low';
  }

  private async sendToServer(logEntry: SystemLogEntry): Promise<void> {
    try {
      await fetch('/api/system-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Fail silently in production, don't disrupt user experience
      console.error('Failed to send log to server:', error);
    }
  }
}

export default SystemLogService.getInstance();
