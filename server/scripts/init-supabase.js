const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabase-client');

async function initSupabase() {
  console.log('🔄 Initializing Supabase database...');

  try {
    // Check if admin user exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', 'admin@tsoam.org')
      .single();

    if (existingUser && !checkError) {
      console.log('📋 Admin user already exists, skipping creation');
      return true;
    }

    // Hash admin password
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminId = uuidv4();

    // Insert admin user
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: adminId,
          name: 'System Administrator',
          email: 'admin@tsoam.org',
          password_hash: adminPassword,
          role: 'Admin',
          department: 'Administration',
          employee_id: 'TSOAM-ADM-001',
          is_active: true,
          can_create_accounts: true,
          can_delete_accounts: true,
        }
      ])
      .select();

    if (insertError) {
      console.error('❌ Failed to create admin user:', insertError.message);
      return false;
    }

    console.log('✅ Admin user created successfully');

    // Create HR Officer
    const hrPassword = await bcrypt.hash('hr123', 12);
    const hrId = uuidv4();

    const { data: hrData, error: hrError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: hrId,
          name: 'HR Officer',
          email: 'hr@tsoam.org',
          password_hash: hrPassword,
          role: 'HR Officer',
          department: 'Human Resources',
          employee_id: 'TSOAM-HR-001',
          is_active: true,
        }
      ])
      .select();

    if (hrError) {
      console.error('⚠️  Failed to create HR user:', hrError.message);
    } else {
      console.log('✅ HR Officer user created successfully');
    }

    console.log('\n✅ Supabase database initialized successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@tsoam.org / admin123');
    console.log('HR Officer: hr@tsoam.org / hr123');

    return true;
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  initSupabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initSupabase };
