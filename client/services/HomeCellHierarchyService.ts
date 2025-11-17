import { homeCellService, District, Zone, HomeCell } from './HomeCellService';

export type { District, Zone, HomeCell };

class HomeCellHierarchyService {
  private districts: District[] = [];
  private zones: Zone[] = [];
  private homecells: HomeCell[] = [];
  private initialized = false;

  /**
   * Initialize the service by fetching hierarchy data from the API
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Fetch full hierarchy
      const hierarchy = await homeCellService.getFullHierarchy();
      
      // Extract districts, zones, and homecells from hierarchy
      this.districts = hierarchy || [];
      
      // Fetch all zones
      const allZones: Zone[] = [];
      const allHomecells: HomeCell[] = [];
      
      for (const district of this.districts) {
        const zones = await homeCellService.getZonesByDistrict(district.id);
        allZones.push(...zones);
        
        for (const zone of zones) {
          const homecells = await homeCellService.getHomeCellsByZone(zone.id);
          allHomecells.push(...homecells);
        }
      }
      
      this.zones = allZones;
      this.homecells = allHomecells;
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing HomeCellHierarchyService:', error);
      // Fallback to empty arrays
      this.districts = [];
      this.zones = [];
      this.homecells = [];
    }
  }

  /**
   * Get all districts
   */
  getDistricts(): District[] {
    return this.districts;
  }

  /**
   * Get all zones
   */
  getZones(): Zone[] {
    return this.zones;
  }

  /**
   * Get all homecells
   */
  getHomecells(): HomeCell[] {
    return this.homecells;
  }

  /**
   * Get zones for a specific district
   */
  getZonesByDistrict(districtId: number): Zone[] {
    return this.zones.filter(z => z.district_id === districtId);
  }

  /**
   * Get homecells for a specific zone
   */
  getHomecellsByZone(zoneId: number): HomeCell[] {
    return this.homecells.filter(h => h.zone_id === zoneId);
  }

  /**
   * Get active homecell options for select dropdowns
   */
  getActiveHomecellOptions(): Array<{ value: string; label: string }> {
    return this.homecells
      .filter(hc => hc.is_active)
      .map(hc => ({
        value: hc.homecell_id,
        label: hc.name
      }));
  }

  /**
   * Get a specific district
   */
  getDistrict(id: number): District | undefined {
    return this.districts.find(d => d.id === id);
  }

  /**
   * Get a specific zone
   */
  getZone(id: number): Zone | undefined {
    return this.zones.find(z => z.id === id);
  }

  /**
   * Get a specific homecell
   */
  getHomeCell(id: number): HomeCell | undefined {
    return this.homecells.find(h => h.id === id);
  }

  /**
   * Refresh the hierarchy data from the API
   */
  async refresh(): Promise<void> {
    this.initialized = false;
    await this.initialize();
  }
}

export const homeCellHierarchyService = new HomeCellHierarchyService();

// Auto-initialize on module load
homeCellHierarchyService.initialize().catch(error => {
  console.warn('Failed to auto-initialize HomeCellHierarchyService:', error);
});
