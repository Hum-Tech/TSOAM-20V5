# Module System Documentation

## Overview

The TSOAM Church Management System now includes a **modular architecture** that allows churches to purchase and activate individual modules. This enables churches to only pay for the features they need while providing a clear path for upselling and expanding functionality.

## Key Features

- **Modular Purchase Model**: Churches can buy modules individually
- **Monthly Billing**: All modules are billed monthly (no long-term contracts)
- **Easy Management**: Activate/deactivate modules anytime from Settings or Module Store
- **Feature-Rich**: Each module comes with multiple features and capabilities
- **Audit Trail**: Track all module access and licensing changes

## Available Modules

### 1. Member Management (KES 3,500/month)
- Member Registration
- Member Tracking & Communication
- Bulk SMS Messaging
- Member Reports & Analytics
- Visitor Tracking

### 2. Finance & Accounting (KES 5,800/month)
- Tithe Tracking
- Offering Management
- Expense Tracking
- Financial Reports
- Budget Planning
- Audit Trail

### 3. HR & Payroll (KES 4,600/month)
- Employee Management
- Attendance Tracking
- Payroll Processing
- Leave Management
- Performance Reviews

### 4. HomeCells Management (KES 2,900/month)
- District Management
- Zone Management
- HomCell Organization
- Leader Assignment
- Hierarchy Reporting

### 5. Welfare & Support (KES 2,300/month)
- Assistance Tracking
- Support Requests
- Welfare Programs
- Beneficiary Management

### 6. Events Management (KES 2,300/month)
- Event Planning
- Attendance Tracking
- Budget Tracking
- Event Reports

### 7. Inventory Management (KES 2,300/month)
- Asset Tracking
- Equipment Management
- Supply Management
- Maintenance Tracking

### 8. Appointments & Scheduling (KES 1,700/month)
- Appointment Scheduling
- Calendar Integration
- Reminder Notifications
- Counseling Logs

## User Interface

### Module Store Page
Access the Module Store from the sidebar navigation or Settings page.

**Features:**
- Browse all available modules
- View module features and pricing
- Activate/purchase modules with one click
- Automatic activation upon purchase
- Monthly billing information

**Location:** `/module-store` or Settings → Modules tab

### Settings Page - Modules Tab
Manage your purchased modules directly from Settings.

**Features:**
- View all active modules
- See license type, purchase date, and expiration info
- Deactivate modules anytime
- Quick link to Module Store for purchases

## API Endpoints

### Get All Available Modules
```
GET /api/modules
```
Returns all active modules with features and pricing.

### Get Purchased Modules
```
GET /api/modules/purchased
Authorization: Bearer {token}
```
Returns modules purchased by the current church.

### Check Module Access
```
GET /api/modules/{moduleId}/access
Authorization: Bearer {token}
```
Checks if user has access to a specific module.

### Purchase/Activate Module
```
POST /api/modules/purchase
Authorization: Bearer {token}
Content-Type: application/json

{
  "moduleId": 1,
  "licenseType": "subscription",
  "maxUsers": -1,
  "paymentReference": "optional-payment-ref"
}
```

### Activate Module (Admin Only)
```
POST /api/modules/{moduleId}/activate
Authorization: Bearer {token}
```

### Deactivate Module (Admin Only)
```
POST /api/modules/{moduleId}/deactivate
Authorization: Bearer {token}
```

### Get Module Status
```
GET /api/modules/status/all
Authorization: Bearer {token}
```
Returns status of all modules for the current user.

## Database Tables

### modules
Core module definitions with pricing and features.

```sql
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  module_code VARCHAR(50) UNIQUE,
  module_name VARCHAR(255),
  description TEXT,
  price_usd DECIMAL(10, 2),
  price_kes DECIMAL(10, 2),
  billing_cycle VARCHAR(50),
  features TEXT, -- JSON array
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### church_subscriptions
Track which modules are active for the church.

```sql
CREATE TABLE church_subscriptions (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id),
  license_key VARCHAR(255) UNIQUE,
  status VARCHAR(50), -- active, inactive, expired, cancelled
  purchase_date TIMESTAMP,
  activation_date TIMESTAMP,
  expiration_date TIMESTAMP,
  license_type VARCHAR(50), -- perpetual, trial, subscription
  max_users INTEGER,
  active_users_count INTEGER,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### module_features
Detailed feature list for each module.

```sql
CREATE TABLE module_features (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id),
  feature_code VARCHAR(100),
  feature_name VARCHAR(255),
  description TEXT,
  is_required BOOLEAN,
  created_at TIMESTAMP,
  UNIQUE(module_id, feature_code)
);
```

### module_access_log
Audit trail for module access and licensing.

```sql
CREATE TABLE module_access_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  module_id INTEGER REFERENCES modules(id),
  action VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP
);
```

## Client-Side Services

### ModuleService
Main service for module management.

```typescript
import { moduleService } from '@/services/ModuleService';

// Get all available modules
const modules = await moduleService.getAllModules(token);

// Get purchased modules
const purchased = await moduleService.getPurchasedModules(token);

// Check access to a module
const hasAccess = await moduleService.checkModuleAccess(token, moduleId);

// Purchase a module
const result = await moduleService.purchaseModule(
  token,
  moduleId,
  'subscription',
  -1, // -1 = unlimited users
  'optional-payment-ref'
);

// Activate/deactivate
await moduleService.activateModule(token, moduleId);
await moduleService.deactivateModule(token, moduleId);
```

### useModuleAccess Hook
Easy access to module permissions in components.

```typescript
import { useModuleAccess } from '@/hooks/useModuleAccess';

function MyComponent() {
  const {
    hasModuleAccess,
    hasAccess,
    requireModule,
    getPurchasedModules,
    loading,
    error
  } = useModuleAccess();

  // Check single module
  if (hasModuleAccess('member_management')) {
    // Render member management UI
  }

  // Check multiple modules
  if (hasAccess(['finance', 'hr'])) {
    // Render combined UI
  }

  // Require module (returns boolean)
  if (requireModule('homecells')) {
    // Module is required and active
  }

  // Get all purchased modules
  const purchased = getPurchasedModules();
}
```

## Components

### ModuleStore
Main marketplace component for browsing and purchasing modules.

```typescript
import { ModuleStore } from '@/components/ModuleStore';

<ModuleStore 
  token={token}
  onPurchaseSuccess={() => {
    // Handle successful purchase
  }}
/>
```

### PurchasedModules
Display currently active modules with management options.

```typescript
import { PurchasedModules } from '@/components/PurchasedModules';

<PurchasedModules token={token} />
```

## Implementation Workflow

### 1. Database Setup
The module system requires the migration to be applied:

```bash
# The migration file is at:
server/migrations/004_create_modules_system.sql

# Apply to Supabase:
# 1. Go to Supabase SQL Editor
# 2. Copy the entire migration file
# 3. Run it
```

### 2. Server Routes
Modules routes are automatically registered in `server/server.js`:

```javascript
const modulesRoutes = require("./routes/modules");
app.use("/api/modules", modulesRoutes);
```

### 3. Frontend Integration
The ModuleStore page is available at `/module-store` and integrated in the Settings page.

### 4. Component Usage
Use the `useModuleAccess` hook to conditionally render features:

```typescript
function MemberManagementPage() {
  const { hasModuleAccess } = useModuleAccess();

  if (!hasModuleAccess('member_management')) {
    return <ModuleNotPurchased moduleName="Member Management" />;
  }

  return <MemberManagement />;
}
```

## Access Control

### Role-Based Access
- **Admin**: Full access to module management
- **Finance Officer**: Can purchase and manage modules
- **Other Roles**: Can view their purchased modules

### Module Enforcement
Module access is enforced at:
1. **API Level**: Endpoints check if module is active
2. **Frontend Level**: Components conditionally render based on access
3. **Audit Level**: All access attempts are logged

## Billing & Licensing

### Monthly Billing
- All modules are billed monthly
- No setup fees or long-term contracts
- First month activation is immediate

### License Types
- **subscription**: Monthly recurring billing
- **trial**: 30-day trial period
- **perpetual**: One-time license
- **enterprise**: Custom arrangements

### License Keys
Each subscription gets a unique license key:
```
Format: LIC-{timestamp}-{random}
Example: LIC-1704067200000-ABC123XYZ
```

## Best Practices

### For Administrators
1. Review available modules regularly
2. Activate modules based on church needs
3. Monitor module usage and access logs
4. Plan budgets around module costs

### For Development
1. Always check module access before rendering features
2. Provide fallback UI for inactive modules
3. Log all module-related changes
4. Test module deactivation scenarios

### For Security
1. Validate module access on every API call
2. Protect sensitive module features with authentication
3. Audit all license changes
4. Rotate license keys periodically

## Troubleshooting

### Module Not Appearing in Store
- Verify `is_active = true` in modules table
- Check database connection
- Clear browser cache

### Purchase Failed
- Check Supabase connection
- Verify user has admin/finance role
- Check for duplicate purchases
- Review module_access_log for details

### Module Access Denied
- Verify module is in 'active' status
- Check subscription expiration date
- Confirm module hasn't been deactivated
- Review audit logs for changes

## Future Enhancements

- [ ] Payment gateway integration (Stripe, M-Pesa, etc.)
- [ ] Discount codes and coupons
- [ ] Volume licensing for enterprises
- [ ] Custom module creation
- [ ] Module bundling/packages
- [ ] Usage analytics and reporting
- [ ] Scheduled activations/deactivations

## Support

For questions or issues with the module system:
1. Check module_access_log for error details
2. Review System Logs in Settings
3. Contact support with:
   - Module codes
   - User email
   - Error messages
   - Recent actions

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Maintained by:** TSOAM Development Team
