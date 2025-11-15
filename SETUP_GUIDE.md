# TSOAM Church Management System - Setup Guide

## Overview
This guide walks you through setting up the TSOAM church management system with Supabase database and user accounts.

---

## Phase 1: Database Schema Setup

### Step 1: Initialize Database Schema

1. Go to your Supabase console:
   ```
   https://app.supabase.com
   ```

2. Select your project: `ncrecohwtejwygkyoaul`

3. Navigate to **SQL Editor** and click **"New Query"**

4. Copy all SQL from this file:
   ```
   database/supabase-schema.sql
   ```

5. Paste it into the SQL editor

6. Click **"Run"** to execute all queries

**Expected Results:**
- ✅ All tables created successfully
- ✅ Role permissions configured
- ✅ Default districts and zones created
- ✅ Sample data seeded

---

## Phase 2: Create User Accounts

### Creating Users Interactively

Run the user creation script:

```bash
node server/scripts/create-user.js
```

You will be prompted to enter:
- **Email address** (e.g., user@tsoam.org)
- **Full name** (e.g., John Kipchoge)
- **Phone number** (e.g., +254712345678)
- **Role** (select from 1-5):
  - 1. **ADMIN** - Access everything, can manage users and settings
  - 2. **PASTOR** - Access everything (same as admin but cannot manage other users)
  - 3. **USER** - Limited access (dashboard, new members, member mgmt partial, welfare, events)
  - 4. **FINANCE OFFICER** - Finance, events, messaging, finance-related dashboard
  - 5. **HR OFFICER** - HR, appointments, welfare, inventory, messaging, some dashboard

### Creating Users Programmatically

```bash
node server/scripts/create-user.js \
  admin@tsoam.org \
  "System Administrator" \
  "SecurePassword123" \
  admin \
  "+254712000000"
```

### Default Sample Users

The database comes with 5 sample users (you should update their passwords):

| Email | Full Name | Role | Password |
|-------|-----------|------|----------|
| admin@tsoam.org | System Administrator | admin | Hash in DB |
| pastor@tsoam.org | Rev. Peter Kipchoge | pastor | Hash in DB |
| finance@tsoam.org | David Mwangi | finance_officer | Hash in DB |
| hr@tsoam.org | Sarah Kipchoge | hr_officer | Hash in DB |
| user@tsoam.org | John Kipchoge | user | Hash in DB |

**Update these passwords using the create-user script.**

---

## Phase 3: Role-Based Access Control

### Role Permissions

#### 1. ADMIN
- ✅ Dashboard (full access)
- ✅ Member Management (full)
- ✅ New Members (full)
- ✅ Finance (full)
- ✅ HR (full)
- ✅ Welfare (full)
- ✅ Inventory (full)
- ✅ Appointments (full)
- ✅ Church Events (full)
- ✅ Messaging (full)
- ✅ Settings (all features)
- ✅ User Management

#### 2. PASTOR
- ✅ Dashboard (full access)
- ✅ Member Management (full)
- ✅ New Members (full)
- ✅ Finance (full)
- ✅ HR (full)
- ✅ Welfare (full)
- ✅ Inventory (full)
- ✅ Appointments (full)
- ✅ Church Events (full)
- ✅ Messaging (full)
- ✅ Settings (limited)
- ❌ User Management

#### 3. USER
- ✅ Dashboard (view only)
- ✅ New Members (create & view)
- ✅ Member Management (view only)
- ✅ Welfare (view & manage)
- ✅ Inventory (view only, limited manage)
- ✅ Church Events (view only)
- ✅ Messaging (send & view)
- ✅ Settings (view limited)

#### 4. FINANCE OFFICER
- ✅ Dashboard (finance metrics only)
- ✅ Finance (full management)
- ✅ Church Events (view only)
- ✅ Messaging (send & view)
- ✅ Settings (finance-related only)

#### 5. HR OFFICER
- ✅ Dashboard (HR metrics)
- ✅ HR (full management)
- ✅ Appointments (full management)
- ✅ Welfare (view & manage)
- ✅ Inventory (view & manage)
- ✅ Church Events (view only)
- ✅ Messaging (send & view)
- ✅ Settings (HR-related only)

---

## Phase 4: Start the Application

### 1. Install Dependencies
```bash
npm install
cd client && npm install && cd ..
```

### 2. Start the Development Server
```bash
npm start
```

The app will be available at: `http://localhost:3002`

### 3. Login
Use any of the created user accounts:
- Email: (from Step 2)
- Password: (the password you set)

---

## Database Schema Overview

### Core Tables

#### 1. **users**
Stores all user accounts with hashed passwords

```
- id (UUID)
- email (UNIQUE)
- password_hash
- full_name
- phone
- role (admin, pastor, user, finance_officer, hr_officer)
- is_active
- last_login
- created_at
- updated_at
```

#### 2. **role_permissions**
Defines what each role can access

```
- id (UUID)
- role
- permission (e.g., "dashboard.view", "members.manage")
```

#### 3. **districts**
Geographic districts for organizing zones

```
- id (INT)
- name (UNIQUE)
- description
```

#### 4. **zones**
Zones within districts, led by zone leaders

```
- id (INT)
- district_id (FK)
- name
- leader
- leader_phone
```

#### 5. **homecells**
Small group meetings within zones

```
- id (INT)
- zone_id (FK)
- name
- leader
- leader_phone
- meeting_day
- meeting_time
- location
- description
- is_active
```

#### 6. **members**
Church members with tithe tracking and details

```
- id (UUID)
- member_id (UNIQUE)
- tithe_number (UNIQUE)
- full_name
- email, phone
- date_of_birth
- gender, marital_status
- address
- emergency_contact_*
- homecell_id (FK)
- membership_status (Active/Inactive)
- baptized, baptism_date
- bible_study_completed
- employment_status
- service_groups (JSON array)
- prayer_requests, church_feedback
```

#### 7. **financial_transactions**
All income, expenses, tithes, and offerings

```
- id (UUID)
- transaction_type (income, expense, tithe, offering)
- category
- amount
- member_id (FK for tithes)
- recorded_by (FK user)
- transaction_date
- payment_method
- status
```

#### 8. **inventory**
Church inventory items

```
- id (UUID)
- item_name
- category
- quantity
- unit
- location
- notes
```

#### 9. **welfare**
Welfare assistance tracking

```
- id (UUID)
- member_id (FK)
- type (assistance, support, prayer_request)
- status (pending, approved, completed)
- amount
- recorded_by (FK user)
```

#### 10. **appointments**
Church appointments and meetings

```
- id (UUID)
- title
- appointment_date
- duration_minutes
- attendee_*
- status (scheduled, completed, cancelled)
- location
```

#### 11. **church_events**
Church events and services

```
- id (UUID)
- event_name
- event_date
- event_type (service, meeting, celebration, workshop)
- expected_attendance
- actual_attendance
- organizer_id (FK user)
- status
```

#### 12. **messages**
Internal messaging system

```
- id (UUID)
- sender_id (FK user)
- recipient_id (FK user)
- subject
- content
- is_read
```

#### 13. **system_logs**
Audit trail for all system actions

```
- id (UUID)
- user_id (FK)
- action
- entity_type, entity_id
- changes (JSON)
- ip_address
- user_agent
```

---

## API Endpoints

### Authentication

```
POST   /api/auth/login                    - Login with email/password
POST   /api/auth/register                 - Create user (admin only)
GET    /api/auth/me                       - Get current user
PUT    /api/auth/me                       - Update user profile
GET    /api/auth/users                    - List all users (admin)
PUT    /api/auth/users/:userId            - Update user (admin)
DELETE /api/auth/users/:userId            - Deactivate user (admin)
GET    /api/auth/permissions              - Get user permissions
POST   /api/auth/logout                   - Logout
```

### Members
```
GET    /api/members                       - List members
POST   /api/members                       - Create member (admin)
GET    /api/members/:id                   - Get member
PUT    /api/members/:id                   - Update member (admin)
DELETE /api/members/:id                   - Delete member (admin)
```

### Finance
```
GET    /api/finance/transactions          - List transactions
POST   /api/finance/transactions          - Record transaction
GET    /api/finance/report                - Financial report
```

### And more...

---

## Troubleshooting

### Issue: "Connection refused"
**Solution:** Ensure your Supabase project is running and the credentials in `.env` are correct.

### Issue: "Table doesn't exist"
**Solution:** Run the schema initialization (Phase 1) again in Supabase SQL Editor.

### Issue: "Invalid email or password"
**Solution:** Verify the user exists and the password is correct. Use the create-user script to create or reset accounts.

### Issue: "Permission denied"
**Solution:** Check that your user role has the required permission. See role permissions table above.

---

## Security Best Practices

1. ✅ Change default admin password immediately
2. ✅ Use strong passwords (minimum 8 characters)
3. ✅ Keep JWT_SECRET secure in production
4. ✅ Enable RLS (Row Level Security) in Supabase for production
5. ✅ Use HTTPS in production
6. ✅ Regularly rotate API keys
7. ✅ Monitor system logs for suspicious activity

---

## Support

For issues or questions:
1. Check the system logs in the database
2. Review the auth middleware implementation
3. Verify Supabase project settings
4. Check browser console for frontend errors

---

## Next Steps

1. ✅ Initialize database schema
2. ✅ Create admin and other user accounts
3. ✅ Start the application
4. ✅ Login and verify permissions
5. ✅ Begin managing church operations
