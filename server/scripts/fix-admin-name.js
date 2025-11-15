/**
 * Fix admin user name in Supabase
 * Updates existing admin user to have full_name = "Humphrey Njoroge"
 */

require('dotenv').config();

async function fixAdminName() {
  try {
    const { supabaseAdmin } = require('../config/supabase-client');

    if (!supabaseAdmin) {
      console.log('⚠️  Supabase not available, skipping admin name fix');
      return false;
    }

    // Update admin user
    console.log('🔧 Fixing admin user name...');

    // First, get the current user to see what columns exist
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'admin@tsoam.org')
      .limit(1);

    if (fetchError) {
      console.log('⚠️  Could not fetch admin user:', fetchError.message);
      return false;
    }

    if (!currentUser || currentUser.length === 0) {
      console.log('⚠️  Admin user not found');
      return false;
    }

    const adminUser = currentUser[0];
    console.log('🔧 Admin user columns:', Object.keys(adminUser));

    // Try to update with full_name or name field
    let updateData = {};
    if ('full_name' in adminUser) {
      updateData.full_name = 'Humphrey Njoroge';
    } else if ('name' in adminUser) {
      updateData.name = 'Humphrey Njoroge';
    } else {
      console.log('⚠️  Could not find name column in user table');
      return false;
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('email', 'admin@tsoam.org')
      .select()
      .single();

    if (error) {
      console.log('⚠️  Could not update admin name:', error.message);
      return false;
    }

    if (updatedUser) {
      console.log('✅ Admin user name updated');
      console.log('   Email: ' + updatedUser.email);
      console.log('   Name: ' + updatedUser.full_name);
      return true;
    }

    return false;

  } catch (error) {
    console.log('⚠️  Admin name fix error:', error.message);
    return false;
  }
}

module.exports = { fixAdminName };
