#!/usr/bin/env node

/**
 * Create a new user in the TSOAM system
 * 
 * Usage: node server/scripts/create-user.js
 * 
 * Then follow the interactive prompts to enter user details
 */

require('dotenv').config();

const readline = require('readline');
const { supabaseAdmin } = require('../config/supabase-client');
const { hashPassword } = require('../utils/password-utils');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise(resolve => {
  rl.question(prompt, resolve);
});

const VALID_ROLES = ['admin', 'pastor', 'user', 'finance_officer', 'hr_officer'];

/**
 * Create a new user interactively
 */
async function createUserInteractive() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TSOAM Church - Create New User');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Get user details
    const email = await question('📧 Email address: ');
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing users:', checkError.message);
      process.exit(1);
    }

    if (existingUser && existingUser.length > 0) {
      console.error('❌ User with this email already exists');
      process.exit(1);
    }

    const fullName = await question('👤 Full name: ');
    if (!fullName) {
      console.error('❌ Full name is required');
      process.exit(1);
    }

    const phone = await question('📱 Phone number: ');

    console.log('\n📋 Available roles:');
    VALID_ROLES.forEach((role, index) => {
      const displayRole = role.replace('_', ' ').toUpperCase();
      console.log(`   ${index + 1}. ${displayRole}`);
    });

    const roleChoice = await question('\n🔐 Select role (1-5): ');
    const roleIndex = parseInt(roleChoice) - 1;

    if (roleIndex < 0 || roleIndex >= VALID_ROLES.length) {
      console.error('❌ Invalid role selection');
      process.exit(1);
    }

    const role = VALID_ROLES[roleIndex];

    const password = await question('\n🔑 Password: ');
    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    const confirmPassword = await question('🔑 Confirm password: ');
    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match');
      process.exit(1);
    }

    // Hash password
    console.log('\n⏳ Creating user...');
    const passwordHash = hashPassword(password);

    // Create user in database
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert([{
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone,
        role,
        is_active: true
      }])
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      process.exit(1);
    }

    console.log('\n✅ User created successfully!\n');
    console.log('📊 User Details:');
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Name: ${newUser.full_name}`);
    console.log(`   Role: ${newUser.role.replace('_', ' ').toUpperCase()}`);
    console.log(`   Status: ${newUser.is_active ? 'Active' : 'Inactive'}`);
    console.log(`   Created: ${new Date(newUser.created_at).toLocaleString()}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Create user from arguments (for non-interactive use)
 */
async function createUserFromArgs(email, fullName, password, role, phone) {
  try {
    if (!email || !fullName || !password || !role) {
      console.error('❌ Missing required arguments');
      console.error('Usage: node create-user.js <email> <fullName> <password> <role> [phone]');
      console.error('Roles:', VALID_ROLES.join(', '));
      process.exit(1);
    }

    if (!VALID_ROLES.includes(role)) {
      console.error('❌ Invalid role. Valid roles:', VALID_ROLES.join(', '));
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    console.log('⏳ Creating user...');
    const passwordHash = hashPassword(password);

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
      console.error('❌ Error creating user:', createError.message);
      process.exit(1);
    }

    console.log('✅ User created successfully!');
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Check if running interactively or with arguments
if (process.argv.length > 2) {
  const [, , email, fullName, password, role, phone] = process.argv;
  createUserFromArgs(email, fullName, password, role, phone);
} else {
  createUserInteractive();
}
