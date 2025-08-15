-- Fix Missing Tables for TSOAM Church Management System
-- Run this in MySQL to create missing tables

USE tsoam_church_db;

-- Create user_requests table (required for user account creation)
CREATE TABLE IF NOT EXISTS user_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('Admin', 'HR Officer', 'Finance Officer', 'User') NOT NULL DEFAULT 'User',
  department VARCHAR(100),
  employee_id VARCHAR(50),
  requested_by VARCHAR(255),
  ip_address VARCHAR(45),
  request_reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by VARCHAR(36),
  approved_at TIMESTAMP NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_email (email),
  INDEX idx_requested_by (requested_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify the admin user exists and is active
SELECT 'Admin User Check:' as Status;
SELECT id, name, email, role, is_active 
FROM users 
WHERE email = 'admin@tsoam.org';

-- Show all tables to verify setup
SELECT 'All Tables:' as Status;
SHOW TABLES;

-- Check if user_requests table was created
SELECT 'User Requests Table Check:' as Status;
DESCRIBE user_requests;

SELECT '✅ Database fix completed!' as Status;
