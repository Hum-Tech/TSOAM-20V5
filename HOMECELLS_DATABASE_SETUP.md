# HomeCells Database Setup Guide

This guide explains how to set up the HomeCells hierarchy tables and pre-seed initial district data in Supabase.

## Overview

The HomeCells system uses a 3-level hierarchy:
- **Districts** (9 pre-seeded for Nairobi)
- **Zones** (created by admins under each district)
- **HomeCells** (created by admins under each zone)

## Database Schema

### Tables Created

1. **districts** - Main districts (Nairobi Central, Eastlands, etc.)
   - `id` - Primary key
   - `district_id` - Unique identifier (e.g., "DIS-NAIROBI-CENTRAL")
   - `name` - Display name
   - `leader_id` - Optional reference to user who leads the district
   - `is_active` - Status flag
   - `created_at` / `updated_at` - Timestamps

2. **zones** - Zones within districts (e.g., Parklands, Westlands)
   - `id` - Primary key
   - `zone_id` - Unique identifier
   - `district_id` - Foreign key to districts
   - `name` - Display name
   - `leader_id` - Optional reference to user who leads the zone
   - `is_active` - Status flag
   - `created_at` / `updated_at` - Timestamps

3. **homecells** - Home cells within zones (e.g., Homecell 1, Homecell 2)
   - `id` - Primary key
   - `homecell_id` - Unique identifier
   - `zone_id` - Foreign key to zones
   - `district_id` - Foreign key to districts (for quick access)
   - `name` - Display name
   - `leader_id` - Optional reference to user who leads the homecell
   - `meeting_day` - Day of week when group meets (set by leader)
   - `meeting_time` - Time when group meets (set by leader)
   - `meeting_location` - Location of meetings (set by leader)
   - `member_count` - Cache of member count for performance
   - `is_active` - Status flag
   - `created_at` / `updated_at` - Timestamps

4. **homecell_members** - Member assignments to homecells
   - `id` - Primary key
   - `homecell_id` - Foreign key to homecells
   - `member_id` - Reference to member
   - `assigned_date` - When member was assigned
   - `is_active` - Assignment status
   - `created_at` / `updated_at` - Timestamps

## Pre-Seeded Districts

The following 9 districts are created automatically:

1. **Nairobi Central** - CBD and surrounding areas
2. **Eastlands** - Buruburu, Umoja, Donholm, etc.
3. **Thika Road** - Zimmerman, Kahawa, Roysambu, etc.
4. **South Nairobi** - Lang'ata, Karen, South C/B, etc.
5. **West Nairobi** - Kangemi, Uthiru, Dagoretti, etc.
6. **Northern Nairobi** - Muthaiga, Runda, Gigiri, etc.
7. **Eastern Nairobi** - Mathare, Huruma, Kariobangi, Dandora, etc.
8. **South East Nairobi** - Industrial Area, Mukuru, Imara Daima, etc.
9. **Outskirts Nairobi** - Kitengela, Rongai, Ngong, Juja, Thika, etc.

## How to Run Migrations

### Option 1: Using npm Script (Recommended)

```bash
# Run all migrations and seed initial district data
npm run homecells:migrate
```

This will:
1. Create all necessary tables in Supabase
2. Set up proper indexes for performance
3. Seed the 9 initial districts
4. Verify the setup and display status

### Option 2: Manual Supabase SQL Editor

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `server/migrations/001_create_homecells_tables.sql`
5. Run the query
6. Repeat with `server/migrations/002_seed_districts.sql`

### Option 3: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase migration up
```

## Verification

After running migrations, verify the setup:

```bash
# Check if tables were created successfully
npm run homecells:migrate
```

Or manually check in Supabase:

```sql
-- Check districts
SELECT COUNT(*) as total_districts FROM public.districts;
-- Expected: 9

-- Check zones
SELECT COUNT(*) as total_zones FROM public.zones;
-- Expected: 0 (initially empty)

-- Check homecells
SELECT COUNT(*) as total_homecells FROM public.homecells;
-- Expected: 0 (initially empty)
```

## Workflow for Admins

### Adding a Zone
1. Go to Settings → Home Cells
2. Expand a district
3. Click "Add Zone"
4. Enter zone name, description, and optional leader
5. Zone is created under that district

### Adding a Home Cell
1. Go to Settings → Home Cells
2. Expand a district
3. Expand a zone
4. Click "Add Home Cell"
5. Enter home cell name, leader, and meeting details
6. Home Cell is created under that zone

### Setting Meeting Schedule
1. Go to Settings → Home Cells
2. Click on a home cell
3. Edit meeting details:
   - Meeting day (Monday-Sunday)
   - Meeting time (HH:MM format)
   - Meeting location
4. Changes are saved immediately

### Assigning Members
1. Go to Member Management
2. Find unassigned members in the "Home Cells" tab
3. Click "Assign" next to a member
4. Select the home cell to assign to
5. Member is automatically added to homecell_members table

## Data Population

Data is populated in the following ways:

### Static Data (Pre-Seeded)
- 9 districts are created during migrations
- These never change unless manually deleted

### Dynamic Data (User-Created)
- Zones are created by admins
- Home cells are created by admins
- Member assignments happen automatically when members join

### User-Managed Data (Settings)
- Meeting days, times, and locations are set by leaders in Settings
- Leader assignments are made by admins

## Database Relationships

```
Districts (9 pre-seeded)
├── Zones (created by admins)
│   └── HomeCells (created by admins)
│       └── HomeCellMembers (assigned automatically)
```

## Performance Considerations

- Indexes are automatically created on foreign keys and frequently queried fields
- Member count is cached in homecells.member_count for quick display
- Consider adding additional indexes for large datasets:

```sql
-- Additional optional indexes for large deployments
CREATE INDEX idx_homecell_members_active ON public.homecell_members(homecell_id) WHERE is_active = TRUE;
CREATE INDEX idx_districts_name ON public.districts(name);
CREATE INDEX idx_zones_name ON public.zones(name);
CREATE INDEX idx_homecells_name ON public.homecells(name);
```

## Troubleshooting

### Tables Already Exist Error
If you get "table already exists" error, the migrations have already been run. This is normal - use `ON CONFLICT` and `IF NOT EXISTS` to safely re-run.

### Foreign Key Constraint Error
Ensure the users table exists before assigning leaders. If not found, leave leader_id null initially.

### Missing Supabase Credentials
Ensure environment variables are set:
```bash
export SUPABASE_URL=your_url
export SUPABASE_SERVICE_KEY=your_key
```

## Next Steps

1. ✅ Run migrations to create tables and seed districts
2. ✅ Verify setup is complete
3. 👥 Admins add zones and home cells in Settings
4. 👤 Members get assigned to home cells
5. 📊 Leaders manage meeting details in Settings
6. 📈 System tracks member assignments and statistics

## Support

For issues or questions about the HomeCells system, refer to:
- `HOMECELLS_IMPLEMENTATION_SUMMARY.md` - UI/UX documentation
- `HomeCellService.ts` - Frontend API service
- `server/migrations/` - Database migrations
- `server/routes/homecells.js` - Backend API routes
