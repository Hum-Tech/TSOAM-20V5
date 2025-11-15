#!/usr/bin/env node

/**
 * Create account_requests table in Supabase
 * This table stores pending account requests that need admin approval
 */

require('dotenv').config();

const { supabaseAdmin } = require('../config/supabase-client');

async function createTable() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Creating Account Requests Table');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!supabaseAdmin) {
    console.error('❌ Supabase not configured');
    process.exit(1);
  }

  try {
    console.log('⏳ Checking if account_requests table exists...\n');

    // Try to query the table to see if it exists
    const { data, error } = await supabaseAdmin
      .from('account_requests')
      .select('id')
      .limit(1);

    if (!error || error?.code === 'PGRST116') {
      console.log('✅ account_requests table already exists!\n');
      console.log('Table structure:');
      console.log('  - id (UUID, primary key)');
      console.log('  - email (VARCHAR, unique)');
      console.log('  - full_name (VARCHAR)');
      console.log('  - phone (VARCHAR)');
      console.log('  - role (VARCHAR)');
      console.log('  - status (VARCHAR: pending, approved, rejected)');
      console.log('  - rejection_reason (TEXT)');
      console.log('  - admin_notes (TEXT)');
      console.log('  - requested_at (TIMESTAMP)');
      console.log('  - reviewed_at (TIMESTAMP)');
      console.log('  - reviewed_by (UUID)');
      console.log('  - created_at (TIMESTAMP)');
      console.log('  - updated_at (TIMESTAMP)\n');
      return;
    }

    console.log('⚠️  Table does not exist. Instructions to create manually:\n');
    console.log('1. Go to Supabase Console: https://app.supabase.com');
    console.log('2. Select your project: ncrecohwtejwygkyoaul');
    console.log('3. Click "SQL Editor"');
    console.log('4. Click "New Query"');
    console.log('5. Copy and paste the SQL below:');
    console.log('\n───────────────────────────────────────────────\n');

    const sql = `
-- Create account_requests table for pending user registrations
CREATE TABLE IF NOT EXISTS account_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  admin_notes TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_account_requests_email ON account_requests(email);
CREATE INDEX IF NOT EXISTS idx_account_requests_status ON account_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_requests_requested_at ON account_requests(requested_at DESC);

-- Add RLS policies (optional, for security)
ALTER TABLE account_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their own request
CREATE POLICY "Users can create their own account request"
  ON account_requests FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view pending requests
CREATE POLICY "Users can view pending account requests"
  ON account_requests FOR SELECT
  USING (status = 'pending');

-- Allow admins to view and update all requests
CREATE POLICY "Admins can view all account requests"
  ON account_requests FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update account requests"
  ON account_requests FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
`;

    console.log(sql);
    console.log('\n───────────────────────────────────────────────\n');
    console.log('6. Click "Run"');
    console.log('7. The table will be created\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTable();
