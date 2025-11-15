import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

const SQL_BLOCK_1 = `-- Create districts table
CREATE TABLE IF NOT EXISTS public.districts (
  id BIGSERIAL PRIMARY KEY,
  district_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create zones table
CREATE TABLE IF NOT EXISTS public.zones (
  id BIGSERIAL PRIMARY KEY,
  zone_id VARCHAR(100) UNIQUE NOT NULL,
  district_id BIGINT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create homecells table
CREATE TABLE IF NOT EXISTS public.homecells (
  id BIGSERIAL PRIMARY KEY,
  homecell_id VARCHAR(100) UNIQUE NOT NULL,
  zone_id BIGINT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  district_id BIGINT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  meeting_day VARCHAR(50),
  meeting_time TIME,
  meeting_location VARCHAR(255),
  member_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create homecell_members table
CREATE TABLE IF NOT EXISTS public.homecell_members (
  id BIGSERIAL PRIMARY KEY,
  homecell_id BIGINT NOT NULL REFERENCES public.homecells(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(homecell_id, member_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_districts_leader_id ON public.districts(leader_id);
CREATE INDEX IF NOT EXISTS idx_districts_is_active ON public.districts(is_active);
CREATE INDEX IF NOT EXISTS idx_zones_district_id ON public.zones(district_id);
CREATE INDEX IF NOT EXISTS idx_zones_leader_id ON public.zones(leader_id);
CREATE INDEX IF NOT EXISTS idx_zones_is_active ON public.zones(is_active);
CREATE INDEX IF NOT EXISTS idx_homecells_zone_id ON public.homecells(zone_id);
CREATE INDEX IF NOT EXISTS idx_homecells_district_id ON public.homecells(district_id);
CREATE INDEX IF NOT EXISTS idx_homecells_leader_id ON public.homecells(leader_id);
CREATE INDEX IF NOT EXISTS idx_homecells_is_active ON public.homecells(is_active);
CREATE INDEX IF NOT EXISTS idx_homecell_members_homecell_id ON public.homecell_members(homecell_id);
CREATE INDEX IF NOT EXISTS idx_homecell_members_member_id ON public.homecell_members(member_id);`;

const SQL_BLOCK_2 = `INSERT INTO public.districts (district_id, name, description, is_active)
VALUES
  ('DIS-NAIROBI-CENTRAL', 'Nairobi Central', 'Central Nairobi district covering CBD and surrounding areas', TRUE),
  ('DIS-EASTLANDS', 'Eastlands', 'Eastlands district covering Buruburu, Umoja, Donholm, and surrounding areas', TRUE),
  ('DIS-THIKA-ROAD', 'Thika Road', 'Thika Road district covering Zimmerman, Kahawa, Roysambu, and surrounding areas', TRUE),
  ('DIS-SOUTH-NAIROBI', 'South Nairobi', 'South Nairobi district covering Lang''ata, Karen, South C/B, and surrounding areas', TRUE),
  ('DIS-WEST-NAIROBI', 'West Nairobi', 'West Nairobi district covering Kangemi, Uthiru, Dagoretti, and surrounding areas', TRUE),
  ('DIS-NORTH-NAIROBI', 'Northern Nairobi', 'Northern Nairobi district covering Muthaiga, Runda, Gigiri, and surrounding areas', TRUE),
  ('DIS-EAST-NAIROBI', 'Eastern Nairobi', 'Eastern Nairobi district covering Mathare, Huruma, Kariobangi, Dandora, and surrounding areas', TRUE),
  ('DIS-SOUTH-EAST-NAIROBI', 'South East Nairobi', 'South East Nairobi district covering Industrial Area, Mukuru, Imara Daima, and surrounding areas', TRUE),
  ('DIS-OUTSKIRTS-NAIROBI', 'Outskirts Nairobi', 'Outskirts Nairobi district covering Kitengela, Rongai, Ngong, Ruai, Juja, Thika, and surrounding areas', TRUE)
ON CONFLICT (district_id) DO NOTHING;`;

export function DatabaseSetup() {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  const copyToClipboard = (text: string, block: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(block);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">HomeCells Database Setup</h1>
        <p className="text-slate-600">Complete these steps to set up your HomeCells hierarchy</p>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          You need to manually run SQL in Supabase to create the HomeCells tables. Follow the steps below.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Step-by-Step Instructions</h2>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-lg">1. Open Supabase Dashboard</h3>
            <p className="text-slate-600 mb-4">
              Go to your Supabase project and open the SQL Editor
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open('https://app.supabase.com/', '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              Open Supabase
            </Button>
          </div>

          <div className="border-t pt-4 space-y-2">
            <h3 className="font-bold text-lg">2. Create New Query</h3>
            <p className="text-slate-600">
              Click "New query" in the SQL Editor
            </p>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="font-bold text-lg">3. Run SQL Block 1: Create Tables</h3>
            <p className="text-slate-600 mb-3">
              Copy the SQL below and paste it into Supabase, then click Run
            </p>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
              <pre>{SQL_BLOCK_1}</pre>
            </div>

            <Button
              onClick={() => copyToClipboard(SQL_BLOCK_1, 1)}
              variant={copiedBlock === 1 ? 'default' : 'outline'}
              className="gap-2 w-full"
            >
              <Copy className="w-4 h-4" />
              {copiedBlock === 1 ? 'Copied to Clipboard!' : 'Copy SQL Block 1'}
            </Button>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="font-bold text-lg">4. Run SQL Block 2: Seed Districts</h3>
            <p className="text-slate-600 mb-3">
              Create another new query and paste this SQL, then click Run
            </p>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-48 overflow-y-auto">
              <pre>{SQL_BLOCK_2}</pre>
            </div>

            <Button
              onClick={() => copyToClipboard(SQL_BLOCK_2, 2)}
              variant={copiedBlock === 2 ? 'default' : 'outline'}
              className="gap-2 w-full"
            >
              <Copy className="w-4 h-4" />
              {copiedBlock === 2 ? 'Copied to Clipboard!' : 'Copy SQL Block 2'}
            </Button>
          </div>

          <div className="border-t pt-4 space-y-2">
            <h3 className="font-bold text-lg">5. Verify & Refresh</h3>
            <p className="text-slate-600">
              Once both queries run successfully, refresh this page (Cmd+Shift+R or Ctrl+Shift+R)
              and go to Settings → Home Cells. You should see 9 districts listed.
            </p>
          </div>
        </Card>
      </div>

      <Alert className="border-green-200 bg-green-50">
        <AlertCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Once the tables are created, admins can add zones and home cells through the Settings page.
        </AlertDescription>
      </Alert>
    </div>
  );
}
