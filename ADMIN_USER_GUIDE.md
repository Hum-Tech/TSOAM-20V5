# TSOAM Admin User Management Guide

## Quick Start - Create First Admin User

### Method 1: Interactive Script (Easiest)

```bash
# From the project root directory
node server/scripts/create-user.js
```

You'll be prompted to enter:
```
📧 Email address: admin@tsoam.org
👤 Full name: Church Administrator
📱 Phone number: 254712345678
🔐 Select role (1-5): 1 (Admin)
🔑 Password: [enter password, minimum 8 characters]
🔑 Confirm password: [confirm password]
```

The script will show:
```
✅ User created successfully!

📊 User Details:
   Email: admin@tsoam.org
   Name: Church Administrator
   Role: ADMIN
   Status: Active
   Created: [timestamp]
```

### Method 2: Non-Interactive Script

```bash
# Create admin user with command line arguments
node server/scripts/create-user.js "admin@tsoam.org" "Church Administrator" "securePassword123" "admin" "254712345678"
```

**Arguments**:
1. Email address
2. Full name
3. Password
4. Role (admin, pastor, user, finance_officer, hr_officer)
5. Phone number (optional)

### Method 3: API Endpoint

First, get a token by logging in with an existing admin:

```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tsoam.org",
    "password": "securePassword123"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@tsoam.org",
    "fullName": "Church Administrator",
    "role": "admin",
    "permissions": ["..."]
  }
}
```

Then create new users:

```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "email": "new-user@tsoam.org",
    "fullName": "New User Name",
    "phone": "254712345678",
    "password": "securePassword123",
    "role": "user"
  }'
```

## User Roles and Permissions

### 1. Admin
- **Access Level**: Full system access
- **Can**: Create users, manage all modules, view all data, system settings
- **Use for**: System administrators, church leadership

### 2. Pastor
- **Access Level**: Full system access
- **Can**: Manage members, finance, HR, events, welfare, inventory
- **Use for**: Church pastors and senior leaders

### 3. User (Standard)
- **Access Level**: Limited access
- **Can**: View members, create welfare requests, view inventory, view events
- **Use for**: General church staff

### 4. Finance Officer
- **Access Level**: Finance module only
- **Can**: Manage transactions, view financial reports, track budget
- **Use for**: Finance/accounting team

### 5. HR Officer
- **Access Level**: HR module only
- **Can**: Manage employees, leave, payroll, performance
- **Use for**: Human resources team

## Managing Users via API

### Get All Users
```bash
curl -X GET http://localhost:3002/api/auth/users \
  -H "Authorization: Bearer <admin-token>"
```

### Get Current User Profile
```bash
curl -X GET http://localhost:3002/api/auth/me \
  -H "Authorization: Bearer <user-token>"
```

### Update User
```bash
curl -X PUT http://localhost:3002/api/auth/users/:userId \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "phone": "254712345678",
    "role": "pastor",
    "isActive": true
  }'
```

### Deactivate User
```bash
curl -X DELETE http://localhost:3002/api/auth/users/:userId \
  -H "Authorization: Bearer <admin-token>"
```

This sets `is_active` to false without deleting the user record.

### Update Own Profile
```bash
curl -X PUT http://localhost:3002/api/auth/me \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "phone": "254712345678"
  }'
```

## Password Requirements

- **Minimum Length**: 8 characters
- **Recommended**: Mix of uppercase, lowercase, numbers, and special characters
- **Example**: `Ch@rch2024Admin!`

## Best Practices

### 1. Initial Setup
✅ Create one admin user first
✅ Log in with admin and create other admin users
✅ Assign specific roles based on responsibilities
✅ Change default passwords immediately

### 2. Security
✅ Use strong, unique passwords
✅ Regularly review user access
✅ Deactivate unused accounts
✅ Monitor login activity in system logs
❌ Don't share admin credentials
❌ Don't use same password for all accounts
❌ Don't create unnecessary admin accounts

### 3. User Management
✅ Document password for users (share securely)
✅ Verify email is correct before creating
✅ Use meaningful full names
✅ Include phone numbers for contact
✅ Review permissions quarterly

### 4. Monitoring
✅ Check `/api/auth/users` regularly
✅ Review system logs for suspicious activity
✅ Monitor failed login attempts
✅ Track which users accessed which modules

## Troubleshooting

### User Creation Failed
**Error**: "User with this email already exists"
**Solution**: Use a unique email address, or deactivate and recreate the account

**Error**: "Password must be at least 8 characters"
**Solution**: Use a password with 8 or more characters

### Login Failed
**Error**: "Invalid email or password"
**Solution**: Verify email and password are correct, check caps lock

**Error**: "User account is inactive"
**Solution**: Admin needs to reactivate the account

### Permission Denied
**Error**: "Only admins can create users"
**Solution**: User creating the account must have admin role, or use admin token

### Database Connection Error
**Error**: "Database error"
**Solution**: Restart the server and try again

## Environment Variables

The system uses these environment variables (already configured):

```
SUPABASE_URL=https://ncrecohwtejwygkyoaul.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
JWT_SECRET=tsoam_church_jwt_secret_key_2024_change_in_production_123456
JWT_EXPIRES_IN=24h
PORT=3002
NODE_ENV=production
```

## Server Logs

View server logs to troubleshoot issues:

```bash
# Docker container logs (if deployed in Docker)
docker logs <container-name>

# System logs API endpoint
curl -X GET http://localhost:3002/api/system-logs \
  -H "Authorization: Bearer <admin-token>"
```

## Database Status

Check if database is properly connected:

```bash
curl -X GET http://localhost:3002/api/auth/status
```

Should return:
```json
{
  "success": true,
  "status": "operational",
  "database": "supabase",
  "features": {
    "login": true,
    "registration": true,
    "tokenVerification": true,
    "userManagement": true
  }
}
```

## Getting Help

If you encounter issues:

1. Check this guide first
2. Review SYSTEM_VERIFICATION.md for system status
3. Check server logs for error messages
4. Verify environment variables are set correctly
5. Ensure Supabase is accessible
6. Restart the server if needed

## Summary

The TSOAM Church Management System is now ready for use! 

✅ All users can be created and managed through the API
✅ Secure authentication with JWT tokens
✅ Role-based access control
✅ Full audit trail of user activities
✅ Database integration verified

**Start by creating your first admin user using the interactive script!**
