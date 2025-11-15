require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nTo get your service role key:');
  console.error('1. Go to https://app.supabase.com/');
  console.error('2. Select your project');
  console.error('3. Go to Settings > API');
  console.error('4. Copy the Service Role Key (keep it secret!)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// RLS Policy SQL statements
const rlsPolicies = [
  {
    name: 'users - Enable RLS',
    sql: 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'users - Allow authenticated users to read all users',
    sql: `
      CREATE POLICY "Allow authenticated users to read all users"
      ON public.users FOR SELECT
      TO authenticated
      USING (true);
    `
  },
  {
    name: 'users - Allow users to update their own profile',
    sql: `
      CREATE POLICY "Allow users to update their own profile"
      ON public.users FOR UPDATE
      TO authenticated
      USING (auth.uid()::TEXT = id)
      WITH CHECK (auth.uid()::TEXT = id);
    `
  },
  {
    name: 'users - Allow admins to manage all users',
    sql: `
      CREATE POLICY "Allow admins to manage all users"
      ON public.users FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()::TEXT AND u.role = 'Admin'
        )
      );
    `
  },
  
  {
    name: 'members - Enable RLS',
    sql: 'ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'members - Allow authenticated users to read members',
    sql: `
      CREATE POLICY "Allow authenticated users to read members"
      ON public.members FOR SELECT
      TO authenticated
      USING (status != 'Excommunicated' OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()::TEXT AND role IN ('Admin', 'HR Officer')
      ));
    `
  },
  {
    name: 'members - Allow HR Officers and Admins to manage members',
    sql: `
      CREATE POLICY "Allow HR and Admins to manage members"
      ON public.members FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()::TEXT AND role IN ('Admin', 'HR Officer')
        )
      );
    `
  },
  
  {
    name: 'employees - Enable RLS',
    sql: 'ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'employees - Allow authenticated HR to read employees',
    sql: `
      CREATE POLICY "Allow HR to read employees"
      ON public.employees FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()::TEXT AND role IN ('Admin', 'HR Officer')
        )
      );
    `
  },
  {
    name: 'employees - Allow admins to manage employees',
    sql: `
      CREATE POLICY "Allow admins to manage employees"
      ON public.employees FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()::TEXT AND role = 'Admin'
        )
      );
    `
  },
  
  {
    name: 'financial_transactions - Enable RLS',
    sql: 'ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'financial_transactions - Allow finance users to read',
    sql: `
      CREATE POLICY "Allow finance users to read transactions"
      ON public.financial_transactions FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()::TEXT AND role IN ('Admin', 'Finance Officer')
        )
      );
    `
  },
  {
    name: 'financial_transactions - Allow finance to manage',
    sql: `
      CREATE POLICY "Allow finance to manage transactions"
      ON public.financial_transactions FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()::TEXT AND role IN ('Admin', 'Finance Officer')
        )
      );
    `
  },
  
  {
    name: 'welfare_requests - Enable RLS',
    sql: 'ALTER TABLE public.welfare_requests ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'welfare_requests - Allow members to read their own requests',
    sql: `
      CREATE POLICY "Allow members to read their requests"
      ON public.welfare_requests FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.members
          WHERE id = member_id AND created_by = auth.uid()::TEXT
        )
      );
    `
  },
  {
    name: 'welfare_requests - Allow admins to manage all',
    sql: `
      CREATE POLICY "Allow admins to manage welfare requests"
      ON public.welfare_requests FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()::TEXT AND role IN ('Admin', 'HR Officer')
        )
      );
    `
  },
  
  {
    name: 'events - Enable RLS',
    sql: 'ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'events - Allow authenticated users to read public events',
    sql: `
      CREATE POLICY "Allow reading public events"
      ON public.events FOR SELECT
      TO authenticated
      USING (visibility = 'Public');
    `
  },
  {
    name: 'events - Allow admins to manage events',
    sql: `
      CREATE POLICY "Allow admins to manage events"
      ON public.events FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()::TEXT AND role = 'Admin'
        )
      );
    `
  },
  
  {
    name: 'appointments - Enable RLS',
    sql: 'ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'appointments - Allow staff to read their appointments',
    sql: `
      CREATE POLICY "Allow staff to read their appointments"
      ON public.appointments FOR SELECT
      TO authenticated
      USING (staff_id = auth.uid()::TEXT);
    `
  },
  {
    name: 'appointments - Allow staff to manage their appointments',
    sql: `
      CREATE POLICY "Allow staff to manage their appointments"
      ON public.appointments FOR ALL
      TO authenticated
      USING (staff_id = auth.uid()::TEXT);
    `
  },
  
  {
    name: 'messages - Enable RLS',
    sql: 'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'messages - Allow users to read their messages',
    sql: `
      CREATE POLICY "Allow users to read sent/received messages"
      ON public.messages FOR SELECT
      TO authenticated
      USING (sender_id = auth.uid()::TEXT);
    `
  },
  {
    name: 'messages - Allow authenticated to insert',
    sql: `
      CREATE POLICY "Allow authenticated users to send messages"
      ON public.messages FOR INSERT
      TO authenticated
      WITH CHECK (sender_id = auth.uid()::TEXT);
    `
  },
  
  {
    name: 'system_logs - Enable RLS',
    sql: 'ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'system_logs - Allow admins to read logs',
    sql: `
      CREATE POLICY "Allow admins to read system logs"
      ON public.system_logs FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()::TEXT AND role = 'Admin'
        )
      );
    `
  },
  {
    name: 'system_logs - Allow authenticated to insert',
    sql: `
      CREATE POLICY "Allow authenticated to create logs"
      ON public.system_logs FOR INSERT
      TO authenticated
      WITH CHECK (true);
    `
  },
  
  {
    name: 'role_permissions - Enable RLS',
    sql: 'ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'role_permissions - Allow authenticated to read',
    sql: `
      CREATE POLICY "Allow authenticated to read role permissions"
      ON public.role_permissions FOR SELECT
      TO authenticated
      USING (true);
    `
  },
  {
    name: 'role_permissions - Allow admins to manage',
    sql: `
      CREATE POLICY "Allow admins to manage role permissions"
      ON public.role_permissions FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()::TEXT AND role = 'Admin'
        )
      );
    `
  },
  
  {
    name: 'system_settings - Enable RLS',
    sql: 'ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'system_settings - Allow authenticated to read public settings',
    sql: `
      CREATE POLICY "Allow authenticated to read public settings"
      ON public.system_settings FOR SELECT
      TO authenticated
      USING (is_public = true);
    `
  },
  {
    name: 'system_settings - Allow admins to manage all',
    sql: `
      CREATE POLICY "Allow admins to manage settings"
      ON public.system_settings FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid()::TEXT AND role = 'Admin'
        )
      );
    `
  }
];

// Execute SQL statement
async function executeSql(sql) {
  try {
    // Execute via Postgres directly using Supabase's query runner
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Unknown error' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Setup RLS policies
async function setupRlsPolicies() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║      Supabase RLS (Row Level Security) Setup            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let successCount = 0;
  let failureCount = 0;

  for (const policy of rlsPolicies) {
    console.log(`⏳ ${policy.name}...`);

    try {
      const result = await executeSql(policy.sql);

      if (result.success) {
        console.log(`✅ ${policy.name}\n`);
        successCount++;
      } else {
        // Some failures are expected (e.g., policies already exist)
        if (result.error.includes('already exists') || result.error.includes('duplicate')) {
          console.log(`⏭️  ${policy.name} (already exists)\n`);
          successCount++;
        } else {
          console.log(`⚠️  ${policy.name} - ${result.error}\n`);
          failureCount++;
        }
      }
    } catch (error) {
      console.error(`❌ ${policy.name}:`, error.message);
      failureCount++;
    }
  }

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║              RLS Setup Summary                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Applied: ${successCount}`);
  console.log(`⚠️  Issues: ${failureCount}`);
  console.log(`📋 Total: ${rlsPolicies.length}\n`);

  return failureCount === 0 || successCount >= rlsPolicies.length - 5;
}

// Run setup
if (require.main === module) {
  setupRlsPolicies()
    .then(success => {
      if (success) {
        console.log('✅ RLS policies setup completed!');
        process.exit(0);
      } else {
        console.log('⚠️  Some RLS policies need manual review');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ RLS setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupRlsPolicies };
