# TSOAM Project Structure

## Overview
This document outlines the organized file structure of the TSOAM Church Management System.

## Root Directory Structure

```
TSOAM-Church-Management/
├── client/                    # Frontend React application
│   ├── components/           # Reusable UI components
│   ├── pages/               # Application pages/routes
│   ├── services/            # API service layers
│   ├── utils/               # Utility functions
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Third-party library configurations
│   ├── package.json         # Frontend dependencies
│   └── vite.config.ts       # Vite build configuration
│
├── server/                    # Backend Express.js application
│   ├── routes/              # API route handlers
│   ├── models/              # Database models
│   ├── middleware/          # Express middleware
│   ├── config/              # Server configuration
│   ├── database/            # Database utilities
│   ├── scripts/             # Server-side scripts
│   ├── uploads/             # File upload storage
│   ├── package.json         # Backend dependencies
│   └── server.js            # Main server entry point
│
├── database/                  # Database schemas and migrations
│   ├── schemas/             # Database table schemas
│   ├── config.js            # Database configuration
│   └── README.md            # Database documentation
│
├── scripts/                   # Utility and setup scripts
│   ├── database-init-complete.js  # Database initialization
│   ├── install-dependencies.js    # Dependency installer
│   └── check-mysql.js            # MySQL connection tester
│
├── docs/                      # Documentation
│   ├── INSTALLATION.md       # Installation guide
│   ├── DEPLOYMENT.md         # Deployment guide
│   └── PROJECT_STRUCTURE.md  # This file
│
├── public/                    # Static assets
│   ├── placeholder.svg       # Default images
│   ├── robots.txt           # SEO configuration
│   └── offline.html         # Offline page
│
├── shared/                    # Shared utilities between client/server
│   └── api.ts               # Shared API types
│
├── .env.example              # Environment configuration template
├── .gitignore               # Git ignore rules
├── package.json             # Root dependencies and scripts
├── README.md                # Main documentation
└── start-production.js      # Production startup script
```

## Key Directories Explained

### `/client` - Frontend Application
- **Purpose**: React-based user interface
- **Technology**: React, TypeScript, Vite, Tailwind CSS
- **Build Output**: `client/dist/` (production build)

### `/server` - Backend Application  
- **Purpose**: Express.js API server
- **Technology**: Node.js, Express, MySQL/SQLite
- **Entry Point**: `server/server.js`

### `/database` - Database Layer
- **Purpose**: Database schemas, migrations, and utilities
- **Supports**: MySQL 8.0+ and SQLite fallback

### `/scripts` - Utility Scripts
- **Purpose**: Setup, installation, and maintenance scripts
- **Usage**: Called via npm scripts in package.json

### `/docs` - Documentation
- **Purpose**: Installation, deployment, and project documentation
- **Audience**: Developers, system administrators

## Important Files

### Configuration Files
- `.env` - Environment configuration (copied from .env.example)
- `package.json` - Root dependencies and npm scripts
- `client/package.json` - Frontend dependencies
- `server/package.json` - Backend dependencies

### Entry Points
- `server/server.js` - Main server application
- `client/main.tsx` - Frontend application entry
- `start-production.js` - Production startup script

### Setup Scripts
- `scripts/install-dependencies.js` - Installs all dependencies
- `scripts/database-init-complete.js` - Initializes database
- `scripts/check-mysql.js` - Tests database connection

## File Organization Principles

1. **Separation of Concerns**: Frontend, backend, and database are clearly separated
2. **Logical Grouping**: Related files are grouped in appropriate directories
3. **Clear Naming**: File and directory names clearly indicate their purpose
4. **Documentation**: Each major component has accompanying documentation
5. **Production Ready**: Only essential files for deployment are included

## Development vs Production

### Development Files (Not in Production)
- Source code in `client/src/`
- TypeScript files
- Development dependencies
- Test files

### Production Files
- Built frontend in `client/dist/`
- Compiled/transpiled backend code
- Production dependencies only
- Minified and optimized assets

## Clean Structure Benefits

1. **Easy Download/Install**: Clear structure for deployment
2. **Maintainable**: Logical organization for future updates
3. **Scalable**: Structure supports growing application
4. **Professional**: Industry-standard organization
5. **Documentation**: Comprehensive guides for setup and deployment

This organized structure ensures the TSOAM Church Management System is professional, maintainable, and ready for production deployment.
