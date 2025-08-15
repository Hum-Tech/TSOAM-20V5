import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SystemStatus {
  admin_user_exists: boolean;
  admin_user_active: boolean;
  total_users: number;
  total_tables: number;
  database_connected: boolean;
}

const Setup: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/setup/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  const createAdminUser = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/setup/admin-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Admin user setup completed successfully!');
        await checkStatus(); // Refresh status
      } else {
        setMessage(`❌ Setup failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Setup failed: ${error.message}`);
    } finally {
    setLoading(false);
  };

  const fixMissingTables = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/setup/fix-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Missing tables fixed successfully! Created: ${data.tables_created.join(', ')}`);
        await checkStatus(); // Refresh status
      } else {
        setMessage(`❌ Fix failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Fix failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Setup</h1>
        <p className="text-muted-foreground">Configure your TSOAM Church Management System</p>
      </div>

      <div className="grid gap-6">
        {/* System Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system configuration status</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={checkStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {status ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span>Database Connected</span>
                  <Badge variant={status.database_connected ? "default" : "destructive"}>
                    {status.database_connected ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {status.database_connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Admin User Exists</span>
                  <Badge variant={status.admin_user_exists ? "default" : "destructive"}>
                    {status.admin_user_exists ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {status.admin_user_exists ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Admin User Active</span>
                  <Badge variant={status.admin_user_active ? "default" : "secondary"}>
                    {status.admin_user_active ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {status.admin_user_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Total Users</span>
                  <Badge variant="outline">{status.total_users}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Database Tables</span>
                  <Badge variant="outline">{status.total_tables}</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p>Loading system status...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin User Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle>Admin User Setup</CardTitle>
            <CardDescription>
              Create or fix the admin user account for system access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Default Admin Credentials</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Email:</strong> admin@tsoam.org</div>
                  <div><strong>Password:</strong> admin123</div>
                </div>
              </div>

              <Button
                onClick={createAdminUser}
                disabled={loading}
                className="w-full mb-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {status?.admin_user_exists ? 'Fix Admin User' : 'Create Admin User'}
              </Button>

              <Button
                onClick={fixMissingTables}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Fix Missing Tables
              </Button>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.includes('✅')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>After completing the setup</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Complete the admin user setup above</li>
              <li>Navigate to the login page: <a href="/login" className="text-blue-600 underline">http://localhost:3002/login</a></li>
              <li>Log in with the admin credentials</li>
              <li>Change the default password in user settings</li>
              <li>Create additional user accounts as needed</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
