const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Employee = require("../models/Employee");
const { authMiddleware, requireRole, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Get HR service status
router.get("/status", async (req, res) => {
  try {
    res.json({
      success: true,
      status: "operational",
      features: {
        viewEmployees: true,
        createEmployees: true,
        updateEmployees: true,
        leaveManagement: true,
        payrollProcessing: true,
        performanceTracking: true,
        employeeDocuments: true
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/employee-documents");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images, PDFs, and Word documents are allowed"));
    }
  },
});

// Get all employees
router.get("/employees", optionalAuth, async (req, res) => {
  try {
    const filters = {
      is_active: req.query.is_active !== undefined ? req.query.is_active === "true" : undefined,
      department: req.query.department,
      employment_status: req.query.employment_status,
      search: req.query.search,
      limit: req.query.limit,
    };

    const result = await Employee.findAll(filters);

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
    console.error("Get employees error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employees",
    });
  }
});

// Get employee by ID
router.get("/employees/:id", optionalAuth, async (req, res) => {
  try {
    const result = await Employee.findById(req.params.id);

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
    console.error("Get employee error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employee",
    });
  }
});

// Create new employee
router.post("/employees", authMiddleware, requireRole(['Admin', 'HR Officer']), async (req, res) => {
  try {
    const result = await Employee.create(req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: "Employee created successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create employee",
    });
  }
});

// Update employee
router.put("/employees/:id", authMiddleware, requireRole(['Admin', 'HR Officer']), async (req, res) => {
  try {
    const result = await Employee.update(req.params.id, req.body);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: "Employee updated successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update employee",
    });
  }
});

// Delete employee (soft delete)
router.delete("/employees/:id", authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const result = await Employee.delete(req.params.id);

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
    console.error("Delete employee error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete employee",
    });
  }
});

// Get employee statistics
router.get("/employees/stats/summary", optionalAuth, async (req, res) => {
  try {
    const result = await Employee.getStatistics();

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
    console.error("Get employee statistics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employee statistics",
    });
  }
});

// Search employees
router.get("/employees/search/:term", authMiddleware, async (req, res) => {
  try {
    const result = await Employee.search(req.params.term);

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
    console.error("Search employees error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search employees",
    });
  }
});

// Create payroll record
router.post("/payroll", authMiddleware, requireRole(['Admin', 'HR Officer', 'Finance Officer']), async (req, res) => {
  try {
    const result = await Employee.createPayrollRecord(req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: "Payroll record created successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Create payroll error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create payroll record",
    });
  }
});

// Get payroll records for employee
router.get("/payroll/:employeeId", optionalAuth, async (req, res) => {
  try {
    const filters = {
      year: req.query.year,
      month: req.query.month,
    };

    const result = await Employee.getPayrollRecords(req.params.employeeId, filters);

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
    console.error("Get payroll records error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payroll records",
    });
  }
});

// Upload employee document
router.post("/employees/:id/documents", authMiddleware, requireRole(['Admin', 'HR Officer']), upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    // Here you would typically save the document reference to the database
    // For now, we'll just return the file information
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        uploadDate: new Date().toISOString(),
      },
      message: "Document uploaded successfully",
    });
  } catch (error) {
    console.error("Document upload error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload document",
    });
  }
});

// Get employee documents
router.get("/employees/:id/documents", authMiddleware, async (req, res) => {
  try {
    const employeeId = req.params.id;
    const uploadsDir = path.join(__dirname, "../uploads/employee-documents");

    // Read directory for employee documents
    // This is a simplified implementation - in production, you'd store document metadata in the database
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir).filter(file => file.includes(employeeId));

      const documents = files.map(file => ({
        filename: file,
        path: path.join(uploadsDir, file),
        uploadDate: fs.statSync(path.join(uploadsDir, file)).birthtime,
        size: fs.statSync(path.join(uploadsDir, file)).size,
      }));

      res.json({
        success: true,
        data: documents,
      });
    } else {
      res.json({
        success: true,
        data: [],
      });
    }
  } catch (error) {
    console.error("Get employee documents error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employee documents",
    });
  }
});

// Download employee document
router.get("/employees/:id/documents/:filename", authMiddleware, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../uploads/employee-documents", filename);

    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }
  } catch (error) {
    console.error("Download document error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download document",
    });
  }
});

// ===============================
// PERFORMANCE REVIEW ENDPOINTS
// ===============================

// Get all performance reviews
router.get("/performance-reviews", optionalAuth, async (req, res) => {
  try {
    const { query } = require("../config/database");

    const result = await query(`
      SELECT pr.*, e.full_name as employee_name, e.department
      FROM performance_reviews pr
      LEFT JOIN employees e ON pr.employee_id = e.employee_id
      ORDER BY pr.review_date DESC
    `);

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
    console.error("Get performance reviews error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch performance reviews",
    });
  }
});

// Get performance review by ID
router.get("/performance-reviews/:id", optionalAuth, async (req, res) => {
  try {
    const { query } = require("../config/database");

    const result = await query(`
      SELECT pr.*, e.full_name as employee_name, e.department, e.position
      FROM performance_reviews pr
      LEFT JOIN employees e ON pr.employee_id = e.employee_id
      WHERE pr.id = ?
    `, [req.params.id]);

    if (result.success && result.data.length > 0) {
      res.json({
        success: true,
        data: result.data[0],
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Performance review not found",
      });
    }
  } catch (error) {
    console.error("Get performance review error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch performance review",
    });
  }
});

// Create new performance review
router.post("/performance-reviews", optionalAuth, async (req, res) => {
  try {
    const { query } = require("../config/database");

    const {
      employee_id,
      review_period,
      review_type,
      overall_rating,
      job_knowledge_rating,
      quality_of_work_rating,
      productivity_rating,
      communication_rating,
      teamwork_rating,
      initiative_rating,
      reliability_rating,
      strengths,
      areas_for_improvement,
      goals,
      development_plan,
      manager_comments,
      employee_comments,
      reviewer_name,
      review_date
    } = req.body;

    const result = await query(`
      INSERT INTO performance_reviews (
        employee_id, review_period, review_type, overall_rating,
        job_knowledge_rating, quality_of_work_rating, productivity_rating,
        communication_rating, teamwork_rating, initiative_rating,
        reliability_rating, strengths, areas_for_improvement, goals,
        development_plan, manager_comments, employee_comments,
        reviewer_name, review_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      employee_id, review_period, review_type, overall_rating,
      job_knowledge_rating, quality_of_work_rating, productivity_rating,
      communication_rating, teamwork_rating, initiative_rating,
      reliability_rating, strengths, areas_for_improvement, goals,
      development_plan, manager_comments, employee_comments,
      reviewer_name, review_date, 'completed'
    ]);

    if (result.success) {
      res.json({
        success: true,
        data: { id: result.data.insertId },
        message: "Performance review created successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Create performance review error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create performance review",
    });
  }
});

// Update performance review
router.put("/performance-reviews/:id", optionalAuth, async (req, res) => {
  try {
    const { query } = require("../config/database");

    const {
      review_period,
      review_type,
      overall_rating,
      job_knowledge_rating,
      quality_of_work_rating,
      productivity_rating,
      communication_rating,
      teamwork_rating,
      initiative_rating,
      reliability_rating,
      strengths,
      areas_for_improvement,
      goals,
      development_plan,
      manager_comments,
      employee_comments,
      reviewer_name,
      review_date,
      status
    } = req.body;

    const result = await query(`
      UPDATE performance_reviews SET
        review_period = ?, review_type = ?, overall_rating = ?,
        job_knowledge_rating = ?, quality_of_work_rating = ?, productivity_rating = ?,
        communication_rating = ?, teamwork_rating = ?, initiative_rating = ?,
        reliability_rating = ?, strengths = ?, areas_for_improvement = ?, goals = ?,
        development_plan = ?, manager_comments = ?, employee_comments = ?,
        reviewer_name = ?, review_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      review_period, review_type, overall_rating,
      job_knowledge_rating, quality_of_work_rating, productivity_rating,
      communication_rating, teamwork_rating, initiative_rating,
      reliability_rating, strengths, areas_for_improvement, goals,
      development_plan, manager_comments, employee_comments,
      reviewer_name, review_date, status || 'completed', req.params.id
    ]);

    if (result.success) {
      res.json({
        success: true,
        message: "Performance review updated successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Update performance review error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update performance review",
    });
  }
});

// Delete performance review
router.delete("/performance-reviews/:id", authMiddleware, requireRole(['Admin', 'HR Officer']), async (req, res) => {
  try {
    const { query } = require("../config/database");

    const result = await query(`
      DELETE FROM performance_reviews WHERE id = ?
    `, [req.params.id]);

    if (result.success) {
      res.json({
        success: true,
        message: "Performance review deleted successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Delete performance review error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete performance review",
    });
  }
});

module.exports = router;
