/**
 * Demo Data Initialization Script
 * 
 * Initializes the Supabase database with demo districts, zones, and homecells
 * for testing and demonstration purposes.
 * 
 * Usage: node server/scripts/initialize-demo-data.js
 */

const { supabaseAdmin } = require('../config/supabase-client');
require('dotenv').config();

/**
 * Demo data structure for districts with zones and homecells
 */
const demoData = {
  districts: [
    {
      district_id: 'DIS-KIBERA-001',
      name: 'Kibera District',
      description: 'Church district serving Kibera area'
    },
    {
      district_id: 'DIS-EMBAKASI-001',
      name: 'Embakasi District',
      description: 'Church district serving Embakasi area'
    },
    {
      district_id: 'DIS-EASTLEIGH-001',
      name: 'Eastleigh District',
      description: 'Church district serving Eastleigh area'
    }
  ],
  zones: [
    // Kibera zones
    {
      zone_id: 'ZONE-KIB-SOUTH-001',
      district_name: 'Kibera District',
      name: 'South Kibera Zone',
      description: 'South zone of Kibera district'
    },
    {
      zone_id: 'ZONE-KIB-NORTH-001',
      district_name: 'Kibera District',
      name: 'North Kibera Zone',
      description: 'North zone of Kibera district'
    },
    // Embakasi zones
    {
      zone_id: 'ZONE-EMB-EAST-001',
      district_name: 'Embakasi District',
      name: 'East Embakasi Zone',
      description: 'East zone of Embakasi district'
    },
    {
      zone_id: 'ZONE-EMB-WEST-001',
      district_name: 'Embakasi District',
      name: 'West Embakasi Zone',
      description: 'West zone of Embakasi district'
    },
    // Eastleigh zones
    {
      zone_id: 'ZONE-EL-CENTRAL-001',
      district_name: 'Eastleigh District',
      name: 'Central Eastleigh Zone',
      description: 'Central zone of Eastleigh district'
    }
  ],
  homecells: [
    // Kibera South homecells
    {
      homecell_id: 'HC-KIB-S-ZION-001',
      zone_name: 'South Kibera Zone',
      name: 'Zion Cell',
      description: 'Zion home cell group meeting weekly',
      meeting_day: 'Wednesday',
      meeting_time: '18:00',
      meeting_location: 'Riverside Community'
    },
    {
      homecell_id: 'HC-KIB-S-GRACE-001',
      zone_name: 'South Kibera Zone',
      name: 'Grace Cell',
      description: 'Grace home cell group meeting weekly',
      meeting_day: 'Thursday',
      meeting_time: '19:00',
      meeting_location: 'Kibera Community Hall'
    },
    {
      homecell_id: 'HC-KIB-S-FAITH-001',
      zone_name: 'South Kibera Zone',
      name: 'Faith Cell',
      description: 'Faith home cell group meeting weekly',
      meeting_day: 'Friday',
      meeting_time: '18:30',
      meeting_location: 'South Kibera Center'
    },
    // Kibera North homecells
    {
      homecell_id: 'HC-KIB-N-HOPE-001',
      zone_name: 'North Kibera Zone',
      name: 'Hope Cell',
      description: 'Hope home cell group meeting weekly',
      meeting_day: 'Tuesday',
      meeting_time: '18:00',
      meeting_location: 'North Kibera Community'
    },
    {
      homecell_id: 'HC-KIB-N-LOVE-001',
      zone_name: 'North Kibera Zone',
      name: 'Love Cell',
      description: 'Love home cell group meeting weekly',
      meeting_day: 'Wednesday',
      meeting_time: '19:30',
      meeting_location: 'North Kibera Hall'
    },
    // Embakasi East homecells
    {
      homecell_id: 'HC-EMB-E-PEACE-001',
      zone_name: 'East Embakasi Zone',
      name: 'Peace Cell',
      description: 'Peace home cell group meeting weekly',
      meeting_day: 'Monday',
      meeting_time: '18:00',
      meeting_location: 'Embakasi East Center'
    },
    {
      homecell_id: 'HC-EMB-E-LIGHT-001',
      zone_name: 'East Embakasi Zone',
      name: 'Light Cell',
      description: 'Light home cell group meeting weekly',
      meeting_day: 'Thursday',
      meeting_time: '18:30',
      meeting_location: 'East Embakasi Hall'
    },
    // Embakasi West homecells
    {
      homecell_id: 'HC-EMB-W-BLESSED-001',
      zone_name: 'West Embakasi Zone',
      name: 'Blessed Cell',
      description: 'Blessed home cell group meeting weekly',
      meeting_day: 'Wednesday',
      meeting_time: '19:00',
      meeting_location: 'West Embakasi Community'
    },
    // Eastleigh homecells
    {
      homecell_id: 'HC-EL-JOY-001',
      zone_name: 'Central Eastleigh Zone',
      name: 'Joy Cell',
      description: 'Joy home cell group meeting weekly',
      meeting_day: 'Saturday',
      meeting_time: '18:00',
      meeting_location: 'Eastleigh Community Center'
    },
    {
      homecell_id: 'HC-EL-STRENGTH-001',
      zone_name: 'Central Eastleigh Zone',
      name: 'Strength Cell',
      description: 'Strength home cell group meeting weekly',
      meeting_day: 'Sunday',
      meeting_time: '17:00',
      meeting_location: 'Central Eastleigh Hall'
    }
  ]
};

/**
 * Initialize demo data in Supabase
 */
async function initializeDemoData() {
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not initialized');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting demo data initialization...\n');

    // Create districts
    console.log('📍 Creating districts...');
    const districtMap = new Map();
    
    for (const district of demoData.districts) {
      try {
        const { data, error } = await supabaseAdmin
          .from('districts')
          .insert([{
            district_id: district.district_id,
            name: district.name,
            description: district.description,
            is_active: true
          }])
          .select();

        if (error) {
          console.warn(`   ⚠️  ${district.name}: ${error.message}`);
          continue;
        }

        districtMap.set(district.name, data[0].id);
        console.log(`   ✓ ${district.name}`);
      } catch (error) {
        console.warn(`   ⚠️  ${district.name}: ${error.message}`);
      }
    }

    // Create zones
    console.log('\n🗺️  Creating zones...');
    const zoneMap = new Map();

    for (const zone of demoData.zones) {
      try {
        const districtId = districtMap.get(zone.district_name);
        if (!districtId) {
          console.warn(`   ⚠️  ${zone.name}: District not found`);
          continue;
        }

        const { data, error } = await supabaseAdmin
          .from('zones')
          .insert([{
            zone_id: zone.zone_id,
            district_id: districtId,
            name: zone.name,
            description: zone.description,
            is_active: true
          }])
          .select();

        if (error) {
          console.warn(`   ⚠️  ${zone.name}: ${error.message}`);
          continue;
        }

        zoneMap.set(zone.name, { id: data[0].id, district_id: districtId });
        console.log(`   ✓ ${zone.name}`);
      } catch (error) {
        console.warn(`   ⚠️  ${zone.name}: ${error.message}`);
      }
    }

    // Create homecells
    console.log('\n🏘️  Creating homecells...');
    let homecellCount = 0;

    for (const homecell of demoData.homecells) {
      try {
        const zoneInfo = zoneMap.get(homecell.zone_name);
        if (!zoneInfo) {
          console.warn(`   ⚠️  ${homecell.name}: Zone not found`);
          continue;
        }

        const { error } = await supabaseAdmin
          .from('homecells')
          .insert([{
            homecell_id: homecell.homecell_id,
            zone_id: zoneInfo.id,
            district_id: zoneInfo.district_id,
            name: homecell.name,
            description: homecell.description,
            meeting_day: homecell.meeting_day,
            meeting_time: homecell.meeting_time,
            meeting_location: homecell.meeting_location,
            is_active: true,
            member_count: 0
          }]);

        if (error) {
          console.warn(`   ⚠️  ${homecell.name}: ${error.message}`);
          continue;
        }

        console.log(`   ✓ ${homecell.name} (${homecell.zone_name})`);
        homecellCount++;
      } catch (error) {
        console.warn(`   ⚠️  ${homecell.name}: ${error.message}`);
      }
    }

    console.log('\n✅ Demo data initialization completed!');
    console.log(`   📍 Districts created: ${districtMap.size}`);
    console.log(`   🗺️  Zones created: ${zoneMap.size}`);
    console.log(`   🏘️  Homecells created: ${homecellCount}`);
    console.log('\n💡 All demo data is ready for testing!');

    return true;
  } catch (error) {
    console.error('❌ Initialization error:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDemoData().then(() => {
  console.log('\n✨ Demo data setup complete. You can now use the application!\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
