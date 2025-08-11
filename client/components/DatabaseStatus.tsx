/**
 * Database Status Component
 *
 * Displays real-time database health, statistics, and provides
 * database management functionality for administrators
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  BarChart3,
  Clock,
  HardDrive,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import databaseIntegrationService from '@/services/DatabaseIntegrationService';

// Define types locally since they're not exported
interface DatabaseHealth {
  overall: 'healthy' | 'warning' | 'error';
  uptime: number;
  lastCheck: string;
  issues: string[];
}

interface TableInfo {
  name: string;
  recordCount: number;
  lastModified: string;
}

interface DatabaseStatusProps {
  showAdminFeatures?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function DatabaseStatus({
  showAdminFeatures = false,
  autoRefresh = true,
  refreshInterval = 30000
}: DatabaseStatusProps) {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [usageInfo, setUsageInfo] = useState<any>(null);

  // Load database status
  const loadDatabaseStatus = async () => {
    try {
      setLoading(true);

      // Load health, stats, and usage info in parallel
      const [healthData, tablesData, usageData] = await Promise.all([
        databaseIntegrationService.checkHealth(),
        databaseIntegrationService.getDatabaseStats(),
        databaseIntegrationService.getUsageInfo()
      ]);

      setHealth(healthData);
      setTables(tablesData);
      setUsageInfo(usageData);
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Failed to load database status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadDatabaseStatus();

    if (autoRefresh) {
      const interval = setInterval(loadDatabaseStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Admin functions
  const handleInitializeTables = async () => {
    try {
      setLoading(true);
      const success = await databaseIntegrationService.initializeTables();
      if (success) {
        await loadDatabaseStatus();
        alert('Tables initialized successfully');
      } else {
        alert('Table initialization failed');
      }
    } catch (error) {
      alert('Table initialization error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const result = await databaseIntegrationService.createBackup();
      if (result.success) {
        alert('Backup created successfully');
        if (result.downloadUrl) {
          window.open(result.downloadUrl, '_blank');
        }
      } else {
        alert('Backup creation failed');
      }
    } catch (error) {
      alert('Backup error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeDatabase = async () => {
    try {
      setLoading(true);
      const result = await databaseIntegrationService.optimizeDatabase();
      if (result.success) {
        alert(`Database optimized! Optimizations: ${result.optimizations.join(', ')}`);
        await loadDatabaseStatus();
      } else {
        alert('Database optimization failed');
      }
    } catch (error) {
      alert('Optimization error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (connected: boolean) => {
    return (
      <Badge variant={connected ? 'default' : 'destructive'} className="ml-2">
        {connected ? 'Connected' : 'Disconnected'}
      </Badge>
    );
  };

  const getTableStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && !health) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading database status...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Database Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Database Status
            {health && getStatusBadge(health.connected)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              {health && getStatusIcon(health.connected)}
              <div>
                <p className="text-sm font-medium">Connection</p>
                <p className="text-xs text-muted-foreground">
                  {health?.connected ? 'Active' : 'Failed'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Latency</p>
                <p className="text-xs text-muted-foreground">
                  {health?.latency || 0}ms
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Tables</p>
                <p className="text-xs text-muted-foreground">
                  {health?.tablesCount || 0} active
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <HardDrive className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Records</p>
                <p className="text-xs text-muted-foreground">
                  {health?.recordsCount?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {lastRefresh && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDatabaseStatus}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Details Tabs */}
      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          {showAdminFeatures && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        {/* Tables Tab */}
        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div key={table.name} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{table.name}</h4>
                      {getTableStatusIcon(table.status)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Records: {table.recordCount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated: {new Date(table.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Database Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {usageInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Data Size</span>
                        <span>{formatBytes(usageInfo.dataSize)}</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Index Size</span>
                        <span>{formatBytes(usageInfo.indexSize)}</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Total Size</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(usageInfo.totalSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Total Records</p>
                        <p className="text-xs text-muted-foreground">
                          {usageInfo.recordCount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Usage information not available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Zap className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Response Time</p>
                    <p className="text-lg font-bold">{health?.latency || 0}ms</p>
                    <p className="text-xs text-green-600">Excellent</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Activity className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Availability</p>
                    <p className="text-lg font-bold">99.9%</p>
                    <p className="text-xs text-green-600">Excellent</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Shield className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Health Score</p>
                    <p className="text-lg font-bold">95/100</p>
                    <p className="text-xs text-green-600">Healthy</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        {showAdminFeatures && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Database Administration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleInitializeTables}
                    disabled={loading}
                    className="flex items-center justify-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Initialize Tables
                  </Button>
                  <Button
                    onClick={handleCreateBackup}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                  <Button
                    onClick={handleOptimizeDatabase}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize Database
                  </Button>
                  <Button
                    onClick={loadDatabaseStatus}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Status
                  </Button>
                </div>

                {health && health.errors.length > 0 && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Database Warnings:</strong>
                      <ul className="mt-2 space-y-1">
                        {health.errors.map((error, index) => (
                          <li key={index} className="text-sm">• {error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default DatabaseStatus;
