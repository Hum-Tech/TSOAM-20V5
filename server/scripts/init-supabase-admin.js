/**
 * Initialize admin user in Supabase
 * This is called automatically when server starts
 */

require('dotenv').config();

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

async function initializeSupabaseAdmin() {
  try {
    const { supabaseAdmin } = require('../config/supabase-client');

    if (!supabaseAdmin) {
      console.log('⚠️  Supabase not available, skipping admin initialization');
      return false;
    }

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', 'admin@tsoam.org')
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('⚠️  Could not check for existing admin:', checkError.message);
      return false;
    }

    if (existingAdmin && existingAdmin.length > 0) {
      console.log('✅ Admin user already exists');
      return true;
    }

    // Create admin user
    console.log('🔧 Creating admin user...');

    const passwordHash = hashPassword('admin123');

    // Try with different role variations
    const roles = ['admin', 'Admin', 'ADMIN'];
    let newUser = null;
    let createError = null;

    for (const role of roles) {
      const result = await supabaseAdmin
        .from('users')
        .insert([{
          id: uuidv4(),
          email: 'admin@tsoam.org',
          password_hash: passwordHash,
          name: 'Humphrey Njoroge',
          phone: '',
          role: role,
          is_active: true
        }])
        .select()
        .single();

      if (!result.error) {
        newUser = result.data;
        break;
      }
      createError = result.error;
    }

    if (!newUser) {
      console.log('⚠️  Could not create admin user with any role variation');
      console.log('   Last error:', createError?.message);
      return false;
    }

    console.log('✅ Admin user created successfully');
    console.log('   Email: admin@tsoam.org');
    console.log('   Name: Humphrey Njoroge');
    console.log('   Password: admin123');
    console.log('   Role: ' + newUser.role);
    return true;

  } catch (error) {
    console.log('⚠️  Admin initialization error:', error.message);
    return false;
  }
}

module.exports = { initializeSupabaseAdmin };
