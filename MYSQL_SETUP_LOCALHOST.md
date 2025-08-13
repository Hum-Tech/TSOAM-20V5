# MySQL Setup for TSOAM Church Management System - Localhost

## 🔧 MySQL Installation & Configuration

The system is currently falling back to SQLite because MySQL is not available. Here's how to set up MySQL on your localhost:

### Windows Installation

1. **Download MySQL**
   - Go to: https://dev.mysql.com/downloads/installer/
   - Download MySQL Installer for Windows
   - Choose "mysql-installer-community"

2. **Install MySQL**
   ```bash
   # Run the installer and choose:
   - Developer Default (includes MySQL Server, Workbench, etc.)
   - Set root password (remember this!)
   - Default port: 3306
   ```

3. **Start MySQL Service**
   ```bash
   # Open Services (services.msc)
   # Find "MySQL80" service
   # Set to "Automatic" and Start
   ```

### macOS Installation

```bash
# Using Homebrew
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation (optional)
mysql_secure_installation
```

### Linux Installation

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure installation
sudo mysql_secure_installation
```

## 🗄️ Database Configuration

Once MySQL is installed and running, update your configuration:

### 1. Create Database Configuration

Create/update `server/.env` file:

```env
PORT=3004
NODE_ENV=production
USE_SQLITE=false

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=tsoam_church_db
```

### 2. Test MySQL Connection

Run the connection test:

```bash
npm run test:mysql
```

### 3. Initialize Database

```bash
npm run mysql:init
```

## 🚀 Quick Start Commands

```bash
# 1. Install MySQL (Windows)
# Download from: https://dev.mysql.com/downloads/installer/

# 2. Update server configuration
# Edit server/.env with your MySQL credentials

# 3. Test connection
npm run test:mysql

# 4. Initialize database
npm run mysql:init

# 5. Restart server
npm run dev
```

## 🔍 Troubleshooting

### Connection Refused Error
```
❌ MySQL connection failed: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**
1. Check if MySQL service is running
2. Verify port 3306 is not blocked
3. Ensure MySQL is installed
4. Check firewall settings

### Authentication Error
```
❌ Access denied for user 'root'@'localhost'
```

**Solutions:**
1. Verify password in `.env` file
2. Reset MySQL root password
3. Check user permissions

### Database Doesn't Exist
```
❌ Unknown database 'tsoam_church_db'
```

**Solutions:**
1. Run the MySQL initialization script
2. Create database manually in MySQL Workbench
3. Check database name spelling

## ✅ Verification Steps

After setup, you should see:

```
✅ MySQL database connected successfully to: tsoam_church_db
📍 Host: localhost Port: 3306
🔄 MySQL database synchronization ready
```

Instead of:

```
🔄 Using SQLite database for development...
```

## 🗄️ Database Schema

The system will automatically create these tables:
- users (authentication)
- members (church members)
- messages (internal messaging)
- inventory (asset management)
- financial_transactions (finance tracking)
- system_logs (audit trails)
- payroll_records (HR payroll)
- And many more...

## 📞 Support

If you need help with MySQL setup:
1. Check MySQL documentation
2. Verify Windows/Mac MySQL installation guides
3. Ensure MySQL service is running
4. Test connection with MySQL Workbench first
