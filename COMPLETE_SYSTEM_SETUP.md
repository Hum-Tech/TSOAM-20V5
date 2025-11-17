# TSOAM Church Management System - Complete Setup Guide

**Last Updated**: January 2025  
**Status**: Ready for Full Implementation

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Database Setup](#database-setup)
3. [Application Configuration](#application-configuration)
4. [Feature Implementation](#feature-implementation)
5. [Testing Checklist](#testing-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm/yarn package manager
- Supabase account with active project (already configured)
- `.env` file with Supabase credentials

### 5-Minute Setup

```bash
# 1. Install dependencies
npm install

# 2. Apply database schema to Supabase
npm run supabase:init

# 3. Initialize demo data
node server/scripts/initialize-demo-data.js

# 4. Start the application
npm run dev

# 5. Open browser
# Navigate to http://localhost:3000
```

---

## Database Setup

### Current Status: ✅ Configured

Your Supabase project:
- **Project ID**: teozbfjxarbpltfrguxe
- **URL**: https://teozbfjxarbpltfrguxe.supabase.co
- **Region**: Default (usually US-East)

### Step 1: Create Tables in Supabase

**IMPORTANT: This MUST be done before the system will work**

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to: https://app.supabase.com
2. Select project: `teozbfjxarbpltfrguxe`
3. Click: **SQL Editor** → **New Query**
4. Open file: `server/migrations/000_create_complete_schema.sql`
5. Copy and paste **THE ENTIRE CONTENT** into SQL Editor
6. Click: **Run** (or Ctrl+Enter)
7. Wait for: `Query succeeded` message

**Note**: If you get "Table already exists" errors, that's fine - it means the table was created in a previous run.

#### Option B: Using Command Line (For PowerUsers)

```bash
# If you have psql installed:
psql -h teozbfjxarbpltfrguxe.supabase.co \
     -U postgres \
     -d postgres \
     -f server/migrations/000_create_complete_schema.sql
```

When prompted for password, use the `SUPABASE_SERVICE_ROLE_KEY` from your `.env` file.

### Step 2: Verify Tables Were Created

Run this in Supabase SQL Editor:

```sql
-- Check critical tables
SELECT 
  'districts' as table_name,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name='districts' AND table_schema='public') as exists
UNION ALL
SELECT 'zones', (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name='zones' AND table_schema='public')
UNION ALL
SELECT 'homecells', (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name='homecells' AND table_schema='public')
UNION ALL
SELECT 'users', (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name='users' AND table_schema='public')
UNION ALL
SELECT 'modules', (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name='modules' AND table_schema='public')
UNION ALL
SELECT 'account_requests', (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name='account_requests' AND table_schema='public');
```

**Expected Result**: All tables should show `exists = 1`

### Step 3: Initialize Demo Data

```bash
# Load demo districts, zones, and homecells
node server/scripts/initialize-demo-data.js
```

**Output should show**:
```
✅ Demo data initialization completed!
   📍 Districts created: 3
   🗺️  Zones created: 5
   🏘️  Homecells created: 10
```

---

## Application Configuration

### Environment Variables

Your `.env` file must have:

```env
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://teozbfjxarbpltfrguxe.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional but Recommended
NODE_ENV=production
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:3000
PORT=3001
```

### Verify Configuration

After applying the schema, start the application:

```bash
npm run dev
```

**Check console for**:
```
✅ Database Configuration:
   Mode: Supabase PostgreSQL (Production)
   Status: ✅ Configured

✅ All critical tables exist
```

If you see errors about missing tables, go back to Step 1 and apply the schema.

---

## Feature Implementation

### 1. Home Cells Module ✅ COMPLETE

**Status**: Fully functional after schema application

**Available Features**:
- Create districts, zones, and homecells
- View home cell hierarchy
- Assign members to home cells
- Track attendance
- Demo data pre-loaded (3 districts, 5 zones, 10 homecells)

**Test It**:
1. Login as Admin
2. Navigate to **Home Cells** module
3. You should see:
   - 3 districts: Kibera, Embakasi, Eastleigh
   - Zones and homecells under each district
   - All meeting days and locations

### 2. Module Store ✅ FUNCTIONAL

**Status**: Available after authentication

**Features**:
- Browse available modules
- View active subscriptions
- Module activation/deactivation
- Pricing information

**Expected Modules**:
- Home Cells
- Finance Management
- Member Management
- HR Management
- Events & Appointments
- Welfare Management
- Inventory Management

**Test It**:
1. Login to dashboard
2. Click **Module Store** in sidebar
3. Should NOT show "Please log in" message
4. See list of available modules

### 3. Account Activation ✅ IMPLEMENTED

**Workflow**:
1. New user submits account request
2. Admin reviews pending requests
3. Admin approves and sets password
4. User receives credentials
5. User can login

**Test It**:
1. Go to **Login** page
2. Click **Create Account Request**
3. Fill form and submit
4. Switch to Admin account
5. Go to **Settings** → **Account Requests**
6. Find new request and click **Approve**
7. Set password and confirm
8. New user can now login

### 4. Password Reset ✅ FUNCTIONAL

**Workflow**:
1. User clicks "Forgot Password"
2. Enters email address
3. Receives 6-digit reset code
4. Enters reset code and new password
5. Password updated in database

**Test It**:
1. Go to **Login** page
2. Click **Forgot Password**
3. Enter your email
4. Copy the 6-digit code from console log (demo mode)
5. Enter code and new password
6. Login with new password

### 5. Settings Module ✅ INTEGRATED

**Available in Settings**:
- User Profile Management
- Account Security
- Module Subscriptions
- System Preferences
- Data Management

**Module Subscription Management**:
- View active subscriptions
- Manage auto-renewal
- View billing history
- Cancel subscriptions

**Test It**:
1. Go to **Settings**
2. Click **Modules** tab
3. See list of active and available modules
4. Manage subscriptions from here

---

## Testing Checklist

### Pre-Launch Tests

- [ ] Database connection successful
- [ ] All tables created in Supabase
- [ ] Demo data loaded (10 homecells visible)
- [ ] Admin user can login
- [ ] Dashboard loads without errors

### Feature Tests

#### Home Cells
- [ ] Can view all districts
- [ ] Can view zones under districts
- [ ] Can view homecells under zones
- [ ] Can create new district
- [ ] Can create new zone
- [ ] Can create new homecell
- [ ] Meeting day and location display correctly
- [ ] Data persists after page refresh

#### Module Store
- [ ] Authenticated users see module list
- [ ] Unauthenticated users see login message
- [ ] Can purchase/activate modules
- [ ] Can deactivate modules
- [ ] Subscriptions show in Settings

#### Account Management
- [ ] New account request can be submitted
- [ ] Admin sees pending requests
- [ ] Admin can approve request
- [ ] New user can login after approval
- [ ] Rejected requests show reason

#### Password Reset
- [ ] Forgot password link works
- [ ] Reset code sent (check console in demo)
- [ ] Can set new password
- [ ] Can login with new password

#### Settings
- [ ] Can update profile
- [ ] Can view active subscriptions
- [ ] Can manage module subscriptions
- [ ] Changes persist in database

---

## Troubleshooting

### "Could not find table 'public.homecells'"

**Cause**: Schema wasn't applied to Supabase

**Solution**:
1. Go to Supabase SQL Editor
2. Create new query
3. Copy schema from `server/migrations/000_create_complete_schema.sql`
4. Execute the query
5. Restart application

### "Please log in to access" shown despite being logged in

**Cause**: User object not properly populated

**Solution**:
1. Clear browser localStorage: `localStorage.clear()`
2. Logout and login again
3. Check Network tab for 401 errors
4. Verify JWT token is being returned from login endpoint

### Demo data not showing

**Cause**: Initialize script not run

**Solution**:
```bash
node server/scripts/initialize-demo-data.js
```

### Password reset not working

**Cause**: password_resets table not created or email service issue

**Solution**:
1. Verify table exists: check Supabase SQL Editor
2. Check console for reset code (demo mode logs code)
3. In production, configure email service

### Account requests not visible to admin

**Cause**: account_requests table not created

**Solution**:
1. Re-apply schema to Supabase
2. Ensure query executed without errors
3. Verify table in Supabase SQL Editor

---

## Post-Launch Checklist

### Security
- [ ] Change default admin password
- [ ] Enable row-level security (RLS) if needed
- [ ] Configure email service for notifications
- [ ] Setup backup schedule in Supabase

### Performance
- [ ] Enable query caching
- [ ] Monitor database load
- [ ] Setup performance alerts
- [ ] Configure CDN for static assets

### Documentation
- [ ] Create user manual
- [ ] Document module setup
- [ ] Create admin guide
- [ ] Document API endpoints

### Monitoring
- [ ] Setup error tracking (Sentry)
- [ ] Configure logging
- [ ] Setup uptime monitoring
- [ ] Create status dashboard

---

## Support & Resources

**Documentation**:
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Express Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)

**Common Issues**:
- Database connection failing? Check `.env` credentials
- Tables missing? Re-apply schema from SQL Editor
- Auth not working? Clear cache and try again

**Getting Help**:
- Check error logs in browser console (F12)
- Check server logs in terminal
- Review Supabase dashboard for issues
- Check database table structure in Supabase

---

## System Architecture Overview

```
┌─────────────────────────────────────────────┐
│          Client (React/Vite)                │
│  - Login, Dashboard, Module Store,          │
│    Settings, Home Cells, Finance, etc.     │
└────────────────┬────────────────────────────┘
                 │
           HTTP Requests
                 │
┌────────────────▼────────────────────────────┐
│      Backend (Express.js)                    │
│  - Auth routes, API endpoints,               │
│    Account management, Home Cells API       │
└────────────────┬────────────────────────────┘
                 │
          Supabase REST API
                 │
┌────────────────▼────────────────────────────┐
│    Supabase (PostgreSQL Database)            │
│  - Users, Members, Transactions,             │
│    Home Cells, Districts, Zones,             │
│    Modules, Subscriptions                    │
└─────────────────────────────────────────────┘
```

---

## Next Steps

1. **Apply Database Schema** (if not done)
   ```bash
   # Use Supabase SQL Editor to paste schema
   ```

2. **Initialize Demo Data**
   ```bash
   node server/scripts/initialize-demo-data.js
   ```

3. **Start Application**
   ```bash
   npm run dev
   ```

4. **Test All Features** (see Testing Checklist above)

5. **Configure Production** (if going live)
   - Setup environment variables
   - Configure email service
   - Enable RLS policies
   - Setup monitoring

---

## Configuration Summary

| Component | Status | Location |
|-----------|--------|----------|
| Database | ✅ Configured | Supabase (teozbfjxarbpltfrguxe) |
| Authentication | ✅ Complete | server/routes/auth-supabase.js |
| Home Cells | ✅ Complete | server/routes/homecells.js |
| Account Requests | ✅ Complete | server/routes/account-requests.js |
| Modules | ✅ Complete | server/routes/modules.js |
| Module Store | ✅ Complete | client/pages/ModuleStore.tsx |
| Settings | ✅ Complete | client/pages/Settings.tsx |
| Demo Data | ✅ Script Ready | server/scripts/initialize-demo-data.js |

---

**Ready to launch! Follow the Quick Start section above to begin.**
