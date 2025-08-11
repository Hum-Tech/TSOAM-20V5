#!/usr/bin/env node

/**
 * TSOAM Church Management System - Enterprise Database Initialization
 * 
 * This script ensures all required tables are created and properly configured
 * for the complete TSOAM system deployment.
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tsoam_church_db',
  multipleStatements: true,
  charset: 'utf8mb4'
};

// Required tables for the complete system
const REQUIRED_TABLES = [
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

// Required indexes for performance
const REQUIRED_INDEXES = [
  { table: 'users', index: 'idx_users_role_active', columns: ['role', 'is_active'] },
  { table: 'financial_transactions', index: 'idx_transactions_date_type', columns: ['date', 'type'] },
  { table: 'members', index: 'idx_members_active_status', columns: ['status'] },
  { table: 'system_logs', index: 'idx_logs_timestamp_severity', columns: ['timestamp', 'severity'] },
  { table: 'appointments', index: 'idx_appointments_date_status', columns: ['date', 'status'] },
  { table: 'events', index: 'idx_events_start_date_status', columns: ['start_date', 'status'] },
  { table: 'inventory_items', index: 'idx_inventory_category_status', columns: ['category', 'status'] },
  { table: 'leave_requests', index: 'idx_leave_requests_employee_status', columns: ['employee_id', 'status'] },
  { table: 'messages', index: 'idx_messages_sender_date', columns: ['sender_id', 'created_at'] },
  { table: 'notifications', index: 'idx_notifications_user_status', columns: ['user_id', 'status'] }
];

class DatabaseInitializer {
  constructor() {
    this.connection = null;
    this.errors = [];
    this.warnings = [];
  }

  async initialize() {
    console.log('🚀 Starting TSOAM Enterprise Database Initialization...\n');
    
    try {
      // Step 1: Connect to database
      await this.connect();
      
      // Step 2: Create database if it doesn't exist
      await this.createDatabase();
      
      // Step 3: Run enterprise schema
      await this.createTables();
      
      // Step 4: Verify all tables exist
      await this.verifyTables();
      
      // Step 5: Verify indexes
      await this.verifyIndexes();
      
      // Step 6: Insert default data
      await this.insertDefaultData();
      
      // Step 7: Validate data integrity
      await this.validateDataIntegrity();
      
      // Step 8: Generate initialization report
      await this.generateReport();
      
      console.log('✅ Database initialization completed successfully!\n');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      this.errors.push(error.message);
      throw error;
    } finally {
      if (this.connection) {
        await this.connection.end();
      }
    }
  }

  async connect() {
    console.log('📡 Connecting to database...');
    try {
      this.connection = await mysql.createConnection({
        ...DB_CONFIG,
        database: undefined // Connect without database first
      });
      console.log('✅ Database connection established');
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async createDatabase() {
    console.log('🏗️ Creating database if not exists...');
    try {
      await this.connection.execute(
        `CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.database} 
         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await this.connection.execute(`USE ${DB_CONFIG.database}`);
      console.log(`✅ Database '${DB_CONFIG.database}' is ready`);
    } catch (error) {
      throw new Error(`Database creation failed: ${error.message}`);
    }
  }

  async createTables() {
    console.log('📋 Creating tables from enterprise schema...');
    
    try {
      const schemaPath = path.join(__dirname, 'enterprise_schema.sql');
      const schemaSQL = await fs.readFile(schemaPath, 'utf8');
      
      // Split schema into statements
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => 
          stmt.length > 0 && 
          !stmt.startsWith('--') && 
          !stmt.startsWith('/*') &&
          !stmt.includes('CREATE DATABASE') &&
          !stmt.includes('USE ')
        );

      let tablesCreated = 0;
      let tablesSkipped = 0;

      for (const statement of statements) {
        if (statement.includes('CREATE TABLE')) {
          try {
            await this.connection.execute(statement);
            tablesCreated++;
          } catch (error) {
            if (error.message.includes('already exists')) {
              tablesSkipped++;
            } else {
              this.warnings.push(`Table creation warning: ${error.message}`);
            }
          }
        } else if (statement.includes('INSERT') || statement.includes('CREATE INDEX')) {
          try {
            await this.connection.execute(statement);
          } catch (error) {
            // Non-critical errors for inserts and indexes
            this.warnings.push(`Statement warning: ${error.message}`);
          }
        }
      }

      console.log(`✅ Tables processed - Created: ${tablesCreated}, Skipped: ${tablesSkipped}`);
      
    } catch (error) {
      throw new Error(`Schema execution failed: ${error.message}`);
    }
  }

  async verifyTables() {
    console.log('🔍 Verifying all required tables exist...');
    
    try {
      const [tables] = await this.connection.execute(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = ? ORDER BY table_name`,
        [DB_CONFIG.database]
      );

      const existingTables = tables.map(row => row.table_name || row.TABLE_NAME);
      const missingTables = REQUIRED_TABLES.filter(table => !existingTables.includes(table));

      if (missingTables.length > 0) {
        throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
      }

      console.log(`✅ All ${REQUIRED_TABLES.length} required tables verified`);
      
      // Log table statistics
      for (const tableName of REQUIRED_TABLES) {
        try {
          const [countResult] = await this.connection.execute(
            `SELECT COUNT(*) as count FROM ${tableName}`
          );
          const count = countResult[0].count || countResult[0].COUNT;
          console.log(`   📊 ${tableName}: ${count} records`);
        } catch (error) {
          this.warnings.push(`Cannot count records in ${tableName}: ${error.message}`);
        }
      }

    } catch (error) {
      throw new Error(`Table verification failed: ${error.message}`);
    }
  }

  async verifyIndexes() {
    console.log('🔗 Verifying database indexes...');
    
    try {
      let indexesVerified = 0;
      let indexesMissing = 0;

      for (const indexInfo of REQUIRED_INDEXES) {
        try {
          const [indexes] = await this.connection.execute(
            `SHOW INDEX FROM ${indexInfo.table} WHERE Key_name = ?`,
            [indexInfo.index]
          );

          if (indexes.length > 0) {
            indexesVerified++;
          } else {
            indexesMissing++;
            // Try to create missing index
            try {
              const createIndexSQL = `CREATE INDEX ${indexInfo.index} ON ${indexInfo.table} (${indexInfo.columns.join(', ')})`;
              await this.connection.execute(createIndexSQL);
              console.log(`   ✅ Created missing index: ${indexInfo.index}`);
              indexesVerified++;
              indexesMissing--;
            } catch (createError) {
              this.warnings.push(`Cannot create index ${indexInfo.index}: ${createError.message}`);
            }
          }
        } catch (error) {
          this.warnings.push(`Cannot verify index ${indexInfo.index}: ${error.message}`);
        }
      }

      console.log(`✅ Indexes verified: ${indexesVerified}, Missing: ${indexesMissing}`);
      
    } catch (error) {
      this.warnings.push(`Index verification failed: ${error.message}`);
    }
  }

  async insertDefaultData() {
    console.log('📥 Verifying default data...');
    
    try {
      // Check if admin user exists
      const [adminUser] = await this.connection.execute(
        'SELECT id FROM users WHERE email = ?',
        ['admin@tsoam.org']
      );

      if (adminUser.length === 0) {
        await this.connection.execute(
          `INSERT INTO users (id, name, email, password_hash, role, is_active, can_create_accounts, can_delete_accounts) 
           VALUES ('admin-001', 'System Administrator', 'admin@tsoam.org', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', TRUE, TRUE, TRUE)`
        );
        console.log('✅ Default admin user created');
      }

      // Check leave types
      const [leaveTypes] = await this.connection.execute('SELECT COUNT(*) as count FROM leave_types');
      const leaveTypeCount = leaveTypes[0].count || leaveTypes[0].COUNT;
      
      if (leaveTypeCount === 0) {
        const leaveTypeInserts = [
          "('annual', 'Annual Leave', 'AL', 21, 30, TRUE, 5, TRUE, FALSE, TRUE, 'Standard annual vacation leave', 'statutory', 1.75, 0, '[\"Full-time\", \"Part-time\"]', 'none')",
          "('sick', 'Sick Leave', 'SL', 30, 60, FALSE, 0, TRUE, TRUE, TRUE, 'Medical leave for illness or injury', 'statutory', 0, 0, '[\"Full-time\", \"Part-time\", \"Volunteer\"]', 'none')",
          "('maternity', 'Maternity Leave', 'ML', 90, 120, FALSE, 0, TRUE, TRUE, TRUE, 'Maternity leave for childbirth', 'statutory', 0, 12, '[\"Full-time\", \"Part-time\"]', 'female')",
          "('paternity', 'Paternity Leave', 'PL', 14, 14, FALSE, 0, TRUE, TRUE, TRUE, 'Paternity leave for new fathers', 'statutory', 0, 12, '[\"Full-time\", \"Part-time\"]', 'male')",
          "('emergency', 'Emergency Leave', 'EL', 5, 10, FALSE, 0, TRUE, TRUE, FALSE, 'Emergency or compassionate leave', 'company', 0, 3, '[\"Full-time\", \"Part-time\"]', 'none')",
          "('study', 'Study Leave', 'STL', 30, 60, FALSE, 0, TRUE, TRUE, FALSE, 'Leave for educational purposes', 'company', 0, 24, '[\"Full-time\"]', 'none')"
        ];

        await this.connection.execute(
          `INSERT INTO leave_types (id, name, code, default_days, max_days_per_year, carry_over_allowed, max_carry_over_days, requires_approval, requires_documentation, is_paid, description, category, accrual_rate, min_tenure_months, employment_types, gender_restrictions) VALUES ${leaveTypeInserts.join(', ')}`
        );
        console.log('✅ Default leave types created');
      }

      // Check system settings
      const [settings] = await this.connection.execute('SELECT COUNT(*) as count FROM system_settings');
      const settingsCount = settings[0].count || settings[0].COUNT;
      
      if (settingsCount === 0) {
        const settingsInserts = [
          "('church_name', 'The Seed of Abraham Ministry (TSOAM)', 'string', 'general', 'Official church name', TRUE)",
          "('church_address', 'Nairobi, Kenya', 'string', 'general', 'Church physical address', TRUE)",
          "('church_phone', '+254 700 000 000', 'string', 'general', 'Church contact phone', TRUE)",
          "('church_email', 'admin@tsoam.org', 'string', 'general', 'Church contact email', TRUE)",
          "('currency', 'KSH', 'string', 'finance', 'Default currency', TRUE)",
          "('timezone', 'Africa/Nairobi', 'string', 'general', 'Default timezone', FALSE)",
          "('backup_frequency', 'daily', 'string', 'system', 'Automatic backup frequency', FALSE)",
          "('max_login_attempts', '5', 'number', 'security', 'Maximum login attempts before lockout', FALSE)",
          "('session_timeout_minutes', '60', 'number', 'security', 'Session timeout in minutes', FALSE)",
          "('file_upload_max_size', '10485760', 'number', 'system', 'Maximum file upload size in bytes (10MB)', FALSE)"
        ];

        await this.connection.execute(
          `INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES ${settingsInserts.join(', ')}`
        );
        console.log('✅ Default system settings created');
      }

      console.log('✅ Default data verification completed');
      
    } catch (error) {
      this.warnings.push(`Default data insertion warning: ${error.message}`);
    }
  }

  async validateDataIntegrity() {
    console.log('🔍 Validating data integrity...');
    
    try {
      const checks = [
        {
          name: 'Foreign Key Constraints',
          query: `SELECT COUNT(*) as count FROM information_schema.table_constraints 
                  WHERE table_schema = ? AND constraint_type = 'FOREIGN KEY'`,
          params: [DB_CONFIG.database]
        },
        {
          name: 'Unique Constraints',
          query: `SELECT COUNT(*) as count FROM information_schema.table_constraints 
                  WHERE table_schema = ? AND constraint_type = 'UNIQUE'`,
          params: [DB_CONFIG.database]
        },
        {
          name: 'Check Constraints',
          query: `SELECT COUNT(*) as count FROM information_schema.table_constraints 
                  WHERE table_schema = ? AND constraint_type = 'CHECK'`,
          params: [DB_CONFIG.database]
        }
      ];

      for (const check of checks) {
        try {
          const [result] = await this.connection.execute(check.query, check.params);
          const count = result[0].count || result[0].COUNT;
          console.log(`   ✅ ${check.name}: ${count} constraints`);
        } catch (error) {
          this.warnings.push(`Cannot validate ${check.name}: ${error.message}`);
        }
      }

      console.log('✅ Data integrity validation completed');
      
    } catch (error) {
      this.warnings.push(`Data integrity validation failed: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 TSOAM Enterprise Database Initialization Report');
    console.log('=' .repeat(60));
    
    // Database information
    console.log(`Database: ${DB_CONFIG.database}`);
    console.log(`Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`Charset: utf8mb4`);
    
    // Table summary
    console.log(`\n📋 Tables: ${REQUIRED_TABLES.length} required tables`);
    
    // Warnings summary
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }
    
    // Errors summary
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Status
    const status = this.errors.length === 0 ? 'SUCCESS' : 'FAILED';
    console.log(`\n🎯 Status: ${status}`);
    console.log('=' .repeat(60));
    
    // Save report to file
    const reportContent = {
      timestamp: new Date().toISOString(),
      database: DB_CONFIG.database,
      status: status,
      tables_required: REQUIRED_TABLES.length,
      warnings: this.warnings,
      errors: this.errors
    };
    
    const reportPath = path.join(__dirname, 'initialization_report.json');
    await fs.writeFile(reportPath, JSON.stringify(reportContent, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  }
}

// Run initialization if called directly
if (require.main === module) {
  const initializer = new DatabaseInitializer();
  
  initializer.initialize()
    .then(() => {
      console.log('\n🎉 TSOAM Enterprise Database is ready for deployment!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Initialization failed:', error.message);
      process.exit(1);
    });
}

module.exports = DatabaseInitializer;
