const { query } = require('./config/database');
const bcrypt = require('bcrypt');

async function fixAdminUser() {
  console.log("🔍 Checking admin user...");
  
  try {
    // Check if admin user exists
    const existingUser = await query(
      'SELECT id, email, role, is_active FROM users WHERE email = ?',
      ['admin@tsoam.org']
    );

    if (existingUser.success && existingUser.data.length > 0) {
      console.log("✅ Admin user exists:", existingUser.data[0]);
      
      // Make sure user is active
      if (!existingUser.data[0].is_active) {
        await query(
          'UPDATE users SET is_active = TRUE WHERE email = ?',
          ['admin@tsoam.org']
        );
        console.log("✅ Admin user activated");
      }
      
      // Test password
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
      } else {
        console.log("❌ Failed to create admin user:", result.error);
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Admin user setup completed!");
    console.log("🔐 Try logging in with:");
    console.log("   Email: admin@tsoam.org");
    console.log("   Password: admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run the fix
fixAdminUser();
