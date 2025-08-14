# TSOAM MySQL Database Setup Guide

## Complete Step-by-Step Setup for Production Use

### Prerequisites ✅

1. **MySQL Server** running (XAMPP, WAMP, MAMP, or standalone MySQL)
2. **Node.js** >= 18.0.0 installed
3. **Git** (if cloning repository)

### Step 1: Start MySQL Server 🚀

**Choose your method:**

**XAMPP Users:**
```bash
# Open XAMPP Control Panel
# Click "Start" next to MySQL
# Verify MySQL is running (green indicator)
```

**WAMP Users:**
```bash
# Open WAMP
# Ensure WAMP icon is green
# MySQL should be running automatically
```

**Windows Service:**
```bash
# Press Win+R, type: services.msc
# Find "MySQL" service
# Right-click → Start
```

**Command Line (Linux/macOS):**
```bash
# Linux
sudo systemctl start mysql

# macOS with Homebrew
brew services start mysql
```

### Step 2: Verify MySQL Connection 🔍

```bash
# Check if MySQL is accessible
npm run mysql:check
```

**Expected Output:**
```
✅ MySQL connection successful!
📊 MySQL Version: 8.0.x
📁 Found X databases
🚀 Ready to initialize TSOAM database!
```

### Step 3: Initialize Complete Database 🏗️

```bash
# Create all tables and default data
npm run db:init
```

**This will create:**
- ✅ **19 Core Tables** (users, members, employees, etc.)
- ✅ **Default Users** (admin, hr, finance)
- ✅ **System Settings** (church info, security settings)
- ✅ **Leave Types** (annual, sick, maternity, etc.)
- ✅ **Sample Data** for testing

### Step 4: Test Database Synchronization 🧪

```bash
# Comprehensive database test
npm run db:test
```

**This verifies:**
- ✅ All 19 tables exist and are accessible
- ✅ Authentication system works
- ✅ Account creation functions properly
- ✅ Password reset system works
- ✅ Data synchronization is working
- ✅ All default users can login

### Step 5: Build and Start System 🚀

```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Step 6: Access the System 🌐

1. **Open Browser:** http://localhost:3001
2. **Login Options:**

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | admin@tsoam.org | admin123 | Full system access, user management |
| **HR** | hr@tsoam.org | hr123 | HR management, employee records |
| **Finance** | finance@tsoam.org | finance123 | Financial management, reports |

### Core System Features ✨

#### 🔐 **Authentication & Security**
- ✅ Secure login with bcrypt password hashing
- ✅ Role-based access control (Admin, HR, Finance, User)
- ✅ Password reset with email verification
- ✅ Account creation with proper validation
- ✅ Session management and timeout

#### 👥 **Member Management**  
- ✅ Complete member registration
- ✅ Visitor tracking and conversion
- ✅ Member status management
- ✅ Service group assignments
- ✅ Emergency contact information

#### 💰 **Financial Management**
- ✅ Tithe and offering tracking
- ✅ Expense management
- ✅ Budget planning and monitoring
- ✅ Financial reporting
- ✅ Transaction categorization

#### 👨‍💼 **HR Management**
- ✅ Employee records and profiles
- ✅ Leave management system
- ✅ Performance tracking
- ✅ Payroll information
- ✅ Department organization

#### 📅 **Event & Appointment Management**
- ✅ Church event planning
- ✅ Appointment scheduling
- ✅ Calendar integration
- ✅ Registration management
- ✅ Venue and resource booking

#### 🤝 **Welfare Management**
- ✅ Assistance request tracking
- ✅ Case management
- ✅ Approval workflows
- ✅ Disbursement tracking
- ✅ Follow-up management

#### 📦 **Inventory Management**
- ✅ Asset tracking
- ✅ Maintenance scheduling
- ✅ Location management
- ✅ Condition monitoring
- ✅ Purchase tracking

#### 💬 **Communication System**
- ✅ Internal messaging
- ✅ Bulk communication
- ✅ Email integration
- ✅ Notification system
- ✅ Template management

### Database Tables Overview 📊

**Core System (5 tables):**
- `users` - System users and authentication
- `password_resets` - Password recovery system
- `user_sessions` - Session management
- `system_settings` - Application configuration
- `system_logs` - Audit trail and logging

**Member Management (2 tables):**
- `members` - Active church members
- `new_members` - Visitors and new converts

**HR Management (3 tables):**
- `employees` - Staff records
- `leave_types` - Leave category definitions
- `leave_requests` - Leave application system

**Financial Management (2 tables):**
- `financial_transactions` - All financial records
- `tithe_records` - Tithe and offering tracking

**Operations (5 tables):**
- `events` - Church events and activities
- `appointments` - Meeting scheduling
- `welfare_requests` - Assistance applications
- `inventory_items` - Asset and equipment tracking
- `messages` - Communication system

**Support (2 tables):**
- `document_uploads` - File management
- `notifications` - System notifications

### Troubleshooting Common Issues 🔧

#### Issue: "MySQL connection failed"
**Solution:**
```bash
# Check if MySQL is running
npm run mysql:check

# Start MySQL service
# XAMPP: Start MySQL in control panel
# Windows: Start MySQL service in services.msc
# Linux: sudo systemctl start mysql
```

#### Issue: "Database setup failed"
**Solution:**
```bash
# Verify MySQL user has privileges
# Login to MySQL as root:
mysql -u root -p

# Grant privileges:
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

# Then retry initialization:
npm run db:init
```

#### Issue: "Login not working"
**Solution:**
```bash
# Test database synchronization
npm run db:test

# Verify default users exist
# If test fails, reinitialize database:
npm run db:init
```

#### Issue: "Account creation fails"
**Solution:**
```bash
# Check database tables
npm run db:test

# Ensure all required tables exist
# Check user has INSERT privileges on users table
```

### Security Best Practices 🔒

1. **Change Default Passwords:**
   - Login with default credentials
   - Go to Settings → Change Password
   - Use strong passwords (8+ characters, mixed case, numbers)

2. **Regular Backups:**
   - System automatically creates daily backups
   - Manual backup: Export MySQL database regularly

3. **User Management:**
   - Create individual accounts for each user
   - Assign appropriate roles based on responsibilities
   - Regularly review user permissions

4. **Environment Security:**
   - Keep .env file secure and private
   - Use strong JWT secrets in production
   - Enable HTTPS in production environments

### Production Deployment Tips 🚀

1. **Database Optimization:**
   - Use dedicated MySQL server for production
   - Configure appropriate connection limits
   - Set up database replication for high availability

2. **Performance Monitoring:**
   - Monitor database query performance
   - Set up logging and error tracking
   - Regular system health checks

3. **Backup Strategy:**
   - Automated daily database backups
   - Off-site backup storage
   - Regular backup restoration testing

### Support & Maintenance 🛠️

**Regular Maintenance Tasks:**
- Weekly database optimization
- Monthly user access review
- Quarterly system updates
- Annual security audit

**Monitoring Commands:**
```bash
npm run mysql:check    # Check MySQL connection
npm run db:test       # Test database synchronization
npm run verify        # System verification
npm run health-check  # Server health check
```

---

**TSOAM Church Management System**  
*Complete MySQL Database Setup Guide*  
*Version 2.0 - Production Ready*
