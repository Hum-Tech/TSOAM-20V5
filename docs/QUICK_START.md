# Quick Start Guide - HomeCells & Module Store

## 🚀 Getting Started (5 Minutes)

### Step 1: Apply Database Migration (Required)

Before using any new features, you must apply the database schema update:

**Using Supabase Dashboard:**
1. Go to your Supabase project
2. Click **SQL Editor** → **New Query**
3. Copy all contents from: `database/HOMECELLS_SCHEMA_UPDATE.sql`
4. Paste into the query editor
5. Click **Run**
6. Wait for success message

⏱️ **Time: 2 minutes**

### Step 2: Start Development Server

```bash
npm run dev
```

Wait for the server to start. You should see:
```
Local: http://localhost:5173
```

⏱️ **Time: 1 minute**

### Step 3: Test HomeCells Feature

1. Login to the application
2. Go to **Settings** → **Home Cells** tab
3. Click **Add District**
4. Enter district name and click **Create District**
5. Select the district and click **Add Zone**
6. Enter zone name and click **Create Zone**
7. Select the zone and click **Add Homecell**
8. Enter homecell details and click **Create Homecell**

✅ **You now have a complete HomeCells hierarchy!**

⏱️ **Time: 2 minutes**

### Step 4: Explore Module Store

1. Click **Module Store** in the sidebar
2. Browse available modules
3. View the **Subscriptions** tab
4. Check the **Billing** tab
5. Read the **Help** section

✅ **Module Store is fully functional!**

## 📊 Key Features

### HomeCells Management (Settings)
- **Districts**: Top-level organizational units
- **Zones**: Groups of homecells within districts
- **Homecells**: Individual community groups

Each level supports:
- ✅ Create, Read, Update, Delete
- ✅ Search and filtering
- ✅ Member tracking
- ✅ Contact information storage

### Member Management Integration
- Assign members to homecells
- View member statistics
- Export reports (PDF/Excel)
- Visual analytics and charts

### Module Store
**4 Main Sections:**
1. **Module Store** - Browse and purchase modules
2. **Subscriptions** - Manage active subscriptions
3. **Billing** - View invoices and payment history
4. **Help** - FAQ and support information

## 🔍 Testing Checklist

- [ ] Database migration applied successfully
- [ ] Can see "Home Cells" tab in Settings
- [ ] Can create a district
- [ ] Can create a zone in the district
- [ ] Can create a homecell in the zone
- [ ] Module Store page displays correctly
- [ ] Can view available modules
- [ ] Help section shows FAQ and support info

## ❌ Troubleshooting

### Problem: "Home Cells" tab not showing in Settings
**Solution:** 
- Database migration not applied
- Run the SQL from `database/HOMECELLS_SCHEMA_UPDATE.sql`

### Problem: "Cannot save districts" or "API error"
**Solution:**
- Check browser console for error messages (F12)
- Verify database migration was applied
- Check that auth token is valid

### Problem: Module Store page is blank
**Solution:**
- Clear browser cache (Ctrl+F5)
- Check console for errors
- Verify ModuleService is working

## 📂 Project Structure

```
project/
├── docs/
│   ├── DATABASE_SETUP_GUIDE.md
│   ├── IMPLEMENTATION_CHECKLIST.md
│   └── QUICK_START.md (this file)
├── database/
│   ├── HOMECELLS_SCHEMA_UPDATE.sql
│   └── README.md
├── client/
│   ├── components/
│   │   ├── settings/
│   │   │   └── HomeCellsManagement.tsx
│   │   ├── ModuleStoreEnhanced.tsx
│   │   ├── SubscriptionDashboard.tsx
│   │   └── BillingHistory.tsx
│   └── pages/
│       ├── Settings.tsx
│       └── ModuleStore.tsx
└── server/
    └── routes/
        ├── homecells.js
        ├── homecell-reports.js
        └── modules.js
```

## 🎯 Next Steps

After verifying everything works:

1. **Explore Analytics**
   - Go to Member Management → Home Cells → Analytics tab
   - View member distribution charts

2. **Test Member Assignment**
   - Go to Member Management → Home Cells
   - Select a homecell
   - Assign members to it

3. **Export Reports**
   - In Member Management, export homecell member list
   - Download as PDF or Excel

4. **Customize Modules**
   - Add more modules as needed
   - Configure subscription settings
   - Monitor usage and billing

## 📚 Detailed Documentation

For more information, see:
- `docs/DATABASE_SETUP_GUIDE.md` - Detailed database setup
- `docs/IMPLEMENTATION_CHECKLIST.md` - Complete feature list
- `docs/HOMECELLS_MANAGEMENT_SETUP.md` - HomeCells specifics
- `docs/MODULE_SYSTEM.md` - Module system details

## ✅ Success!

You've successfully:
- ✅ Applied the database migration
- ✅ Started the development server
- ✅ Created a homecells hierarchy
- ✅ Explored the Module Store
- ✅ Verified all features work

The system is now ready for use! 🎉

---

**Need Help?**
- Check the documentation files in `/docs`
- Review the troubleshooting section above
- Check browser console (F12) for error messages
