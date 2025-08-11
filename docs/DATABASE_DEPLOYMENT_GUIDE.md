# TSOAM Church Management System - Database Deployment Guide

## 🎯 Overview

This guide ensures the TSOAM Church Management System database is properly configured with all required tables, indexes, and data for production deployment. The system includes comprehensive enterprise features with zero database errors.

## 📋 Database Features

### Core System Tables
- ✅ **Users Management** - Authentication, roles, sessions
- ✅ **Password Resets** - Secure password recovery
- ✅ **System Settings** - Configurable application settings
- ✅ **Audit Trail** - Complete change tracking
- ✅ **System Logs** - Application monitoring

### Member Management
- ✅ **Members** - Full membership records
- ✅ **New Members** - Visitor to member transition tracking
- ✅ **Tithe Records** - Complete financial giving history

### HR Management (Enterprise)
- ✅ **Employees** - Comprehensive employee records
- ✅ **Leave Types** - Configurable leave categories
- ✅ **Leave Balances** - Automatic accrual tracking
- ✅ **Leave Requests** - Multi-level approval workflow
- ✅ **Leave Approval History** - Complete approval audit
- ✅ **Performance Reviews** - Annual/quarterly evaluations
- ✅ **Performance Competencies** - Detailed skill assessments

### Appointment Management (Enterprise)
- ✅ **Appointments** - Comprehensive scheduling
- ✅ **Appointment Participants** - Multi-participant support
- ✅ **Appointment Resources** - Resource booking
- ✅ **Appointment Reminders** - Automated notifications

### Finance Management
- ✅ **Financial Transactions** - Complete transaction records
- ✅ **Budgets** - Budget planning and tracking
- ✅ **Advanced Reporting** - Financial analytics

### Welfare Management
- ✅ **Welfare Requests** - Assistance applications
- ✅ **Multi-level Approval** - Structured review process

### Event Management
- ✅ **Events** - Comprehensive event planning
- ✅ **Event Registrations** - Registration management

### Inventory Management
- ✅ **Inventory Items** - Asset tracking
- ✅ **Inventory Movements** - Stock movements
- ✅ **Maintenance Records** - Asset maintenance

### Messaging System
- ✅ **Messages** - Communication platform
- ✅ **Message Templates** - Reusable templates
- ✅ **Message Recipients** - Delivery tracking

### Document Management
- ✅ **Document Uploads** - File management system

### Notification System
- ✅ **Notifications** - Real-time alerts

## 🚀 Quick Deployment

### One-Command Deployment
```bash
npm run deploy:production
```

This command will:
1. Verify environment
2. Initialize enterprise database
3. Build production assets
4. Generate deployment report

## 📖 Detailed Deployment Steps

### Step 1: Environment Setup

#### Database Configuration
Create or update your environment variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=tsoam_church_db

# Application Configuration
NODE_ENV=production
VITE_API_URL=https://your-domain.com/api
```

#### System Requirements
- Node.js 16.0.0 or higher
- MySQL 8.0 or higher
- Minimum 2GB RAM
- 10GB disk space

### Step 2: Verify Environment
```bash
npm run verify:environment
```

This checks:
- Node.js version compatibility
- Environment variables
- Database connectivity
- Required files

### Step 3: Initialize Enterprise Database
```bash
npm run init:enterprise
```

Features:
- Creates all 30+ required tables
- Configures indexes for performance
- Inserts default data
- Validates data integrity

### Step 4: Build Production Assets
```bash
npm run build-production
```

### Step 5: Start Production Server
```bash
npm start
```

## 🔧 Database Management Scripts

### Initialize Database Only
```bash
npm run init:enterprise
```

### Create Database Backup
```bash
# Manual backup
npm run backup-db

# Programmatic backup (includes enterprise features)
node -e "require('./database/init_enterprise.js').createBackup()"
```

### Verify Database Health
```bash
npm run health-check
```

### Reset Database (Development Only)
```bash
npm run reset-db
```

## 📊 Database Schema Details

### Enterprise Tables Summary

| Category | Tables | Records (Est.) |
|----------|--------|----------------|
| Core System | 6 | 100+ |
| Member Management | 3 | 500+ |
| HR Management | 7 | 200+ |
| Appointments | 4 | 300+ |
| Finance | 3 | 1000+ |
| Welfare | 1 | 50+ |
| Events | 2 | 100+ |
| Inventory | 3 | 200+ |
| Messaging | 3 | 500+ |
| Documents | 1 | 100+ |
| Notifications | 1 | 1000+ |

**Total: 34 Tables with comprehensive relationships**

### Key Features

#### 1. Leave Management System
- **6 Leave Types** by default (Annual, Sick, Maternity, Paternity, Emergency, Study)
- **Automatic Balance Calculation** with carry-over support
- **Multi-level Approval Workflow** (Supervisor → HR → Executive)
- **Document Attachments** with verification
- **Compliance Checking** against policies

#### 2. Performance Review System
- **Annual/Quarterly Reviews** with customizable competencies
- **360-degree Feedback** support
- **Development Planning** with goal setting
- **Rating Scales** and analytics

#### 3. Appointment System
- **Resource Booking** (rooms, equipment, vehicles)
- **Multi-participant** scheduling
- **Automatic Reminders** (email, SMS, in-app)
- **Conflict Detection** and resolution

#### 4. Financial Management
- **Multi-currency Support** (default KSH)
- **Budget Tracking** with variance analysis
- **Tithe Management** with receipt generation
- **Expense Approval** workflows

## 🔐 Security Features

### Data Protection
- **Encrypted Password Storage** (bcrypt)
- **Session Management** with timeout
- **Audit Trail** for all changes
- **Role-based Access Control**

### Database Security
- **Foreign Key Constraints** for data integrity
- **Input Validation** at database level
- **SQL Injection Protection**
- **Backup Encryption** support

## 📈 Performance Optimization

### Automatic Optimizations
- **30+ Performance Indexes** for fast queries
- **Generated Columns** for calculated fields
- **Connection Pooling** for scalability
- **Query Caching** strategies

### Monitoring
- **Real-time Health Checks**
- **Performance Metrics** tracking
- **Slow Query Detection**
- **Database Size Monitoring**

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database credentials
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME

# Verify environment variables
node -e "console.log(process.env.DB_HOST)"
```

#### Missing Tables
```bash
# Reinitialize database
npm run init:enterprise

# Check table creation
mysql -u $DB_USER -p -e "SHOW TABLES;" $DB_NAME
```

#### Performance Issues
```bash
# Optimize database
node -e "require('./database/init_enterprise.js').optimizeDatabase()"

# Check slow queries
mysql -u $DB_USER -p -e "SHOW PROCESSLIST;" $DB_NAME
```

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| DB001 | Connection timeout | Check network and credentials |
| DB002 | Table creation failed | Verify permissions |
| DB003 | Data insertion failed | Check constraints |
| DB004 | Index creation failed | Review table structure |

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database credentials verified
- [ ] Required ports available (3306 for MySQL)
- [ ] Sufficient disk space
- [ ] Network connectivity tested

### Deployment
- [ ] `npm run verify:environment` passes
- [ ] `npm run init:enterprise` completes successfully
- [ ] All 34 tables created
- [ ] Default data inserted
- [ ] Indexes created
- [ ] `npm run build-production` successful

### Post-deployment
- [ ] Application starts without errors
- [ ] Database connection established
- [ ] Admin login works (admin@tsoam.org)
- [ ] All modules accessible
- [ ] Performance monitoring active

## 🎉 Success Indicators

### Database Health
✅ **Connected**: Database connection active  
✅ **Tables**: All 34 tables created  
✅ **Indexes**: Performance indexes active  
✅ **Data**: Default data loaded  
✅ **Constraints**: Foreign keys enforced  

### Application Health
✅ **Authentication**: User login working  
✅ **Modules**: All features accessible  
✅ **Performance**: Response times < 100ms  
✅ **Security**: Audit logging active  
✅ **Monitoring**: Health checks passing  

## 📞 Support

### Resources
- **Deployment Report**: Check `deployment-report.json`
- **Database Status**: Available in admin dashboard
- **System Logs**: Located in `logs/` directory
- **Health Endpoint**: `/api/health/database`

### Getting Help
1. Review deployment report for detailed information
2. Check system logs for specific errors
3. Use database status component for real-time monitoring
4. Consult troubleshooting section above

---

**🎯 The TSOAM Church Management System is now ready for enterprise production use with a comprehensive, error-free database!**
