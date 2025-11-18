import { useState, useEffect } from 'react';
import { moduleService, ModuleStatus } from '@/services/ModuleService';
import { useAuth } from '@/contexts/AuthContext';

export function useModuleAccess() {
  const { token } = useAuth();
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const loadModuleStatuses = async () => {
      try {
        setLoading(true);
        setError(null);
        const statuses = await moduleService.getAllModuleStatuses(token);
        setModuleStatuses(statuses);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load module statuses';
        setError(message);
        console.error('Error loading module statuses:', err);
      } finally {
        setLoading(false);
      }
    };

    loadModuleStatuses();
  }, [token]);

  const hasModuleAccess = (moduleCode: string): boolean => {
    const status = moduleStatuses.find((s) => s.code === moduleCode);
    return status?.isPurchased || false;
  };

  const hasAccess = (moduleCodes: string | string[]): boolean => {
    const codes = Array.isArray(moduleCodes) ? moduleCodes : [moduleCodes];
    return codes.some((code) => hasModuleAccess(code));
  };

  const requireModule = (moduleCode: string): boolean => {
    if (!hasModuleAccess(moduleCode)) {
      console.warn(`Module ${moduleCode} is not purchased`);
      return false;
    }
    return true;
  };

  const getPurchasedModules = (): string[] => {
    return moduleStatuses
      .filter((s) => s.isPurchased)
      .map((s) => s.code);
  };

  const getUnpurchasedModules = (): ModuleStatus[] => {
    return moduleStatuses.filter((s) => !s.isPurchased);
  };

  return {
    moduleStatuses,
    loading,
    error,
    hasModuleAccess,
    hasAccess,
    requireModule,
    getPurchasedModules,
    getUnpurchasedModules,
  };
}
