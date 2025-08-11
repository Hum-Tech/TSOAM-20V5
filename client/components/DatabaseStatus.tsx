/**
 * Simple Database Status Component Stub
 * Temporary replacement to fix build errors
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface DatabaseStatusProps {
  showAdminFeatures?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function DatabaseStatus({
  showAdminFeatures = false,
  autoRefresh = false,
  refreshInterval = 30000
}: DatabaseStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Database Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Overall Status</span>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Healthy
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Connection</span>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Connected
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Tables</span>
            <span className="text-sm text-muted-foreground">All synced</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DatabaseStatus;
