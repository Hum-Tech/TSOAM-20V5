# Admin Setup Guide - TSOAM Church Management System

## ✅ Admin Account Created

**Email**: `admin@tsoam.org`
**Password**: `admin123`
**Role**: Admin (Full System Access)

---

## How to Log In

### Step 1: Open the Application
Navigate to `http://localhost:3002` (or your server URL)

### Step 2: Click "Sign in to your account"
You'll see the login form with email and password fields.

### Step 3: Enter Credentials
- **Email**: `admin@tsoam.org`
- **Password**: `admin123`

### Step 4: Click "Sign in"
You will be logged in and see the admin dashboard.

⚠️ **IMPORTANT**: Change your password after first login!

---

## User Registration System

### How Regular Users Request Accounts

1. **Users Click "Create Account" Button** on the login page
2. **Users Fill Out Application** with:
   - Email address
   - Full name
   - Phone number
   - Desired role (User, Finance Officer, or HR Officer)
3. **Submit Request** - Account request is saved to the database
4. **Admin Reviews** - Admin receives the request in their dashboard
5. **Admin Approves or Rejects** - Sets password and activates account

### New Account Request Flow

```
User Requests Account → Saved as "Pending" → Admin Reviews → Admin Approves/Rejects
                                                    ↓
                                              Creates User Account
                                              Sets Password
                                              Sends Notification
```

---

## Admin: Managing Account Requests

### View Pending Requests

**Via API:**
```bash
curl -X GET http://localhost:3002/api/account-requests \
  -H "Authorization: Bearer <your-admin-token>"
```

**Expected Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "User Name",
      "phone": "254712345678",
      "role": "user",
      "status": "pending",
      "requestedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Approve an Account Request

**Via API:**
```bash
curl -X POST http://localhost:3002/api/account-requests/:requestId/approve \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "securePassword123",
    "adminNotes": "Approved - Member of finance team"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Account request approved and user created",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "User Name",
    "role": "user",
    "status": "active"
  }
}
```

### Reject an Account Request

**Via API:**
```bash
curl -X POST http://localhost:3002/api/account-requests/:requestId/reject \
  -H "Authorization: Bearer <your-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Email already in use",
    "adminNotes": "Duplicate request"
  }'
```

---

## Database Schema

### Account Requests Table
```sql
CREATE TABLE account_requests (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50),
  status VARCHAR(50),              -- pending, approved, rejected
  rejection_reason TEXT,
  admin_notes TEXT,
  requested_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50),                -- admin, pastor, user, finance_officer, hr_officer
  is_active BOOLEAN,
  last_login TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## Available Roles

| Role | Level | Can Do |
|------|-------|--------|
| **Admin** | Full | Everything - Manage users, all modules, settings |
| **Pastor** | Full | Manage members, finance, HR, events, welfare, inventory |
| **User** | Limited | View members, create welfare requests, view inventory |
| **Finance Officer** | Module | Manage finance transactions and reports |
| **HR Officer** | Module | Manage employees and HR records |

---

## API Endpoints for Account Management

### Public Endpoints (No Auth Required)
```
POST   /api/account-requests              - Request new account
GET    /api/account-requests/status       - Check service status
```

### Admin Only Endpoints (Requires Auth)
```
GET    /api/account-requests              - View all pending requests
GET    /api/account-requests/:requestId   - View specific request
POST   /api/account-requests/:id/approve  - Approve request and create user
POST   /api/account-requests/:id/reject   - Reject request
```

---

## Complete Login/Registration API

### User Login
```bash
POST /api/auth/login
{
  "email": "admin@tsoam.org",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@tsoam.org",
    "fullName": "Church Administrator",
    "role": "admin",
    "permissions": [...]
  }
}
```

### Check Auth Status
```bash
GET /api/auth/status
```

---

## Next Steps

### 1. Log In as Admin
Use credentials above to access the admin dashboard.

### 2. Change Admin Password
Once logged in, go to Settings → Change Password

### 3. Configure Church Information
Set up church details, locations, and settings

### 4. Create Additional Admins (Optional)
If needed, create other admin users through the API:

```bash
POST /api/auth/register
Authorization: Bearer <admin-token>
{
  "email": "pastor@tsoam.org",
  "fullName": "Church Pastor",
  "phone": "254712345678",
  "password": "securePassword123",
  "role": "pastor"
}
```

### 5. Monitor Account Requests
Regularly check for new account requests and approve them

---

## Security Best Practices

✅ **DO:**
- Change default admin password
- Use strong passwords (12+ characters with mixed case, numbers, symbols)
- Review account requests before approving
- Log out when away from computer
- Monitor login activity
- Disable inactive accounts

❌ **DON'T:**
- Share admin credentials with unauthorized users
- Use "admin123" as permanent password
- Approve requests without verification
- Store passwords in plain text
- Leave admin account logged in unattended

---

## Troubleshooting

### Problem: "Invalid email or password"
**Solution**: Verify credentials are exactly correct. Remember password is case-sensitive.

### Problem: Can't approve account request
**Solution**: Make sure you're logged in as admin. Check if request status is "pending".

### Problem: Database connection error
**Solution**: Verify Supabase is accessible. Check environment variables are set correctly.

### Problem: Can't create account request
**Solution**: Check email is not already registered. Ensure email format is valid.

---

## System Architecture

```
┌──��──────────────────────────────────────────────┐
│     TSOAM Church Management System               │
├─────────────────────────────────────────────────┤
│                                                  │
│  Login/Auth    →  JWT Token Generation           │
│       ↓                                          │
│  Admin Dashboard                                │
│       ↓                                          │
│  Account Requests Management                    │
│       │                                         │
│       ├─→ View Pending Requests                 │
│       ├─→ Approve Requests (Create User)        │
│       └─→ Reject Requests                       │
│                                                  │
└─────────────────────────────────────────────────┘
         ↓
    Supabase PostgreSQL
         ↓
    ├── Users Table
    ├── Account Requests Table
    └── Role Permissions Table
```

---

## Summary

✅ Admin account created: `admin@tsoam.org` / `admin123`
✅ Account request system implemented
✅ API endpoints ready for user management
✅ Database fully configured
✅ All changes saved to Supabase

**You're ready to go!** Start by logging in with the admin credentials above.
