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

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        full_name: 'Humphrey Njoroge'
      })
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
