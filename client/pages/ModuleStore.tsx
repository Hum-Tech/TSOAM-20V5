import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ModuleStore } from '@/components/ModuleStore';
import { PurchasedModules } from '@/components/PurchasedModules';
import { ShoppingCart, Package, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ModuleStorePage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('store');
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  if (!token) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Please log in to access the module store</p>
        </div>
      </Layout>
    );
  }

  const handlePurchaseSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    toast({
      title: 'Module Activated',
      description: 'The module is now ready to use',
    });
    // Switch to purchased modules tab
    setActiveTab('purchased');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Module Store</h1>
          <p className="text-muted-foreground">
            Purchase and manage modules to customize your church management system
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Available Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">8+</p>
              <p className="text-sm text-muted-foreground">Professional modules</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5" />
                Monthly Billing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Flexible</p>
              <p className="text-sm text-muted-foreground">Pay only for what you use</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-5 w-5" />
                24/7 Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Always</p>
              <p className="text-sm text-muted-foreground">Help when you need it</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Store and Purchased Modules */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Your Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="store">Module Store</TabsTrigger>
                <TabsTrigger value="purchased">Purchased Modules</TabsTrigger>
              </TabsList>

              <TabsContent value="store" className="space-y-4 mt-4">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    Browse and activate modules to extend your church management system with powerful features.
                  </p>
                </div>
                <ModuleStore token={token} onPurchaseSuccess={handlePurchaseSuccess} key={refreshKey} />
              </TabsContent>

              <TabsContent value="purchased" className="space-y-4 mt-4">
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900">
                    Manage your active modules and subscriptions.
                  </p>
                </div>
                <PurchasedModules token={token} key={refreshKey} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Browse Modules</h3>
                  <p className="text-sm text-muted-foreground">
                    Explore all available modules and their features in the Module Store tab.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Purchase Module</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Activate Module" to purchase and immediately activate the module for your church.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Use Immediately</h3>
                  <p className="text-sm text-muted-foreground">
                    Start using the module right away. You'll be billed monthly for active modules.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">Manage Anytime</h3>
                  <p className="text-sm text-muted-foreground">
                    View your purchased modules and deactivate them anytime from the Purchased Modules tab.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Info */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>
              All modules are billed on a monthly basis. Deactivate anytime without long-term contracts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Member Management</h3>
                <p className="text-2xl font-bold mb-1">KES 3,500</p>
                <p className="text-sm text-muted-foreground">Per month</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Finance & Accounting</h3>
                <p className="text-2xl font-bold mb-1">KES 5,800</p>
                <p className="text-sm text-muted-foreground">Per month</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">HR & Payroll</h3>
                <p className="text-2xl font-bold mb-1">KES 4,600</p>
                <p className="text-sm text-muted-foreground">Per month</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">HomeCells Management</h3>
                <p className="text-2xl font-bold mb-1">KES 2,900</p>
                <p className="text-sm text-muted-foreground">Per month</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Pricing shown in Kenya Shillings (KES). USD pricing available.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
