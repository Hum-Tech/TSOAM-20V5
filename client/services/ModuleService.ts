export interface Module {
  id: number;
  module_code: string;
  module_name: string;
  description: string;
  version: string;
  price_usd: number;
  price_kes: number;
  billing_cycle: string;
  features: ModuleFeature[];
  featureCount?: number;
  is_active: boolean;
}

export interface ModuleFeature {
  id: number;
  module_id: number;
  feature_code: string;
  feature_name: string;
  description: string;
  is_required: boolean;
}

export interface ModuleSubscription extends Module {
  subscriptionId: number;
  purchaseDate: string;
  activationDate: string;
  expirationDate: string;
  licenseType: string;
  maxUsers: number;
  activeUsersCount: number;
}

export interface ModuleStatus {
  id: number;
  code: string;
  name: string;
  isPurchased: boolean;
  price_usd: number;
  price_kes: number;
}

class ModuleService {
  private baseUrl = '/api/modules';

  async getAllModules(token: string): Promise<Module[]> {
    try {
      const response = await fetch(this.baseUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      const data = await response.json();
      return data.modules || [];
    } catch (error) {
      console.error('Error fetching modules:', error);
      return [];
    }
  }

  async getPurchasedModules(token: string): Promise<ModuleSubscription[]> {
    try {
      const response = await fetch(`${this.baseUrl}/purchased`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch purchased modules: ${response.statusText}`);
      }

      const data = await response.json();
      return data.modules || [];
    } catch (error) {
      console.error('Error fetching purchased modules:', error);
      return [];
    }
  }

  async checkModuleAccess(token: string, moduleId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${moduleId}/access`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.hasAccess || false;
    } catch (error) {
      console.error('Error checking module access:', error);
      return false;
    }
  }

  async getModuleStatus(token: string, moduleId: number): Promise<ModuleStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/status/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch module status: ${response.statusText}`);
      }

      const data = await response.json();
      const statuses = data.moduleStatuses || [];
      return statuses.find((s: ModuleStatus) => s.id === moduleId) || null;
    } catch (error) {
      console.error('Error fetching module status:', error);
      return null;
    }
  }

  async getAllModuleStatuses(token: string): Promise<ModuleStatus[]> {
    try {
      const response = await fetch(`${this.baseUrl}/status/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch module statuses: ${response.statusText}`);
      }

      const data = await response.json();
      return data.moduleStatuses || [];
    } catch (error) {
      console.error('Error fetching module statuses:', error);
      return [];
    }
  }

  async purchaseModule(
    token: string,
    moduleId: number,
    licenseType: string = 'subscription',
    maxUsers: number = -1,
    paymentReference?: string
  ): Promise<{ success: boolean; subscription?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          licenseType,
          maxUsers,
          paymentReference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to purchase module',
        };
      }

      return {
        success: true,
        subscription: data.subscription,
      };
    } catch (error) {
      console.error('Error purchasing module:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async activateModule(token: string, moduleId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${moduleId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to activate module',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error activating module:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deactivateModule(token: string, moduleId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${moduleId}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to deactivate module',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deactivating module:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getModuleDetails(token: string, moduleId: number): Promise<Module | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${moduleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch module details: ${response.statusText}`);
      }

      const data = await response.json();
      return data.module || null;
    } catch (error) {
      console.error('Error fetching module details:', error);
      return null;
    }
  }
}

export const moduleService = new ModuleService();
