const { query } = require("../config/database");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

async function initializeData() {
  console.log("🔄 Initializing database with sample data...");

  try {
    // Check if data already exists
    const existingUsers = await query("SELECT COUNT(*) as count FROM users");
    if (existingUsers.success && existingUsers.data[0].count > 0) {
      console.log("📋 Sample data already exists, skipping initialization");
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    const adminId = uuidv4();

    await query(`
      INSERT INTO users (id, name, email, password_hash, role, department, employee_id, is_active, can_create_accounts, can_delete_accounts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [adminId, "System Administrator", "admin@tsoam.org", adminPassword, "Admin", "Administration", "TSOAM-ADM-001", 1, 1, 1]);

    // Create HR Officer
    const hrPassword = await bcrypt.hash("hr123", 12);
    const hrId = uuidv4();

    await query(`
      INSERT INTO users (id, name, email, password_hash, role, department, employee_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [hrId, "HR Officer", "hr@tsoam.org", hrPassword, "HR Officer", "Human Resources", "TSOAM-HR-001", 1]);

    // Create sample members
    const member1Id = uuidv4();
    const member2Id = uuidv4();

    await query(`
      INSERT INTO members (id, member_id, tithe_number, full_name, email, phone, date_of_birth, gender, marital_status, address, occupation, emergency_contact_name, emergency_contact_phone, membership_date, department, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [member1Id, "TSOAM-MEM-001", "TN-001", "John Kamau", "john.kamau@example.com", "+254712345678", "1985-03-15", "Male", "Married", "123 Nairobi Street, Nairobi", "Teacher", "Mary Kamau", "+254723456789", "2020-01-15", "Adults Ministry", 1]);

    await query(`
      INSERT INTO members (id, member_id, tithe_number, full_name, email, phone, date_of_birth, gender, marital_status, address, occupation, emergency_contact_name, emergency_contact_phone, membership_date, department, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [member2Id, "TSOAM-MEM-002", "TN-002", "Grace Wanjiku", "grace.wanjiku@example.com", "+254798765432", "1990-08-22", "Female", "Single", "456 Mombasa Road, Nairobi", "Nurse", "Peter Wanjiku", "+254756789012", "2021-05-10", "Youth Ministry", 1]);

    // Create sample employees
    await query(`
      INSERT OR REPLACE INTO employees (employee_id, member_id, full_name, email, phone, address, date_of_birth, gender, marital_status, national_id, department, position, employment_type, employment_status, hire_date, basic_salary, housing_allowance, transport_allowance, medical_allowance, performance_rating, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["TSOAM-EMP-001", member1Id, "John Kamau", "john.kamau@tsoam.org", "+254712345678", "123 Nairobi Street, Nairobi", "1985-03-15", "Male", "Married", "12345678", "Administration", "Administrator", "Full-time", "Active", "2020-01-15", 80000, 20000, 10000, 5000, 4.5, 1]);

    await query(`
      INSERT OR REPLACE INTO employees (employee_id, member_id, full_name, email, phone, address, date_of_birth, gender, marital_status, national_id, department, position, employment_type, employment_status, hire_date, basic_salary, housing_allowance, transport_allowance, medical_allowance, performance_rating, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["TSOAM-EMP-002", member2Id, "Grace Wanjiku", "grace.wanjiku@tsoam.org", "+254798765432", "456 Mombasa Road, Nairobi", "1990-08-22", "Female", "Single", "98765432", "Human Resources", "HR Assistant", "Full-time", "Active", "2021-05-10", 65000, 15000, 8000, 4000, 4.2, 1]);

    await query(`
      INSERT OR REPLACE INTO employees (employee_id, full_name, email, phone, address, date_of_birth, gender, marital_status, national_id, department, position, employment_type, employment_status, hire_date, basic_salary, housing_allowance, transport_allowance, medical_allowance, performance_rating, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["TSOAM-VOL-001", "David Mwangi", "david.mwangi@tsoam.org", "+254745678901", "789 Kiambu Road, Kiambu", "1988-11-10", "Male", "Married", "11223344", "Youth Ministry", "Youth Coordinator", "Volunteer", "Active", "2022-01-01", 0, 0, 5000, 0, 4.0, 1]);

    // Create sample performance reviews
    await query(`
      INSERT OR REPLACE INTO performance_reviews (employee_id, review_period, review_type, overall_rating, job_knowledge_rating, quality_of_work_rating, productivity_rating, communication_rating, teamwork_rating, initiative_rating, reliability_rating, strengths, areas_for_improvement, goals, manager_comments, reviewer_name, review_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["TSOAM-EMP-001", "Q3 2024", "quarterly", 4.5, 4.0, 5.0, 4.5, 4.0, 4.5, 4.0, 5.0, "Excellent leadership skills and strong work ethic", "Could improve time management", "Complete advanced training program by Q1 2025", "John consistently exceeds expectations", "HR Manager", "2024-09-30", "completed"]);

    await query(`
      INSERT OR REPLACE INTO performance_reviews (employee_id, review_period, review_type, overall_rating, job_knowledge_rating, quality_of_work_rating, productivity_rating, communication_rating, teamwork_rating, initiative_rating, reliability_rating, strengths, areas_for_improvement, goals, manager_comments, reviewer_name, review_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["TSOAM-EMP-002", "Q3 2024", "quarterly", 4.2, 4.5, 4.0, 4.0, 4.5, 4.0, 3.5, 4.5, "Great attention to detail and communication skills", "Needs to take more initiative in projects", "Lead a major HR project by Q2 2025", "Grace shows great potential for growth", "HR Manager", "2024-09-30", "completed"]);

    // Create sample financial transactions
    await query(`
      INSERT OR REPLACE INTO transactions (transaction_id, type, category, amount, description, date, payment_method, member_id, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["TXN-001", "Income", "Tithe", 15000, "Monthly tithe contribution", "2024-12-01", "Mobile Money", member1Id, adminId, "approved"]);

    await query(`
      INSERT OR REPLACE INTO transactions (transaction_id, type, category, amount, description, date, payment_method, member_id, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["TXN-002", "Income", "Sunday Offering", 8500, "Sunday service offering", "2024-12-01", "Cash", member2Id, adminId, "approved"]);

    await query(`
      INSERT OR REPLACE INTO transactions (transaction_id, type, category, amount, description, date, payment_method, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["TXN-003", "Expense", "Utilities", 12000, "Monthly electricity bill", "2024-12-01", "Bank Transfer", null, adminId, "approved"]);

    // Create sample events
    await query(`
      INSERT OR REPLACE INTO events (title, description, event_type, start_date, end_date, location, organizer, max_attendees, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["Sunday Service", "Weekly Sunday worship service", "Service", "2024-12-08 09:00:00", "2024-12-08 11:00:00", "Main Sanctuary", "Pastor John", 200, "published", adminId]);

    await query(`
      INSERT OR REPLACE INTO events (title, description, event_type, start_date, end_date, location, organizer, max_attendees, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["Youth Fellowship", "Monthly youth fellowship meeting", "Fellowship", "2024-12-15 18:00:00", "2024-12-15 20:00:00", "Youth Hall", "David Mwangi", 50, "published", adminId]);

    // Create sample appointments
    await query(`
      INSERT OR REPLACE INTO appointments (title, description, appointment_date, duration, type, location, attendee_name, attendee_email, attendee_phone, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ["Counseling Session", "Marriage counseling appointment", "2024-12-10 14:00:00", 60, "Counseling", "Pastor's Office", "John and Mary Kamau", "john.kamau@example.com", "+254712345678", "scheduled", adminId]);

    console.log("✅ Database initialized with sample data successfully!");

    console.log("\n📋 Login Credentials:");
    console.log("Admin: admin@tsoam.org / admin123");
    console.log("HR Officer: hr@tsoam.org / hr123");

  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    throw error;
  }
}

module.exports = { initializeData };

// Run if called directly
if (require.main === module) {
  initializeData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
