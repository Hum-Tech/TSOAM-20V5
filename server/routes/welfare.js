const express = require("express");
const { query } = require("../config/database");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

// Get all welfare requests
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT wr.*, m.name as member_name, u.name as reviewed_by_name
      FROM welfare_requests wr
      LEFT JOIN members m ON wr.member_id = m.id
      LEFT JOIN users u ON wr.reviewed_by = u.id
      ORDER BY wr.created_at DESC
    `);
    res.json({ success: true, data: result.data || [] });
  } catch (error) {
    console.error("Get welfare requests error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch welfare requests" });
  }
});

// Get welfare request by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT wr.*, m.name as member_name, u.name as reviewed_by_name
      FROM welfare_requests wr
      LEFT JOIN members m ON wr.member_id = m.id
      LEFT JOIN users u ON wr.reviewed_by = u.id
      WHERE wr.id = ?
    `, [req.params.id]);

    if (result.success && result.data.length > 0) {
      res.json({ success: true, data: result.data[0] });
    } else {
      res.status(404).json({ success: false, error: "Welfare request not found" });
    }
  } catch (error) {
    console.error("Get welfare request error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch welfare request" });
  }
});

// Create new welfare request
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      applicant_name, applicant_age, phone_number, email_address,
      residence, city_state_zip, marital_status, dependents,
      member_id, membership_status, tithe_status, employment_status,
      monthly_income, financial_hardship, assistance_type,
      amount_requested, reason_for_request, urgency_level
    } = req.body;

    if (!applicant_name || !phone_number || !residence || !assistance_type || !amount_requested) {
      return res.status(400).json({
        success: false,
        error: "Required fields missing"
      });
    }

    // Generate request ID
    const requestId = `WR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const result = await query(`
      INSERT INTO welfare_requests (
        request_id, applicant_name, applicant_age, phone_number, email_address,
        residence, city_state_zip, marital_status, dependents, member_id,
        membership_status, tithe_status, employment_status, monthly_income,
        financial_hardship, assistance_type, amount_requested, reason_for_request,
        urgency_level, application_date, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, 'Pending', NOW())
    `, [
      requestId, applicant_name, applicant_age, phone_number, email_address,
      residence, city_state_zip, marital_status, dependents, member_id,
      membership_status, tithe_status, employment_status, monthly_income,
      financial_hardship, assistance_type, amount_requested, reason_for_request,
      urgency_level || 'Medium'
    ]);

    if (result.success) {
      res.json({
        success: true,
        data: { request_id: requestId, ...req.body },
        message: "Welfare request submitted successfully"
      });
    } else {
      res.status(500).json({ success: false, error: "Failed to create welfare request" });
    }
  } catch (error) {
    console.error("Create welfare request error:", error);
    res.status(500).json({ success: false, error: "Failed to create welfare request" });
  }
});

// Update welfare request status
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status, review_notes, amount_approved, reviewed_by } = req.body;

    const result = await query(`
      UPDATE welfare_requests SET
        status = ?, review_notes = ?, amount_approved = ?,
        reviewed_by = ?, review_date = CURRENT_DATE, updated_at = NOW()
      WHERE id = ?
    `, [status, review_notes, amount_approved, reviewed_by, req.params.id]);

    if (result.success) {
      res.json({ success: true, message: "Welfare request updated successfully" });
    } else {
      res.status(500).json({ success: false, error: "Failed to update welfare request" });
    }
  } catch (error) {
    console.error("Update welfare request error:", error);
    res.status(500).json({ success: false, error: "Failed to update welfare request" });
  }
});

module.exports = router;
