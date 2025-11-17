import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { moduleService, Module, ModuleStatus } from '@/services/ModuleService';
import { ShoppingCart, Check, Clock, AlertCircle } from 'lucide-react';

interface ModuleStoreProps {
  token: string;
  onPurchaseSuccess?: () => void;
}

export function ModuleStore({ token, onPurchaseSuccess }: ModuleStoreProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const [allModules, statuses] = await Promise.all([
        moduleService.getAllModules(token),
        moduleService.getAllModuleStatuses(token),
      ]);

      setModules(allModules);
      setModuleStatuses(statuses);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load modules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseModule = async (moduleId: number, moduleName: string) => {
    setPurchasing({ ...purchasing, [moduleId]: true });

    try {
      const result = await moduleService.purchaseModule(token, moduleId, 'subscription', -1);

      if (result.success) {
        toast({
          title: 'Success',
          description: `${moduleName} has been purchased and activated!`,
        });
        onPurchaseSuccess?.();
        loadModules();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to purchase module',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during purchase',
        variant: 'destructive',
      });
    } finally {
      setPurchasing({ ...purchasing, [moduleId]: false });
    }
  };

  const getModuleStatus = (moduleId: number) => {
    return moduleStatuses.find((s) => s.id === moduleId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => {
          const status = getModuleStatus(module.id);
          const isPurchased = status?.isPurchased || false;
          const isLoading = purchasing[module.id] || false;

          return (
            <Card key={module.id} className={isPurchased ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{module.module_name}</CardTitle>
                    <CardDescription className="mt-1">{module.description}</CardDescription>
                  </div>
                  {isPurchased && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features List */}
                {module.features && module.features.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Key Features:</h4>
                    <ul className="space-y-1">
                      {module.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start">
                          <span className="mr-2">•</span>
                          <span>{feature.feature_name}</span>
                        </li>
                      ))}
                      {module.features.length > 4 && (
                        <li className="text-sm text-muted-foreground italic">
                          +{module.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Pricing and Version */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Price</p>
                      <p className="text-xl font-bold">
                        KES {module.price_kes.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (${module.price_usd.toFixed(2)})
                      </p>
                    </div>
                    <Badge variant="outline">{module.version}</Badge>
                  </div>

                  {/* Purchase Button */}
                  <Button
                    onClick={() => handlePurchaseModule(module.id, module.module_name)}
                    disabled={isPurchased || isLoading}
                    className="w-full"
                    variant={isPurchased ? 'outline' : 'default'}
                  >
                    {isLoading && <Clock className="h-4 w-4 mr-2 animate-spin" />}
                    {isPurchased ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Already Active
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Activate Module
                      </>
                    )}
                  </Button>

                  {/* Billing Info */}
                  <p className="text-xs text-muted-foreground text-center">
                    {module.billing_cycle === 'monthly' && 'Billed monthly'}
                    {module.billing_cycle === 'annual' && 'Billed annually'}
                    {module.billing_cycle === 'one-time' && 'One-time purchase'}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {modules.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No modules available</p>
          </div>
        </div>
      )}
    </div>
  );
}
