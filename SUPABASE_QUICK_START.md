# Supabase Quick Start - 5 Minutes to Production Ready

This guide will get your TSOAM Church Management System running with Supabase in under 5 minutes.

## Prerequisites

- ✅ Supabase account created
- ✅ Supabase project created  
- ✅ Node.js 18+ installed
- ✅ Project cloned and npm installed

## Step 1: Get Your Credentials (1 minute)

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings > API**
4. Copy these values:
   - `Project URL` → `SUPABASE_URL`
   - `Anon Key` → `SUPABASE_ANON_KEY`
   - `Service Role Key` → `SUPABASE_SERVICE_ROLE_KEY` (optional but recommended)

## Step 2: Update .env File (30 seconds)

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 3: Initialize Database (2 minutes)

Run this single command to create all tables, add default users, and set up security:

```bash
npm run supabase:init
```

This will:
- ✅ Create all 40+ database tables
- ✅ Insert default admin user
- ✅ Configure role-based permissions
- ✅ Set up RLS (Row Level Security) policies

## Step 4: Verify Everything Works (1 minute)

```bash
npm run supabase:verify
```

This will test:
- ✅ Supabase connectivity
- ✅ All tables exist
- ✅ Read operations
- ✅ Write operations
- ✅ Authentication flow

## Step 5: Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Open http://localhost:3000 and login with:
- **Email**: admin@tsoam.org
- **Password**: admin123

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run supabase:init` | Complete setup (tables + data + RLS) |
| `npm run supabase:setup` | Create tables only |
| `npm run supabase:verify` | Test connectivity |
| `npm run supabase:test` | Run comprehensive tests |
| `npm run supabase:rls` | Setup RLS policies only |

## Default Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tsoam.org | admin123 |
| HR Officer | hr@tsoam.org | hr123 |
| Finance Officer | finance@tsoam.org | finance123 |

**⚠️ Change these passwords immediately in production!**

## Troubleshooting

### "Supabase connection failed"

```bash
# Check credentials are correct:
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Verify .env file is loaded:
npm run supabase:verify
```

### "Table does not exist"

```bash
# Recreate all tables:
npm run supabase:setup

# Then verify:
npm run supabase:verify
```

### "Permission denied"

```bash
# This is expected without Service Role Key
# To enable full features, add SUPABASE_SERVICE_ROLE_KEY to .env
# Then run:
npm run supabase:rls
```

## What Gets Created?

The `npm run supabase:init` command creates:

### Users & Security (6 tables)
- users, user_requests, password_resets, user_sessions, user_permissions, role_permissions

### Members (3 tables)
- members, new_members, member_families, member_family_relationships

### HR & Employees (4 tables)
- employees, leave_types, leave_requests, performance_reviews, payroll

### Finance (3 tables)
- financial_transactions, budget_categories, pledges

### Operations (9 tables)
- events, event_registrations, appointments, messages, message_replies, message_recipients, welfare_requests, inventory_items, inventory_transactions

### Admin (3 tables)
- system_logs, system_settings, document_uploads

**Total: 40+ tables with proper indexes and constraints**

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Frontend (React)                       │
│         http://localhost:3000                    │
└────────────────────┬────────────────────────────┘
                     │
                     ↓ API Requests
┌─────────────────────────────────────────────────┐
│         Backend Server (Node.js)                │
│          http://localhost:3002                   │
│        /api/auth, /api/members, etc.            │
└────────────────────┬────────────────────────────┘
                     │
                     ↓ SQL Queries (RLS enforced)
┌─────────────────────────────────────────────────┐
│            Supabase PostgreSQL                   │
│      (with Row Level Security policies)         │
│   https://your-project.supabase.co              │
└─────────────────────────────────────────────────┘
```

## Security Features

✅ **Row Level Security (RLS)**
- Users only see data they have permission to access
- Admin policies for management
- Role-based visibility

✅ **Encrypted Passwords**
- bcryptjs hashing (12 rounds)
- Never stored in plaintext

✅ **JWT Tokens**
- Secure session management
- Configurable expiration

✅ **Role-Based Access Control**
- Admin, HR Officer, Finance Officer, User roles
- Granular permissions per role
- Easy to extend

## Next Steps

1. ✅ Login with admin account
2. ✅ Change admin password
3. ✅ Add your users
4. ✅ Configure system settings
5. ✅ Set up backups (Supabase does this automatically)
6. ✅ Enable 2FA for security

## Useful Links

- **Supabase Console**: https://app.supabase.com/
- **Full Setup Guide**: See SUPABASE_SETUP.md
- **API Documentation**: http://localhost:3002/api/
- **Health Check**: http://localhost:3002/api/health

## Common Tasks

### Add a New User

Via the admin panel:
1. Go to Settings > Users
2. Click "Add User"
3. Fill in email and role
4. Click "Create"

### Change a Password

```bash
# Login first, then:
# Go to Profile > Security > Change Password
```

### Export Data

```bash
# Via Supabase console:
# 1. Go to SQL Editor
# 2. Run: SELECT * FROM table_name;
# 3. Download as CSV
```

### Reset Everything

```bash
# Backup first! Then:
# Via Supabase console SQL Editor:
# DROP SCHEMA public CASCADE;
# CREATE SCHEMA public;

# Then reinitialize:
npm run supabase:init
```

## Support

- 📧 Email: admin@tsoam.org
- 📚 Docs: SUPABASE_SETUP.md
- 🐛 Issues: Check GitHub issues
- 💬 Community: Supabase Discord

---

**Happy coding! 🚀**

You now have a production-ready church management system with Supabase!
