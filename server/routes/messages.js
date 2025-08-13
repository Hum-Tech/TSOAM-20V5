const express = require("express");
const { query } = require("../config/database");

const router = express.Router();

// Get all messages for a user with replies
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    const result = await query(
      `SELECT m.*, u.name as sender_name, u.email as sender_email,
              r.original_message_id, r.thread_depth,
              (SELECT COUNT(*) FROM message_replies WHERE original_message_id = m.id) as reply_count
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       LEFT JOIN message_replies r ON m.id = r.reply_message_id
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

// Get conversation thread for a message
router.get("/thread/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;

    // Get original message and all replies in the thread
    const result = await query(
      `SELECT m.*, u.name as sender_name, u.email as sender_email,
              r.thread_depth, r.original_message_id
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       LEFT JOIN message_replies r ON m.id = r.reply_message_id OR m.id = r.original_message_id
       WHERE m.id = ? OR r.original_message_id = ?
       ORDER BY m.created_at ASC`,
      [messageId, messageId]
    );

    if (result.success) {
      res.json({ success: true, thread: result.data });
    } else {
      res.status(500).json({ error: "Failed to fetch conversation thread" });
    }
  } catch (error) {
    console.error("Thread fetch error:", error);
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
      recipient_type,
      parent_message_id,
      is_reply
    } = req.body;

    if (!sender_id || !recipient_ids || !message_content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert message into database
    const result = await query(
      `INSERT INTO messages (sender_id, recipient_ids, content, message_type, subject, recipient_type, status, parent_message_id, is_reply, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'sent', ?, ?, NOW())`,
      [
        sender_id,
        JSON.stringify(recipient_ids),
        message_content,
        message_type || 'Internal',
        subject || null,
        recipient_type || 'employee',
        parent_message_id || null,
        is_reply ? 1 : 0
      ]
    );

    if (result.success) {
      const messageId = result.data.insertId;

      // If this is a reply, add to message_replies table
      if (is_reply && parent_message_id) {
        await query(
          `INSERT INTO message_replies (original_message_id, reply_message_id, thread_depth)
           VALUES (?, ?, (SELECT COALESCE(MAX(thread_depth), 0) + 1 FROM message_replies WHERE original_message_id = ?))`,
          [parent_message_id, messageId, parent_message_id]
        );
      }

      // Log the activity
      await query(
        `INSERT INTO system_logs (action, module, details, severity, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          is_reply ? 'Reply Sent' : 'Message Sent',
          'Messaging',
          `${message_type} ${is_reply ? 'reply' : 'message'} sent to ${recipient_ids.length} recipient(s): "${message_content.substring(0, 50)}..."`,
          'Info',
          sender_id
        ]
      );

      res.json({
        success: true,
        messageId: messageId,
        message: is_reply ? "Reply sent successfully" : "Message sent successfully"
      });
    } else {
      res.status(500).json({ error: "Failed to send message" });
    }
  } catch (error) {
    console.error("Message send error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send a reply to a message
router.post("/reply", async (req, res) => {
  try {
    const {
      sender_id,
      original_message_id,
      reply_content,
      recipient_id
    } = req.body;

    if (!sender_id || !original_message_id || !reply_content || !recipient_id) {
      return res.status(400).json({ error: "Missing required fields for reply" });
    }

    // Get original message details
    const originalMessage = await query(
      `SELECT m.*, u.name as sender_name FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [original_message_id]
    );

    if (!originalMessage.success || originalMessage.data.length === 0) {
      return res.status(404).json({ error: "Original message not found" });
    }

    const original = originalMessage.data[0];

    // Insert reply message
    const result = await query(
      `INSERT INTO messages (sender_id, recipient_ids, content, message_type, subject, recipient_type, status, parent_message_id, is_reply, created_at)
       VALUES (?, ?, ?, 'Internal', ?, 'employee', 'sent', ?, 1, NOW())`,
      [
        sender_id,
        JSON.stringify([recipient_id]),
        reply_content,
        `Re: ${original.subject || 'Internal Message'}`,
        original_message_id
      ]
    );

    if (result.success) {
      const replyId = result.data.insertId;

      // Add to message_replies table
      await query(
        `INSERT INTO message_replies (original_message_id, reply_message_id, thread_depth)
         VALUES (?, ?, (SELECT COALESCE(MAX(thread_depth), 0) + 1 FROM message_replies WHERE original_message_id = ?))`,
        [original_message_id, replyId, original_message_id]
      );

      // Mark original message as read (conversation activity)
      await query(
        `UPDATE messages SET status = 'read', read_at = NOW() WHERE id = ?`,
        [original_message_id]
      );

      // Log the reply
      await query(
        `INSERT INTO system_logs (action, module, details, severity, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          'Reply Sent',
          'Messaging',
          `Reply sent to message ID ${original_message_id}: "${reply_content.substring(0, 50)}..."`,
          'Info',
          sender_id
        ]
      );

      res.json({
        success: true,
        replyId: replyId,
        message: "Reply sent successfully"
      });
    } else {
      res.status(500).json({ error: "Failed to send reply" });
    }
  } catch (error) {
    console.error("Reply send error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark message as read
router.patch("/:messageId/read", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    const result = await query(
      `UPDATE messages SET status = 'read', read_at = NOW() WHERE id = ?`,
      [messageId]
    );

    if (result.success) {
      // Log the read action
      await query(
        `INSERT INTO system_logs (action, module, details, severity, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          'Message Read',
          'Messaging',
          `Message ID ${messageId} marked as read`,
          'Info',
          userId
        ]
      );

      res.json({ success: true, message: "Message marked as read" });
    } else {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  } catch (error) {
    console.error("Mark read error:", error);
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