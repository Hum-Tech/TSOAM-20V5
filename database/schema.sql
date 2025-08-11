-- TSOAM Church Management System - Production Database Schema
-- Enhanced schema with comprehensive payroll tracking and rejection handling

CREATE DATABASE IF NOT EXISTS tsoam_church_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tsoam_church_db;

-- Enhanced Payroll Records Table with Individual Tracking
CREATE TABLE IF NOT EXISTS payroll_records (
    id VARCHAR(50) PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    period VARCHAR(7) NOT NULL, -- YYYY-MM format
    pay_period_from DATE NOT NULL,
    pay_period_to DATE NOT NULL,
    
    -- Salary Components
    basic_salary DECIMAL(15,2) NOT NULL,
    allowances DECIMAL(15,2) DEFAULT 0.00,
    gross_salary DECIMAL(15,2) NOT NULL,
    
    -- Statutory Deductions
    paye_tax DECIMAL(15,2) DEFAULT 0.00,
    nssf_deduction DECIMAL(15,2) DEFAULT 0.00,
    sha_deduction DECIMAL(15,2) DEFAULT 0.00,
    housing_levy DECIMAL(15,2) DEFAULT 0.00,
    
    -- Other Deductions
    loan_deduction DECIMAL(15,2) DEFAULT 0.00,
    insurance_deduction DECIMAL(15,2) DEFAULT 0.00,
    other_deductions DECIMAL(15,2) DEFAULT 0.00,
    total_deductions DECIMAL(15,2) NOT NULL,
    
    -- Net Salary
    net_salary DECIMAL(15,2) NOT NULL,
    
    -- Status Tracking
    status ENUM('Pending_Finance_Approval', 'Approved', 'Rejected', 'Paid', 'Batch_Rejected') DEFAULT 'Pending_Finance_Approval',
    
    -- Processing Information
    processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by VARCHAR(100) NOT NULL,
    
    -- Approval/Rejection Information
    approved_date TIMESTAMP NULL,
    approved_by VARCHAR(100) NULL,
    rejected_date TIMESTAMP NULL,
    rejected_by VARCHAR(100) NULL,
    rejection_reason TEXT NULL,
    
    -- Payment Information
    paid_date TIMESTAMP NULL,
    payment_reference VARCHAR(100) NULL,
    
    -- Metadata
    tax_year YEAR NOT NULL,
    quarter TINYINT NOT NULL,
    metadata JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_batch_id (batch_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_period (period),
    INDEX idx_status (status),
    INDEX idx_processed_date (processed_date),
    INDEX idx_tax_year_quarter (tax_year, quarter)
);

-- Payroll Batches Table for Batch Management
CREATE TABLE IF NOT EXISTS payroll_batches (
    batch_id VARCHAR(50) PRIMARY KEY,
    period VARCHAR(7) NOT NULL,
    total_employees INT NOT NULL,
    total_gross_amount DECIMAL(15,2) NOT NULL,
    total_net_amount DECIMAL(15,2) NOT NULL,
    
    -- Status
    status ENUM('Pending_Finance_Approval', 'Partially_Approved', 'Fully_Approved', 'Rejected', 'Paid') DEFAULT 'Pending_Finance_Approval',
    
    -- Processing Information
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    
    -- Approval Information
    approved_date TIMESTAMP NULL,
    approved_by VARCHAR(100) NULL,
    approval_notes TEXT NULL,
    
    -- Rejection Information
    rejected_date TIMESTAMP NULL,
    rejected_by VARCHAR(100) NULL,
    rejection_reason TEXT NULL,
    
    -- Summary Statistics
    approved_count INT DEFAULT 0,
    rejected_count INT DEFAULT 0,
    paid_count INT DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_period (period),
    INDEX idx_status (status),
    INDEX idx_created_date (created_date)
);

-- Individual Payment Rejections Table
CREATE TABLE IF NOT EXISTS payment_rejections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_record_id VARCHAR(50) NOT NULL,
    batch_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    rejection_type ENUM('Individual', 'Batch') NOT NULL,
    rejection_reason TEXT NOT NULL,
    rejected_by VARCHAR(100) NOT NULL,
    rejected_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount_rejected DECIMAL(15,2) NOT NULL,
    hr_notified BOOLEAN DEFAULT FALSE,
    hr_notification_date TIMESTAMP NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_date TIMESTAMP NULL,
    resolved_by VARCHAR(100) NULL,
    
    INDEX idx_payroll_record_id (payroll_record_id),
    INDEX idx_batch_id (batch_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_rejected_date (rejected_date),
    INDEX idx_resolved (resolved),
    
    FOREIGN KEY (payroll_record_id) REFERENCES payroll_records(id) ON DELETE CASCADE
);

-- Finance Approval Audit Trail
CREATE TABLE IF NOT EXISTS finance_approval_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_type ENUM('Batch', 'Individual') NOT NULL,
    reference_id VARCHAR(50) NOT NULL,
    action ENUM('Approved', 'Rejected', 'Paid') NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NULL,
    amount DECIMAL(15,2) NULL,
    previous_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    INDEX idx_reference (reference_type, reference_id),
    INDEX idx_action_date (action_date),
    INDEX idx_performed_by (performed_by)
);

-- Triggers to maintain data consistency

DELIMITER //

-- Update batch statistics when payroll record status changes
CREATE TRIGGER update_batch_stats_after_payroll_update
AFTER UPDATE ON payroll_records
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        UPDATE payroll_batches 
        SET 
            approved_count = (
                SELECT COUNT(*) FROM payroll_records 
                WHERE batch_id = NEW.batch_id AND status = 'Approved'
            ),
            rejected_count = (
                SELECT COUNT(*) FROM payroll_records 
                WHERE batch_id = NEW.batch_id AND status = 'Rejected'
            ),
            paid_count = (
                SELECT COUNT(*) FROM payroll_records 
                WHERE batch_id = NEW.batch_id AND status = 'Paid'
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE batch_id = NEW.batch_id;
        
        -- Update batch status based on individual record statuses
        UPDATE payroll_batches b
        SET status = (
            CASE 
                WHEN (SELECT COUNT(*) FROM payroll_records WHERE batch_id = b.batch_id AND status = 'Paid') = b.total_employees 
                    THEN 'Paid'
                WHEN (SELECT COUNT(*) FROM payroll_records WHERE batch_id = b.batch_id AND status = 'Approved') = b.total_employees 
                    THEN 'Fully_Approved'
                WHEN (SELECT COUNT(*) FROM payroll_records WHERE batch_id = b.batch_id AND status IN ('Approved', 'Paid')) > 0 
                    THEN 'Partially_Approved'
                WHEN (SELECT COUNT(*) FROM payroll_records WHERE batch_id = b.batch_id AND status = 'Rejected') = b.total_employees 
                    THEN 'Rejected'
                ELSE 'Pending_Finance_Approval'
            END
        )
        WHERE batch_id = NEW.batch_id;
    END IF;
END//

-- Log finance actions in audit trail
CREATE TRIGGER log_finance_action_payroll
AFTER UPDATE ON payroll_records
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status AND NEW.status IN ('Approved', 'Rejected', 'Paid') THEN
        INSERT INTO finance_approval_audit (
            reference_type, reference_id, action, performed_by, reason, amount, 
            previous_status, new_status
        ) VALUES (
            'Individual', NEW.id, NEW.status, 
            COALESCE(NEW.approved_by, NEW.rejected_by, 'System'), 
            NEW.rejection_reason, NEW.net_salary, OLD.status, NEW.status
        );
    END IF;
END//

DELIMITER ;

-- Insert sample data for testing (can be removed in production)
-- This will be handled by the application initialization

-- Indexes for performance optimization
CREATE INDEX idx_payroll_employee_period ON payroll_records(employee_id, period);
CREATE INDEX idx_payroll_status_date ON payroll_records(status, processed_date);
CREATE INDEX idx_batch_period_status ON payroll_batches(period, status);
CREATE INDEX idx_rejection_date_resolved ON payment_rejections(rejected_date, resolved);

-- Views for reporting
CREATE VIEW payroll_summary AS
SELECT 
    pb.batch_id,
    pb.period,
    pb.total_employees,
    pb.total_gross_amount,
    pb.total_net_amount,
    pb.status as batch_status,
    pb.approved_count,
    pb.rejected_count,
    pb.paid_count,
    pb.created_date,
    pb.created_by
FROM payroll_batches pb
ORDER BY pb.created_date DESC;

CREATE VIEW rejected_payments AS
SELECT 
    pr.id as payroll_id,
    pr.batch_id,
    pr.employee_id,
    pr.employee_name,
    pr.period,
    pr.net_salary,
    pr.rejection_reason,
    pr.rejected_by,
    pr.rejected_date,
    CASE WHEN prej.resolved = 1 THEN 'Resolved' ELSE 'Pending' END as resolution_status
FROM payroll_records pr
LEFT JOIN payment_rejections prej ON pr.id = prej.payroll_record_id
WHERE pr.status = 'Rejected'
ORDER BY pr.rejected_date DESC;
