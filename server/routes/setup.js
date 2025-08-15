const express = require('express');
const { query } = require('../config/database');
const bcrypt = require('bcrypt');

const router = express.Router();

// Setup admin user endpoint
router.post('/admin-user', async (req, res) => {
  try {
    console.log("🔍 Checking admin user setup...");
    
    // Check if admin user exists
    const existingUser = await query(
      'SELECT id, email, role, is_active FROM users WHERE email = ?',
      ['admin@tsoam.org']
    );

    if (existingUser.success && existingUser.data.length > 0) {
      const user = existingUser.data[0];
      console.log("✅ Admin user exists:", user);
      
      // Make sure user is active
      if (!user.is_active) {
        await query(
          'UPDATE users SET is_active = TRUE WHERE email = ?',
          ['admin@tsoam.org']
        );
        console.log("✅ Admin user activated");
      }
      
      // Test and fix password if needed
      const userWithPassword = await query(
        'SELECT password_hash FROM users WHERE email = ?',
        ['admin@tsoam.org']
      );
      
      if (userWithPassword.success && userWithPassword.data.length > 0) {
        const isValid = await bcrypt.compare('admin123', userWithPassword.data[0].password_hash);
        console.log("🔐 Password test:", isValid ? 'Valid' : 'Invalid');
        
        if (!isValid) {
          const newHash = await bcrypt.hash('admin123', 10);
          await query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [newHash, 'admin@tsoam.org']
          );
          console.log("✅ Password updated");
        }
      }

      return res.json({
        success: true,
        message: 'Admin user already exists and is configured',
        user: {
          email: user.email,
          role: user.role,
          is_active: true
        }
      });
    } else {
      console.log("❌ Admin user not found. Creating...");
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUserId = 'admin-001';
      
      const result = await query(`
        INSERT INTO users (id, name, email, password_hash, role, is_active, can_create_accounts, can_delete_accounts, department, employee_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        adminUserId,
        'System Administrator', 
        'admin@tsoam.org',
        hashedPassword,
        'Admin',
        1,
        1,
        1,
        'Administration',
        'TSOAM-ADM-001'
      ]);
      
      if (result.success) {
        console.log("✅ Admin user created successfully");
        return res.json({
          success: true,
          message: 'Admin user created successfully',
          user: {
            email: 'admin@tsoam.org',
            role: 'Admin',
            is_active: true
          },
          credentials: {
            email: 'admin@tsoam.org',
            password: 'admin123'
          }
        });
      } else {
        console.log("❌ Failed to create admin user:", result.error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create admin user',
          details: result.error
        });
      }
    }

  } catch (error) {
    console.error("❌ Setup error:", error.message);
    res.status(500).json({
      success: false,
      error: 'Admin user setup failed',
      details: error.message
    });
  }
});

// Check system setup status
router.get('/status', async (req, res) => {
  try {
    // Check if admin user exists
    const adminUser = await query(
      'SELECT email, role, is_active FROM users WHERE email = ?',
      ['admin@tsoam.org']
    );

    // Check total users
    const totalUsers = await query('SELECT COUNT(*) as count FROM users');

    // Check database tables
    const tables = await query('SHOW TABLES');

    res.json({
      success: true,
      status: {
        admin_user_exists: adminUser.success && adminUser.data.length > 0,
        admin_user_active: adminUser.success && adminUser.data.length > 0 ? adminUser.data[0].is_active : false,
        total_users: totalUsers.success ? totalUsers.data[0].count : 0,
        total_tables: tables.success ? tables.data.length : 0,
        database_connected: true
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check system status',
      details: error.message
    });
  }
});

module.exports = router;
