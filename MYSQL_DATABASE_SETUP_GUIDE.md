# TSOAM Church Management System - MySQL Database Setup Guide

## Issues Fixed

### ✅ 1. npm start Error Resolution
**Problem**: `npm start` was looking for `server/index.js` but only `server/index.ts` existed
**Solution**: Updated `package.json` start script to point to `server/server.js`

### ✅ 2. MySQL Database Compatibility  
**Problem**: Database initialization used SQLite syntax incompatible with MySQL
**Solution**: 
- Rewrote `server/init-complete-db.js` with proper MySQL syntax
- Added MySQL-specific data types (ENUM, AUTO_INCREMENT, ENGINE=InnoDB)
- Fixed all table schemas for MySQL compatibility
- Added foreign key constraints with proper CASCADE rules

### ✅ 3. In-App Notification Reply System
**Problem**: Replies were sent but not appearing on receiver's side
**Solution**:
- Enhanced messages API with reply endpoints (`/api/messages/reply`)
- Added `message_replies` table to track conversation threads
- Updated notification system to use database instead of localStorage only
- Fixed reply handling in Header component to use database API

## Database Schema

The system now creates the following MySQL tables:

### Core Tables
1. **users** - User authentication and roles
2. **members** - Church members management
3. **messages** - Internal messaging system
4. **message_replies** - Conversation threading
5. **inventory** - Equipment and asset management
6. **financial_transactions** - Financial records
7. **events** - Event scheduling
8. **appointments** - Appointment booking
9. **hr_employees** - HR employee records
10. **welfare_cases** - Welfare case management
11. **documents** - Document management
12. **system_logs** - Audit trail

## MySQL Setup Instructions

### For Localhost Development

1. **Install MySQL** (if not already installed):
   - **Windows**: Download MySQL installer from mysql.com
   - **macOS**: `brew install mysql` or use MySQL installer
   - **Linux**: `sudo apt install mysql-server` (Ubuntu/Debian)

2. **Start MySQL Service**:
   - **Windows**: Start MySQL service in Services panel
   - **macOS**: `brew services start mysql`
   - **Linux**: `sudo systemctl start mysql`

3. **Create Database Configuration**:
   Create or update `.env` file in project root:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=tsoam_church_db
   ```

4. **Initialize Database**:
   ```bash
   npm run db:init
   ```

5. **Start the System**:
   ```bash
   npm start
   ```

### Verification Commands

- Test MySQL connection: `node verify-mysql.js`
- Check health: `curl http://localhost:3004/api/health`
- Initialize database: `npm run db:init`

## Features Working

### ✅ Database Persistence
- All data now saves to MySQL database (not localStorage)
- User authentication through database
- Complete CRUD operations for all modules

### ✅ In-App Notifications with Replies
- Users can send and receive notifications
- Reply functionality works bidirectionally  
- Replies appear in real-time on receiver's side
- Conversation threading maintained
- Read receipts and delivery tracking

### ✅ System Reliability
- Automatic fallback to SQLite if MySQL unavailable
- Error handling and logging
- Production-ready configuration

## Default Admin Account

After database initialization:
- **Email**: admin@tsoam.org
- **Password**: admin123

## Troubleshooting

### MySQL Connection Issues
1. **ECONNREFUSED**: MySQL server not running
   - Start MySQL service on your system
   - Check if port 3306 is available

2. **Access Denied**: Wrong credentials
   - Update `.env` file with correct MySQL credentials
   - Ensure MySQL user has database creation privileges

3. **Database Not Found**: 
   - Run `npm run db:init` to create database and tables
   - Verify MySQL user permissions

### Message Reply Issues
- Check network connectivity
- Verify user authentication
- Ensure database tables are properly created
- Check browser console for JavaScript errors

## Production Deployment

For production deployment:
1. Set up MySQL server with proper security
2. Create production database user with limited privileges
3. Update `.env` with production credentials
4. Run database initialization
5. Configure backup procedures

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for specific error messages
3. Verify MySQL server status and credentials
4. Ensure all npm dependencies are installed

The system is now fully configured for MySQL and all messaging features work correctly with database persistence.
