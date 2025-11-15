import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, Database, Copy, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface SetupStatus {
  districts?: boolean;
  zones?: boolean;
  homecells?: boolean;
  homecell_members?: boolean;
}

export default function AdminSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [tableStatus, setTableStatus] = useState<SetupStatus | null>(null);

  const handleSetupDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/database-setup/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (data.success) {
        setSetupComplete(true);
        setTableStatus(data.tableStatus);
        toast({
          title: "Success!",
          description: "Database tables created successfully. Districts have been seeded.",
          variant: "default"
        });
      } else {
        toast({
          title: "Setup Incomplete",
          description: data.message || "Please follow the manual setup instructions below.",
          variant: "destructive"
        });
        setTableStatus(data.tableStatus);
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Database className="w-8 h-8" />
          Database Setup
        </h1>
        <p className="text-slate-600">Initialize the HomeCells database with tables and seed data</p>
      </div>

      {setupComplete && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Database setup completed successfully! Go to Settings → Home Cells to view the districts.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Setup</h2>
          <p className="text-slate-600 mb-6">
            Click the button below to automatically create all necessary database tables and seed the 9 districts.
          </p>

          <Button
            size="lg"
            onClick={handleSetupDatabase}
            disabled={isLoading || setupComplete}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting up database...
              </>
            ) : setupComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Setup Complete
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Create Database Tables
              </>
            )}
          </Button>
        </div>

        {tableStatus && (
          <div className="border-t pt-6">
            <h3 className="font-bold mb-4">Table Status</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(tableStatus).map(([table, status]: [string, any]) => (
                <div key={table} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  {status.exists ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold capitalize text-sm">{table.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-slate-500">
                      {status.exists ? 'Ready' : 'Not found'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

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
