# TSOAM Church Management System - Quick Start Guide

## 🎯 Your Goal
Get the TSOAM church management system running with real user accounts stored in your Supabase database.

---

## 📋 Prerequisites
- ✅ Supabase project: `https://ncrecohwtejwygkyoaul.supabase.co`
- ✅ Node.js installed on your computer
- ✅ Git installed on your computer
- ✅ This code repository cloned

---

## 🚀 Step 1: Initialize the Database (5 minutes)

### Option A: Using Supabase Console (Recommended)

1. **Open Supabase Dashboard**
   ```
   https://app.supabase.com
   ```

2. **Select Project**
   - Click on project `ncrecohwtejwygkyoaul`

3. **Open SQL Editor**
   - Left sidebar → **SQL Editor**
   - Click **"New Query"**

4. **Copy the Schema**
   - Open file: `database/supabase-schema.sql`
   - Copy ALL content

5. **Paste and Run**
   - Paste into the SQL editor
   - Click **"Run"**
   - Wait for success message

**Result:**
- ✅ All tables created
- ✅ Default roles configured
- ✅ Sample districts and zones created

---

## 👥 Step 2: Create User Accounts (2 minutes each)

### Create Admin Account

```bash
# In your terminal, run:
node server/scripts/create-user.js
```

**Follow the prompts:**
```
📧 Email address: admin@tsoam.org
👤 Full name: System Administrator
📱 Phone number: +254712000000

📋 Available roles:
   1. ADMIN
   2. PASTOR
   3. USER
   4. FINANCE OFFICER
   5. HR OFFICER

🔐 Select role (1-5): 1
🔑 Password: (type secure password - min 8 chars)
🔑 Confirm password: (repeat password)
```

**Result:**
```
✅ User created successfully!
   Email: admin@tsoam.org
   Role: ADMIN
   Status: Active
```

### Create Other User Accounts

Repeat the same process for:

**Pastor Account**
```bash
node server/scripts/create-user.js
📧 Email: pastor@tsoam.org
👤 Name: Pastor's Name
🔐 Role: 2 (PASTOR)
```

**Finance Officer Account**
```bash
node server/scripts/create-user.js
📧 Email: finance@tsoam.org
👤 Name: Finance Officer's Name
🔐 Role: 4 (FINANCE OFFICER)
```

**HR Officer Account**
```bash
node server/scripts/create-user.js
📧 Email: hr@tsoam.org
👤 Name: HR Officer's Name
🔐 Role: 5 (HR OFFICER)
```

**Regular User Account**
```bash
node server/scripts/create-user.js
📧 Email: user@tsoam.org
👤 Name: Regular User's Name
🔐 Role: 3 (USER)
```

---

## 🚢 Step 3: Start the Application (2 minutes)

### Install Dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### Start the Server
```bash
npm start
```

**Expected Output:**
```
✅ Supabase clients initialized successfully
✅ Supabase connection verified
✅ All required tables exist
✅ Supabase database ready
🚀 TSOAM Church Management System Server Started
🌐 Server running on: http://localhost:3002
```

---

## 🔓 Step 4: Login and Verify (2 minutes)

### Open the Application
```
http://localhost:3002
```

### Login with Admin Account
```
📧 Email: admin@tsoam.org
🔑 Password: (your password)
```

### Expected Result
- ✅ Dashboard loads with all metrics
- ✅ All menu items visible
- ✅ Can access all features

---

## 📊 What Each User Can Do

### Admin Role
- ✅ Create and manage all users
- ✅ Access all features
- ✅ Manage settings
- ✅ View all reports

### Pastor Role
- ✅ Access everything except user management
- ✅ No ability to create other accounts

### User Role
- ✅ View dashboard
- ✅ Manage new members
- ✅ View member directory
- ✅ View welfare and events
- ✅ Limited settings access

### Finance Officer Role
- ✅ Manage all finances
- ✅ View financial reports
- ✅ Limited dashboard (finance only)
- ✅ Messaging

### HR Officer Role
- ✅ Manage HR operations
- ✅ Manage appointments
- ✅ Manage welfare
- ✅ Manage inventory
- ✅ Limited settings access

---

## ✅ Verification Checklist

After completing the setup, verify:

- [ ] Database tables created in Supabase
- [ ] Admin account created successfully
- [ ] Server starts without errors
- [ ] Can login with admin account
- [ ] Dashboard displays with all metrics
- [ ] All menu items are accessible
- [ ] Can view other users (Admin page)

---

## 🐛 Troubleshooting

### Problem: "Connection refused"
```
Solution: 
1. Check .env file has SUPABASE_URL and SUPABASE_ANON_KEY
2. Verify Supabase project is active
3. Check internet connection
```

### Problem: "Table doesn't exist"
```
Solution:
1. Run database schema again in Supabase SQL Editor
2. Verify all SQL executed without errors
3. Refresh and retry
```

### Problem: "Invalid email or password"
```
Solution:
1. Verify email is spelled correctly
2. Check password (case-sensitive)
3. Try creating user again with create-user.js script
```

### Problem: Server won't start
```
Solution:
1. Run: npm install
2. Check Node.js version (use v14+)
3. Look at error message in terminal
4. Check .env file configuration
```

---

## 🔐 Important Security Notes

1. **Change Passwords**: Update all default user passwords immediately
2. **JWT Secret**: The JWT_SECRET in .env is pre-configured but should be changed in production
3. **HTTPS**: Always use HTTPS in production
4. **API Keys**: Never share Supabase API keys
5. **Passwords**: Minimum 8 characters, use strong passwords

---

## 📞 Next Steps

Once the system is running:

1. **Explore the Dashboard**
   - View member statistics
   - Check financial summaries
   - Review pending items

2. **Manage Members**
   - Add new members
   - Assign to home cells
   - Manage welfare records

3. **Manage Users**
   - Create accounts for other staff
   - Assign appropriate roles
   - Manage permissions

4. **Configure Settings**
   - Update church information
   - Set up districts and zones
   - Configure home cells

---

## 📖 Full Documentation

For detailed information, see: `SETUP_GUIDE.md`

---

## ❓ Still Having Issues?

1. Check the application logs in the terminal
2. Review error messages carefully
3. Verify Supabase project status
4. Check that all files are in correct locations
5. Restart the server if needed

**Good luck with your TSOAM Church Management System! 🙏**
