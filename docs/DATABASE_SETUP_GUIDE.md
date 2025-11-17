# Database Setup Guide

## Overview
This guide explains how to set up the database schema for the new HomeCells management system and Module Store features.

## Prerequisites
- Supabase project created
- Connection string available
- Admin access to the database

## Setup Steps

### Step 1: Apply the HomeCells Schema Update

The HomeCells schema is located in `database/HOMECELLS_SCHEMA_UPDATE.sql`. This file contains all the necessary table changes and indexes for the new functionality.

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `database/HOMECELLS_SCHEMA_UPDATE.sql`
5. Paste into the query editor
6. Click **Run**
7. Wait for the query to complete successfully

**Option B: Using Command Line (if you have access)**
```bash
# Using psql
psql "your-connection-string" < database/HOMECELLS_SCHEMA_UPDATE.sql
```

### Step 2: Verify the Schema

After applying the migration, verify that all tables were created successfully:

```sql
-- Check if districts table has district_id column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'districts' AND column_name = 'district_id';

-- Check if homecells table has all required columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'homecells' 
ORDER BY ordinal_position;

-- Check if zones table has description column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'zones' AND column_name = 'description';
```

### Step 3: Test the HomeCells API

Once the schema is updated, test the API endpoints:

```bash
# Test getting all districts
curl -X GET http://localhost:5000/api/homecells/districts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test creating a district
curl -X POST http://localhost:5000/api/homecells/districts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test District",
    "description": "Test description"
  }'
```

## Tables Modified/Created

### Modified Tables:
1. **districts**
   - Added: `district_id`, `description`, `updated_at`

2. **zones**
   - Added: `description`, `updated_at`

3. **homecells**
   - Added: `district_id`, `description`, `updated_at`
   - Added indexes for performance

4. **members**
   - Added: `homecell_id` with proper foreign key relationship

### New Tables Created:
1. **homecell_attendance** - Track attendance records
2. **homecell_activities** - Track activities and events
3. **homecell_reports** - Store generated reports

## Required Environment Variables

Ensure these are set in your `.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

### Issue: "Table 'homecells' not found"
**Solution**: The schema update hasn't been applied. Run the SQL migration from `database/HOMECELLS_SCHEMA_UPDATE.sql`

### Issue: "Column 'district_id' not found"
**Solution**: Run the schema update migration to add the missing columns.

### Issue: "API returns 401 Unauthorized"
**Solution**: Ensure your auth token is valid and included in the Authorization header.

## Next Steps

After the database is set up:
1. Start the development server: `npm run dev`
2. Navigate to Settings → Home Cells in the application
3. Try creating a District to test the functionality
4. Visit the Module Store to view available modules

## Support

For additional help:
- Check the logs for specific error messages
- Review the SQL migration file to understand what was changed
- Ensure all environment variables are correctly set
