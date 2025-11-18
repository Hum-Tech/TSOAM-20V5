const express = require("express");
const authService = require("../services/auth-service");
const { verifyToken } = require("../services/auth-service");
const { supabaseAdmin } = require("../config/supabase-client");

const router = express.Router();

/**
 * Authentication middleware
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token' });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    const result = authService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = result.decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * POST /api/auth/bootstrap
 * Initialize the admin user (only works if no users exist)
 * This is a one-time setup endpoint
 */
router.post("/bootstrap", async (req, res) => {
  try {
    // Check if any users exist
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'System already initialized. Users exist in database.'
      });
    }

    // Create admin user
    const { hashPassword } = require('../utils/password-utils');
    const passwordHash = hashPassword('admin123');

    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert([{
        email: 'admin@tsoam.org',
        password_hash: passwordHash,
        name: 'Humphrey Njoroge',
        phone: '',
        role: 'admin',
        is_active: true
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating admin:', createError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create admin user'
      });
    }

    // Ensure name is always provided
    const adminName = (newUser.name || newUser.full_name || newUser.email || "Admin").trim();

    res.json({
      success: true,
      message: 'System initialized with admin user',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: adminName,
        name: adminName,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    const result = await authService.authenticateUser(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      token: result.token,
      user: result.user
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/auth/register
 * Create a new user (admin only)
 */
router.post("/register", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Only admins can create users"
      });
    }

    const { email, fullName, phone, password, role } = req.body;

    const result = await authService.createUser({
      email,
      fullName,
      phone,
      password,
      role
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      user: result.user,
      message: "User created successfully"
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, role, is_active, created_at, last_login')
      .eq('id', req.user.userId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const permissions = await authService.getUserPermissions(user.role);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        permissions: permissions,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * PUT /api/auth/me
 * Update user profile
 */
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    const result = await authService.updateUser(req.user.userId, {
      full_name: fullName,
      phone: phone
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      user: result.user,
      message: "Profile updated successfully"
    });

  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/auth/users/create-request
 * Request a new account (public endpoint, no auth required)
 */
router.post("/users/create-request", async (req, res) => {
  try {
    const { name, email, phone, role, department, employee_id, requested_by, ip_address, request_reason } = req.body;

    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if email already exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Check if request already exists
    const { data: existingRequest } = await supabaseAdmin
      .from('user_requests')
      .select('id, status')
      .eq('email', email)
      .limit(1);

    if (existingRequest && existingRequest.length > 0) {
      const request = existingRequest[0];
      if (request.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Account request already pending for this email'
        });
      }
    }

    // Create account request
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data: newRequest, error: createError } = await supabaseAdmin
      .from('user_requests')
      .insert([{
        request_id: requestId,
        name: name,
        email: email,
        phone: phone || null,
        role: role || 'User',
        department: department || null,
        employee_id: employee_id || null,
        requested_by: requested_by || 'Self',
        ip_address: ip_address || null,
        request_reason: request_reason || 'New user account creation request',
        status: 'pending'
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating account request:', createError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create account request'
      });
    }

    res.json({
      success: true,
      message: 'Account request created successfully',
      requestId: newRequest.request_id,
      request: newRequest
    });

  } catch (error) {
    console.error("Account creation request error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * GET /api/auth/status
 * Check authentication service status
 */
router.get("/status", async (req, res) => {
  try {
    const { isSupabaseConfigured } = require("../config/supabase-client");

    res.json({
      success: true,
      status: "operational",
      database: isSupabaseConfigured ? "supabase" : "sqlite",
      features: {
        login: true,
        registration: true,
        tokenVerification: true,
        userManagement: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "error",
      error: error.message
    });
  }
});

/**
 * GET /api/users/pending-verification
 * Get all pending user requests (public endpoint for account verification tab)
 */
router.get("/users/pending-verification", async (req, res) => {
  try {
    console.log("📨 GET /api/users/pending-verification - Fetching pending user requests");

    const { data: pendingRequests, error } = await supabaseAdmin
      .from('user_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    console.log("📦 Pending requests response:", { error, count: pendingRequests?.length });

    if (error) {
      console.error('❌ Error fetching pending requests:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch pending requests'
      });
    }

    // Map to expected format
    const users = (pendingRequests || []).map(req => ({
      id: req.id,
      name: req.name,
      email: req.email,
      phone: req.phone || '',
      role: req.role || 'User',
      department: req.department || '',
      employeeId: req.employee_id || '',
      requestedAt: req.created_at,
      requestedBy: req.requested_by || 'Self',
      requestReason: req.request_reason || '',
      ipAddress: req.ip_address || '',
      status: req.status || 'pending'
    }));

    console.log("✅ Returning", users.length, "pending users");

    res.json({
      success: true,
      users: users,
      total: users.length
    });

  } catch (error) {
    console.error("❌ Fetch pending requests error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/users/approve
 * Approve a pending account request and create the user
 */
router.post("/users/approve", async (req, res) => {
  try {
    const { requestId, tempPassword } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }

    // Get the pending request
    const { data: requests, error: fetchError } = await supabaseAdmin
      .from('user_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !requests) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    if (requests.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending requests can be approved'
      });
    }

    // Check if email already exists as user
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', requests.email)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create temporary password if not provided
    const { hashPassword } = require('../utils/password-utils');
    const password = tempPassword || 'TempPass123!';
    const passwordHash = hashPassword(password);

    // Create new user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert([{
        email: requests.email,
        password_hash: passwordHash,
        name: requests.name,
        phone: requests.phone || '',
        role: requests.role || 'User',
        department: requests.department || '',
        employee_id: requests.employee_id || '',
        is_active: true
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }

    // Update request status
    await supabaseAdmin
      .from('user_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId);

    res.json({
      success: true,
      message: 'Account approved and user created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      tempPassword: password
    });

  } catch (error) {
    console.error("Approve account error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/users/reject
 * Reject a pending account request
 */
router.post("/users/reject", async (req, res) => {
  try {
    const { requestId, reason } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }

    // Update request status
    const { error } = await supabaseAdmin
      .from('user_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'Rejected by administrator'
      })
      .eq('id', requestId);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to reject request'
      });
    }

    res.json({
      success: true,
      message: 'Account request rejected'
    });

  } catch (error) {
    console.error("Reject account error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user exists
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .limit(1);

    if (!users || users.length === 0) {
      // For security, don't reveal if email exists
      return res.json({
        success: true,
        message: 'If email exists, reset code has been sent',
        demo: true,
        resetCode: '123456'
      });
    }

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset code (in demo mode, we'll just return it)
    // In production, you would send this via email
    res.json({
      success: true,
      message: 'Reset code sent to email',
      demo: true,
      resetCode: resetCode
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/auth/verify-reset-code
 * Verify password reset code
 */
router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, resetCode } = req.body;

    if (!email || !resetCode) {
      return res.status(400).json({
        success: false,
        error: 'Email and reset code are required'
      });
    }

    // In production, verify the code against database
    // For demo, accept any 6-digit code
    if (resetCode.length === 6 && /^\d+$/.test(resetCode)) {
      res.json({
        success: true,
        message: 'Reset code verified'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid reset code'
      });
    }

  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with verified code
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Get user
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Hash new password
    const { hashPassword } = require('../utils/password-utils');
    const passwordHash = hashPassword(newPassword);

    // Update password
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', users[0].id);

    if (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to reset password'
      });
    }

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * GET /api/auth/users
 * Get all users (admin only)
 */
router.get("/users", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Only admins can view all users"
      });
    }

    const users = await authService.getAllUsers();

    res.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * PUT /api/auth/users/:userId
 * Update user (admin only)
 */
router.put("/users/:userId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Only admins can update users"
      });
    }

    const { userId } = req.params;
    const { fullName, phone, role, isActive } = req.body;

    const updateData = {};
    if (fullName) updateData.full_name = fullName;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.is_active = isActive;

    const result = await authService.updateUser(userId, updateData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      user: result.user,
      message: "User updated successfully"
    });

  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * DELETE /api/auth/users/:userId
 * Deactivate user (admin only)
 */
router.delete("/users/:userId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Only admins can deactivate users"
      });
    }

    const { userId } = req.params;

    // Prevent self-deletion
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: "You cannot deactivate your own account"
      });
    }

    const result = await authService.deactivateUser(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * GET /api/auth/permissions
 * Get current user permissions
 */
router.get("/permissions", authMiddleware, async (req, res) => {
  try {
    const permissions = await authService.getUserPermissions(req.user.role);

    res.json({
      success: true,
      role: req.user.role,
      permissions
    });

  } catch (error) {
    console.error("Get permissions error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout endpoint (client-side token deletion)
 */
router.post("/logout", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
