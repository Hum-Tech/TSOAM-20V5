require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDistricts() {
  try {
    console.log('🔍 Checking districts table...\n');

    // Check if table exists
    const { data: allData, error: selectError } = await supabase
      .from('districts')
      .select('*');

    if (selectError) {
      console.error('❌ Error querying districts:', selectError.message);
      process.exit(1);
    }

    console.log(`✅ Found ${allData?.length || 0} districts\n`);

    if (allData && allData.length > 0) {
      allData.forEach(d => {
        console.log(`📍 ${d.name} (ID: ${d.id})`);
      });
    } else {
      console.log('ℹ️  Table exists but is empty');
      console.log('\n🌱 Attempting to seed districts...\n');

      const districts = [
        { district_id: 'DIS-NAIROBI-CENTRAL', name: 'Nairobi Central', description: 'Central Nairobi district covering CBD and surrounding areas', is_active: true },
        { district_id: 'DIS-EASTLANDS', name: 'Eastlands', description: 'Eastlands district covering Buruburu, Umoja, Donholm, and surrounding areas', is_active: true },
        { district_id: 'DIS-THIKA-ROAD', name: 'Thika Road', description: 'Thika Road district covering Zimmerman, Kahawa, Roysambu, and surrounding areas', is_active: true },
        { district_id: 'DIS-SOUTH-NAIROBI', name: 'South Nairobi', description: 'South Nairobi district covering Lang\'ata, Karen, South C/B, and surrounding areas', is_active: true },
        { district_id: 'DIS-WEST-NAIROBI', name: 'West Nairobi', description: 'West Nairobi district covering Kangemi, Uthiru, Dagoretti, and surrounding areas', is_active: true },
        { district_id: 'DIS-NORTH-NAIROBI', name: 'Northern Nairobi', description: 'Northern Nairobi district covering Muthaiga, Runda, Gigiri, and surrounding areas', is_active: true },
        { district_id: 'DIS-EAST-NAIROBI', name: 'Eastern Nairobi', description: 'Eastern Nairobi district covering Mathare, Huruma, Kariobangi, Dandora, and surrounding areas', is_active: true },
        { district_id: 'DIS-SOUTH-EAST-NAIROBI', name: 'South East Nairobi', description: 'South East Nairobi district covering Industrial Area, Mukuru, Imara Daima, and surrounding areas', is_active: true },
        { district_id: 'DIS-OUTSKIRTS-NAIROBI', name: 'Outskirts Nairobi', description: 'Outskirts Nairobi district covering Kitengela, Rongai, Ngong, Ruai, Juja, Thika, and surrounding areas', is_active: true }
      ];

      const { data: inserted, error: insertError } = await supabase
        .from('districts')
        .insert(districts)
        .select();

      if (insertError) {
        console.error('❌ Error inserting districts:', insertError.message);
        process.exit(1);
      }

      console.log(`✅ Successfully seeded ${inserted?.length || 0} districts\n`);

      inserted?.forEach(d => {
        console.log(`📍 ${d.name} (ID: ${d.id})`);
      });
    }

    console.log('\n🎉 Districts are ready!');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

checkDistricts();
