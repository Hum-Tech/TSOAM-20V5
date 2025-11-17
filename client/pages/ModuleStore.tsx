import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ModuleStoreEnhanced } from '@/components/ModuleStoreEnhanced';
import { SubscriptionDashboard } from '@/components/SubscriptionDashboard';
import { BillingHistory } from '@/components/BillingHistory';
import { ShoppingCart, Package, CreditCard, HelpCircle, Lightbulb } from 'lucide-react';
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
    // Switch to subscriptions tab
    setActiveTab('subscriptions');
  };

  const handleDeactivate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Module Store</h1>
          <p className="text-muted-foreground">
            Manage your church management system modules and subscriptions
          </p>
        </div>

        {/* Quick Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6 flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-blue-900 mb-1">
                Pro Tip: Get More Value
              </p>
              <p className="text-sm text-blue-800">
                Bundle multiple modules together for better pricing. Visit our store to explore all available modules and features.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 hidden sm:inline" />
              <span>Module Store</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Package className="h-4 w-4 hidden sm:inline" />
              <span>Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 hidden sm:inline" />
              <span>Billing</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 hidden sm:inline" />
              <span>Help</span>
            </TabsTrigger>
          </TabsList>

          {/* Store Tab */}
          <TabsContent value="store" className="space-y-4">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                Browse and activate modules to extend your church management system with powerful features.
              </p>
            </div>
            <ModuleStoreEnhanced
              token={token}
              onPurchaseSuccess={handlePurchaseSuccess}
              key={refreshKey}
            />
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                Manage your active module subscriptions and monitor usage across your church.
              </p>
            </div>
            <SubscriptionDashboard
              token={token}
              onDeactivate={handleDeactivate}
              key={refreshKey}
            />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-900">
                View your billing history, invoices, and payment details.
              </p>
            </div>
            <BillingHistory token={token} />
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FAQ Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">
                      How do I purchase a module?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Go to the Module Store tab, find the module you want, and click the "Activate Module" button. You'll be billed monthly for the module.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">
                      Can I cancel a subscription anytime?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Yes! You can deactivate any module from your Subscriptions tab. Your subscription will end at the end of the current billing period.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">
                      What payment methods do you accept?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      We accept M-Pesa, bank transfers, and credit cards. Contact support for more payment options.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">
                      Is there a free trial available?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Yes! You can request a 14-day free trial for any module. Contact our sales team for details.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Support Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Support & Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">📚 Knowledge Base</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Access comprehensive guides and documentation for all modules.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">💬 Live Chat</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Chat with our support team 24/7 (9 AM - 6 PM EAT).
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">📧 Email Support</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Email us at support@churchmanagement.com for detailed inquiries.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">🎓 Training</h4>
                    <p className="text-sm text-muted-foreground">
                      Schedule a training session with our team to get the most out of your modules.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* How It Works Section */}
            <Card>
              <CardHeader>
                <CardTitle>How Module Store Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Browse Modules</h3>
                      <p className="text-sm text-muted-foreground">
                        Explore all available modules in the Module Store. View details, features, and pricing.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Purchase Module</h3>
                      <p className="text-sm text-muted-foreground">
                        Click "Activate Module" to purchase. You'll be guided through the payment process.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Instant Activation</h3>
                      <p className="text-sm text-muted-foreground">
                        Your module is activated immediately. Start using it right away!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Manage & Monitor</h3>
                      <p className="text-sm text-muted-foreground">
                        View subscriptions, usage analytics, and billing from your dashboard. Deactivate anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Transparency Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Billing</CardTitle>
                <CardDescription>
                  All prices in both KES and USD. No hidden fees.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">✓ What You Pay For</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Monthly module subscription fees</li>
                    <li>• Premium support (included)</li>
                    <li>• Regular updates and improvements</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-green-900 mb-2">
                    ✓ No Extra Fees
                  </p>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• No setup fees</li>
                    <li>• No transaction fees</li>
                    <li>• No long-term contracts</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
