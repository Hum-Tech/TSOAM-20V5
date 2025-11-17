# Supabase Account Migration - Step by Step Instructions

## ✅ Status
- ✅ Environment variables have been updated with your new Supabase credentials
- ⏳ Waiting for you to apply the database schema

## 🚀 Step 1: Go to Supabase SQL Editor

1. Open your browser and go to: https://app.supabase.com/
2. Login with your account
3. Select your new project: **teozbfjxarbpltfrguxe**
4. Click on **SQL Editor** in the left sidebar
5. Click **New Query** button

## 📋 Step 2: Copy and Paste the Complete Setup SQL

1. Open the file: `SUPABASE_COMPLETE_SETUP.sql` in this project
2. Select ALL the content (Ctrl+A or Cmd+A)
3. Copy it (Ctrl+C or Cmd+C)
4. Go back to Supabase SQL Editor
5. Click in the SQL query box
6. Paste the entire content (Ctrl+V or Cmd+V)
7. Click the **Run** button (or press Ctrl+Enter)

## ⏳ Wait for Completion

The SQL will execute and create:
- ✅ 20+ database tables
- ✅ All necessary indexes
- ✅ 9 pre-configured districts
- ✅ Sample zones and home cells
- ✅ 8 modules with pricing
- ✅ Role permissions

This should take about 30-60 seconds.

## ✅ Step 3: Verify Tables Were Created

After the SQL runs successfully:

1. Click on **Table Editor** in the left sidebar
2. You should see these tables (scroll down):
   - `users`
   - `members`
   - `employees`
   - `financial_transactions`
   - `districts`
   - `zones`
   - `homecells`
   - `modules`
   - `church_subscriptions`
   - `module_features`
   - `module_access_log`
   - And many more...

If you see all these tables, ✅ **Setup is complete!**

## 🔌 Step 4: System Should Connect Automatically

Since we've already updated the environment variables, your system should:
- Automatically connect to the new Supabase account
- Load all the tables
- Be ready to use

## 👤 Step 5: Create Your Admin User (Optional)

If you want to bootstrap a new admin user:

### Option A: API Method (Recommended)
```bash
curl -X POST http://localhost:3001/api/auth/bootstrap \
  -H "Content-Type: application/json"
```

### Option B: Manual Database Insert
1. Go to Supabase **SQL Editor**
2. Create a new query and paste:

```sql
INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
VALUES (
  'admin@church.local',
  '$2b$10$HASHED_PASSWORD_HERE',
  'Church Administrator',
  '+254712345678',
  'admin',
  true
);
```

## 🔍 Troubleshooting

### SQL Execution Failed?
- Check for error messages in the output
- Common issues:
  - Some tables may already exist (that's OK, we use `IF NOT EXISTS`)
  - Copy the entire file including all sections
  - Run it all at once, don't split it

### Tables Created but System Not Connecting?
- Refresh the browser page
- Check browser console for errors (F12 → Console tab)
- Restart the development server

### Can't See Tables?
1. Refresh the Table Editor
2. Make sure you're viewing the correct project
3. Check that all SQL ran successfully

## 📊 What's Been Set Up

### Core Tables
- **users** - User accounts and authentication
- **members** - Church members
- **employees** - Staff/employees
- **financial_transactions** - Tithes, offerings, expenses

### Organization Tables
- **districts** - 9 districts pre-configured
- **zones** - Zone hierarchy under districts
- **homecells** - HomCell groups under zones

### Feature Tables
- **modules** - 8 modules with pricing
- **church_subscriptions** - Track purchased modules
- **module_features** - Features within each module
- **module_access_log** - Audit trail

### Other Tables
- **appointments** - Schedule management
- **church_events** - Events and services
- **welfare** - Welfare/support tracking
- **inventory** - Asset management
- **messages** - Internal messaging
- **role_permissions** - Permission system
- **system_logs** - Activity logs

## 🎯 Next Steps

1. ✅ Apply the SQL setup (Step 1-2 above)
2. ✅ Verify tables exist (Step 3)
3. ✅ Test by logging into the system
4. ✅ Create your admin account
5. ✅ Browse Module Store to activate modules

## ❓ Need Help?

- Check the system logs: Settings → System Logs
- Review errors in browser console (F12)
- Check Supabase logs: https://app.supabase.com/project/teozbfjxarbpltfrguxe/logs/editor

---

**Ready?** Let me know once you've applied the SQL and I'll help with anything else you need!
