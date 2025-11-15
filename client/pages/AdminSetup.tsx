import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, Database, Copy, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface SetupStatus {
  [key: string]: { exists: boolean };
}

interface SetupResponse {
  success: boolean;
  message: string;
  tableStatus?: SetupStatus;
  districtCount?: number;
  projectId?: string;
  instructions?: string[];
  migrationSQLs?: {
    [key: string]: string;
  };
}

export default function AdminSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupResponse | null>(null);
  const [copiedSQL, setCopiedSQL] = useState<string | null>(null);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch("/api/database-setup/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data: SetupResponse = await response.json();
      setSetupStatus(data);

      if (data.success) {
        toast({
          title: "✅ All Set!",
          description: "Database is fully configured. Districts are ready to use.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Setup check error:", error);
    }
  };

  const copyToClipboard = (sql: string, fileName: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSQL(fileName);
    toast({
      title: "Copied!",
      description: `${fileName} SQL copied to clipboard`,
      variant: "default"
    });
    setTimeout(() => setCopiedSQL(null), 3000);
  };

  const handleSetupDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/database-setup/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data: SetupResponse = await response.json();
      setSetupStatus(data);

      if (data.success) {
        toast({
          title: "Success!",
          description: `Database setup complete! ${data.districtCount} districts seeded.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Tables Need to be Created",
          description: "Please follow the manual instructions below.",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set up database. Check console for details.",
        variant: "destructive"
      });
      console.error("Setup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSetupComplete = setupStatus?.success;
  const needsTableCreation = setupStatus && !isSetupComplete && setupStatus.migrationSQLs;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Database className="w-8 h-8" />
          Database Setup
        </h1>
        <p className="text-slate-600">Initialize the HomeCells database with tables and seed data</p>
      </div>

      {isSetupComplete && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Database setup completed successfully! Go to Settings → Home Cells to view the {setupStatus?.districtCount} districts.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Setup Status</h2>
          <Button
            size="lg"
            onClick={handleSetupDatabase}
            disabled={isLoading || isSetupComplete}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking database...
              </>
            ) : isSetupComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Setup Complete
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Check Database Status
              </>
            )}
          </Button>
        </div>

        {setupStatus?.tableStatus && (
          <div className="border-t pt-6">
            <h3 className="font-bold mb-4">Table Status</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(setupStatus.tableStatus).map(([table, status]: [string, any]) => (
                <div key={table} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  {status.exists ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold capitalize text-sm">{table.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-slate-500">
                      {status.exists ? '✓ Ready' : '✗ Not found'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {needsTableCreation && (
        <Card className="p-8 space-y-6 border-amber-200 bg-amber-50">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              Manual Table Creation Required
            </h2>
            <p className="text-slate-700 mb-6">
              The database tables need to be created manually through the Supabase SQL Editor. This is a one-time setup.
            </p>
          </div>

          <div className="space-y-4">
            <div className="font-semibold text-slate-900">Step 1: Copy the SQL</div>
            {Object.entries(setupStatus.migrationSQLs || {}).map(([fileName, sql]) => (
              <div key={fileName} className="space-y-2">
                <div className="font-medium text-sm text-slate-700">{fileName}</div>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto">
                  <pre>{sql}</pre>
                </div>
                <Button
                  onClick={() => copyToClipboard(sql, fileName)}
                  variant={copiedSQL === fileName ? 'default' : 'outline'}
                  className="gap-2 w-full"
                >
                  <Copy className="w-4 h-4" />
                  {copiedSQL === fileName ? 'Copied!' : `Copy ${fileName}`}
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-6">
            <div className="font-semibold text-slate-900 mb-4">Step 2: Paste in Supabase</div>
            <ol className="space-y-2 text-sm text-slate-700 list-decimal ml-5">
              <li>Click the button below to open Supabase</li>
              <li>Click "SQL Editor" in the left sidebar</li>
              <li>Click "New query"</li>
              <li>Paste the SQL from "{Object.keys(setupStatus.migrationSQLs || {})[0]}"</li>
              <li>Click "Run"</li>
              <li>Repeat for the second SQL file</li>
              <li>Come back here and click "Check Database Status"</li>
            </ol>

            <Button
              onClick={() => window.open(
                `https://app.supabase.com/project/${setupStatus.projectId}/sql`,
                '_blank'
              )}
              className="gap-2 mt-6 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <ExternalLink className="w-5 h-5" />
              Open Supabase SQL Editor
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-8 space-y-6 bg-amber-50 border-amber-200">
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            What Gets Created
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">📍 Districts (9 pre-seeded)</h3>
              <ul className="text-sm text-slate-700 space-y-1 ml-4">
                <li>✓ Nairobi Central</li>
                <li>✓ Eastlands</li>
                <li>✓ Thika Road</li>
                <li>✓ South Nairobi</li>
                <li>✓ West Nairobi</li>
                <li>✓ Northern Nairobi</li>
                <li>✓ Eastern Nairobi</li>
                <li>✓ South East Nairobi</li>
                <li>✓ Outskirts Nairobi</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Database Tables</h3>
              <ul className="text-sm text-slate-700 space-y-1 ml-4">
                <li>✓ <code className="bg-slate-200 px-2 py-1 rounded">districts</code> - Main districts</li>
                <li>✓ <code className="bg-slate-200 px-2 py-1 rounded">zones</code> - Zones within districts</li>
                <li>✓ <code className="bg-slate-200 px-2 py-1 rounded">homecells</code> - Home cells within zones</li>
                <li>✓ <code className="bg-slate-200 px-2 py-1 rounded">homecell_members</code> - Member assignments</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Next Steps</h3>
              <ol className="text-sm text-slate-700 space-y-1 ml-4 list-decimal">
                <li>Click "Create Database Tables" above</li>
                <li>Wait for the setup to complete</li>
                <li>Go to <strong>Settings → Home Cells</strong></li>
                <li>Add zones and home cells under each district</li>
                <li>Assign members to home cells in <strong>Member Management</strong></li>
              </ol>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
