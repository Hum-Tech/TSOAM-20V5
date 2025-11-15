#!/usr/bin/env node

/**
 * Initialize admin user directly in Supabase
 */

require('dotenv').config();

const { supabaseAdmin } = require('../config/supabase-client');
const crypto = require('crypto');

// Hash password using PBKDF2
function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

async function initAdmin() {
  console.log('\n🔧 Initializing Admin User...\n');

  if (!supabaseAdmin) {
    console.error('❌ Supabase not configured');
    process.exit(1);
  }

  try {
    const email = 'admin@tsoam.org';
    const passwordHash = hashPassword('admin123');

    console.log('📝 Creating admin user:', email);
    console.log('⏳ Connecting to Supabase...\n');

    // Try to insert the admin user
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: email,
        password_hash: passwordHash,
        full_name: 'Church Administrator',
        phone: '',
        role: 'admin',
        is_active: true
      })
      .select();

    if (error) {
      if (error.code === '23505') {
        console.log('⚠️  Admin user already exists in database');
        console.log('   Email: admin@tsoam.org');
        console.log('   Password: admin123\n');
        process.exit(0);
      }
      console.error('❌ Error creating admin:', error.message);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Email: admin@tsoam.org');
    console.log('   Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⏭️  Next steps:');
    console.log('   1. Go to http://localhost:3002');
    console.log('   2. Enter: admin@tsoam.org / admin123');
    console.log('   3. Click Sign In\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

initAdmin();
