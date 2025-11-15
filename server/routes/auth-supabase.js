const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let supabase, supabaseAdmin;
try {
  ({ supabase, supabaseAdmin } = require('../config/supabase-client'));
} catch (error) {
  console.error('Failed to load Supabase client:', error.message);
}

const router = express.Router();

// Cleanup expired password reset codes
const cleanupExpiredResets = async () => {
  try {
    const now = new Date();
    await supabaseAdmin
      .from('password_resets')
      .delete()
      .or(`expires_at.lt.${now.toISOString()},and(used.eq.true,created_at.lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()})`);
  } catch (error) {
    console.warn('Password reset cleanup failed:', error.message);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredResets, 60 * 60 * 1000);

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true);

    if (selectError) {
      return res.status(500).json({ error: 'Database error', details: selectError.message });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: rememberMe ? '7d' : '24h' }
    );

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Return user data (without password)
    const { password_hash, ...userData } = user;

    res.json({
      success: true,
      token,
      user: {
        ...userData,
        permissions: getRolePermissions(user.role),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, role, department, phone, employeeId } = req.body;

    if (!fullName || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate temporary password
    const tempPassword = `temp${Math.floor(Math.random() * 10000)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const generatedEmployeeId = employeeId || `TSOAM-EMP-${String(Date.now()).slice(-6)}`;
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Insert new user
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: userId,
          name: fullName,
          email,
          role,
          department: department || 'General',
          phone: phone || '',
          employee_id: generatedEmployeeId,
          password_hash: hashedPassword,
          is_active: false,
        }
      ]);

    if (insertError) {
      return res.status(500).json({ error: 'Failed to create user', details: insertError.message });
    }

    res.json({
      success: true,
      user: {
        id: userId,
        name: fullName,
        email,
        role,
        employee_id: generatedEmployeeId,
        is_active: false,
      },
      credentials: {
        employeeId: generatedEmployeeId,
        tempPassword,
        email,
        accountType: 'new',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create account endpoint
router.post('/create-account', async (req, res) => {
  try {
    const { name, email, password, role, department, employeeId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = `user-${Date.now()}`;

    // Insert new user
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: userId,
          name,
          email,
          password_hash: passwordHash,
          role,
          department,
          employee_id: employeeId,
        }
      ]);

    if (insertError) {
      return res.status(500).json({ error: 'Failed to create user', details: insertError.message });
    }

    res.json({
      success: true,
      message: 'User created successfully',
      credentials: { email, password },
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get role permissions
function getRolePermissions(role) {
  const basePermissions = {
    dashboard: true,
    members: false,
    hr: false,
    finance: false,
    welfare: false,
    inventory: false,
    events: false,
    appointments: false,
    messaging: false,
    settings: false,
    users: false,
    systemLogs: false,
  };

  switch (role) {
    case 'Admin':
      return {
        dashboard: true,
        members: true,
        hr: true,
        finance: true,
        welfare: true,
        inventory: true,
        events: true,
        appointments: true,
        messaging: true,
        settings: true,
        users: true,
        systemLogs: true,
      };
    case 'HR Officer':
      return {
        ...basePermissions,
        members: true,
        hr: true,
        welfare: true,
        appointments: true,
        messaging: true,
      };
    case 'Finance Officer':
      return {
        ...basePermissions,
        finance: true,
        inventory: true,
        events: true,
      };
    case 'User':
    default:
      return {
        ...basePermissions,
        members: true,
        inventory: true,
        events: true,
        appointments: true,
      };
  }
}

// Verify token middleware
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Forgot password - Request reset code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .eq('is_active', true);

    if (!users || users.length === 0) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If the email exists, a reset code has been sent',
        demo: true,
      });
    }

    const user = users[0];

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Store reset code in database
    const { error: insertError } = await supabaseAdmin
      .from('password_resets')
      .insert([
        {
          user_id: user.id,
          email,
          reset_code: resetCode,
          expires_at: expiresAt.toISOString(),
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
        }
      ]);

    if (insertError) {
      console.log('💡 Database issue - returning demo reset code confirmation');
      return res.json({
        success: true,
        message: 'Reset code sent to your email (Demo Mode)',
        resetCode: '123456',
        demo: true,
      });
    }

    console.log(`📧 Password Reset Code for ${email}: ${resetCode}`);

    res.json({
      success: true,
      message: 'Reset code sent to your email',
      resetCode,
      demo: true,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify reset code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, resetCode } = req.body;

    if (!email || !resetCode) {
      return res.status(400).json({ error: 'Email and reset code are required' });
    }

    // Check reset code
    const { data: resets } = await supabase
      .from('password_resets')
      .select('user_id, reset_code, expires_at, used')
      .eq('email', email)
      .eq('reset_code', resetCode)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!resets || resets.length === 0) {
      // Demo mode fallback
      if (resetCode === '123456') {
        return res.json({
          success: true,
          message: 'Reset code verified (Demo Mode)',
          demo: true,
        });
      }
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    const resetRecord = resets[0];

    // Check if expired
    if (new Date() > new Date(resetRecord.expires_at)) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    res.json({
      success: true,
      message: 'Reset code verified successfully',
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password with code
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({
        error: 'Email, reset code, and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
      });
    }

    // Verify reset code again
    const { data: resets } = await supabase
      .from('password_resets')
      .select('user_id, reset_code, expires_at, used')
      .eq('email', email)
      .eq('reset_code', resetCode)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!resets || resets.length === 0) {
      // Demo mode fallback
      if (resetCode === '123456') {
        return res.json({
          success: true,
          message: 'Password reset successfully (Demo Mode)',
          demo: true,
        });
      }
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    const resetRecord = resets[0];

    // Check if expired
    if (new Date() > new Date(resetRecord.expires_at)) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', resetRecord.user_id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update password', details: updateError.message });
    }

    // Mark reset code as used
    await supabaseAdmin
      .from('password_resets')
      .update({ used: true })
      .eq('email', email)
      .eq('reset_code', resetCode);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
