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
      .select('*, leader:leader_id(*)')
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
      .select('*, leader:leader_id(*)')
      .eq('id', req.params.id)
      .single();

    if (districtError) throw districtError;

    const { data: zones, error: zonesError } = await supabaseAdmin
      .from('zones')
      .select('*, leader:leader_id(*), homecells(*, leader:leader_id(*))')
      .eq('district_id', req.params.id)
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
    const { name, description, leader_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'District name is required' });
    }

    const districtId = `DIST-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from('districts')
      .insert([{
        district_id: districtId,
        name,
        description,
        leader_id,
        is_active: true
      }])
      .select();

    if (error) throw error;

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error creating district:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update district
router.put('/districts/:id', async (req, res) => {
  try {
    const { name, description, leader_id } = req.body;

    const { data, error } = await supabaseAdmin
      .from('districts')
      .update({
        name,
        description,
        leader_id,
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
      .select('*, leader:leader_id(*)')
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
      .select('*, leader:leader_id(*)')
      .eq('id', req.params.id)
      .single();

    if (zoneError) throw zoneError;

    const { data: homecells, error: homecellsError } = await supabaseAdmin
      .from('homecells')
      .select('*, leader:leader_id(*)')
      .eq('zone_id', req.params.id)
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
    const { district_id, name, description, leader_id } = req.body;

    if (!district_id || !name) {
      return res.status(400).json({ error: 'District ID and zone name are required' });
    }

    const zoneId = `ZONE-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from('zones')
      .insert([{
        zone_id: zoneId,
        district_id,
        name,
        description,
        leader_id,
        is_active: true
      }])
      .select();

    if (error) throw error;

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error creating zone:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update zone
router.put('/zones/:id', async (req, res) => {
  try {
    const { name, description, leader_id } = req.body;

    const { data, error } = await supabaseAdmin
      .from('zones')
      .update({
        name,
        description,
        leader_id,
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
    const { districtId, zoneId, search, leaderId } = req.query;

    let query = supabaseAdmin
      .from('homecells')
      .select('*, leader:leader_id(*), zone:zone_id(*), members(count)');

    if (districtId) query = query.eq('district_id', districtId);
    if (zoneId) query = query.eq('zone_id', zoneId);
    if (leaderId) query = query.eq('leader_id', leaderId);

    const { data, error } = await query.eq('is_active', true).order('name');

    if (error) throw error;

    const filteredData = search
      ? data.filter(hc => hc.name.toLowerCase().includes(search.toLowerCase()))
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
      .select('*, leader:leader_id(*), zone:zone_id(*)')
      .eq('zone_id', req.params.zoneId)
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
      .select('*, leader:leader_id(*), zone:zone_id(*), district:district_id(*)')
      .eq('id', req.params.id)
      .single();

    if (homecellError) throw homecellError;

    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('homecell_id', req.params.id)
      .order('name');

    if (membersError) throw membersError;

    res.json({ success: true, data: { ...homecell, members } });
  } catch (error) {
    console.error('Error fetching homecell:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create homecell
router.post('/homecells', async (req, res) => {
  try {
    const { zone_id, district_id, name, description, leader_id, meeting_day, meeting_time, meeting_location } = req.body;

    if (!zone_id || !district_id || !name) {
      return res.status(400).json({ error: 'Zone ID, District ID, and homecell name are required' });
    }

    const homecellId = `HC-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from('homecells')
      .insert([{
        homecell_id: homecellId,
        zone_id,
        district_id,
        name,
        description,
        leader_id,
        meeting_day,
        meeting_time,
        meeting_location,
        is_active: true
      }])
      .select();

    if (error) throw error;

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error creating homecell:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update homecell
router.put('/homecells/:id', async (req, res) => {
  try {
    const { name, description, leader_id, meeting_day, meeting_time, meeting_location } = req.body;

    const { data, error } = await supabaseAdmin
      .from('homecells')
      .update({
        name,
        description,
        leader_id,
        meeting_day,
        meeting_time,
        meeting_location,
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

// Assign member to homecell
router.post('/homecells/:id/members/:memberId', async (req, res) => {
  try {
    const { notes } = req.body;

    // Update member with homecell
    const { error: updateError } = await supabaseAdmin
      .from('members')
      .update({
        homecell_id: req.params.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.memberId);

    if (updateError) throw updateError;

    // Record the assignment
    const { data, error: assignError } = await supabaseAdmin
      .from('homecell_assignments')
      .insert([{
        member_id: parseInt(req.params.memberId),
        homecell_id: parseInt(req.params.id),
        notes
      }])
      .select();

    if (assignError) throw assignError;

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error assigning member:', error);
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
      .order('name');

    if (error) throw error;

    res.json({ success: true, data });
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
      .select('*')
      .eq('homecell_id', req.params.id);

    if (error) throw error;

    const stats = {
      totalMembers: members?.length || 0,
      activeMembers: members?.filter(m => m.status === 'Active').length || 0,
      inactiveMembers: members?.filter(m => m.status === 'Inactive').length || 0,
      maleMembers: members?.filter(m => m.gender === 'Male').length || 0,
      femaleMembers: members?.filter(m => m.gender === 'Female').length || 0,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== BULK OPERATIONS ====================

// Get all with hierarchy
router.get('/hierarchy/full', async (req, res) => {
  try {
    const { data: districts, error } = await supabaseAdmin
      .from('districts')
      .select('*, leader:leader_id(*), zones(*, leader:leader_id(*), homecells(*, leader:leader_id(*)))')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    res.json({ success: true, data: districts });
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auto-assign members by address/zone
router.post('/auto-assign-members', async (req, res) => {
  try {
    const { zoneId } = req.body;

    if (!zoneId) {
      return res.status(400).json({ error: 'Zone ID is required' });
    }

    // Get zone info
    const { data: zone, error: zoneError } = await supabaseAdmin
      .from('zones')
      .select('*')
      .eq('id', zoneId)
      .single();

    if (zoneError) throw zoneError;

    // Get unassigned members in this zone area
    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('*')
      .is('homecell_id', null);

    if (membersError) throw membersError;

    // Get homecells for this zone
    const { data: homecells, error: homecellsError } = await supabaseAdmin
      .from('homecells')
      .select('*')
      .eq('zone_id', zoneId);

    if (homecellsError) throw homecellsError;

    if (!homecells || homecells.length === 0) {
      return res.status(400).json({ error: 'No homecells found for this zone' });
    }

    // Auto-assign members to homecells (round-robin distribution)
    let homecellIndex = 0;
    const updates = [];

    for (const member of members) {
      const homecell = homecells[homecellIndex % homecells.length];
      updates.push({
        id: member.id,
        homecell_id: homecell.id
      });
      homecellIndex++;
    }

    // Perform bulk update
    const { error: updateError } = await supabaseAdmin
      .from('members')
      .upsert(updates);

    if (updateError) throw updateError;

    res.json({ 
      success: true, 
      message: `Auto-assigned ${updates.length} members to homecells in ${zone.name}`,
      assignedCount: updates.length
    });
  } catch (error) {
    console.error('Error auto-assigning members:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
