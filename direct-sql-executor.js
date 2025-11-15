#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const https = require('https');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Extract project ID from URL
const projectMatch = supabaseUrl.match(/https:\/\/([^.]+)/);
if (!projectMatch) {
  console.error('❌ Invalid Supabase URL');
  process.exit(1);
}

const projectId = projectMatch[1];

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    // Try using Supabase's REST API exec endpoint if it exists
    const apiUrl = new URL(`${supabaseUrl}/rest/v1/rpc/exec_sql`);
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      }
    };

    const req = https.request(apiUrl, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            console.log(`Response status: ${res.statusCode}`);
            console.log(`Response: ${data}`);
            resolve(false);
          }
        } catch (err) {
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('Request error (trying alternative method...):', err.message);
      resolve(false);
    });

    req.write(JSON.stringify({ sql }));
    req.end();
  });
}

async function main() {
  console.log('🔄 Attempting direct SQL execution...\n');

  const migrationsDir = path.join(__dirname, 'server/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`📄 Processing: ${file}`);

    const result = await executeSql(sql);
    if (result) {
      console.log('✅ SQL executed\n');
    } else {
      console.log('⚠️  Could not execute via API\n');
    }
  }

  console.log('\n📋 Next steps:');
  console.log('1. Please visit the Supabase dashboard manually');
  console.log(`2. URL: https://app.supabase.com/project/${projectId}`);
  console.log('3. Open SQL Editor');
  console.log('4. Run the SQL from MANUAL_MIGRATION_SQL.md');
}

main();
