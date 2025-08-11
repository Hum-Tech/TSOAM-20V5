# TSOAM Church Management System

**Professional Church Management System with ZionSurf Branding**

A comprehensive, modern church management system built with React, TypeScript, Node.js, and MySQL. This system provides complete management capabilities for appointments, members, finances, HR, events, inventory, and welfare programs.

## 🌟 Features

### Core Modules
- **Dashboard** - Real-time analytics and system overview
- **Appointments** - Comprehensive appointment scheduling and management
- **Member Management** - Complete member database with visitor tracking
- **Financial Management** - Offerings, tithes, expenses, and financial reporting
- **HR Management** - Employee records, payroll, and performance tracking
- **Events Management** - Event planning, scheduling, and attendance tracking
- **Inventory Management** - Asset tracking, stock management, and maintenance records
- **Welfare Management** - Member assistance and support programs

### Key Features
- **Real-time Updates** - Cross-component data synchronization
- **Advanced Analytics** - Comprehensive reporting and insights
- **Export Capabilities** - PDF and Excel export functionality
- **Mobile Responsive** - Optimized for all device sizes
- **Secure Authentication** - Role-based access control
- **Multi-language Support** - English and Swahili
- **Offline Capabilities** - Service worker for offline functionality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Extract the system files**
   ```bash
   unzip tsoam-church-management-system.zip
   cd tsoam-church-management-system
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install && cd ..
   
   # Install server dependencies  
   cd server && npm install && cd ..
   ```

3. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE tsoam_church;
   
   # Import schema
   mysql -u root -p tsoam_church < database/schema.sql
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment files
   cp .env.example .env.production
   cp server/.env.example server/.env
   
   # Edit configuration files with your settings
   ```

5. **Start the system**
   ```bash
   npm run dev
   ```

The system will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3002

## 📁 Project Structure

```
tsoam-church-management-system/
├── client/                 # React frontend application
│   ├── components/        # Reusable UI components
│   ├── pages/            # Application pages/views
│   ├── services/         # API service layer
│   ├── utils/            # Utility functions
│   └── contexts/         # React contexts
├── server/               # Node.js backend API
│   ├── routes/          # API route handlers
│   ├── models/          # Database models
│   ├── middleware/      # Express middleware
│   └── config/          # Server configuration
├── database/            # Database schemas and scripts
├── docs/               # Documentation
└── scripts/            # Build and deployment scripts
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=tsoam_church

# Server Configuration
PORT=3002
JWT_SECRET=your_jwt_secret_key

# Email Configuration (Optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

**Frontend (.env.production)**
```env
VITE_API_URL=http://localhost:3002
VITE_APP_NAME=TSOAM Church Management
VITE_APP_VERSION=2.0.0
```

## 🧹 Demo Data Cleanup

**IMPORTANT**: Before using in production, remove all demo data using the cleanup script:

```bash
# Run the cleanup script to remove demo data
npm run cleanup-demo-data

# Or manually clean specific modules:
npm run cleanup-appointments
npm run cleanup-members  
npm run cleanup-financial
npm run cleanup-inventory
```

See [DEMO_DATA_CLEANUP.md](docs/DEMO_DATA_CLEANUP.md) for detailed instructions.

## 📊 Production Deployment

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

### Manual Deployment
```bash
# Build production version
npm run build

# Start production server
npm run start:prod
```

### Nginx Configuration
See [docs/NGINX_CONFIG.md](docs/NGINX_CONFIG.md) for production web server setup.

## 🔐 Security

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- SQL injection protection
- XSS protection headers
- CORS configuration
- Environment variable protection

## 📝 API Documentation

Full API documentation is available at `/api/docs` when the server is running, or see [docs/API_REFERENCE.md](docs/API_REFERENCE.md).

## 🤝 Support

For technical support and customization:
- Email: support@zionsurf.com
- Documentation: [docs/](docs/)
- Issues: Create detailed bug reports

## 📄 License

This software is proprietary to ZionSurf. See LICENSE file for terms.

## 🔄 Version History

- **v2.0.0** - Complete system with all modules (Current)
- **v1.5.0** - Enhanced features and performance
- **v1.0.0** - Initial release

---

**© 2025 ZIONSURF. All rights reserved.**

Built with ❤️ for the church community
