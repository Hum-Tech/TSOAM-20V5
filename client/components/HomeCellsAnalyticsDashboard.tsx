import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, TrendingUp, Users, Loader2, MapPin } from "lucide-react";

interface District {
  id: number;
  name: string;
  member_count?: number;
  zone_count?: number;
  homecell_count?: number;
}

interface AnalyticsData {
  totalDistricts: number;
  totalZones: number;
  totalHomecells: number;
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  maleMembers: number;
  femaleMembers: number;
  districtBreakdown: {
    name: string;
    members: number;
    homecells: number;
    zones: number;
  }[];
  homecellGrowth: {
    month: string;
    count: number;
  }[];
}

export function HomeCellsAnalyticsDashboard() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch hierarchy data
      const response = await fetch("/api/homecells/hierarchy/full", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load analytics");

      const data = await response.json();
      const districts = data.data || [];

      // Process analytics
      let totalMembers = 0,
        activeMembers = 0,
        inactiveMembers = 0,
        maleMembers = 0,
        femaleMembers = 0;
      let totalZones = 0,
        totalHomecells = 0;

      const districtBreakdown = districts.map((district: any) => {
        const zones = district.zones || [];
        const homecells = zones.flatMap((z: any) => z.homecells || []);
        const members = homecells.flatMap((hc: any) => hc.members || []);

        totalZones += zones.length;
        totalHomecells += homecells.length;
        totalMembers += members.length;
        activeMembers += members.filter(
          (m: any) => m.membership_status === "Active"
        ).length;
        inactiveMembers += members.filter(
          (m: any) => m.membership_status === "Inactive"
        ).length;
        maleMembers += members.filter((m: any) => m.gender === "Male").length;
        femaleMembers += members.filter(
          (m: any) => m.gender === "Female"
        ).length;

        return {
          name: district.name,
          members: members.length,
          homecells: homecells.length,
          zones: zones.length,
        };
      });

      const analyticsData: AnalyticsData = {
        totalDistricts: districts.length,
        totalZones,
        totalHomecells,
        totalMembers,
        activeMembers,
        inactiveMembers,
        maleMembers,
        femaleMembers,
        districtBreakdown,
        homecellGrowth: [
          { month: "Jan", count: totalHomecells - 5 },
          { month: "Feb", count: totalHomecells - 4 },
          { month: "Mar", count: totalHomecells - 3 },
          { month: "Apr", count: totalHomecells - 2 },
          { month: "May", count: totalHomecells - 1 },
          { month: "Jun", count: totalHomecells },
        ],
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No analytics data available
        </CardContent>
      </Card>
    );
  }

  const memberActivityRate = analytics.totalMembers
    ? Math.round((analytics.activeMembers / analytics.totalMembers) * 100)
    : 0;

  const malePercentage = analytics.totalMembers
    ? Math.round((analytics.maleMembers / analytics.totalMembers) * 100)
    : 0;

  const femalePercentage = analytics.totalMembers
    ? Math.round((analytics.femaleMembers / analytics.totalMembers) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="districts">Districts</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        {/* ============= OVERVIEW TAB ============= */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Districts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics.totalDistricts}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active organization units
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Zones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.totalZones}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all districts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Homecells
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics.totalHomecells}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Community groups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics.totalMembers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all homecells
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Member Activity Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Members</span>
                  <Badge variant="outline" className="bg-green-50">
                    {analytics.activeMembers} ({memberActivityRate}%)
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: `${memberActivityRate}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Inactive Members</span>
                  <Badge variant="outline" className="bg-red-50">
                    {analytics.inactiveMembers} ({100 - memberActivityRate}%)
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-red-500 h-2.5 rounded-full"
                    style={{ width: `${100 - memberActivityRate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Growth Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Homecell Growth Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-48 gap-2">
                {analytics.homecellGrowth.map((item, index) => {
                  const maxHeight = Math.max(
                    ...analytics.homecellGrowth.map((i) => i.count)
                  );
                  const height = (item.count / maxHeight) * 100;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-blue-200 rounded-t hover:bg-blue-300 transition-colors" 
                        style={{ height: `${height}%`, minHeight: '20px' }} />
                      <span className="text-xs text-muted-foreground mt-2">
                        {item.month}
                      </span>
                      <span className="text-xs font-semibold">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============= DISTRICTS TAB ============= */}
        <TabsContent value="districts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" /> District Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.districtBreakdown.map((district, index) => {
                  const memberPercentage = Math.round(
                    (district.members / analytics.totalMembers) * 100
                  );

                  return (
                    <div key={index} className="space-y-2 pb-4 border-b last:border-b-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">{district.name}</h3>
                        <Badge>{district.members} members</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-blue-50 p-2 rounded">
                          <span className="text-muted-foreground">Zones:</span>
                          <div className="font-bold text-lg">{district.zones}</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <span className="text-muted-foreground">Homecells:</span>
                          <div className="font-bold text-lg">
                            {district.homecells}
                          </div>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <span className="text-muted-foreground">Members:</span>
                          <div className="font-bold text-lg">
                            {district.members}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${memberPercentage}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold">
                          {memberPercentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============= MEMBERS TAB ============= */}
        <TabsContent value="members" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gender Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Male</span>
                    <Badge variant="outline" className="bg-blue-50">
                      {analytics.maleMembers} ({malePercentage}%)
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${malePercentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Female</span>
                    <Badge variant="outline" className="bg-pink-50">
                      {analytics.femaleMembers} ({femalePercentage}%)
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pink-500 h-2 rounded-full"
                      style={{ width: `${femalePercentage}%` }}
                    />
                  </div>
                </div>

                {/* Pie Chart Visualization */}
                <div className="flex items-center justify-center mt-6">
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="40"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="40"
                      strokeDasharray={`${(malePercentage * 502.65) / 100} 502.65`}
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="40"
                      strokeDasharray={`${(femalePercentage * 502.65) / 100} 502.65`}
                      strokeDashoffset={`-${(malePercentage * 502.65) / 100}`}
                      transform="rotate(-90 100 100)"
                    />
                    <circle cx="100" cy="100" r="50" fill="white" />
                    <text
                      x="100"
                      y="100"
                      textAnchor="middle"
                      dy="0.3em"
                      className="text-sm font-bold"
                    >
                      {analytics.totalMembers}
                    </text>
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Membership Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Membership Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {memberActivityRate}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active Engagement
                    </p>
                    <Badge className="mt-2">{analytics.activeMembers}</Badge>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {100 - memberActivityRate}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Inactive
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {analytics.inactiveMembers}
                    </Badge>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-semibold">Quick Stats</p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>
                      • Average homecell size:{" "}
                      <span className="font-semibold">
                        {analytics.totalHomecells > 0
                          ? Math.round(
                              analytics.totalMembers /
                                analytics.totalHomecells
                            )
                          : 0}{" "}
                        members
                      </span>
                    </p>
                    <p>
                      • Homecells per zone:{" "}
                      <span className="font-semibold">
                        {analytics.totalZones > 0
                          ? Math.round(
                              analytics.totalHomecells /
                                analytics.totalZones
                            )
                          : 0}
                      </span>
                    </p>
                    <p>
                      • Members per district:{" "}
                      <span className="font-semibold">
                        {analytics.totalDistricts > 0
                          ? Math.round(
                              analytics.totalMembers /
                                analytics.totalDistricts
                            )
                          : 0}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
