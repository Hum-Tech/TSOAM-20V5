# TSOAM Church Management System

A comprehensive church management system for The Seed of Abraham Ministry (TSOAM) built with React.js frontend and Node.js/Express backend.

## Features

- **Member Management** - Complete member registration, tracking, and management
- **Financial Management** - Tithe tracking, expense management, budget planning
- **HR Management** - Employee records, leave management, performance tracking
- **Event Management** - Church events, appointments, calendar management
- **Welfare Management** - Assistance requests and welfare case management
- **Inventory Management** - Asset tracking and maintenance
- **Messaging System** - Internal communication and notifications
- **User Management** - Role-based access control and authentication

## System Requirements

- **Node.js** >= 18.0.0
- **MySQL** >= 8.0 (recommended) or SQLite (fallback)
- **npm** >= 8.0.0

## Quick Start

### 1. MySQL Setup (Recommended)

**Start MySQL server:**
- **XAMPP**: Open XAMPP Control Panel → Start MySQL
- **WAMP**: Open WAMP → Start MySQL service
- **MAMP**: Open MAMP → Start MySQL
- **Windows Service**: services.msc → Start MySQL service
- **Linux**: `sudo systemctl start mysql`
- **macOS**: `brew services start mysql`

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tsoam_church_db

# Server Configuration
PORT=3001
NODE_ENV=production

# Security (optional)
JWT_SECRET=your_jwt_secret_here
```

### 3. Installation & Setup

**Option A: Automatic Setup (Windows)**
```cmd
# Run the setup script (installs everything)
setup-windows.bat
```

**Option B: Manual Setup (All Platforms)**
```bash
# Install all dependencies (root + client + server)
npm run install-all

# OR install step by step:
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Check MySQL connection
npm run mysql:check

# Initialize database (creates all tables)
npm run db:init

# Build frontend
npm run build

# Start production server
npm start
```

### 4. Access the System

- **URL**: http://localhost:3001
- **Admin Login**: admin@tsoam.org / admin123
- **HR Login**: hr@tsoam.org / hr123
- **Finance Login**: finance@tsoam.org / finance123

## Database Tables

The system creates **15+ comprehensive tables**:

✅ **Core Tables:**
- `users` - System users and authentication
- `user_sessions` - Session management
- `password_resets` - Password recovery
- `system_settings` - Application configuration
- `system_logs` - Audit trail and logging

✅ **Member Management:**
- `members` - Active church members
- `new_members` - Visitors in transition process

✅ **HR Management:**
- `employees` - Staff records and payroll
- `leave_requests` - Leave management system
- `leave_balances` - Leave entitlements tracking
- `performance_reviews` - Performance management

✅ **Financial Management:**
- `financial_transactions` - All financial records
- `tithe_records` - Tithe and offering tracking
- `budgets` - Budget planning and tracking

✅ **Operations:**
- `events` - Church events and activities
- `appointments` - Meeting and appointment scheduling
- `welfare_requests` - Assistance and welfare cases
- `inventory_items` - Asset and inventory tracking
- `messages` - Internal messaging system

## Available Scripts

```bash
# Database Management
npm run mysql:check      # Check MySQL connection
npm run db:init         # Initialize complete database
npm run mysql:setup     # Alternative database setup

# Development
npm run dev            # Start development servers
npm run build          # Build production frontend
npm start             # Start production server
npm run start:direct  # Start server directly

# Utilities
npm run health-check   # Server health verification

# Database Verification
npm run db:verify      # Complete MySQL compatibility check
npm run db:test-ops    # Test all database operations
```

## Troubleshooting

### MySQL Connection Issues

**Error: ECONNREFUSED**
- MySQL server is not running
- Start MySQL using your preferred method above

**Error: ER_ACCESS_DENIED_ERROR**
- Check username/password in .env file
- Verify MySQL user has proper privileges

**Error: Database setup failed**
- Ensure MySQL user has CREATE DATABASE privileges
- Run `npm run mysql:check` to diagnose

### Build Issues

**Error: 'vite' is not recognized as an internal or external command**
```bash
# The client dependencies aren't installed
# Solution:
cd client
npm install
cd ..
npm run build
```

**Error: Production build not found**
```bash
# Build the frontend first
npm run build
# Then start the server
npm start
```

**Complete Setup Issues**
```bash
# Use the install-all script to install everything
npm run install-all
# Then build and start
npm run build
npm start
```

**Build fails with dependency errors:**
```bash
cd client && npm install --force
npm run build
```

**Server won't start:**
- Check if port 3001 is available
- Verify all dependencies are installed
- Check .env configuration

## Project Structure

```
├── client/                 # React.js frontend
│   ├── components/        # Reusable UI components
│   ├── pages/            # Application pages
│   ├── contexts/         # React contexts
│   ├── services/         # API service layers
│   └── utils/           # Utility functions
├── server/               # Node.js backend
│   ├── routes/          # API endpoints
│   ├── models/          # Database models
│   ├── config/          # Configuration files
│   └── middleware/      # Express middleware
├── database/            # Database schemas
└── package.json        # Project configuration
```

## Default User Accounts

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | admin@tsoam.org | admin123 | Full system access |
| HR Officer | hr@tsoam.org | hr123 | HR management, user creation |
| Finance Officer | finance@tsoam.org | finance123 | Financial management |

## Security Features

- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Session management
- ✅ Password reset functionality
- ✅ Request rate limiting
- ✅ SQL injection prevention
- ✅ CORS protection

## Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Set production environment:**
   ```bash
   export NODE_ENV=production
   ```

3. **Configure MySQL production database**

4. **Start the server:**
   ```bash
   npm start
   ```

## Support

For technical support or questions about the TSOAM Church Management System, please contact the development team.

---

**The Seed of Abraham Ministry (TSOAM)**
*Church Management System v2.0*
