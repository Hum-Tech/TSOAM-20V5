import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { moduleService, Module, ModuleStatus } from '@/services/ModuleService';
import {
  ShoppingCart,
  Check,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Star,
  TrendingUp,
  Users,
  Zap,
  Settings,
  MoreVertical,
  DownloadCloud,
  Eye,
  Loader2,
  Calendar,
} from 'lucide-react';

interface ModuleStoreEnhancedProps {
  token: string;
  onPurchaseSuccess?: () => void;
}

type SortOption = 'name' | 'price' | 'rating' | 'popularity';
type CategoryFilter = 'all' | 'finance' | 'membership' | 'events' | 'admin';

export function ModuleStoreEnhanced({ token, onPurchaseSuccess }: ModuleStoreEnhancedProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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

  const getCategoryIcon = (moduleName: string) => {
    if (moduleName.toLowerCase().includes('finance')) return <Zap className="h-5 w-5" />;
    if (moduleName.toLowerCase().includes('member')) return <Users className="h-5 w-5" />;
    if (moduleName.toLowerCase().includes('event')) return <Calendar className="h-5 w-5" />;
    return <Settings className="h-5 w-5" />;
  };

  // Filter modules
  const filteredModules = modules
    .filter((module) => {
      const matchesSearch = module.module_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' ||
        module.module_name.toLowerCase().includes(categoryFilter);

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price_kes - b.price_kes;
        case 'rating':
          return (b.featureCount || 0) - (a.featureCount || 0);
        case 'popularity':
          return (b.featureCount || 0) - (a.featureCount || 0);
        case 'name':
        default:
          return a.module_name.localeCompare(b.module_name);
      }
    });

  const totalModules = modules.length;
  const purchasedCount = moduleStatuses.filter((s) => s.isPurchased).length;

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

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{totalModules}</div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{purchasedCount}</div>
              <Check className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                KES {moduleStatuses
                  .filter((s) => s.isPurchased)
                  .reduce((sum, s) => sum + s.price_kes, 0)
                  .toLocaleString()}
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules by name or features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="membership">Membership</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="admin">Administration</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price">Price (Low-High)</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      {filteredModules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No modules found matching your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((module) => {
            const status = getModuleStatus(module.id);
            const isPurchased = status?.isPurchased || false;
            const isLoading = purchasing[module.id] || false;

            return (
              <Card
                key={module.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isPurchased ? 'border-green-200 bg-green-50' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(module.module_name)}
                      <div>
                        <CardTitle className="text-base">{module.module_name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          v{module.version}
                        </CardDescription>
                      </div>
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
                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {module.description}
                  </p>

                  {/* Features Count */}
                  {module.features && module.features.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-muted-foreground">
                        {module.features.length} Features
                      </span>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="border-t pt-3">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Price</p>
                        <p className="text-lg font-bold">
                          KES {module.price_kes.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {module.billing_cycle}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedModule(module);
                          setShowDetailsModal(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>

                      <Button
                        onClick={() =>
                          handlePurchaseModule(module.id, module.module_name)
                        }
                        disabled={isPurchased || isLoading}
                        size="sm"
                        className="flex-1"
                        variant={isPurchased ? 'outline' : 'default'}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isPurchased ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Module Details Modal */}
      {showDetailsModal && selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div>
                <CardTitle>{selectedModule.module_name}</CardTitle>
                <CardDescription className="mt-2">{selectedModule.description}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailsModal(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Features List */}
              {selectedModule.features && selectedModule.features.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Features:</h4>
                  <ul className="space-y-1">
                    {selectedModule.features.map((feature) => (
                      <li
                        key={feature.id}
                        className="text-sm text-muted-foreground flex items-start"
                      >
                        <Check className="h-4 w-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>
                          {feature.feature_name}
                          {feature.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {feature.description}
                            </p>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pricing Info */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-semibold mb-2">Pricing</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Monthly Cost</p>
                    <p className="font-bold">KES {selectedModule.price_kes.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Version</p>
                    <p className="font-bold">{selectedModule.version}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handlePurchaseModule(selectedModule.id, selectedModule.module_name);
                    setShowDetailsModal(false);
                  }}
                  className="flex-1"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Activate Module
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
