# TSOAM Installation Guide

## System Requirements

- **Node.js**: Version 18.0 or higher
- **Database**: MySQL 8.0+ (recommended) or SQLite (fallback)
- **Memory**: Minimum 2GB RAM
- **Storage**: 1GB free space
- **Operating System**: Windows, macOS, or Linux

## Step-by-Step Installation

### 1. Download and Extract
1. Download the TSOAM Church Management System package
2. Extract to your desired directory (e.g., `C:\TSOAM` or `/opt/tsoam`)
3. Open terminal/command prompt in the extracted directory

### 2. Install Dependencies
```bash
# Install all required dependencies
npm run install-deps

# This will install:
# - Root dependencies
# - Client (frontend) dependencies  
# - Server (backend) dependencies
```

### 3. Database Setup

#### Option A: MySQL Setup (Recommended)
1. **Install MySQL 8.0+**
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Follow installation wizard
   - Remember your root password

2. **Create Database**
   ```sql
   CREATE DATABASE tsoam_church_db;
   ```

3. **Configure Environment**
   ```bash
   # Copy template
   cp .env.example .env
   
   # Edit .env file with your details:
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=tsoam_church_db
   ```

#### Option B: SQLite Setup (Fallback)
```bash
# Edit .env file:
USE_SQLITE=true
```

### 4. Initialize Database
```bash
# Create tables and default data
npm run db:init
```

### 5. Build Application
```bash
# Build frontend for production
npm run build
```

### 6. Start Server
```bash
# Start production server
npm start
```

### 7. Access Application
1. Open browser to: http://localhost:3002
2. If login issues, visit: http://localhost:3002/setup
3. Login with: admin@tsoam.org / admin123

## Windows Installation

### Using Command Prompt:
```cmd
cd C:\TSOAM
npm run install-deps
copy .env.example .env
REM Edit .env with notepad
npm run db:init
npm run build
npm start
```

### Using PowerShell:
```powershell
Set-Location C:\TSOAM
npm run install-deps
Copy-Item .env.example .env
# Edit .env with your preferred editor
npm run db:init
npm run build
npm start
```

## Linux/macOS Installation

```bash
cd /opt/tsoam
npm run install-deps
cp .env.example .env
# Edit .env with nano/vim/etc
nano .env
npm run db:init
npm run build
npm start
```

## Troubleshooting

### Common Issues

1. **"Node not found"**
   - Install Node.js from https://nodejs.org
   - Restart terminal after installation

2. **"MySQL connection failed"**
   - Check MySQL is running
   - Verify credentials in .env
   - Use SQLite as fallback

3. **"Port already in use"**
   - Change PORT in .env
   - Stop other services using the port

4. **"Cannot login"**
   - Visit /setup page
   - Click "Create Admin User"
   - Clear browser cache

### Getting Help

1. Check logs in terminal
2. Visit setup page: /setup
3. Check environment configuration
4. Contact support: admin@tsoam.org

## Next Steps

1. Change default admin password
2. Create additional user accounts
3. Configure church information
4. Import member data
5. Set up regular backups

## Production Deployment

For production deployment on a server:

1. Use a process manager (PM2)
2. Set up reverse proxy (nginx)
3. Configure SSL certificates
4. Set up regular backups
5. Monitor system performance

Contact support for detailed production setup assistance.
