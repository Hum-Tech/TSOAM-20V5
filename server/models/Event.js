const { executeQuery, executeTransaction, generateNextFormattedId } = require("../database/connection");
const { v4: uuidv4 } = require("uuid");

class Event {
  /**
   * Create a new event
   * @param {Object} eventData Event data
   * @returns {Promise<Object>} Result object
   */
  static async create(eventData) {
    try {
      const id = uuidv4();
      const eventId = await generateNextFormattedId('EVT-', 'events', 'event_id');
      
      const sql = `
        INSERT INTO events (
          id, event_id, title, description, category, location,
          start_date, end_date, start_time, end_time, is_recurring,
          recurrence_pattern, max_attendees, registration_required,
          registration_deadline, organizer, contact_email, contact_phone,
          budget, actual_cost, status, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        eventId,
        eventData.title,
        eventData.description,
        eventData.category,
        eventData.location,
        eventData.start_date,
        eventData.end_date,
        eventData.start_time,
        eventData.end_time,
        eventData.is_recurring || false,
        eventData.recurrence_pattern,
        eventData.max_attendees,
        eventData.registration_required || false,
        eventData.registration_deadline,
        eventData.organizer,
        eventData.contact_email,
        eventData.contact_phone,
        eventData.budget || 0,
        eventData.actual_cost || 0,
        eventData.status || 'Planned',
        eventData.is_active !== undefined ? eventData.is_active : true
      ];

      await executeQuery(sql, params);
      
      return { 
        success: true, 
        data: { id, event_id: eventId, ...eventData } 
      };
    } catch (error) {
      console.error("Event creation error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find all events with optional filters
   * @param {Object} filters Filter options
   * @returns {Promise<Object>} Result object
   */
  static async findAll(filters = {}) {
    try {
      let sql = "SELECT * FROM events WHERE is_active = TRUE";
      const params = [];

      if (filters.category) {
        sql += " AND category = ?";
        params.push(filters.category);
      }

      if (filters.status) {
        sql += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.start_date && filters.end_date) {
        sql += " AND start_date BETWEEN ? AND ?";
        params.push(filters.start_date, filters.end_date);
      } else if (filters.start_date) {
        sql += " AND start_date >= ?";
        params.push(filters.start_date);
      } else if (filters.end_date) {
        sql += " AND start_date <= ?";
        params.push(filters.end_date);
      }

      if (filters.search) {
        sql += " AND (title LIKE ? OR description LIKE ? OR location LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      sql += " ORDER BY start_date ASC, start_time ASC";

      if (filters.limit) {
        sql += " LIMIT ?";
        params.push(parseInt(filters.limit));
      }

      const events = await executeQuery(sql, params);
      
      return { success: true, data: events };
    } catch (error) {
      console.error("Event fetch error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find event by ID
   * @param {string} id Event ID
   * @returns {Promise<Object>} Result object
   */
  static async findById(id) {
    try {
      const sql = "SELECT * FROM events WHERE id = ? OR event_id = ?";
      const events = await executeQuery(sql, [id, id]);
      
      if (events.length === 0) {
        return { success: false, error: "Event not found" };
      }

      return { success: true, data: events[0] };
    } catch (error) {
      console.error("Event fetch error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update event
   * @param {string} id Event ID
   * @param {Object} updateData Update data
   * @returns {Promise<Object>} Result object
   */
  static async update(id, updateData) {
    try {
      const setClauses = [];
      const params = [];

      // Build dynamic update query
      for (const [key, value] of Object.entries(updateData)) {
        if (key !== 'id' && key !== 'event_id' && key !== 'created_at') {
          setClauses.push(`${key} = ?`);
          params.push(value);
        }
      }

      if (setClauses.length === 0) {
        return { success: false, error: "No valid fields to update" };
      }

      params.push(id);

      const sql = `UPDATE events SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR event_id = ?`;
      params.push(id);

      const result = await executeQuery(sql, params);
      
      if (result.affectedRows === 0) {
        return { success: false, error: "Event not found" };
      }

      // Fetch updated event
      const updatedEvent = await this.findById(id);
      return updatedEvent;
    } catch (error) {
      console.error("Event update error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete event (soft delete)
   * @param {string} id Event ID
   * @returns {Promise<Object>} Result object
   */
  static async delete(id) {
    try {
      const sql = "UPDATE events SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR event_id = ?";
      const result = await executeQuery(sql, [id, id]);
      
      if (result.affectedRows === 0) {
        return { success: false, error: "Event not found" };
      }

      return { success: true, message: "Event deleted successfully" };
    } catch (error) {
      console.error("Event delete error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register attendee for event
   * @param {string} eventId Event ID
   * @param {Object} attendeeData Attendee data
   * @returns {Promise<Object>} Result object
   */
  static async registerAttendee(eventId, attendeeData) {
    try {
      const registrationId = uuidv4();
      
      // Check if event exists and has space
      const eventResult = await this.findById(eventId);
      if (!eventResult.success) {
        return { success: false, error: "Event not found" };
      }

      const event = eventResult.data;
      
      // Check if registration is required
      if (!event.registration_required) {
        return { success: false, error: "Registration not required for this event" };
      }

      // Check if registration deadline has passed
      if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
        return { success: false, error: "Registration deadline has passed" };
      }

      // Check current attendee count
      const countSql = "SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ? AND status = 'Confirmed'";
      const countResult = await executeQuery(countSql, [eventId]);
      
      if (event.max_attendees && countResult[0].count >= event.max_attendees) {
        return { success: false, error: "Event is full" };
      }

      // Check if already registered
      const existingSql = "SELECT id FROM event_registrations WHERE event_id = ? AND email = ?";
      const existing = await executeQuery(existingSql, [eventId, attendeeData.email]);
      
      if (existing.length > 0) {
        return { success: false, error: "Already registered for this event" };
      }

      // Register attendee
      const sql = `
        INSERT INTO event_registrations (
          id, event_id, name, email, phone, special_requirements,
          registration_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        registrationId,
        eventId,
        attendeeData.name,
        attendeeData.email,
        attendeeData.phone,
        attendeeData.special_requirements,
        new Date().toISOString().split('T')[0],
        'Confirmed'
      ];

      await executeQuery(sql, params);
      
      return { 
        success: true, 
        data: { id: registrationId, ...attendeeData, event_id: eventId } 
      };
    } catch (error) {
      console.error("Event registration error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get event registrations
   * @param {string} eventId Event ID
   * @returns {Promise<Object>} Result object
   */
  static async getRegistrations(eventId) {
    try {
      const sql = `
        SELECT er.*, e.title as event_title
        FROM event_registrations er
        JOIN events e ON er.event_id = e.event_id
        WHERE er.event_id = ?
        ORDER BY er.registration_date DESC
      `;
      
      const registrations = await executeQuery(sql, [eventId]);
      
      return { success: true, data: registrations };
    } catch (error) {
      console.error("Event registrations fetch error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get upcoming events
   * @param {number} limit Number of events to return
   * @returns {Promise<Object>} Result object
   */
  static async getUpcoming(limit = 10) {
    try {
      const sql = `
        SELECT * FROM events 
        WHERE is_active = TRUE 
        AND start_date >= CURDATE()
        ORDER BY start_date ASC, start_time ASC
        LIMIT ?
      `;
      
      const events = await executeQuery(sql, [limit]);
      
      return { success: true, data: events };
    } catch (error) {
      console.error("Upcoming events fetch error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get event statistics
   * @returns {Promise<Object>} Result object
   */
  static async getStatistics() {
    try {
      const statsQueries = [
        "SELECT COUNT(*) as total FROM events WHERE is_active = TRUE",
        "SELECT COUNT(*) as upcoming FROM events WHERE is_active = TRUE AND start_date >= CURDATE()",
        "SELECT COUNT(*) as past FROM events WHERE is_active = TRUE AND start_date < CURDATE()",
        "SELECT category, COUNT(*) as count FROM events WHERE is_active = TRUE GROUP BY category",
        "SELECT status, COUNT(*) as count FROM events WHERE is_active = TRUE GROUP BY status"
      ];

      const [totalResult, upcomingResult, pastResult, categoryResult, statusResult] = await Promise.all(
        statsQueries.map(query => executeQuery(query))
      );

      const stats = {
        total: totalResult[0].total,
        upcoming: upcomingResult[0].upcoming,
        past: pastResult[0].past,
        byCategory: categoryResult,
        byStatus: statusResult
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("Event statistics error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search events
   * @param {string} searchTerm Search term
   * @returns {Promise<Object>} Result object
   */
  static async search(searchTerm) {
    try {
      const sql = `
        SELECT * FROM events 
        WHERE is_active = TRUE 
        AND (
          title LIKE ? OR 
          description LIKE ? OR 
          location LIKE ? OR 
          organizer LIKE ?
        )
        ORDER BY start_date ASC
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const params = Array(4).fill(searchPattern);
      
      const events = await executeQuery(sql, params);
      
      return { success: true, data: events };
    } catch (error) {
      console.error("Event search error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = Event;
