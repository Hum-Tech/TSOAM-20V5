const sqlite = require("../config/sqlite-adapter");
const { v4: uuidv4 } = require("uuid");

class Employee {
  /**
   * Create a new employee
   * @param {Object} employeeData Employee data
   * @returns {Promise<Object>} Result object
   */
  static async create(employeeData) {
    try {
      const id = uuidv4();
      const employeeId = await generateNextFormattedId('TSOAM-EMP-', 'employees', 'employee_id');

      const sql = `
        INSERT INTO employees (
          id, employee_id, first_name, last_name, email, phone,
          date_of_birth, gender, marital_status, address, national_id,
          kra_pin, nhif_number, nssf_number, position, department,
          employment_type, employment_status, salary, hire_date,
          bank_name, bank_account_number, next_of_kin_name,
          next_of_kin_relationship, next_of_kin_phone, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        employeeId,
        employeeData.first_name,
        employeeData.last_name,
        employeeData.email,
        employeeData.phone,
        employeeData.date_of_birth,
        employeeData.gender,
        employeeData.marital_status,
        employeeData.address,
        employeeData.national_id,
        employeeData.kra_pin,
        employeeData.nhif_number,
        employeeData.nssf_number,
        employeeData.position,
        employeeData.department,
        employeeData.employment_type || 'Permanent',
        employeeData.employment_status || 'Active',
        employeeData.salary,
        employeeData.hire_date,
        employeeData.bank_name,
        employeeData.bank_account_number,
        employeeData.next_of_kin_name,
        employeeData.next_of_kin_relationship,
        employeeData.next_of_kin_phone,
        employeeData.is_active !== undefined ? employeeData.is_active : true
      ];

      await executeQuery(sql, params);

      return {
        success: true,
        data: { id, employee_id: employeeId, ...employeeData }
      };
    } catch (error) {
      console.error("Employee creation error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find all employees with optional filters
   * @param {Object} filters Filter options
   * @returns {Promise<Object>} Result object
   */
  static async findAll(filters = {}) {
    try {
      let sql = "SELECT * FROM employees WHERE 1=1";
      const params = [];

      if (filters.is_active !== undefined) {
        sql += " AND is_active = ?";
        params.push(filters.is_active);
      }

      if (filters.department) {
        sql += " AND department = ?";
        params.push(filters.department);
      }

      if (filters.employment_status) {
        sql += " AND employment_status = ?";
        params.push(filters.employment_status);
      }

      if (filters.search) {
        sql += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR employee_id LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      sql += " ORDER BY created_at DESC";

      if (filters.limit) {
        sql += " LIMIT ?";
        params.push(parseInt(filters.limit));
      }

      const result = await sqlite.query(sql, params);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Employee fetch error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find employee by ID
   * @param {string} id Employee ID
   * @returns {Promise<Object>} Result object
   */
  static async findById(id) {
    try {
      const sql = "SELECT * FROM employees WHERE id = ? OR employee_id = ?";
      const result = await sqlite.query(sql, [id, id]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (result.data.length === 0) {
        return { success: false, error: "Employee not found" };
      }

      return { success: true, data: result.data[0] };
    } catch (error) {
      console.error("Employee fetch error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update employee
   * @param {string} id Employee ID
   * @param {Object} updateData Update data
   * @returns {Promise<Object>} Result object
   */
  static async update(id, updateData) {
    try {
      const setClauses = [];
      const params = [];

      // Build dynamic update query
      for (const [key, value] of Object.entries(updateData)) {
        if (key !== 'id' && key !== 'employee_id' && key !== 'created_at') {
          setClauses.push(`${key} = ?`);
          params.push(value);
        }
      }

      if (setClauses.length === 0) {
        return { success: false, error: "No valid fields to update" };
      }

      params.push(id);

      const sql = `UPDATE employees SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR employee_id = ?`;
      params.push(id);

      const result = await executeQuery(sql, params);

      if (result.affectedRows === 0) {
        return { success: false, error: "Employee not found" };
      }

      // Fetch updated employee
      const updatedEmployee = await this.findById(id);
      return updatedEmployee;
    } catch (error) {
      console.error("Employee update error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete employee (soft delete)
   * @param {string} id Employee ID
   * @returns {Promise<Object>} Result object
   */
  static async delete(id) {
    try {
      const sql = "UPDATE employees SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR employee_id = ?";
      const result = await executeQuery(sql, [id, id]);

      if (result.affectedRows === 0) {
        return { success: false, error: "Employee not found" };
      }

      return { success: true, message: "Employee deactivated successfully" };
    } catch (error) {
      console.error("Employee delete error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get employee statistics
   * @returns {Promise<Object>} Result object
   */
  static async getStatistics() {
    try {
      const statsQueries = [
        "SELECT COUNT(*) as total FROM employees WHERE is_active = TRUE",
        "SELECT COUNT(*) as active FROM employees WHERE employment_status = 'Active' AND is_active = TRUE",
        "SELECT COUNT(*) as terminated FROM employees WHERE employment_status = 'Terminated' AND is_active = TRUE",
        "SELECT department, COUNT(*) as count FROM employees WHERE is_active = TRUE GROUP BY department",
        "SELECT employment_type, COUNT(*) as count FROM employees WHERE is_active = TRUE GROUP BY employment_type"
      ];

      const [totalResult, activeResult, terminatedResult, departmentResult, employmentTypeResult] = await Promise.all(
        statsQueries.map(query => executeQuery(query))
      );

      const stats = {
        total: totalResult[0].total,
        active: activeResult[0].active,
        terminated: terminatedResult[0].terminated,
        inactive: totalResult[0].total - activeResult[0].active,
        byDepartment: departmentResult,
        byEmploymentType: employmentTypeResult
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("Employee statistics error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create payroll record
   * @param {Object} payrollData Payroll data
   * @returns {Promise<Object>} Result object
   */
  static async createPayrollRecord(payrollData) {
    try {
      const id = uuidv4();
      const payrollId = await generateNextFormattedId('PAY-', 'payroll_records', 'payroll_id');

      const sql = `
        INSERT INTO payroll_records (
          id, payroll_id, employee_id, pay_period_start, pay_period_end,
          basic_salary, allowances, deductions, gross_pay, net_pay,
          tax, nhif, nssf, other_deductions, overtime_hours, overtime_rate,
          overtime_pay, status, processed_by, processed_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        payrollId,
        payrollData.employee_id,
        payrollData.pay_period_start,
        payrollData.pay_period_end,
        payrollData.basic_salary,
        payrollData.allowances || 0,
        payrollData.deductions || 0,
        payrollData.gross_pay,
        payrollData.net_pay,
        payrollData.tax || 0,
        payrollData.nhif || 0,
        payrollData.nssf || 0,
        payrollData.other_deductions || 0,
        payrollData.overtime_hours || 0,
        payrollData.overtime_rate || 0,
        payrollData.overtime_pay || 0,
        payrollData.status || 'Pending',
        payrollData.processed_by,
        payrollData.processed_date
      ];

      await executeQuery(sql, params);

      return {
        success: true,
        data: { id, payroll_id: payrollId, ...payrollData }
      };
    } catch (error) {
      console.error("Payroll creation error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get payroll records for an employee
   * @param {string} employeeId Employee ID
   * @param {Object} filters Filter options
   * @returns {Promise<Object>} Result object
   */
  static async getPayrollRecords(employeeId, filters = {}) {
    try {
      let sql = `
        SELECT pr.*, e.first_name, e.last_name, e.employee_id
        FROM payroll_records pr
        JOIN employees e ON pr.employee_id = e.employee_id
        WHERE pr.employee_id = ?
      `;
      const params = [employeeId];

      if (filters.year) {
        sql += " AND YEAR(pr.pay_period_start) = ?";
        params.push(filters.year);
      }

      if (filters.month) {
        sql += " AND MONTH(pr.pay_period_start) = ?";
        params.push(filters.month);
      }

      sql += " ORDER BY pr.pay_period_start DESC";

      const records = await executeQuery(sql, params);

      return { success: true, data: records };
    } catch (error) {
      console.error("Payroll records fetch error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search employees
   * @param {string} searchTerm Search term
   * @returns {Promise<Object>} Result object
   */
  static async search(searchTerm) {
    try {
      const sql = `
        SELECT * FROM employees
        WHERE is_active = TRUE
        AND (
          first_name LIKE ? OR
          last_name LIKE ? OR
          email LIKE ? OR
          employee_id LIKE ? OR
          phone LIKE ? OR
          position LIKE ? OR
          department LIKE ?
        )
        ORDER BY first_name, last_name
      `;

      const searchPattern = `%${searchTerm}%`;
      const params = Array(7).fill(searchPattern);

      const employees = await executeQuery(sql, params);

      return { success: true, data: employees };
    } catch (error) {
      console.error("Employee search error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = Employee;
