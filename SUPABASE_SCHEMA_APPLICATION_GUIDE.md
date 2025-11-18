# Supabase Schema Application Guide

**CRITICAL: You must apply the database schema before the system will work.**

## Quick Setup (5 minutes)

### Step 1: Get Your Supabase Credentials
Your Supabase project is configured at:
- **URL**: https://teozbfjxarbpltfrguxe.supabase.co
- **Project**: teozbfjxarbpltfrguxe

### Step 2: Access Supabase SQL Editor

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project: **teozbfjxarbpltfrguxe**
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query** button

### Step 3: Copy the Complete Schema

The complete schema file is located at:
```
server/migrations/000_create_complete_schema.sql
```

**Recommended: Apply in sections**

Due to Supabase query size limits, apply the schema in these sections:

#### Section A: Authentication & User Management (Tables + Indexes)
Copy this from the schema file - starts at line 35, ends at line 150

#### Section B: Member & Financial Management
Lines 156-300

#### Section C: Welfare, Events & Scheduling
Lines 300-400

#### Section D: Home Cells & Districts (CRITICAL FOR HOME CELLS MODULE)
**Lines 296-367 - MUST INCLUDE**
```sql
-- Districts table
CREATE TABLE IF NOT EXISTS public.districts (
  id BIGSERIAL PRIMARY KEY,
  district_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Zones table
CREATE TABLE IF NOT EXISTS public.zones (
  id BIGSERIAL PRIMARY KEY,
  zone_id VARCHAR(100) UNIQUE NOT NULL,
  district_id BIGINT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Homecells table
CREATE TABLE IF NOT EXISTS public.homecells (
  id BIGSERIAL PRIMARY KEY,
  homecell_id VARCHAR(100) UNIQUE NOT NULL,
  zone_id BIGINT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  district_id BIGINT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  meeting_day VARCHAR(50),
  meeting_time TIME,
  meeting_location VARCHAR(255),
  member_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Homecell members table
CREATE TABLE IF NOT EXISTS public.homecell_members (
  id BIGSERIAL PRIMARY KEY,
  homecell_id BIGINT NOT NULL REFERENCES public.homecells(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(homecell_id, member_id)
);
```

#### Section E: Modules & Subscriptions
Lines 453-491

#### Section F: Indexes for Performance
Lines 492-525+

### Step 4: Execute Each Section

For each section:
1. Paste the SQL into the SQL Editor
2. Click the **Run** button (or press Ctrl+Enter)
3. Wait for "Query succeeded" message
4. Proceed to next section

**Common Errors:**
- "Table already exists" - Safe to ignore, means table was created in previous run
- "Relation does not exist" - Check you're running sections in order

### Step 5: Verify Tables Were Created

```sql
-- Run this query to verify critical tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'districts', 'zones', 'homecells', 'members', 'modules')
ORDER BY table_name;
```

Expected result: Should show 6 tables

### Step 6: Restart Your Application

```bash
npm run dev
```

Check console for message: "✅ All critical tables exist"

## Tables Created

After applying the complete schema, you'll have:

### Authentication (3 tables)
- `users` - User accounts and authentication
- `account_requests` - New user registration requests  
- `password_resets` - Password reset tokens

### Members & Finance (4 tables)
- `members` - Church member records
- `transitions` - Member onboarding workflow
- `tithes` - Tithe/offering transactions
- `financial_transactions` - All financial records

### Organization (4 tables)
- `districts` - Top-level organizational units ⭐
- `zones` - District subdivisions ⭐
- `homecells` - Small group cells ⭐
- `homecell_members` - Member assignments ⭐

### Events & Communication (6 tables)
- `events` - Church events
- `appointments` - Meeting scheduling
- `messages` - Internal messaging
- `welfare_requests` - Assistance requests
- `welfare_approvals` - Approval workflow
- `system_logs` - Audit trail

### Inventory & Modules (4 tables)
- `inventory_items` - Church assets
- `inventory_categories` - Asset types
- `modules` - Available system modules
- `subscriptions` - Module subscriptions

**⭐ = Critical for Home Cells functionality**

## Troubleshooting

### "Could not find table 'public.districts'"
**Solution**: The schema wasn't applied. Follow steps 1-5 above.

### "Relation 'homecells' does not exist"
**Solution**: 
1. Verify districts and zones tables exist first
2. Re-apply homecells section in the schema

### Queries timeout in SQL Editor
**Solution**:
1. Apply schema in smaller sections
2. Execute 5-10 statements at a time instead of all at once

### RLS (Row Level Security) policies appear
**Solution**: This is normal. You can disable RLS for now:
1. Go to Authentication > Policies
2. Remove or disable restrictive policies temporarily
3. Restart application

## After Schema Application

Your application will now:
✅ Store data to Supabase PostgreSQL  
✅ Create districts, zones, and homecells  
✅ Save home cell member assignments  
✅ Save financial transactions  
✅ Track account requests and activations  

## Next Steps

1. ✅ Apply schema (this guide)
2. Restart the application
3. Test Home Cells module functionality
4. Create test districts, zones, and homecells
5. Verify data persists in Supabase

## Manual SQL Execution (Alternative)

If SQL Editor has issues, you can use PostgreSQL CLI:

```bash
# Connect to Supabase
psql -h teozbfjxarbpltfrguxe.supabase.co -U postgres -d postgres

# When prompted for password, use: SUPABASE_SERVICE_ROLE_KEY from .env

# Then paste and execute the schema SQL
```

## Support

If you continue having issues after applying the schema:
1. Check that all CREATE TABLE statements completed without error
2. Verify `.env` has correct SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
3. Restart the application server
4. Check browser console for errors
5. Check server logs for detailed error messages
