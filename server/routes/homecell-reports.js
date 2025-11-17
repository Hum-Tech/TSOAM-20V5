const express = require('express');
const { supabaseAdmin } = require('../config/supabase-client');

const router = express.Router();

// Helper function to format date
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to generate CSV content
const generateCSV = (headers, rows) => {
  const csv = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row =>
      headers.map(h => {
        const value = row[h.toLowerCase().replace(/\s+/g, '_')] || '';
        return `"${value}"`;
      }).join(',')
    )
  ].join('\n');
  return csv;
};

// Helper function to generate simple HTML for PDF conversion
const generateHTML = (title, content) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f8f9fa; font-weight: bold; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .info-block { background: #f8f9fa; padding: 15px; border-radius: 5px; }
    .label { font-weight: bold; color: #555; }
    .stat { font-size: 24px; font-weight: bold; color: #007bff; }
    .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  ${content}
  <div class="footer">
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p>Church Management System</p>
  </div>
</body>
</html>
  `;
};

// Export homecell report as PDF/Excel/CSV
router.get('/homecells/:id/export', async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    const homecellId = req.params.id;

    // Fetch homecell details
    const { data: homecell, error: hcError } = await supabaseAdmin
      .from('homecells')
      .select('*')
      .eq('id', homecellId)
      .single();

    if (hcError) throw hcError;

    // Fetch zone details
    const { data: zone, error: zoneError } = await supabaseAdmin
      .from('zones')
      .select('*')
      .eq('id', homecell.zone_id)
      .single();

    if (zoneError) throw zoneError;

    // Fetch district details
    const { data: district, error: districtError } = await supabaseAdmin
      .from('districts')
      .select('*')
      .eq('id', homecell.district_id)
      .single();

    if (districtError && homecell.district_id) throw districtError;

    // Fetch members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('homecell_id', homecellId)
      .order('full_name');

    if (membersError) throw membersError;

    // Prepare report data
    const reportData = {
      homecell,
      zone,
      district,
      members: members || [],
      generatedAt: new Date().toISOString(),
      stats: {
        totalMembers: members?.length || 0,
        activeMembers: members?.filter(m => m.membership_status === 'Active').length || 0,
        inactiveMembers: members?.filter(m => m.membership_status === 'Inactive').length || 0,
        maleMembers: members?.filter(m => m.gender === 'Male').length || 0,
        femaleMembers: members?.filter(m => m.gender === 'Female').length || 0,
      }
    };

    if (format === 'csv') {
      // Generate CSV for members
      const headers = ['Full Name', 'Member ID', 'Email', 'Phone', 'Status', 'Membership Date'];
      const rows = members.map(m => ({
        'Full Name': m.full_name,
        'Member ID': m.member_id,
        'Email': m.email || '',
        'Phone': m.phone || '',
        'Status': m.membership_status,
        'Membership Date': formatDate(m.created_at)
      }));

      const csv = generateCSV(headers, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="homecell-${homecell.name}-members.csv"`);
      res.send(csv);

    } else if (format === 'excel') {
      // For Excel, we'll return JSON that can be processed by frontend
      // In production, use a library like xlsx to generate actual Excel files
      res.json({
        success: true,
        format: 'excel',
        filename: `homecell-${homecell.name}.xlsx`,
        data: reportData
      });

    } else {
      // HTML format (can be printed as PDF)
      let htmlContent = `
        <h1>${homecell.name}</h1>
        
        <div class="info-grid">
          <div class="info-block">
            <p><span class="label">Zone:</span> ${zone?.name || 'N/A'}</p>
            <p><span class="label">District:</span> ${district?.name || 'N/A'}</p>
            <p><span class="label">Leader:</span> ${homecell.leader || 'Not assigned'}</p>
            <p><span class="label">Leader Phone:</span> ${homecell.leader_phone || 'N/A'}</p>
          </div>
          <div class="info-block">
            <p><span class="label">Meeting Day:</span> ${homecell.meeting_day || 'N/A'}</p>
            <p><span class="label">Meeting Time:</span> ${homecell.meeting_time || 'N/A'}</p>
            <p><span class="label">Location:</span> ${homecell.meeting_location || 'N/A'}</p>
            <p><span class="label">Status:</span> ${homecell.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>

        <h2>Summary Statistics</h2>
        <div class="info-grid">
          <div class="info-block">
            <p><span class="label">Total Members:</span> <span class="stat">${reportData.stats.totalMembers}</span></p>
          </div>
          <div class="info-block">
            <p><span class="label">Active Members:</span> <span class="stat">${reportData.stats.activeMembers}</span></p>
          </div>
          <div class="info-block">
            <p><span class="label">Inactive Members:</span> <span class="stat">${reportData.stats.inactiveMembers}</span></p>
          </div>
          <div class="info-block">
            <p><span class="label">Male:</span> <span class="stat">${reportData.stats.maleMembers}</span></p>
          </div>
          <div class="info-block">
            <p><span class="label">Female:</span> <span class="stat">${reportData.stats.femaleMembers}</span></p>
          </div>
        </div>
      `;

      if (members && members.length > 0) {
        htmlContent += `
          <h2>Members List (${members.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Member ID</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Membership Date</th>
              </tr>
            </thead>
            <tbody>
              ${members.map(m => `
                <tr>
                  <td>${m.full_name}</td>
                  <td>${m.member_id}</td>
                  <td>${m.email || ''}</td>
                  <td>${m.phone || ''}</td>
                  <td>${m.membership_status}</td>
                  <td>${formatDate(m.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      const html = generateHTML(`${homecell.name} Report`, htmlContent);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="homecell-${homecell.name}.html"`);
      res.send(html);
    }
  } catch (error) {
    console.error('Error exporting homecell report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get homecell summary statistics
router.get('/homecells/:id/summary', async (req, res) => {
  try {
    const { data: homecell, error: hcError } = await supabaseAdmin
      .from('homecells')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (hcError) throw hcError;

    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('membership_status, gender')
      .eq('homecell_id', req.params.id);

    if (membersError) throw membersError;

    const membersList = members || [];
    const summary = {
      homecellId: homecell.id,
      homecellName: homecell.name,
      totalMembers: membersList.length,
      activeMembers: membersList.filter(m => m.membership_status === 'Active').length,
      inactiveMembers: membersList.filter(m => m.membership_status === 'Inactive').length,
      maleMembers: membersList.filter(m => m.gender === 'Male').length,
      femaleMembers: membersList.filter(m => m.gender === 'Female').length,
      malePercentage: membersList.length > 0 
        ? Math.round((membersList.filter(m => m.gender === 'Male').length / membersList.length) * 100)
        : 0,
      femalePercentage: membersList.length > 0
        ? Math.round((membersList.filter(m => m.gender === 'Female').length / membersList.length) * 100)
        : 0,
      activePercentage: membersList.length > 0
        ? Math.round((membersList.filter(m => m.membership_status === 'Active').length / membersList.length) * 100)
        : 0,
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching homecell summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get district summary statistics
router.get('/districts/:id/summary', async (req, res) => {
  try {
    const { data: district, error: districtError } = await supabaseAdmin
      .from('districts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (districtError) throw districtError;

    const { data: zones, error: zonesError } = await supabaseAdmin
      .from('zones')
      .select('id')
      .eq('district_id', req.params.id);

    if (zonesError) throw zonesError;

    const { data: homecells, error: homecellsError } = await supabaseAdmin
      .from('homecells')
      .select('id')
      .in('zone_id', zones?.map(z => z.id) || []);

    if (homecellsError) throw homecellsError;

    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('membership_status, gender')
      .in('homecell_id', homecells?.map(h => h.id) || []);

    if (membersError) throw membersError;

    const membersList = members || [];
    const summary = {
      districtId: district.id,
      districtName: district.name,
      zones: zones?.length || 0,
      homecells: homecells?.length || 0,
      totalMembers: membersList.length,
      activeMembers: membersList.filter(m => m.membership_status === 'Active').length,
      inactiveMembers: membersList.filter(m => m.membership_status === 'Inactive').length,
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching district summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export district report
router.get('/districts/:id/export', async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;

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
      .order('name');

    if (zonesError) throw zonesError;

    const summaryData = {
      district,
      zones: zones || [],
      generatedAt: new Date().toISOString(),
    };

    if (format === 'csv') {
      const headers = ['Zone Name', 'Zone Leader', 'Leader Phone', 'Status'];
      const rows = zones.map(z => ({
        'Zone Name': z.name,
        'Zone Leader': z.leader || '',
        'Leader Phone': z.leader_phone || '',
        'Status': z.is_active ? 'Active' : 'Inactive'
      }));

      const csv = generateCSV(headers, rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="district-${district.name}-zones.csv"`);
      res.send(csv);

    } else {
      let htmlContent = `
        <h1>${district.name}</h1>
        
        <div class="info-grid">
          <div class="info-block">
            <p><span class="label">Total Zones:</span> <span class="stat">${zones?.length || 0}</span></p>
          </div>
          <div class="info-block">
            <p><span class="label">Status:</span> ${district.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      `;

      if (zones && zones.length > 0) {
        htmlContent += `
          <h2>Zones in this District</h2>
          <table>
            <thead>
              <tr>
                <th>Zone Name</th>
                <th>Zone Leader</th>
                <th>Leader Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${zones.map(z => `
                <tr>
                  <td>${z.name}</td>
                  <td>${z.leader || ''}</td>
                  <td>${z.leader_phone || ''}</td>
                  <td>${z.is_active ? 'Active' : 'Inactive'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      const html = generateHTML(`${district.name} Report`, htmlContent);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="district-${district.name}.html"`);
      res.send(html);
    }
  } catch (error) {
    console.error('Error exporting district report:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
