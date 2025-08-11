# Demo Data Cleanup Guide

**IMPORTANT**: This guide helps you remove all demo/sample data before deploying the system in a production environment.

## 🚨 Before You Start

**BACKUP YOUR DATABASE** before running any cleanup operations:

```bash
# Create backup
mysqldump -u username -p tsoam_church > backup_before_cleanup.sql

# Or use the built-in backup
npm run backup-database
```

## 🧹 Automated Cleanup

### Option 1: Complete Cleanup (Recommended)
```bash
# Remove ALL demo data from ALL modules
npm run cleanup-demo-data
```

This script will:
- Remove sample appointments
- Clear demo member records  
- Delete test financial transactions
- Remove inventory demo items
- Clear sample events
- Reset HR demo data
- Remove welfare demo applications
- Reset dashboard counters
- Clear demo user accounts (except admin)

### Option 2: Module-Specific Cleanup

```bash
# Clean specific modules individually
npm run cleanup-appointments    # Remove demo appointments
npm run cleanup-members        # Remove demo members
npm run cleanup-financial      # Remove demo financial data
npm run cleanup-inventory      # Remove demo inventory items
npm run cleanup-events         # Remove demo events
npm run cleanup-hr            # Remove demo HR records
npm run cleanup-welfare       # Remove demo welfare data
npm run cleanup-users         # Remove demo users (keeps admin)
```

## 🔍 Manual Verification

After running cleanup scripts, verify the data removal:

```sql
-- Check remaining records in key tables
SELECT 
    'appointments' as table_name, COUNT(*) as records FROM appointments
UNION ALL
SELECT 'members', COUNT(*) FROM members  
UNION ALL
SELECT 'financial_transactions', COUNT(*) FROM financial_transactions
UNION ALL
SELECT 'inventory_items', COUNT(*) FROM inventory_items
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'welfare_applications', COUNT(*) FROM welfare_applications;
```

## 📋 What Gets Cleaned vs. Preserved

### ✅ Preserved (System Data)
- Admin user account
- System configuration settings
- Database schema and structure
- Built-in categories and types
- System logs and audit trails
- User roles and permissions structure

### 🗑️ Removed (Demo Data)
- Sample appointments and schedules
- Demo member profiles and visitors
- Test financial transactions
- Sample inventory items and stock
- Demo events and activities
- Test employee records
- Sample welfare applications
- Demo analytics data

## 🔧 Manual Cleanup (If Needed)

If automated scripts fail, you can manually clean specific tables:

### Appointments
```sql
-- Remove demo appointments (those with specific demo patterns)
DELETE FROM appointments WHERE 
    title LIKE '%Demo%' OR 
    title LIKE '%Sample%' OR
    title LIKE '%Test%' OR
    member_name LIKE '%Demo%';

-- Reset appointment IDs
ALTER TABLE appointments AUTO_INCREMENT = 1;
```

### Members
```sql
-- Remove demo members (preserve real member structure)
DELETE FROM members WHERE 
    first_name LIKE '%Demo%' OR 
    last_name LIKE '%Sample%' OR
    email LIKE '%demo%' OR
    email LIKE '%test%';

-- Reset member IDs  
ALTER TABLE members AUTO_INCREMENT = 1;
```

### Financial Transactions
```sql
-- Remove demo financial data
DELETE FROM financial_transactions WHERE 
    description LIKE '%Demo%' OR 
    description LIKE '%Sample%' OR
    description LIKE '%Test%';

-- Reset transaction IDs
ALTER TABLE financial_transactions AUTO_INCREMENT = 1;
```

### Inventory Items
```sql
-- Remove demo inventory
DELETE FROM inventory_items WHERE 
    item_name LIKE '%Demo%' OR 
    item_name LIKE '%Sample%' OR
    notes LIKE '%demo%';

-- Remove demo stock items
DELETE FROM stock_items WHERE 
    item_name LIKE '%Demo%' OR 
    item_name LIKE '%Sample%';

-- Reset IDs
ALTER TABLE inventory_items AUTO_INCREMENT = 1;
ALTER TABLE stock_items AUTO_INCREMENT = 1;
```

### Events
```sql
-- Remove demo events
DELETE FROM events WHERE 
    title LIKE '%Demo%' OR 
    title LIKE '%Sample%' OR
    description LIKE '%demo%';

-- Reset event IDs
ALTER TABLE events AUTO_INCREMENT = 1;
```

### HR Records
```sql
-- Remove demo employees (keep admin structure)
DELETE FROM employees WHERE 
    first_name LIKE '%Demo%' OR 
    last_name LIKE '%Sample%' OR
    email LIKE '%demo%';

-- Reset employee IDs
ALTER TABLE employees AUTO_INCREMENT = 1;
```

### Welfare Applications
```sql
-- Remove demo welfare applications
DELETE FROM welfare_applications WHERE 
    applicant_name LIKE '%Demo%' OR 
    applicant_name LIKE '%Sample%';

-- Reset application IDs
ALTER TABLE welfare_applications AUTO_INCREMENT = 1;
```

## 🔄 Post-Cleanup Setup

After cleaning demo data:

1. **Verify System Functionality**
   ```bash
   npm run test-system
   ```

2. **Create First Real Admin User**
   - Login with default admin credentials
   - Change admin password immediately
   - Create additional user accounts as needed

3. **Configure System Settings**
   - Update church information
   - Set financial year settings
   - Configure notification preferences
   - Update branding/logo if needed

4. **Import Real Data (Optional)**
   ```bash
   # Import member data from CSV
   npm run import-members data/members.csv
   
   # Import financial history
   npm run import-financial data/transactions.csv
   ```

## ⚠️ Important Notes

- **Test First**: Run cleanup on a test/staging environment first
- **Backup Always**: Always backup before running cleanup
- **Check Dependencies**: Some data may have foreign key relationships
- **Verify Results**: Always verify the cleanup worked as expected
- **Document Changes**: Keep a record of what was cleaned

## 🆘 Troubleshooting

### Foreign Key Errors
```sql
-- Temporarily disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;
-- Run cleanup queries
SET FOREIGN_KEY_CHECKS = 1;
```

### Auto-Increment Reset Issues
```sql
-- Check current auto-increment values
SELECT table_name, auto_increment 
FROM information_schema.tables 
WHERE table_schema = 'tsoam_church' 
AND auto_increment IS NOT NULL;

-- Reset specific table
ALTER TABLE table_name AUTO_INCREMENT = 1;
```

### Incomplete Cleanup
If some demo data remains:
1. Check the cleanup logs: `logs/cleanup.log`
2. Run individual module cleanups
3. Use manual SQL queries above
4. Contact support if issues persist

---

**Remember**: After cleanup, your system will start fresh with no demo data. This is the clean state needed for production use.
