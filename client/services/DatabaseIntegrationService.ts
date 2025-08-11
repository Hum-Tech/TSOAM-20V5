/**
 * TSOAM Database Integration Service
 *
 * This service provides seamless integration between the frontend and the
 * comprehensive enterprise database. It handles all CRUD operations with
 * proper error handling and fallback to demo data when needed.
 */

export interface DatabaseConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
  fallbackToDemo: boolean;
}

export interface DatabaseHealth {
  connected: boolean;
  latency: number;
  lastCheck: string;
  tablesCount: number;
  recordsCount: number;
  errors: string[];
}

export interface TableInfo {
  name: string;
  recordCount: number;
  lastUpdated: string;
  status: 'healthy' | 'warning' | 'error';
}

class DatabaseIntegrationService {
  private config: DatabaseConfig;
  private health: DatabaseHealth | null = null;
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.config = {
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 10000,
      retries: 3,
      fallbackToDemo: true
    };
  }

  /**
   * Initialize database connection and verify schema
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔌 Initializing database integration...');

      // Check database health
      const health = await this.checkHealth();

      if (health.connected) {
        console.log('✅ Database integration initialized successfully');
        return true;
      } else {
        console.warn('⚠️ Database not available, using demo mode');
        return false;
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return false;
    }
  }

  /**
   * Check database health and connectivity
   */
  async checkHealth(): Promise<DatabaseHealth> {
    const now = Date.now();

    // Return cached health if recent
    if (this.health && (now - this.lastHealthCheck) < this.HEALTH_CHECK_INTERVAL) {
      return this.health;
    }

    const startTime = Date.now();
    const health: DatabaseHealth = {
      connected: false,
      latency: 0,
      lastCheck: new Date().toISOString(),
      tablesCount: 0,
      recordsCount: 0,
      errors: []
    };

    try {
      // Test database connection
      const response = await this.makeRequest('/health/database', {
        timeout: 5000
      });

      health.connected = true;
      health.latency = Date.now() - startTime;
      health.tablesCount = response.tables || 0;
      health.recordsCount = response.totalRecords || 0;

    } catch (error) {
      health.connected = false;
      health.latency = Date.now() - startTime;
      health.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    this.health = health;
    this.lastHealthCheck = now;
    return health;
  }

  /**
   * Get comprehensive database statistics
   */
  async getDatabaseStats(): Promise<TableInfo[]> {
    try {
      const response = await this.makeRequest('/database/stats');
      return response.tables || [];
    } catch (error) {
      console.warn('Cannot fetch database stats:', error);
      return this.getDemoStats();
    }
  }

  /**
   * Verify all required tables exist
   */
  async verifyTables(): Promise<{ verified: boolean; missingTables: string[] }> {
    const requiredTables = [
      // Core System
      'users', 'password_resets', 'user_sessions', 'system_settings', 'system_logs', 'audit_trail',

      // Member Management
      'members', 'new_members',

      // HR Management
      'employees', 'leave_types', 'leave_balances', 'leave_requests', 'leave_approval_history',
      'performance_reviews', 'performance_competencies',

      // Appointment Management
      'appointments', 'appointment_participants', 'appointment_resources', 'appointment_reminders',

      // Finance Management
      'financial_transactions', 'tithe_records', 'budgets',

      // Welfare Management
      'welfare_requests',

      // Event Management
      'events', 'event_registrations',

      // Inventory Management
      'inventory_items', 'inventory_movements', 'maintenance_records',

      // Messaging System
      'messages', 'message_templates', 'message_recipients',

      // Document Management
      'document_uploads',

      // Notification System
      'notifications'
    ];

    try {
      const response = await this.makeRequest('/database/verify-tables');
      const existingTables = response.tables || [];
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));

      return {
        verified: missingTables.length === 0,
        missingTables
      };
    } catch (error) {
      console.warn('Cannot verify tables:', error);
      return {
        verified: false,
        missingTables: requiredTables
      };
    }
  }

  /**
   * Initialize missing tables
   */
  async initializeTables(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/database/initialize', {
        method: 'POST'
      });
      return response.success || false;
    } catch (error) {
      console.error('Table initialization failed:', error);
      return false;
    }
  }

  /**
   * Create database backup
   */
  async createBackup(): Promise<{ success: boolean; backupId?: string; downloadUrl?: string }> {
    try {
      const response = await this.makeRequest('/database/backup', {
        method: 'POST'
      });
      return {
        success: true,
        backupId: response.backupId,
        downloadUrl: response.downloadUrl
      };
    } catch (error) {
      console.error('Backup creation failed:', error);
      return { success: false };
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/database/restore/${backupId}`, {
        method: 'POST'
      });
      return response.success || false;
    } catch (error) {
      console.error('Backup restore failed:', error);
      return false;
    }
  }

  /**
   * Optimize database performance
   */
  async optimizeDatabase(): Promise<{ success: boolean; optimizations: string[] }> {
    try {
      const response = await this.makeRequest('/database/optimize', {
        method: 'POST'
      });
      return {
        success: true,
        optimizations: response.optimizations || []
      };
    } catch (error) {
      console.error('Database optimization failed:', error);
      return { success: false, optimizations: [] };
    }
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/database/test', {
        timeout: 3000
      });
      return response.connected || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get database size and usage information
   */
  async getUsageInfo(): Promise<{
    totalSize: number;
    dataSize: number;
    indexSize: number;
    tableCount: number;
    recordCount: number;
  }> {
    try {
      const response = await this.makeRequest('/database/usage');
      return {
        totalSize: response.totalSize || 0,
        dataSize: response.dataSize || 0,
        indexSize: response.indexSize || 0,
        tableCount: response.tableCount || 0,
        recordCount: response.recordCount || 0
      };
    } catch (error) {
      console.warn('Cannot fetch usage info:', error);
      return {
        totalSize: 0,
        dataSize: 0,
        indexSize: 0,
        tableCount: 0,
        recordCount: 0
      };
    }
  }

  /**
   * Execute a custom query (admin only)
   */
  async executeQuery(query: string): Promise<any[]> {
    try {
      const response = await this.makeRequest('/database/query', {
        method: 'POST',
        body: JSON.stringify({ query })
      });
      return response.results || [];
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for database changes
   */
  async getAuditTrail(filters: {
    tableName?: string;
    operation?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value));
      });

      const response = await this.makeRequest(`/database/audit?${queryParams}`);
      return response.auditTrail || [];
    } catch (error) {
      console.warn('Cannot fetch audit trail:', error);
      return [];
    }
  }

  /**
   * Sync data between different environments
   */
  async syncData(sourceEnv: string, targetEnv: string, tables: string[]): Promise<boolean> {
    try {
      const response = await this.makeRequest('/database/sync', {
        method: 'POST',
        body: JSON.stringify({
          sourceEnv,
          targetEnv,
          tables
        })
      });
      return response.success || false;
    } catch (error) {
      console.error('Data sync failed:', error);
      return false;
    }
  }

  /**
   * Generate comprehensive database report
   */
  async generateReport(reportType: 'summary' | 'detailed' | 'performance' | 'security' = 'summary'): Promise<any> {
    try {
      const response = await this.makeRequest(`/database/report/${reportType}`);
      return response.report || {};
    } catch (error) {
      console.warn('Cannot generate database report:', error);
      return this.getDemoReport(reportType);
    }
  }

  /**
   * Private method to make HTTP requests with proper error handling
   */
  private async makeRequest(endpoint: string, options: RequestInit & { timeout?: number } = {}): Promise<any> {
    const url = `${this.config.apiUrl}${endpoint}`;
    const timeout = options.timeout || this.config.timeout;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  /**
   * Demo data methods for fallback when database is not available
   */
  private getDemoStats(): TableInfo[] {
    return [
      { name: 'users', recordCount: 5, lastUpdated: new Date().toISOString(), status: 'healthy' },
      { name: 'members', recordCount: 150, lastUpdated: new Date().toISOString(), status: 'healthy' },
      { name: 'employees', recordCount: 25, lastUpdated: new Date().toISOString(), status: 'healthy' },
      { name: 'financial_transactions', recordCount: 500, lastUpdated: new Date().toISOString(), status: 'healthy' },
      { name: 'appointments', recordCount: 75, lastUpdated: new Date().toISOString(), status: 'healthy' },
      { name: 'events', recordCount: 20, lastUpdated: new Date().toISOString(), status: 'healthy' },
      { name: 'leave_requests', recordCount: 45, lastUpdated: new Date().toISOString(), status: 'healthy' },
      { name: 'welfare_requests', recordCount: 12, lastUpdated: new Date().toISOString(), status: 'healthy' },
      { name: 'inventory_items', recordCount: 200, lastUpdated: new Date().toISOString(), status: 'healthy' },
      { name: 'messages', recordCount: 100, lastUpdated: new Date().toISOString(), status: 'healthy' }
    ];
  }

  private getDemoReport(reportType: string): any {
    const baseReport = {
      timestamp: new Date().toISOString(),
      environment: 'demo',
      database: 'tsoam_church_db',
      status: 'healthy',
      tablesCount: 30,
      totalRecords: 1127,
      dataSize: '15.2 MB',
      indexSize: '3.8 MB'
    };

    switch (reportType) {
      case 'detailed':
        return {
          ...baseReport,
          tables: this.getDemoStats(),
          performance: {
            averageQueryTime: '12ms',
            slowQueries: 0,
            indexEfficiency: '94%'
          }
        };
      case 'performance':
        return {
          ...baseReport,
          queryPerformance: {
            averageResponseTime: '12ms',
            peakResponseTime: '45ms',
            queriesPerSecond: 25.3,
            slowestQueries: []
          },
          indexUsage: {
            efficiency: '94%',
            unusedIndexes: 0,
            missingIndexes: 0
          }
        };
      case 'security':
        return {
          ...baseReport,
          security: {
            userAccounts: 5,
            activeTokens: 3,
            lastPasswordChanges: new Date().toISOString(),
            suspiciousActivity: 0,
            backupStatus: 'current'
          }
        };
      default:
        return baseReport;
    }
  }
}

// Export singleton instance
export const databaseIntegrationService = new DatabaseIntegrationService();
export default databaseIntegrationService;
