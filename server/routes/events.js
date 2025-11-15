const express = require("express");
const Event = require("../models/Event");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get events service status
router.get("/status", async (req, res) => {
  try {
    res.json({
      success: true,
      status: "operational",
      features: {
        viewEvents: true,
        createEvents: true,
        updateEvents: true,
        deleteEvents: true,
        eventRegistration: true,
        eventStatistics: true
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

// Get all events
router.get("/", authMiddleware, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      search: req.query.search,
      limit: req.query.limit,
    };

    const result = await Event.findAll(filters);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        total: result.data.length,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch events",
    });
  }
});

// Get event by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await Event.findById(req.params.id);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch event",
    });
  }
});

// Create new event
router.post("/", authMiddleware, requireRole(['Admin', 'User']), async (req, res) => {
  try {
    const result = await Event.create(req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: "Event created successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create event",
    });
  }
});

// Update event
router.put("/:id", authMiddleware, requireRole(['Admin', 'User']), async (req, res) => {
  try {
    const result = await Event.update(req.params.id, req.body);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: "Event updated successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update event",
    });
  }
});

// Delete event
router.delete("/:id", authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const result = await Event.delete(req.params.id);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete event",
    });
  }
});

// Get upcoming events
router.get("/upcoming/list", authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const result = await Event.getUpcoming(parseInt(limit));

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch upcoming events",
    });
  }
});

// Register for event
router.post("/:id/register", authMiddleware, async (req, res) => {
  try {
    const result = await Event.registerAttendee(req.params.id, req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: "Registration successful",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register for event",
    });
  }
});

// Get event registrations
router.get("/:id/registrations", authMiddleware, requireRole(['Admin', 'User']), async (req, res) => {
  try {
    const result = await Event.getRegistrations(req.params.id);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Get event registrations error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch event registrations",
    });
  }
});

// Get event statistics
router.get("/stats/summary", authMiddleware, async (req, res) => {
  try {
    const result = await Event.getStatistics();

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Get event statistics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch event statistics",
    });
  }
});

// Search events
router.get("/search/:term", authMiddleware, async (req, res) => {
  try {
    const result = await Event.search(req.params.term);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Search events error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search events",
    });
  }
});

module.exports = router;
