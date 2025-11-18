const { supabaseAdmin, isSupabaseConfigured } = require('./server/config/supabase-client');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createAdminUser() {
  if (!isSupabaseConfigured) {
    console.error('❌ Supabase not configured. Check your environment variables.');
    process.exit(1);
  }

  console.log('🔐 Creating admin user...\n');

  const adminEmail = 'admin@tsoam.org';
  const adminPassword = 'Admin@123456'; // Default password - CHANGE THIS IMMEDIATELY
  const adminName = 'System Administrator';

  try {
    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log(`   Email: ${adminEmail}`);
      return;
    }

    // Create admin user
    const passwordHash = hashPassword(adminPassword);
    
    const { data: newAdmin, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: adminEmail,
          password_hash: passwordHash,
          full_name: adminName,
          role: 'admin',
          is_active: true,
          email_verified: true,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create admin user:', error.message);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!\n');
    console.log('📋 Admin Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('1. Change the password immediately on first login');
    console.log('2. Do NOT share these credentials');
    console.log('3. Consider enabling two-factor authentication\n');
    console.log('✅ Setup Complete! You can now login to the system.');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();
