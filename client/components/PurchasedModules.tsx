import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { moduleService, ModuleSubscription } from '@/services/ModuleService';
import { CheckCircle, AlertTriangle, Calendar, Users, Loader2 } from 'lucide-react';

interface PurchasedModulesProps {
  token: string;
}

export function PurchasedModules({ token }: PurchasedModulesProps) {
  const [purchasedModules, setPurchasedModules] = useState<ModuleSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadPurchasedModules();
  }, []);

  const loadPurchasedModules = async () => {
    setLoading(true);
    try {
      const modules = await moduleService.getPurchasedModules(token);
      setPurchasedModules(modules);
    } catch (error) {
      console.error('Error loading purchased modules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchased modules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateModule = async (moduleId: number, moduleName: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${moduleName}?`)) {
      return;
    }

    setDeactivating({ ...deactivating, [moduleId]: true });

    try {
      const result = await moduleService.deactivateModule(token, moduleId);

      if (result.success) {
        toast({
          title: 'Success',
          description: `${moduleName} has been deactivated`,
        });
        loadPurchasedModules();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to deactivate module',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Deactivation error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setDeactivating({ ...deactivating, [moduleId]: false });
    }
  };

  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  const daysUntilExpiration = (expirationDate: string | null) => {
    if (!expirationDate) return null;
    const days = Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading modules...</p>
        </div>
      </div>
    );
  }

  if (purchasedModules.length === 0) {
    return (
      <div className="text-center py-12 px-4 border rounded-lg bg-muted/30">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-600" />
        <h3 className="text-lg font-semibold mb-2">No Modules Purchased</h3>
        <p className="text-muted-foreground mb-4">
          Get started by purchasing your first module from the Module Store.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {purchasedModules.map((module) => {
        const expired = isExpired(module.expirationDate);
        const daysLeft = daysUntilExpiration(module.expirationDate);
        const isDeactivating = deactivating[module.id] || false;

        return (
          <Card key={module.id} className={expired ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{module.module_name}</CardTitle>
                    {!expired && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    {expired && (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* License Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">License Type</p>
                  <p className="font-medium capitalize">{module.licenseType}</p>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs">Purchase Date</p>
                  <p className="font-medium">
                    {module.purchaseDate ? new Date(module.purchaseDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                {module.maxUsers !== -1 && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs">Max Users</p>
                      <p className="font-medium">{module.maxUsers}</p>
                    </div>
                  </div>
                )}

                {module.expirationDate && !expired && daysLeft && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs">Expires In</p>
                      <p className="font-medium">{daysLeft} days</p>
                    </div>
                  </div>
                )}

                {expired && module.expirationDate && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs">Expired On</p>
                      <p className="font-medium text-red-600">
                        {new Date(module.expirationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly Price */}
              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="text-xl font-bold">KES {module.price_kes.toLocaleString()}</p>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 flex gap-2">
                <Button
                  onClick={() => handleDeactivateModule(module.id, module.module_name)}
                  disabled={isDeactivating}
                  variant="outline"
                  size="sm"
                >
                  {isDeactivating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isDeactivating ? 'Deactivating...' : 'Deactivate Module'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
