import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { moduleService, ModuleSubscription } from '@/services/ModuleService';
import {
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  Loader2,
  Trash2,
  RefreshCw,
  CreditCard,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface SubscriptionDashboardProps {
  token: string;
  onDeactivate?: () => void;
}

export function SubscriptionDashboard({ token, onDeactivate }: SubscriptionDashboardProps) {
  const [subscriptions, setSubscriptions] = useState<ModuleSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
    // Refresh every 60 seconds
    const interval = setInterval(loadSubscriptions, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const modules = await moduleService.getPurchasedModules(token);
      setSubscriptions(modules);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (moduleId: number, moduleName: string) => {
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
        loadSubscriptions();
        onDeactivate?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to deactivate',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deactivating:', error);
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
    const days = Math.ceil(
      (new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : null;
  };

  const isNearExpiration = (expirationDate: string | null) => {
    const days = daysUntilExpiration(expirationDate);
    return days !== null && days <= 7;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalMonthlySpend = subscriptions.reduce((sum, sub) => sum + sub.price_kes, 0);
  const activeCount = subscriptions.filter((s) => !isExpired(s.expirationDate)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">No Active Subscriptions</h3>
          <p className="text-muted-foreground text-sm">
            You don't have any active module subscriptions yet. Visit the Module Store to purchase modules.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{activeCount}</div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {subscriptions.reduce((sum, s) => sum + (s.activeUsersCount || 0), 0)}
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-50" />
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
                KES {totalMonthlySpend.toLocaleString()}
              </div>
              <CreditCard className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Subscriptions</h3>

        {subscriptions.map((subscription) => {
          const expired = isExpired(subscription.expirationDate);
          const nearExpiration = isNearExpiration(subscription.expirationDate);
          const daysLeft = daysUntilExpiration(subscription.expirationDate);
          const isDeactivatingModule = deactivating[subscription.id] || false;

          return (
            <Card
              key={subscription.id}
              className={`transition-all ${
                expired ? 'border-red-200 bg-red-50' : nearExpiration ? 'border-yellow-200 bg-yellow-50' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">{subscription.module_name}</CardTitle>
                      {!expired && (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 border-green-300"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {expired && (
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-800 border-red-300"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                      {!expired && nearExpiration && (
                        <Badge
                          variant="outline"
                          className="bg-yellow-100 text-yellow-800 border-yellow-300"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Expires Soon
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{subscription.description}</CardDescription>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold">KES {subscription.price_kes.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Per month</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* License Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">License Type</p>
                    <p className="font-semibold text-sm capitalize">
                      {subscription.licenseType}
                    </p>
                  </div>

                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Active Users</p>
                    <p className="font-semibold text-sm">
                      {subscription.activeUsersCount}/{subscription.maxUsers === -1 ? '∞' : subscription.maxUsers}
                    </p>
                  </div>

                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Purchased</p>
                    <p className="font-semibold text-sm">{formatDate(subscription.purchaseDate)}</p>
                  </div>

                  <div
                    className={`p-3 rounded-lg ${
                      expired
                        ? 'bg-red-100'
                        : nearExpiration
                          ? 'bg-yellow-100'
                          : 'bg-green-100'
                    }`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Expires</p>
                    <p className="font-semibold text-sm">{formatDate(subscription.expirationDate)}</p>
                    {daysLeft && !expired && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {daysLeft} days left
                      </p>
                    )}
                  </div>
                </div>

                {/* User Utilization Progress */}
                {subscription.maxUsers > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">User Utilization</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(
                          (subscription.activeUsersCount / subscription.maxUsers) * 100
                        )}%
                      </p>
                    </div>
                    <Progress
                      value={(subscription.activeUsersCount / subscription.maxUsers) * 100}
                      className="h-2"
                    />
                  </div>
                )}

                {/* Expiration Warning */}
                {isNearExpiration && !expired && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-900">
                      <strong>Expiring Soon:</strong> This subscription will expire in {daysLeft} days.
                      Renew now to avoid service interruption.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renew
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      handleDeactivate(subscription.id, subscription.module_name)
                    }
                    disabled={isDeactivatingModule}
                    className="flex-1"
                  >
                    {isDeactivatingModule ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Deactivate
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
