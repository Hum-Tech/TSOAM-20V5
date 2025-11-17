# TSOAM Church Management System - Code Organization Guide

## Project Structure Overview

### Root Directory Files
```
/ (Root)
├── package.json                 # Project dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Build tool configuration
├── .env                        # Environment variables (local development)
├── .env.production             # Production environment variables
├── .gitignore                  # Git ignore rules
├── README.md                   # Project README with setup instructions
├── CODE_ORGANIZATION_GUIDE.md  # This file - code structure documentation
├── Procfile                    # Process file for deployment
├── fly.toml                    # Fly.io deployment configuration
└── package-lock.json           # Locked package versions
```

### Main Application Directories

#### `/client` - Frontend React Application
```
client/
├── main.tsx                    # React application entry point
├── index.html                  # HTML template
├── global.css                  # Global styles
├── App.tsx                     # Main app component with routing
├── main.tsx.bak               # REMOVE - Old backup file
│
├── contexts/                   # React Context for state management
│   ├── AuthContext.tsx        # Authentication and authorization context
│   │   └── Comments: Comprehensive JWT auth, role-based access, session management
│   └── [other contexts]
│
├── hooks/                      # Custom React hooks
│   ├── use-toast.ts           # Toast notification hook
│   ├── use-mobile.tsx         # Mobile responsiveness hook
│   ├── useModuleAccess.ts     # Module access permission hook
│   └── [other custom hooks]
│
├── services/                   # Business logic and API integration
│   ├── ApiAppointmentService.ts    # Appointment API operations
│   ├── ApiEventService.ts          # Event API operations
│   ├── ApiFinancialService.ts      # Financial API operations
│   ├── AuthService.ts              # Authentication service
│   ├── BackupService.ts            # Data backup operations
│   ├── ExportService.ts            # Data export functionality (PDF, Excel)
│   ├── HomeCellService.ts          # Home cell management service
│   ├── HomeCellHierarchyService.ts # District/Zone/Homecell hierarchy
│   ├── RoleBasedAccessService.ts   # RBAC permission checking
│   ├── TransferService.ts          # Member transfer operations
│   └── SettingsService.ts          # System settings management
│
├── components/                 # Reusable UI components
│   ├── layout/
│   │   ├── Header.tsx         # Top navigation header
│   │   ├── Layout.tsx         # Main page layout wrapper
│   │   ├── PageHeader.tsx     # Page section headers
│   │   └── Sidebar.tsx        # Left navigation menu
│   │
│   ├── ui/                    # UI primitives (button, input, card, etc.)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── table.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── checkbox.tsx
│   │   ├── label.tsx
│   │   ├── toast.tsx
│   │   ├── sonner.tsx         # Sonner toast library wrapper
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   └── [other UI components]
│   │
│   ├── settings/              # Settings-related components
│   │   └── HomeCellsManagement.tsx    # District/Zone/Homecell management UI
│   │
│   ├── auth/                  # Authentication components
│   │   └── ProtectedRoute.tsx # Route protection wrapper
│   │
│   ├── AccountRequestsPanel.tsx       # Admin account request management
│   ├── AccountVerification.tsx         # Account verification component
│   ├── AuthDebugger.tsx               # Auth debugging utilities
│   ├── BackupRecovery.tsx             # Backup and recovery UI
│   ├── BillingHistory.tsx             # Billing records display
│   ├── HomeCellsAnalyticsDashboard.tsx # Analytics and reporting
│   ├── MemberHomeCellManagement.tsx    # Member-to-homecell assignment
│   ├── MemberTitheRecords.tsx          # Tithe transaction history
│   ├── ModuleStore.tsx                 # Module marketplace (old version)
│   ├── ModuleStoreEnhanced.tsx         # Enhanced module store UI
│   ├── PurchasedModules.tsx            # User's purchased modules
│   ├── SubscriptionDashboard.tsx       # Active subscriptions display
│   └── [other feature components]
│
├── pages/                     # Page components (one per route)
│   ├── Appointments.tsx              # Appointment scheduling page
│   ├── Dashboard.tsx                 # REMOVE - Old version
│   ├── DashboardNew.tsx              # Main dashboard page
│   ├── Events.tsx                    # Church events page
│   ├── Finance.tsx                   # Financial module page
│   ├── Financials.tsx                # REMOVE - Old version
│   ├── HR.tsx                        # Human resources page
│   ├── Inventory.tsx                 # Inventory management page
│   ├── Login.tsx                     # Login page
│   ├── MemberManagement.tsx          # Member management page
│   ├── Messaging.tsx                 # Internal messaging page
│   ├── ModuleStore.tsx               # Module store page
│   ├── NewMembers.tsx                # New member onboarding page
│   ├── NotFound.tsx                  # 404 page
│   ├── ProjectManagement.tsx         # REMOVE - Not used
│   ├── Settings.tsx                  # System settings page
│   ├── SystemLogs.tsx                # Audit logs page
│   ├── Transfers.tsx                 # Member transfers page
│   ├── Users.tsx                     # User management page
│   ├── Welfare.tsx                   # Welfare/assistance page
│   └── [other pages]
│
├── utils/                     # Utility functions and helpers
│   ├── abortHandler.ts       # Request cancellation utilities
│   ├── authDisabler.ts       # Authentication state management
│   ├── dataRefresh.ts        # Data synchronization utilities
│   ├── minimalAuth.ts        # Lightweight auth utilities
│   ├── printUtils.ts         # PDF and print utilities
│   ├── validation.ts         # Form validation utilities
│   └── [other utilities]
│
├── lib/                       # Library utilities
│   └── utils.ts              # Common utility functions (cn, clsx, etc)
│
├── assets/                    # Static assets (images, logos, etc)
│   └── [images, icons, etc]
│
└── vite-env.d.ts             # Vite environment type definitions
```

#### `/server` - Backend Node.js/Express Server
```
server/
├── server.js                  # Main server entry point
├── index.ts                   # TypeScript entry point
│
├── config/                    # Configuration files
│   ├── database.js           # Database connection setup
│   ├── sqlite-adapter.js     # SQLite database adapter
│   └── supabase-client.js    # Supabase client configuration
│
├── database/                  # Database utilities and setup
│   ├── connection.js         # Database connection management
│   └── setup.js              # Database initialization
│
├── middleware/                # Express middleware
│   └── auth.js               # Authentication and authorization middleware
│
├── routes/                    # API route handlers (one file per module)
│   ├── account-requests.js    # Account request management API
│   ├── appointments.js        # Appointment scheduling API
│   ├── auth.js               # Authentication endpoints
│   ├── auth-supabase.js      # Supabase authentication
│   ├── database-setup.js     # Database setup utilities
│   ├── events.js             # Church events API
│   ├── finance.js            # Financial transactions API
│   ├── homecells.js          # Home cells hierarchy API
│   ├── homecell-reports.js   # Home cell reporting API
│   ├── inventory.js          # Inventory management API
│   ├── messages.js           # Messaging API
│   ├── members.js            # Member management API
│   ├── modules.js            # Module store API
│   ├── setup.js              # Setup and initialization
│   ├── setup-homecells.js    # Home cells setup
│   ├── system-logs.js        # System logging API
│   ├── users.js              # User management API
│   ├── welfare.js            # Welfare request API
│   └── [other routes]
│
├── migrations/                # Database migration files (SQL)
│   ├── 000_create_complete_schema.sql     # COMPLETE SCHEMA - All tables
│   ├── 001_create_homecells_tables.sql    # Home cells tables
│   ├── 002_seed_districts.sql             # Pre-seed districts data
│   ├── 003_create_homecells_tables.sql    # Additional home cell schema
│   ├── 004_create_modules_system.sql      # Module system tables
│   └── 005_create_account_requests_table.sql  # Account requests table
│
├── models/                    # Data models and schemas
│   ├── Employee.js
│   ├── Event.js
│   ├── FinancialTransaction.js
│   ├── Member.js
│   └── [other models]
│
├── services/                  # Business logic layer
│   └── auth-service.js       # Authentication business logic
│
├── scripts/                   # Utility scripts for maintenance
│   ├── create-account-requests-table.js
│   ├── create-admin.js
│   ├── create-user.js
│   ├── fix-login.html
│   ├── init-supabase-full.js
│   ├── run-migrations.js
│   ├── setup-rls-policies.js
│   ├── setup-supabase-complete.js
│   ├── supabase-complete-migration.js
│   ├── test-supabase-operations.js
│   ├── verify-supabase.js
│   └── [other scripts]
│
├── utils/                     # Utility functions
│   └── password-utils.js     # Password hashing and validation utilities
│
├── uploads/                   # User-uploaded files directory
│   └── [uploaded files]
│
├── fix-login.html            # Standalone login file (REMOVE)
├── init-complete-db.js       # Legacy database init (REMOVE)
└── [other legacy files - REMOVE]
```

#### `/database` - Database Configuration & Migrations
```
database/
├── complete-schema.sql        # Full database schema
├── HOMECELLS_SCHEMA_UPDATE.sql # Home cells schema additions
└── README.md                  # Database documentation
```

#### `/docs` - Documentation
```
docs/
├── DATABASE_SETUP_GUIDE.md    # Database setup instructions
├── DEPLOYMENT.md              # Deployment guide
├── IMPLEMENTATION_CHECKLIST.md # Feature implementation status
├── QUICK_START.md             # Quick start guide
├── SETUP_SUMMARY.md           # Setup summary
└── [other documentation]
```

#### `/public` - Static Assets
```
public/
├── offline.html               # Offline page
├── placeholder.svg            # Placeholder image
├── robots.txt                 # SEO robots config
└── [other public assets]
```

#### `/shared` - Shared Code Between Client & Server
```
shared/
└── api.ts                     # Shared API types and utilities
```

---

## Code Organization Best Practices

### 1. Comments & Documentation Standards

Every file should have:
- **File header** with purpose, features, and usage
- **Function documentation** with @param, @returns, @throws
- **Complex logic comments** explaining the "why" not the "what"
- **JSDoc comments** for all exported functions

**Example:**
```typescript
/**
 * Authentication Context Provider
 * 
 * Manages user authentication state, JWT tokens, and role-based permissions
 * for the entire application.
 * 
 * Features:
 * - JWT token management with automatic refresh
 * - Role-based access control (RBAC)
 * - Session timeout handling
 * - User profile management
 * 
 * @example
 * const { user, login, logout } = useAuth();
 */

/**
 * Authenticate user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password (will be hashed)
 * @returns {Promise<AuthResponse>} Authentication response with token and user data
 * @throws {AuthError} If credentials are invalid
 */
async function login(email: string, password: string): Promise<AuthResponse> {
  // Implementation...
}
```

### 2. File Naming Conventions

- **Components**: PascalCase (e.g., `HeaderComponent.tsx`)
- **Pages**: PascalCase (e.g., `LoginPage.tsx`)
- **Services**: camelCase (e.g., `authService.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Constants**: UPPERCASE_SNAKE_CASE

### 3. Directory Organization Rules

- **One component per file** (unless very tightly coupled)
- **Group related files** by feature (e.g., all auth components in `/auth`)
- **Separate concerns**: UI, Logic, Utils, Services
- **Keep imports flat** within a directory

### 4. Service Layer Pattern

Services should:
- Handle all API communication
- Contain business logic
- Be framework-agnostic when possible
- Be testable and composable

```typescript
// Good: Service with clear API
class UserService {
  async fetchUser(id: string): Promise<User> { }
  async updateUser(id: string, data: Partial<User>): Promise<User> { }
  async deleteUser(id: string): Promise<void> { }
}

// Usage in component
const { user } = useQuery(() => userService.fetchUser(id));
```

### 5. Component Structure

```typescript
/**
 * Component description and purpose
 * 
 * @component
 * @example
 * return <YourComponent prop="value" />
 */

// Props interface
interface YourComponentProps {
  /** Description of prop */
  prop: string;
}

// Component implementation
export function YourComponent({ prop }: YourComponentProps) {
  // Hooks
  // State
  // Effects
  // Event handlers
  // Render
  return <div>{prop}</div>;
}
```

---

## Files to REMOVE (Duplicates/Old Versions)

These files are outdated, duplicated, or no longer needed:

### Root Directory
- ❌ `ADMIN_ACTION_PLAN.md`
- ❌ `ADMIN_SETUP.md`
- ❌ `ADMIN_USER_GUIDE.md`
- ❌ `COMPLETE_SYSTEM_STATUS.md`
- ❌ `DEPLOYMENT_TO_FLYIO.md`
- ❌ `HOMECELLS_DATABASE_SETUP.md`
- ❌ `HOMECELLS_IMPLEMENTATION_SUMMARY.md`
- ❌ `IMPLEMENTATION_SUMMARY.md`
- ❌ `MANUAL_MIGRATION_SQL.md`
- ❌ `SYSTEM_VERIFICATION.md`

### Client Directory
- ❌ `client/pages/Dashboard.tsx` (use DashboardNew.tsx instead)
- ❌ `client/pages/Financials.tsx` (use Finance.tsx instead)
- ❌ `client/pages/ProjectManagement.tsx` (not used)
- ❌ `client/main.tsx.bak` (backup file)

### Server Directory
- ❌ `server/fix-login.html` (legacy file)
- ❌ `server/init-complete-db.js` (legacy)

---

## Migration Process

### When Adding New Features

1. **Create new service** in `/services`
2. **Create new routes** in `/server/routes`
3. **Create new pages/components** in `/client/pages` and `/client/components`
4. **Add navigation** in `/client/components/layout/Sidebar.tsx`
5. **Create database migration** in `/server/migrations`
6. **Add comprehensive comments** to all new code

### Naming & Organization Examples

```
New feature: "Financial Reporting"

Files to create:
- /client/components/FinancialReportsPanel.tsx (UI)
- /client/services/FinancialReportService.ts (API & logic)
- /client/pages/FinancialReports.tsx (Page)
- /server/routes/financial-reports.js (API endpoints)
- /server/migrations/00X_create_financial_reports_table.sql
```

---

## Code Quality Standards

### Required for All Code

1. ✅ **TypeScript types** - No `any` types
2. ✅ **JSDoc comments** - Document all public functions
3. ✅ **Error handling** - Try/catch with meaningful messages
4. ✅ **Validation** - Validate all inputs
5. ✅ **Testing** - Unit tests for services
6. ✅ **Logging** - Log important events
7. ✅ **Security** - No sensitive data in logs or comments

### Code Review Checklist

- [ ] Comments explain the "why" not the "what"
- [ ] Functions have JSDoc with @param, @returns
- [ ] No console.log statements (use proper logging)
- [ ] Error messages are user-friendly
- [ ] No hardcoded values or secrets
- [ ] Code follows naming conventions
- [ ] Related files are organized together
- [ ] No unnecessary dependencies

---

## Summary

This project follows a feature-based directory structure with clear separation of concerns:
- **Client**: React UI components and services
- **Server**: Express API routes and database logic
- **Database**: SQL migrations and schema
- **Docs**: Project documentation

All code must include professional comments explaining purpose, parameters, and complex logic to facilitate future maintenance and development.

---

**Last Updated**: 2025-01-17  
**Version**: 1.0.0  
**Maintainer**: ZionSurf Development Team
