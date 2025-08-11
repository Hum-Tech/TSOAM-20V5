const express = require("express");
const FinancialTransaction = require("../models/FinancialTransaction");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get all transactions
router.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      category: req.query.category,
      status: req.query.status,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      search: req.query.search,
      limit: req.query.limit,
    };

    const result = await FinancialTransaction.findAll(filters);

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
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions",
    });
  }
});

// Get transaction by ID
router.get("/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const result = await FinancialTransaction.findById(req.params.id);

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
    console.error("Get transaction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transaction",
    });
  }
});

// Add new transaction
router.post("/transactions", authMiddleware, requireRole(['Admin', 'Finance Officer']), async (req, res) => {
  try {
    const result = await FinancialTransaction.create(req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: "Transaction created successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create transaction",
    });
  }
});

// Update transaction
router.put("/transactions/:id", authMiddleware, requireRole(['Admin', 'Finance Officer']), async (req, res) => {
  try {
    const result = await FinancialTransaction.update(req.params.id, req.body);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: "Transaction updated successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update transaction",
    });
  }
});

// Delete transaction
router.delete("/transactions/:id", authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const result = await FinancialTransaction.delete(req.params.id);

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
    console.error("Delete transaction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete transaction",
    });
  }
});

// Get financial summary
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const result = await FinancialTransaction.getFinancialSummary();

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
    console.error("Get financial summary error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch financial summary",
    });
  }
});

// Get transactions by category
router.get("/transactions/category/:category", authMiddleware, async (req, res) => {
  try {
    const filters = { category: req.params.category };
    const result = await FinancialTransaction.findAll(filters);

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
    console.error("Get transactions by category error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions by category",
    });
  }
});

// Search transactions
router.get("/transactions/search/:term", authMiddleware, async (req, res) => {
  try {
    const result = await FinancialTransaction.search(req.params.term);

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
    console.error("Search transactions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search transactions",
    });
  }
});

// Get monthly financial report
router.get("/reports/monthly", authMiddleware, async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || (new Date().getMonth() + 1);
    
    const result = await FinancialTransaction.getMonthlyReport(year, month);

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
    console.error("Get monthly report error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch monthly report",
    });
  }
});

// Get yearly financial report
router.get("/reports/yearly", authMiddleware, async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    
    const result = await FinancialTransaction.getYearlyReport(year);

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
    console.error("Get yearly report error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch yearly report",
    });
  }
});

// Approve transaction
router.put("/transactions/:id/approve", authMiddleware, requireRole(['Admin', 'Finance Officer']), async (req, res) => {
  try {
    const result = await FinancialTransaction.update(req.params.id, { 
      status: 'Approved',
      approved_by: req.user.id,
      approved_date: new Date().toISOString().split('T')[0]
    });

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: "Transaction approved successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Approve transaction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve transaction",
    });
  }
});

// Reject transaction
router.put("/transactions/:id/reject", authMiddleware, requireRole(['Admin', 'Finance Officer']), async (req, res) => {
  try {
    const result = await FinancialTransaction.update(req.params.id, { 
      status: 'Rejected',
      approved_by: req.user.id,
      approved_date: new Date().toISOString().split('T')[0],
      notes: req.body.rejection_reason
    });

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: "Transaction rejected successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Reject transaction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reject transaction",
    });
  }
});

// Get pending transactions for approval
router.get("/transactions/pending/approval", authMiddleware, requireRole(['Admin', 'Finance Officer']), async (req, res) => {
  try {
    const filters = { status: 'Pending' };
    const result = await FinancialTransaction.findAll(filters);

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
    console.error("Get pending transactions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pending transactions",
    });
  }
});

module.exports = router;
