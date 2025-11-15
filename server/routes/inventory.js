const express = require("express");
const { query } = require("../config/database");
const router = express.Router();

// Get inventory service status
router.get("/status", async (req, res) => {
  try {
    res.json({
      success: true,
      status: "operational",
      features: {
        viewInventory: true,
        createInventory: true,
        updateInventory: true,
        deleteInventory: true,
        inventoryStats: true
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

// Get all inventory items
router.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM inventory ORDER BY created_at DESC",
    );
    res.json({ success: true, data: result.data || [] });
  } catch (error) {
    console.error("Inventory fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get inventory item by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      "SELECT * FROM inventory WHERE id = ?",
      [id]
    );

    if (result.success && result.data.length > 0) {
      res.json({ success: true, data: result.data[0] });
    } else {
      res.status(404).json({ error: "Inventory item not found" });
    }
  } catch (error) {
    console.error("Inventory fetch by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new inventory item
router.post("/", async (req, res) => {
  try {
    const {
      item_code,
      item_name,
      category,
      brand,
      model,
      description,
      location,
      current_value,
      purchase_date,
      purchase_price,
      supplier,
      status,
      condition
    } = req.body;

    if (!item_code || !item_name || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await query(
      `INSERT INTO inventory (
        item_code, item_name, category, brand, model, description,
        location, current_value, purchase_date, purchase_price,
        supplier, status, condition_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        item_code, item_name, category, brand || "", model || "",
        description || "", location || "", current_value || 0,
        purchase_date || null, purchase_price || 0, supplier || "",
        status || "working", condition || "good"
      ]
    );

    if (result.success) {
      // Log the activity
      await query(
        `INSERT INTO system_logs (action, module, details, severity, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [
          'Inventory Item Created',
          'Inventory',
          `Created inventory item: ${item_name} (${item_code})`,
          'Info'
        ]
      );

      res.json({
        success: true,
        id: result.data.insertId,
        message: "Inventory item created successfully"
      });
    } else {
      res.status(500).json({ error: "Failed to create inventory item" });
    }
  } catch (error) {
    console.error("Inventory creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update inventory item
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Build dynamic update query
    const setClause = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateFields), id];

    const result = await query(
      `UPDATE inventory SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    if (result.success) {
      // Log the activity
      await query(
        `INSERT INTO system_logs (action, module, details, severity, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [
          'Inventory Item Updated',
          'Inventory',
          `Updated inventory item ID: ${id}`,
          'Info'
        ]
      );

      res.json({ success: true, message: "Inventory item updated successfully" });
    } else {
      res.status(500).json({ error: "Failed to update inventory item" });
    }
  } catch (error) {
    console.error("Inventory update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete inventory item (Admin/Pastor only)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userRole } = req.body;

    // Check permissions
    if (!["admin", "pastor"].includes(userRole?.toLowerCase())) {
      return res.status(403).json({ error: "Insufficient permissions to delete inventory items" });
    }

    const result = await query(
      "DELETE FROM inventory WHERE id = ?",
      [id]
    );

    if (result.success) {
      // Log the activity
      await query(
        `INSERT INTO system_logs (action, module, details, severity, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [
          'Inventory Item Deleted',
          'Inventory',
          `Deleted inventory item ID: ${id}`,
          'Warning'
        ]
      );

      res.json({ success: true, message: "Inventory item deleted successfully" });
    } else {
      res.status(500).json({ error: "Failed to delete inventory item" });
    }
  } catch (error) {
    console.error("Inventory deletion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get inventory statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const totalResult = await query("SELECT COUNT(*) as total FROM inventory");
    const workingResult = await query("SELECT COUNT(*) as working FROM inventory WHERE status = 'working'");
    const faultyResult = await query("SELECT COUNT(*) as faulty FROM inventory WHERE status = 'faulty'");
    const valueResult = await query("SELECT SUM(current_value) as total_value FROM inventory");

    if (totalResult.success && workingResult.success && faultyResult.success && valueResult.success) {
      res.json({
        success: true,
        stats: {
          total: totalResult.data[0].total,
          working: workingResult.data[0].working,
          faulty: faultyResult.data[0].faulty,
          totalValue: valueResult.data[0].total_value || 0
        }
      });
    } else {
      res.status(500).json({ error: "Failed to fetch inventory statistics" });
    }
  } catch (error) {
    console.error("Inventory stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
