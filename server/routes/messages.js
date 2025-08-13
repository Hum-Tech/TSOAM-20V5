const express = require("express");
const { query } = require("../config/database");

const router = express.Router();

// Get all messages for a user
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    const result = await query(
      `SELECT m.*, u.name as sender_name 
       FROM messages m 
       LEFT JOIN users u ON m.sender_id = u.id 
       WHERE m.sender_id = ? OR JSON_CONTAINS(m.recipient_ids, ?) 
       ORDER BY m.created_at DESC`,
      [userId, `"${userId}"`]
    );

    if (result.success) {
      res.json({ success: true, messages: result.data });
    } else {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  } catch (error) {
    console.error("Messages fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send a new message
router.post("/", async (req, res) => {
  try {
    const { 
      sender_id, 
      recipient_ids, 
      message_content, 
      message_type, 
      subject,
      recipient_type 
    } = req.body;

    if (!sender_id || !recipient_ids || !message_content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert message into database
    const result = await query(
      `INSERT INTO messages (sender_id, recipient_ids, content, message_type, subject, recipient_type, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'sent', NOW())`,
      [
        sender_id,
        JSON.stringify(recipient_ids),
        message_content,
        message_type || 'Internal',
        subject || null,
        recipient_type || 'employee'
      ]
    );

    if (result.success) {
      // Log the activity
      await query(
        `INSERT INTO system_logs (action, module, details, severity, user_id, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          'Message Sent',
          'Messaging',
          `${message_type} sent to ${recipient_ids.length} recipient(s): "${message_content.substring(0, 50)}..."`,
          'Info',
          sender_id
        ]
      );

      res.json({ 
        success: true, 
        messageId: result.data.insertId,
        message: "Message sent successfully"
      });
    } else {
      res.status(500).json({ error: "Failed to send message" });
    }
  } catch (error) {
    console.error("Message send error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete messages (admin only)
router.delete("/delete", async (req, res) => {
  try {
    const { message_ids, user_role } = req.body;

    if (!["Admin", "HR Officer"].includes(user_role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const result = await query(
      `DELETE FROM messages WHERE id IN (${message_ids.map(() => '?').join(',')})`,
      message_ids
    );

    if (result.success) {
      res.json({ success: true, message: "Messages deleted successfully" });
    } else {
      res.status(500).json({ error: "Failed to delete messages" });
    }
  } catch (error) {
    console.error("Message delete error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get message statistics
router.get("/stats", async (req, res) => {
  try {
    const { userId } = req.query;

    const totalResult = await query(
      "SELECT COUNT(*) as total FROM messages WHERE sender_id = ?",
      [userId]
    );

    const todayResult = await query(
      "SELECT COUNT(*) as today FROM messages WHERE sender_id = ? AND DATE(created_at) = CURDATE()",
      [userId]
    );

    const deliveryResult = await query(
      "SELECT AVG(CASE WHEN status = 'delivered' THEN 100 ELSE 0 END) as rate FROM messages WHERE sender_id = ?",
      [userId]
    );

    if (totalResult.success && todayResult.success && deliveryResult.success) {
      res.json({
        success: true,
        stats: {
          total: totalResult.data[0].total,
          today: todayResult.data[0].today,
          deliveryRate: deliveryResult.data[0].rate || 0
        }
      });
    } else {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  } catch (error) {
    console.error("Message stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
