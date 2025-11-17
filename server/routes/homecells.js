const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabase-client');

const router = express.Router();

// ==================== DISTRICTS ====================

// Get all districts
router.get('/districts', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('districts')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.warn('Districts table not available, returning empty list:', error.message);
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.warn('Error fetching districts, returning empty list:', error.message);
    res.json({ success: true, data: [] });
  }
});

// Get single district with zones and homecells
router.get('/districts/:id', async (req, res) => {
  try {
    const { data: district, error: districtError } = await supabaseAdmin
      .from('districts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (districtError) throw districtError;

    const { data: zones, error: zonesError } = await supabaseAdmin
      .from('zones')
      .select('*')
      .eq('district_id', req.params.id)
      .eq('is_active', true)
      .order('name');

    if (zonesError) throw zonesError;

    res.json({ success: true, data: { ...district, zones } });
  } catch (error) {
    console.error('Error fetching district:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create district
router.post('/districts', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'District name is required' });
    }

    // Generate unique district_id from name
    const districtId = `DIS-${name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from('districts')
      .insert([{
        district_id: districtId,
        name: name.trim(),
        description: description?.trim() || null,
        is_active: true
      }])
      .select();

    if (error) {
      console.error('Error creating district:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error creating district:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update district
router.put('/districts/:id', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'District name is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('districts')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error updating district:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete district
router.delete('/districts/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('districts')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting district:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ZONES ====================

// Get zones by district
router.get('/districts/:districtId/zones', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('zones')
      .select('*')
      .eq('district_id', req.params.districtId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single zone with homecells
router.get('/zones/:id', async (req, res) => {
  try {
    const { data: zone, error: zoneError } = await supabaseAdmin
      .from('zones')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (zoneError) throw zoneError;

    const { data: homecells, error: homecellsError } = await supabaseAdmin
      .from('homecells')
      .select('*')
      .eq('zone_id', req.params.id)
      .eq('is_active', true)
      .order('name');

    if (homecellsError) throw homecellsError;

    res.json({ success: true, data: { ...zone, homecells } });
  } catch (error) {
    console.error('Error fetching zone:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create zone
router.post('/zones', async (req, res) => {
  try {
    const { district_id, name, description, leader, leader_phone } = req.body;

    if (!district_id || !name) {
      return res.status(400).json({ error: 'District ID and zone name are required' });
    }

    // Generate unique zone_id
    const zoneId = `ZONE-${name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from('zones')
      .insert([{
        zone_id: zoneId,
        district_id: parseInt(district_id),
        name: name.trim(),
        description: description?.trim() || null,
        is_active: true
      }])
      .select();

    if (error) {
      console.error('Error creating zone:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error creating zone:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update zone
router.put('/zones/:id', async (req, res) => {
  try {
    const { name, description, leader, leader_phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Zone name is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('zones')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        leader: leader?.trim() || null,
        leader_phone: leader_phone?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error updating zone:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete zone
router.delete('/zones/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('zones')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting zone:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HOMECELLS ====================

// Get all homecells with filters
router.get('/homecells', async (req, res) => {
  try {
    const { districtId, zoneId, search } = req.query;

    let query = supabaseAdmin
      .from('homecells')
      .select('*');

    if (districtId) query = query.eq('district_id', districtId);
    if (zoneId) query = query.eq('zone_id', zoneId);

    const { data, error } = await query
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    const filteredData = search
      ? data.filter(hc => 
          hc.name.toLowerCase().includes(search.toLowerCase()) ||
          (hc.leader && hc.leader.toLowerCase().includes(search.toLowerCase()))
        )
      : data;

    res.json({ success: true, data: filteredData });
  } catch (error) {
    console.error('Error fetching homecells:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get homecells by zone
router.get('/zones/:zoneId/homecells', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('homecells')
      .select('*')
      .eq('zone_id', parseInt(req.params.zoneId))
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching zone homecells:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single homecell with members
router.get('/homecells/:id', async (req, res) => {
  try {
    const { data: homecell, error: homecellError } = await supabaseAdmin
      .from('homecells')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (homecellError) throw homecellError;

    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('homecell_id', req.params.id)
      .order('full_name');

    if (membersError) throw membersError;

    res.json({ success: true, data: { ...homecell, members: members || [] } });
  } catch (error) {
    console.error('Error fetching homecell:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create homecell
router.post('/homecells', async (req, res) => {
  try {
    const { zone_id, district_id, name, description, leader, leader_phone, meeting_day, meeting_time, meeting_location } = req.body;

    if (!zone_id || !district_id || !name) {
      return res.status(400).json({ error: 'Zone ID, District ID, and homecell name are required' });
    }

    // Generate unique homecell_id
    const homecellId = `HC-${name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from('homecells')
      .insert([{
        homecell_id: homecellId,
        zone_id: parseInt(zone_id),
        district_id: parseInt(district_id),
        name: name.trim(),
        description: description?.trim() || null,
        meeting_day: meeting_day || null,
        meeting_time: meeting_time || null,
        meeting_location: meeting_location?.trim() || null,
        is_active: true
      }])
      .select();

    if (error) {
      console.error('Error creating homecell:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error creating homecell:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update homecell
router.put('/homecells/:id', async (req, res) => {
  try {
    const { name, description, leader, leader_phone, meeting_day, meeting_time, meeting_location } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Homecell name is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('homecells')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        leader: leader?.trim() || null,
        leader_phone: leader_phone?.trim() || null,
        meeting_day: meeting_day || null,
        meeting_time: meeting_time || null,
        meeting_location: meeting_location?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error updating homecell:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete homecell
router.delete('/homecells/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('homecells')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting homecell:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get homecell members
router.get('/homecells/:id/members', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('homecell_id', req.params.id)
      .order('full_name');

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching homecell members:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get homecell statistics
router.get('/homecells/:id/stats', async (req, res) => {
  try {
    const { data: members, error } = await supabaseAdmin
      .from('members')
      .select('membership_status, gender')
      .eq('homecell_id', req.params.id);

    if (error) throw error;

    const membersList = members || [];
    const stats = {
      totalMembers: membersList.length,
      activeMembers: membersList.filter(m => m.membership_status === 'Active').length,
      inactiveMembers: membersList.filter(m => m.membership_status === 'Inactive').length,
      maleMembers: membersList.filter(m => m.gender === 'Male').length,
      femaleMembers: membersList.filter(m => m.gender === 'Female').length,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export homecell report (PDF)
router.get('/homecells/:id/export', async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;

    const { data: homecell, error: hcError } = await supabaseAdmin
      .from('homecells')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (hcError) throw hcError;

    const { data: zone, error: zoneError } = await supabaseAdmin
      .from('zones')
      .select('*')
      .eq('id', homecell.zone_id)
      .single();

    if (zoneError) throw zoneError;

    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('homecell_id', req.params.id)
      .order('full_name');

    if (membersError) throw membersError;

    const reportData = {
      homecell,
      zone,
      members: members || [],
      generatedAt: new Date().toISOString()
    };

    // For now, return JSON. In production, you'd generate actual PDF/Excel
    res.json({ success: true, data: reportData });
  } catch (error) {
    console.error('Error exporting homecell report:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== BULK OPERATIONS ====================

// Get all with hierarchy
router.get('/hierarchy/full', async (req, res) => {
  try {
    const { data: districts, error } = await supabaseAdmin
      .from('districts')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Get zones for each district
    const districtData = await Promise.all(
      districts.map(async (district) => {
        const { data: zones, error: zonesError } = await supabaseAdmin
          .from('zones')
          .select('*')
          .eq('district_id', district.id)
          .eq('is_active', true);

        if (zonesError) throw zonesError;

        // Get homecells for each zone
        const zonesData = await Promise.all(
          zones.map(async (zone) => {
            const { data: homecells, error: hcError } = await supabaseAdmin
              .from('homecells')
              .select('*')
              .eq('zone_id', zone.id)
              .eq('is_active', true);

            if (hcError) throw hcError;
            return { ...zone, homecells: homecells || [] };
          })
        );

        return { ...district, zones: zonesData };
      })
    );

    res.json({ success: true, data: districtData });
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign member to homecell
router.post('/homecells/:id/members/:memberId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('members')
      .update({
        homecell_id: parseInt(req.params.id),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.memberId)
      .select();

    if (error) throw error;

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error assigning member:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
