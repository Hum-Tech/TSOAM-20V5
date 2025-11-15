const express = require("express");
const { query } = require("../config/database");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

// Get appointments service status
router.get("/status", async (req, res) => {
  try {
    res.json({
      success: true,
      status: "operational",
      features: {
        viewAppointments: true,
        createAppointments: true,
        updateAppointments: true,
        appointmentScheduling: true,
        reminderNotifications: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "error",
      error: error.message
    });
  }
});

// Get all appointments
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, u.name as organizer_name
      FROM appointments a
      LEFT JOIN users u ON a.organizer_id = u.id
      ORDER BY a.date DESC, a.time ASC
    `);
    res.json({ success: true, data: result.data || [] });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch appointments" });
  }
});

// Get appointment by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, u.name as organizer_name
      FROM appointments a
      LEFT JOIN users u ON a.organizer_id = u.id
      WHERE a.id = ?
    `, [req.params.id]);

    if (result.success && result.data.length > 0) {
      res.json({ success: true, data: result.data[0] });
    } else {
      res.status(404).json({ success: false, error: "Appointment not found" });
    }
  } catch (error) {
    console.error("Get appointment error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch appointment" });
  }
});

// Create new appointment
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title, description, date, time, duration_minutes, type,
      organizer_id, organizer_name, organizer_email, location_type,
      location_address, location_room, meeting_link, agenda, notes
    } = req.body;

    if (!title || !date || !time || !type || !organizer_id) {
      return res.status(400).json({
        success: false,
        error: "Title, date, time, type, and organizer are required"
      });
    }

    // Generate appointment ID
    const appointmentId = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const result = await query(`
      INSERT INTO appointments (
        id, title, description, date, time, duration_minutes,
        type, organizer_id, organizer_name, organizer_email,
        location_type, location_address, location_room, meeting_link,
        agenda, notes, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW())
    `, [
      appointmentId, title, description, date, time, duration_minutes || 60,
      type, organizer_id, organizer_name, organizer_email,
      location_type || 'physical', location_address, location_room, meeting_link,
      agenda, notes, req.user?.id || organizer_id
    ]);

    if (result.success) {
      res.json({
        success: true,
        data: { id: appointmentId, ...req.body },
        message: "Appointment created successfully"
      });
    } else {
      res.status(500).json({ success: false, error: "Failed to create appointment" });
    }
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({ success: false, error: "Failed to create appointment" });
  }
});

// Update appointment
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const {
      title, description, date, time, duration_minutes, status,
      location_address, location_room, meeting_link, agenda, notes
    } = req.body;

    const result = await query(`
      UPDATE appointments SET
        title = ?, description = ?, date = ?, time = ?,
        duration_minutes = ?, status = ?, location_address = ?,
        location_room = ?, meeting_link = ?, agenda = ?, notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      title, description, date, time, duration_minutes, status,
      location_address, location_room, meeting_link, agenda, notes,
      appointmentId
    ]);

    if (result.success) {
      res.json({ success: true, message: "Appointment updated successfully" });
    } else {
      res.status(500).json({ success: false, error: "Failed to update appointment" });
    }
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({ success: false, error: "Failed to update appointment" });
  }
});

// Delete appointment
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await query("DELETE FROM appointments WHERE id = ?", [req.params.id]);

    if (result.success) {
      res.json({ success: true, message: "Appointment deleted successfully" });
    } else {
      res.status(500).json({ success: false, error: "Failed to delete appointment" });
    }
  } catch (error) {
    console.error("Delete appointment error:", error);
    res.status(500).json({ success: false, error: "Failed to delete appointment" });
  }
});

module.exports = router;
