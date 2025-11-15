const { supabaseAdmin } = require('../config/supabase-client');
const { hashPassword, verifyPassword } = require('../utils/password-utils');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} - User data and token if successful
 */
async function authenticateUser(email, password) {
  try {
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      };
    }

    // Get user from database
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }

    if (!users || users.length === 0) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    const user = users[0];

    // Debug: Log user data structure
    console.log('🔍 User found. Columns available:', Object.keys(user));
    console.log('🔍 password_hash present:', !!user.password_hash);
    console.log('🔍 User role:', user.role);

    // Check if user is active
    if (!user.is_active) {
      return {
        success: false,
        error: 'User account is inactive'
      };
    }

    // Verify password
    if (!user.password_hash) {
      console.error('❌ Password hash not found for user:', email);
      return {
        success: false,
        error: 'Account authentication data missing'
      };
    }

    const passwordMatch = verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Get user permissions
    const permissions = await getUserPermissions(user.role);

    // Normalize name field - handle both 'name' and 'full_name' columns from database
    const fullName = (user.name || user.full_name || user.email || "User").trim();

    // Ensure fullName is never empty or undefined
    const safeName = fullName && fullName !== "" && fullName !== "User" ? fullName : (user.email || "User");

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        fullName: safeName,
        role: user.role,
        permissions: permissions
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: safeName,
        name: safeName,
        phone: user.phone || "",
        role: user.role,
        permissions: permissions,
        lastLogin: user.last_login
      }
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Get user permissions based on role
 * @param {string} role - User role
 * @returns {array} - Array of permissions
 */
async function getUserPermissions(role) {
  try {
    // Return default permissions based on role if table doesn't exist
    const defaultPermissions = {
      'admin': ['*'],
      'Admin': ['*'],
      'pastor': ['*'],
      'Pastor': ['*'],
      'hr': ['members', 'hr', 'employees'],
      'HR Officer': ['members', 'hr', 'employees'],
      'finance': ['finance', 'transactions'],
      'Finance Officer': ['finance', 'transactions'],
      'user': ['members', 'events', 'appointments'],
      'User': ['members', 'events', 'appointments']
    };

    // Return default permissions
    if (defaultPermissions[role]) {
      return defaultPermissions[role];
    }

    // Try to fetch from database
    const { data: permissions, error } = await supabaseAdmin
      .from('role_permissions')
      .select('permission')
      .eq('role', role);

    if (error) {
      console.warn('Role permissions table not found, using defaults:', error.message);
      return defaultPermissions[role] || [];
    }

    return permissions.map(p => p.permission);
  } catch (error) {
    console.warn('Error in getUserPermissions, using defaults:', error.message);
    return [];
  }
}

/**
 * Create a new user (admin only)
 * @param {object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.fullName - User full name
 * @param {string} userData.phone - User phone
 * @param {string} userData.password - User password (will be hashed)
 * @param {string} userData.role - User role
 * @returns {object} - Created user data
 */
async function createUser(userData) {
  try {
    const { email, fullName, phone, password, role } = userData;

    // Validate required fields
    if (!email || !fullName || !password || !role) {
      return {
        success: false,
        error: 'Email, full name, password, and role are required'
      };
    }

    // Check if email already exists
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (checkError) {
      return {
        success: false,
        error: 'Database error'
      };
    }

    if (existingUsers && existingUsers.length > 0) {
      return {
        success: false,
        error: 'Email already exists'
      };
    }

    // Validate role
    const validRoles = ['admin', 'pastor', 'user', 'finance_officer', 'hr_officer'];
    if (!validRoles.includes(role)) {
      return {
        success: false,
        error: 'Invalid role'
      };
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert([{
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone: phone || '',
        role,
        is_active: true
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return {
        success: false,
        error: 'Failed to create user'
      };
    }

    // Normalize name field - handle both 'name' and 'full_name' columns
    const createdUserName = (newUser.name || newUser.full_name || fullName || newUser.email || "User").trim();

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: createdUserName,
        name: createdUserName,
        phone: newUser.phone || "",
        role: newUser.role,
        createdAt: newUser.created_at
      }
    };

  } catch (error) {
    console.error('Error in createUser:', error);
    return {
      success: false,
      error: 'Failed to create user'
    };
  }
}

/**
 * Update user details (admin or user self)
 * @param {string} userId - User ID
 * @param {object} updates - Fields to update
 * @returns {object} - Updated user data
 */
async function updateUser(userId, updates) {
  try {
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: 'Failed to update user'
      };
    }

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.is_active
      }
    };

  } catch (error) {
    console.error('Error in updateUser:', error);
    return {
      success: false,
      error: 'Failed to update user'
    };
  }
}

/**
 * Get all users (admin only)
 * @returns {array} - List of users
 */
async function getAllUsers() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, role, is_active, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return users.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }));

  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
}

/**
 * Deactivate user (admin only)
 * @param {string} userId - User ID
 * @returns {object} - Success status
 */
async function deactivateUser(userId) {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', userId);

    if (error) {
      return {
        success: false,
        error: 'Failed to deactivate user'
      };
    }

    return {
      success: true,
      message: 'User deactivated successfully'
    };

  } catch (error) {
    console.error('Error in deactivateUser:', error);
    return {
      success: false,
      error: 'Failed to deactivate user'
    };
  }
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} - Decoded token or error
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      valid: true,
      decoded
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

module.exports = {
  authenticateUser,
  createUser,
  updateUser,
  getAllUsers,
  deactivateUser,
  getUserPermissions,
  verifyToken,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
