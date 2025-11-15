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
      .from('account_requests')
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
    const { v4: uuidv4 } = require('uuid');
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data: newRequest, error: createError } = await supabaseAdmin
      .from('account_requests')
      .insert([{
        request_id: requestId,
        name: name,
        email: email,
        phone: phone || null,
        role: role || 'user',
        department: department || null,
        employee_id: employee_id || null,
        requested_by: requested_by || 'Self',
        ip_address: ip_address || null,
        request_reason: request_reason || 'New user account creation request',
        status: 'pending',
        created_at: new Date().toISOString()
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
