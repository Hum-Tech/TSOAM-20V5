#!/usr/bin/env node

/**
 * Create the initial admin user for TSOAM system
 * Usage: node server/scripts/create-admin.js
 */

require('dotenv').config();

const { supabaseAdmin } = require('../config/supabase-client');
const { hashPassword } = require('../utils/password-utils');

async function createAdmin() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TSOAM - Creating Initial Admin User');
  console.log('━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!supabaseAdmin) {
    console.error('❌ Supabase not configured');
    process.exit(1);
  }

  try {
    const email = 'admin@tsoam.org';
    const fullName = 'Church Administrator';
    const password = 'admin123';
    const phone = '';
    const role = 'admin';

    console.log('⏳ Checking if admin already exists...');
    
    // Check if admin already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing users:', checkError.message);
      process.exit(1);
    }

    if (existingUser && existingUser.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${email}`);
      console.log(`   ID: ${existingUser[0].id}`);
      console.log('\nNo action needed.');
      process.exit(0);
    }

    console.log('✅ Admin does not exist, creating new admin user...\n');

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
      console.error('❌ Error creating admin:', createError.message);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Admin Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${newUser.full_name}`);
    console.log(`   Role: ${newUser.role.toUpperCase()}`);
    console.log(`   Status: ${newUser.is_active ? 'Active' : 'Inactive'}`);
    console.log(`   Created: ${new Date(newUser.created_at).toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT:');
    console.log('   1. Save these credentials in a secure location');
    console.log('   2. Change the password after first login');
    console.log('   3. Do not share credentials with unauthorized users\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
