# TSOAM Church Management System

A comprehensive church management system built for The Seed of Abraham Ministry (TSOAM).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+ (or use SQLite fallback)
- npm or yarn

### Installation

1. **Clone/Download the repository**
   ```bash
   # Extract the downloaded files to your desired directory
   cd TSOAM-Church-Management
   ```

2. **Install dependencies**
   ```bash
   npm run install-deps
   ```

3. **Configure environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your database credentials
   # For MySQL: Update DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
   # For SQLite: Set USE_SQLITE=true
   ```

4. **Initialize database**
   ```bash
   npm run db:init
   ```

5. **Build and start**
   ```bash
   npm run build
   npm start
   ```

6. **Access the application**
   - Open: http://localhost:3002
   - Setup: http://localhost:3002/setup (if login issues)
   - Login: admin@tsoam.org / admin123

## 📁 Project Structure

```
TSOAM-Church-Management/
├── client/                 # React frontend application
├── server/                 # Express.js backend API
├── database/              # Database schemas and migrations  
├── scripts/               # Utility and setup scripts
├── docs/                  # Documentation
├── public/                # Static assets
├── .env.example          # Environment configuration template
├── package.json          # Root dependencies and scripts
└── README.md            # This file
```

## 🔧 Available Scripts

- `npm run install-deps` - Install all dependencies
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run dev` - Start development servers
- `npm run db:init` - Initialize/setup database
- `npm run mysql:check` - Check MySQL connection

## 🗄️ Database Setup

### Option 1: MySQL (Recommended)
1. Install MySQL 8.0+
2. Create a database for TSOAM
3. Update .env with your MySQL credentials
4. Run `npm run db:init`

### Option 2: SQLite (Fallback)
1. Set `USE_SQLITE=true` in .env
2. Run `npm run db:init`

## 🔐 Default Login

- **Email**: admin@tsoam.org
- **Password**: admin123

**⚠️ Important**: Change the default password after first login!

## 🆘 Troubleshooting

### Login Issues
1. Visit http://localhost:3002/setup
2. Click "Create Admin User"
3. Try logging in again

### Database Issues
1. Check MySQL is running
2. Verify .env credentials
3. Run `npm run mysql:check`

### Port Issues
- Default port: 3002
- Change PORT in .env if needed
- Ensure port is not in use

## 📞 Support

For support and questions:
- Email: admin@tsoam.org
- Documentation: ./docs/

## 📄 License

© 2025 The Seed of Abraham Ministry (TSOAM). All rights reserved.
