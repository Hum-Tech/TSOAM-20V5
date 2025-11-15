# TSOAM Church Management System - Supabase Setup Guide

## Overview

This guide provides step-by-step instructions to set up the TSOAM Church Management System with Supabase as the backend database.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (https://supabase.com)
- Existing Supabase project created

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose your organization or create one
4. Fill in the project details:
   - **Project Name**: TSOAM Church Management
   - **Database Password**: Set a strong password (save it!)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait for the project to initialize (3-5 minutes)

## Step 2: Get Your Supabase Credentials

1. Once your project is ready, go to **Settings > API**
2. Copy the following credentials:
   - **Project URL**: (format: https://your-project-ref.supabase.co)
   - **Anon Key**: (public key, safe to share)
   - **Service Role Key**: (secret! keep it safe)

## Step 3: Configure Environment Variables

1. Open `.env` file in the project root
2. Update the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important**: 
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Never commit `.env` to version control
- Never share your service role key publicly

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Initialize Supabase Database

### Option A: Full Initialization (Recommended)

This will create all tables, insert default data, and set up RLS policies:

```bash
npm run supabase:init
```

### Option B: Step-by-Step Initialization

If you want more control:

```bash
# 1. Create all database tables
npm run supabase:setup

# 2. Verify installation
npm run supabase:verify

# 3. Setup RLS policies (requires Service Role Key)
npm run supabase:rls
```

## Step 6: Verify Everything Works

```bash
npm run supabase:verify
```

This will test:
- ✅ Supabase connectivity
- ✅ All required tables exist
- ✅ Read operations work
- ✅ Write operations work
- ✅ Authentication flow works

## Step 7: Start the Application

### Development Mode

```bash
npm run dev
```

This starts both the frontend (port 3000) and backend (port 3001).

### Production Mode

```bash
npm start
```

## Default Credentials

Once setup is complete, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tsoam.org | admin123 |
| HR Officer | hr@tsoam.org | hr123 |
| Finance Officer | finance@tsoam.org | finance123 |

**⚠️ WARNING**: Change these passwords immediately in production!

## Database Tables Created

The following tables are automatically created:

### User Management
- `users` - System users with roles
- `user_requests` - Account creation requests
- `password_resets` - Password reset tokens
- `user_sessions` - Active user sessions
- `user_permissions` - Individual user permissions
- `role_permissions` - Role-based permissions

### Member Management
- `members` - Church members
- `new_members` - Visitor registrations
- `member_families` - Family groupings
- `member_family_relationships` - Family relationships

### HR & Employees
- `employees` - Employee records
- `leave_types` - Leave type definitions
- `leave_requests` - Leave request records
- `performance_reviews` - Performance reviews
- `payroll` - Payroll records

### Finance
- `financial_transactions` - Income/expense transactions
- `budget_categories` - Budget categories
- `pledges` - Member pledges

### Events & Appointments
- `events` - Church events
- `event_registrations` - Event registrations
- `appointments` - Member appointments

### Messaging & Welfare
- `messages` - System messages
- `message_replies` - Message replies
- `message_recipients` - Message recipients
- `welfare_requests` - Welfare assistance requests

### Admin
- `inventory_items` - Inventory items
- `inventory_transactions` - Inventory transactions
- `document_uploads` - Document storage
- `system_logs` - Activity logs
- `system_settings` - System configuration

## Row Level Security (RLS)

RLS policies are automatically configured for data security:

- **Users**: Can read all users, update own profile, admins manage all
- **Members**: Can read active members, HR/Admins manage all
- **Employees**: HR and Admins can manage
- **Financial**: Finance officers can manage, restricted viewing
- **Welfare**: Members can view own requests, admins manage all
- **Events**: Public events visible, admins manage all
- **Appointments**: Staff can manage their own

## Troubleshooting

### Connection Issues

```
❌ Supabase connection failed
```

**Solutions:**
1. Verify `SUPABASE_URL` is correct (no trailing slash)
2. Verify `SUPABASE_ANON_KEY` is correct
3. Check internet connection
4. Verify Supabase project is active

### Tables Not Found

```
❌ Table 'users' does not exist
```

**Solutions:**
1. Run `npm run supabase:setup` to create tables
2. Check that tables are in the `public` schema
3. Verify database owner has correct permissions

### Permission Denied Errors

```
❌ Permission denied for schema public
```

**Solutions:**
1. Ensure you're using the correct credentials
2. Check RLS policies with `npm run supabase:rls`
3. For admin operations, use `SUPABASE_SERVICE_ROLE_KEY`

### Row Level Security Issues

```
❌ Query violates row level security policy
```

**Solutions:**
1. Verify user has correct role
2. Check RLS policies are applied
3. For testing, temporarily disable RLS in Supabase console:
   - Settings > Database > Replication > Off for development

## Environment Variables Reference

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Recommended for full functionality
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
PORT=3002
CLIENT_URL=http://localhost:3000
NODE_ENV=production
```

## API Endpoints

Once running, the API is available at:

```
http://localhost:3002/api/
```

Health check endpoint:

```
GET http://localhost:3002/api/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": {
    "supabase": "Connected",
    "local": "Disconnected"
  },
  "server": "Running"
}
```

## Security Best Practices

1. **Never commit credentials**: Use `.env` and `.gitignore`
2. **Rotate passwords**: Change default credentials immediately
3. **Use environment variables**: Store sensitive data in env
4. **Enable RLS**: Always use Row Level Security in production
5. **Backup regularly**: Use Supabase automated backups
6. **Monitor access**: Check system logs for unusual activity
7. **Update regularly**: Keep dependencies current

## Support & Resources

- **Supabase Documentation**: https://supabase.com/docs
- **API Reference**: https://supabase.com/docs/reference/javascript
- **Community Forum**: https://github.com/supabase/supabase/discussions
- **Project Issues**: Check GitHub issues for known problems

## Next Steps

1. ✅ Verify database works with `npm run supabase:verify`
2. ✅ Login with admin credentials
3. ✅ Change default passwords
4. ✅ Configure system settings
5. ✅ Add users and roles
6. ✅ Set up backup procedures
7. ✅ Plan for scaling/optimization

## Common Tasks

### Reset Database

To completely reset and reinitialize:

```bash
# In Supabase console:
# 1. Go to SQL Editor
# 2. Run: DROP SCHEMA public CASCADE;
# 3. Run: CREATE SCHEMA public;

# Then reinitialize:
npm run supabase:setup
npm run supabase:verify
```

### Add New User

Via API:
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'newuser@example.com',
  password: 'securepassword'
});
```

### Check Database Status

```bash
curl http://localhost:3002/api/health
```

### View System Logs

```bash
# Via API or Supabase console
SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100;
```

## Migration from MySQL

If migrating from MySQL:

1. Export MySQL schema to SQL file
2. Convert MySQL syntax to PostgreSQL
3. Create tables in Supabase
4. Migrate data using Supabase import tools
5. Run RLS policy setup
6. Test all operations

For detailed migration steps, contact support.

---

**Last Updated**: January 2024  
**Version**: 2.0  
**Status**: Production Ready
