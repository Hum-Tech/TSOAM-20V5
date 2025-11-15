// Types
export interface District {
  id: number;
  district_id: string;
  name: string;
  description?: string;
  leader_id?: string;
  leader?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Zone {
  id: number;
  zone_id: string;
  district_id: number;
  name: string;
  description?: string;
  leader_id?: string;
  leader?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomeCell {
  id: number;
  homecell_id: string;
  zone_id: number;
  district_id: number;
  name: string;
  description?: string;
  leader_id?: string;
  leader?: any;
  meeting_day?: string;
  meeting_time?: string;
  meeting_location?: string;
  member_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomeCellHierarchy {
  districts: Array<District & {
    zones: Array<Zone & {
      homecells: HomeCell[]
    }>
  }>;
}

export interface HomeCellMember {
  id: number;
  member_id: string;
  name: string;
  email: string;
  phone: string;
  membership_number?: string;
  status: string;
  homecell_id?: number;
}

// API Base URL
const API_BASE = '/api/homecells';

export class HomeCellService {
  // ==================== DISTRICTS ====================

  async getAllDistricts(): Promise<District[]> {
    try {
      const response = await fetch(`${API_BASE}/districts`);
      if (!response.ok) throw new Error('Failed to fetch districts');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching districts:', error);
      return [];
    }
  }

  async getDistrict(id: number): Promise<District & { zones: Zone[] } | null> {
    try {
      const response = await fetch(`${API_BASE}/districts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch district');
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching district:', error);
      return null;
    }
  }

  async createDistrict(district: Partial<District>): Promise<District | null> {
    try {
      const response = await fetch(`${API_BASE}/districts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(district)
      });
      if (!response.ok) throw new Error('Failed to create district');
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error creating district:', error);
      return null;
    }
  }

  async updateDistrict(id: number, updates: Partial<District>): Promise<District | null> {
    try {
      const response = await fetch(`${API_BASE}/districts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update district');
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error updating district:', error);
      return null;
    }
  }

  async deleteDistrict(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/districts/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete district');
      return true;
    } catch (error) {
      console.error('Error deleting district:', error);
      return false;
    }
  }

  // ==================== ZONES ====================

  async getZonesByDistrict(districtId: number): Promise<Zone[]> {
    try {
      const response = await fetch(`${API_BASE}/districts/${districtId}/zones`);
      if (!response.ok) throw new Error('Failed to fetch zones');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching zones:', error);
      return [];
    }
  }

  async getZone(id: number): Promise<Zone & { homecells: HomeCell[] } | null> {
    try {
      const response = await fetch(`${API_BASE}/zones/${id}`);
      if (!response.ok) throw new Error('Failed to fetch zone');
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching zone:', error);
      return null;
    }
  }

  async createZone(zone: Partial<Zone>): Promise<Zone | null> {
    try {
      const response = await fetch(`${API_BASE}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zone)
      });
      if (!response.ok) throw new Error('Failed to create zone');
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error creating zone:', error);
      return null;
    }
  }

  async updateZone(id: number, updates: Partial<Zone>): Promise<Zone | null> {
    try {
      const response = await fetch(`${API_BASE}/zones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update zone');
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error updating zone:', error);
      return null;
    }
  }

  async deleteZone(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/zones/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete zone');
      return true;
    } catch (error) {
      console.error('Error deleting zone:', error);
      return false;
    }
  }

  // ==================== HOMECELLS ====================

  async getAllHomeCells(filters?: {
    districtId?: number;
    zoneId?: number;
    leaderId?: string;
    search?: string;
  }): Promise<HomeCell[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.districtId) params.append('districtId', filters.districtId.toString());
      if (filters?.zoneId) params.append('zoneId', filters.zoneId.toString());
      if (filters?.leaderId) params.append('leaderId', filters.leaderId);
      if (filters?.search) params.append('search', filters.search);

      const response = await fetch(`${API_BASE}/homecells?${params}`);
      if (!response.ok) throw new Error('Failed to fetch homecells');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching homecells:', error);
      return [];
    }
  }

  async getHomeCellsByZone(zoneId: number): Promise<HomeCell[]> {
    try {
      const response = await fetch(`${API_BASE}/zones/${zoneId}/homecells`);
      if (!response.ok) throw new Error('Failed to fetch homecells');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching homecells:', error);
      return [];
    }
  }

  async getHomeCell(id: number): Promise<HomeCell & { members: HomeCellMember[] } | null> {
    try {
      const response = await fetch(`${API_BASE}/homecells/${id}`);
      if (!response.ok) throw new Error('Failed to fetch homecell');
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching homecell:', error);
      return null;
    }
  }

  async createHomeCell(homecell: Partial<HomeCell>): Promise<HomeCell | null> {
    try {
      const response = await fetch(`${API_BASE}/homecells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(homecell)
      });
      if (!response.ok) throw new Error('Failed to create homecell');
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error creating homecell:', error);
      return null;
    }
  }

  async updateHomeCell(id: number, updates: Partial<HomeCell>): Promise<HomeCell | null> {
    try {
      const response = await fetch(`${API_BASE}/homecells/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update homecell');
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error updating homecell:', error);
      return null;
    }
  }

  async deleteHomeCell(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/homecells/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete homecell');
      return true;
    } catch (error) {
      console.error('Error deleting homecell:', error);
      return false;
    }
  }

  // ==================== MEMBERS ====================

  async assignMemberToHomeCell(homecellId: number, memberId: number, notes?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/homecells/${homecellId}/members/${memberId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (!response.ok) throw new Error('Failed to assign member');
      return true;
    } catch (error) {
      console.error('Error assigning member:', error);
      return false;
    }
  }

  async getHomeCellMembers(homecellId: number): Promise<HomeCellMember[]> {
    try {
      const response = await fetch(`${API_BASE}/homecells/${homecellId}/members`);
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching members:', error);
      return [];
    }
  }

  async getHomeCellStats(homecellId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/homecells/${homecellId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {};
    }
  }

  // ==================== HIERARCHY ====================

  async getFullHierarchy(): Promise<District[]> {
    try {
      const response = await fetch(`${API_BASE}/hierarchy/full`);
      if (!response.ok) throw new Error('Failed to fetch hierarchy');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
      return [];
    }
  }

  // ==================== AUTO-ASSIGN ====================

  async autoAssignMembers(zoneId: number): Promise<{ assignedCount: number; message: string } | null> {
    try {
      const response = await fetch(`${API_BASE}/auto-assign-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId })
      });
      if (!response.ok) throw new Error('Failed to auto-assign members');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error auto-assigning members:', error);
      return null;
    }
  }
}

export const homeCellService = new HomeCellService();
