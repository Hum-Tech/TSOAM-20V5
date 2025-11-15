require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Test helper
async function testOperation(name, operation) {
  testResults.total++;
  try {
    console.log(`\n⏳ Testing: ${name}`);
    const result = await operation();
    console.log(`✅ ${name} - PASS`);
    testResults.passed++;
    return result;
  } catch (error) {
    console.error(`❌ ${name} - FAIL`);
    console.error(`   Error: ${error.message}`);
    testResults.failed++;
    return null;
  }
}

// Test 1: User operations
async function testUserOperations() {
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('     TEST 1: USER MANAGEMENT OPERATIONS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test reading users
  await testOperation('Read all active users', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    console.log(`   Found ${data?.length || 0} active users`);
    return data;
  });

  // Test finding admin
  await testOperation('Find admin user', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@tsoam.org')
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Admin user not found');
    console.log(`   Found: ${data[0].name} (${data[0].role})`);
    return data[0];
  });

  // Test updating user
  const adminId = 'admin-001';
  await testOperation('Update user last_login', async () => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminId)
      .select();

    if (error) throw error;
    console.log(`   Updated: ${data?.[0]?.name}`);
    return data;
  });
}

// Test 2: Member operations
async function testMemberOperations() {
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('     TEST 2: MEMBER MANAGEMENT OPERATIONS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test create member
  const memberId = `TEST-${Date.now()}`;
  let createdMemberId = null;

  await testOperation('Create new member', async () => {
    const { data, error } = await supabaseAdmin
      .from('members')
      .insert([{
        member_id: memberId,
        name: 'Test Member',
        email: `test-${Date.now()}@example.com`,
        phone: '0700000000',
        status: 'Active',
        join_date: new Date().toISOString().split('T')[0],
        created_by: 'admin-001'
      }])
      .select();

    if (error) throw error;
    createdMemberId = data?.[0]?.id;
    console.log(`   Created: ${data?.[0]?.name} (ID: ${createdMemberId})`);
    return data;
  });

  // Test read members
  await testOperation('Read all active members', async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'Active')
      .limit(10);

    if (error) throw error;
    console.log(`   Found ${data?.length || 0} active members`);
    return data;
  });

  // Test update member
  if (createdMemberId) {
    await testOperation('Update member information', async () => {
      const { data, error } = await supabaseAdmin
        .from('members')
        .update({
          phone: '0711111111',
          address: 'Test Address'
        })
        .eq('id', createdMemberId)
        .select();

      if (error) throw error;
      console.log(`   Updated: ${data?.[0]?.name}`);
      return data;
    });

    // Test delete member
    await testOperation('Delete test member', async () => {
      const { error } = await supabaseAdmin
        .from('members')
        .delete()
        .eq('id', createdMemberId);

      if (error) throw error;
      console.log(`   Deleted member ID: ${createdMemberId}`);
      return true;
    });
  }
}

// Test 3: Financial operations
async function testFinancialOperations() {
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('     TEST 3: FINANCIAL OPERATIONS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test create transaction
  const transactionId = `TXN-${Date.now()}`;
  let createdTransId = null;

  await testOperation('Create financial transaction', async () => {
    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .insert([{
        id: transactionId,
        transaction_id: transactionId,
        type: 'Income',
        category: 'Tithe',
        amount: 5000,
        description: 'Test tithe deposit',
        transaction_date: new Date().toISOString().split('T')[0],
        created_by: 'admin-001'
      }])
      .select();

    if (error) throw error;
    createdTransId = data?.[0]?.id;
    console.log(`   Created: ${data?.[0]?.description} (Amount: ${data?.[0]?.amount})`);
    return data;
  });

  // Test read transactions
  await testOperation('Read financial transactions', async () => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('type', 'Income')
      .limit(10);

    if (error) throw error;
    console.log(`   Found ${data?.length || 0} income transactions`);
    return data;
  });

  // Test financial summary
  await testOperation('Calculate transaction totals', async () => {
    const { data: income, error: incomeError } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('type', 'Income');

    const { data: expense, error: expenseError } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('type', 'Expense');

    if (incomeError || expenseError) throw incomeError || expenseError;

    const totalIncome = (income || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpense = (expense || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    console.log(`   Total Income: ${totalIncome}`);
    console.log(`   Total Expense: ${totalExpense}`);
    console.log(`   Balance: ${totalIncome - totalExpense}`);

    return { totalIncome, totalExpense };
  });
}

// Test 4: Event operations
async function testEventOperations() {
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('     TEST 4: EVENT MANAGEMENT OPERATIONS');
  console.log('═══════════════════════════════════════════════════════\n');

  const eventId = `EVT-${Date.now()}`;
  let createdEventId = null;

  // Test create event
  await testOperation('Create event', async () => {
    const { data, error } = await supabaseAdmin
      .from('events')
      .insert([{
        id: eventId,
        event_id: eventId,
        title: 'Test Sunday Service',
        event_type: 'Service',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        venue: 'Main Church Hall',
        status: 'Planned',
        created_by: 'admin-001'
      }])
      .select();

    if (error) throw error;
    createdEventId = data?.[0]?.id;
    console.log(`   Created: ${data?.[0]?.title}`);
    return data;
  });

  // Test read events
  await testOperation('Read upcoming events', async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'Planned')
      .limit(10);

    if (error) throw error;
    console.log(`   Found ${data?.length || 0} planned events`);
    return data;
  });
}

// Test 5: System logs
async function testSystemLogs() {
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('     TEST 5: SYSTEM LOGGING OPERATIONS');
  console.log('═══════════════════════════════════════════════════════\n');

  const logId = `LOG-${Date.now()}`;

  // Test create log
  await testOperation('Write system log', async () => {
    const { data, error } = await supabaseAdmin
      .from('system_logs')
      .insert([{
        log_id: logId,
        action: 'TEST_OPERATION',
        module: 'SYSTEM',
        details: 'Testing database operations',
        severity: 'Info',
        status: 'Success'
      }])
      .select();

    if (error) throw error;
    console.log(`   Created log: ${data?.[0]?.action}`);
    return data;
  });

  // Test read logs
  await testOperation('Read system logs', async () => {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) throw error;
    console.log(`   Found ${data?.length || 0} recent logs`);
    return data;
  });
}

// Test 6: Permissions
async function testPermissions() {
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('     TEST 6: PERMISSIONS AND ROLES');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test read role permissions
  await testOperation('Read role permissions', async () => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_name', 'Admin');

    if (error) throw error;
    console.log(`   Found ${data?.length || 0} Admin permissions`);
    return data;
  });

  // Test read system settings
  await testOperation('Read system settings', async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('is_public', true);

    if (error) throw error;
    console.log(`   Found ${data?.length || 0} public settings`);
    return data;
  });
}

// Run all tests
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   TSOAM - Comprehensive Supabase Operations Test Suite        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  try {
    await testUserOperations();
    await testMemberOperations();
    await testFinancialOperations();
    await testEventOperations();
    await testSystemLogs();
    await testPermissions();

    // Print summary
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     TEST SUMMARY                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Tests:   ${testResults.total}`);
    console.log(`✅ Passed:     ${testResults.passed}`);
    console.log(`❌ Failed:     ${testResults.failed}`);
    console.log(`Success Rate:  ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
      console.log('\n✅ All tests passed! Supabase is fully operational.\n');
      return true;
    } else {
      console.log(`\n⚠️  ${testResults.failed} test(s) failed. Please review errors above.\n`);
      return false;
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
