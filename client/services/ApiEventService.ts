/**
 * TSOAM Church Management System - API Event Service
 *
 * Service for event management using REST API
 * Replaces localStorage-based operations with database operations
 *
 * @author TSOAM Development Team
 * @version 3.0.0
 */

export interface Event {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  max_attendees?: number;
  registration_required: boolean;
  registration_deadline?: string;
  organizer: string;
  contact_email?: string;
  contact_phone?: string;
  budget: number;
  actual_cost: number;
  status: "Planned" | "In Progress" | "Completed" | "Cancelled";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone?: string;
  special_requirements?: string;
  registration_date: string;
  status: "Confirmed" | "Cancelled" | "Waitlist";
}

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3002' : '');

export class ApiEventService {
  /**
   * Get authentication token from localStorage
   */
  private static getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Get API headers with authorization
   */
  private static getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  /**
   * Get all events
   */
  static async getAllEvents(filters?: {
    category?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    limit?: number;
  }): Promise<Event[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/api/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`Authentication required - HTTP error! status: ${response.status}`);
        } else if (response.status === 403) {
          throw new Error(`Access forbidden - HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      // Don't log authentication errors as errors - they're expected in production
      if (error instanceof Error && error.message.includes('401')) {
        console.log('API authentication required for events, will use demo data');
      } else {
        console.error('Error loading events:', error);
      }
      throw error; // Re-throw so the calling component can handle it
    }
  }

  /**
   * Get event by ID
   */
  static async getEventById(id: string): Promise<Event | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error loading event:', error);
      return null;
    }
  }

  /**
   * Create new event
   */
  static async createEvent(eventData: Omit<Event, 'id' | 'event_id' | 'created_at' | 'updated_at'>): Promise<Event | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`Authentication required - HTTP error! status: ${response.status}`);
        } else if (response.status === 403) {
          throw new Error(`Access forbidden - HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      // Don't log authentication errors as errors - they're expected in production
      if (error instanceof Error && error.message.includes('401')) {
        console.log('API authentication required, will fallback to local creation');
      } else {
        console.error('Error creating event:', error);
      }
      throw error; // Re-throw so the calling component can handle it
    }
  }

  /**
   * Update event
   */
  static async updateEvent(id: string, updateData: Partial<Event>): Promise<Event | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error updating event:', error);
      return null;
    }
  }

  /**
   * Delete event
   */
  static async deleteEvent(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  /**
   * Get upcoming events
   */
  static async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/upcoming/list?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error loading upcoming events:', error);
      return [];
    }
  }

  /**
   * Register for event
   */
  static async registerForEvent(eventId: string, registrationData: Omit<EventRegistration, 'id' | 'event_id' | 'registration_date' | 'status'>): Promise<EventRegistration | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error registering for event:', error);
      return null;
    }
  }

  /**
   * Get event registrations
   */
  static async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/registrations`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error loading event registrations:', error);
      return [];
    }
  }

  /**
   * Search events
   */
  static async searchEvents(searchTerm: string): Promise<Event[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/search/${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error searching events:', error);
      return [];
    }
  }

  /**
   * Get event statistics
   */
  static async getEventStatistics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/stats/summary`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`Authentication required - HTTP error! status: ${response.status}`);
        } else if (response.status === 403) {
          throw new Error(`Access forbidden - HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      // Don't log authentication errors as errors - they're expected in production
      if (error instanceof Error && error.message.includes('401')) {
        console.log('API authentication required for event statistics, will use demo data');
      } else {
        console.error('Error loading event statistics:', error);
      }
      throw error; // Re-throw so the calling component can handle it
    }
  }
}

export default ApiEventService;
