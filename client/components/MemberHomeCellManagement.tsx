import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Download,
  Loader2,
  Users,
  Search,
  Eye,
  FileText,
  BarChart3,
  TrendingUp,
} from "lucide-react";

interface District {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  member_count?: number;
}

interface Zone {
  id: number;
  district_id: number;
  name: string;
  description?: string;
  leader?: string;
  leader_phone?: string;
  is_active: boolean;
  member_count?: number;
}

interface Homecell {
  id: number;
  zone_id: number;
  district_id?: number;
  name: string;
  description?: string;
  leader?: string;
  leader_phone?: string;
  meeting_day?: string;
  meeting_time?: string;
  meeting_location?: string;
  is_active: boolean;
  member_count?: number;
  members?: any[];
}

interface Member {
  id: string;
  member_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  membership_status: string;
  homecell_id?: number;
}

export function MemberHomeCellManagement() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("hierarchy");

  // State
  const [districts, setDistricts] = useState<District[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [homecells, setHomecells] = useState<Homecell[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedHomecell, setSelectedHomecell] = useState<Homecell | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [memberToAssign, setMemberToAssign] = useState<Member | null>(null);
  const [unassignedMembers, setUnassignedMembers] = useState<Member[]>([]);
  const [homecellMembers, setHomecellMembers] = useState<Member[]>([]);

  // Load initial data
  useEffect(() => {
    loadDistricts();
  }, []);

  // Load districts
  const loadDistricts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/homecells/districts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load districts");

      const data = await response.json();
      setDistricts(data.data || []);
    } catch (error) {
      console.error("Error loading districts:", error);
      toast({
        title: "Error",
        description: "Failed to load districts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load zones for district
  const handleDistrictSelect = async (districtId: number) => {
    const district = districts.find((d) => d.id === districtId);
    if (!district) return;

    setSelectedDistrict(district);
    setSelectedZone(null);
    setSelectedHomecell(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/homecells/districts/${districtId}/zones`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to load zones");

      const data = await response.json();
      setZones(data.data || []);
    } catch (error) {
      console.error("Error loading zones:", error);
      toast({
        title: "Error",
        description: "Failed to load zones",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load homecells for zone
  const handleZoneSelect = async (zoneId: number) => {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;

    setSelectedZone(zone);
    setSelectedHomecell(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/homecells/zones/${zoneId}/homecells`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load homecells");

      const data = await response.json();
      setHomecells(data.data || []);
    } catch (error) {
      console.error("Error loading homecells:", error);
      toast({
        title: "Error",
        description: "Failed to load homecells",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load homecell details with members
  const handleHomecellSelect = async (homecell: Homecell) => {
    setSelectedHomecell(homecell);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/homecells/${homecell.id}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load members");

      const data = await response.json();
      setHomecellMembers(data.data || []);
    } catch (error) {
      console.error("Error loading homecell members:", error);
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load unassigned members
  const loadUnassignedMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/members?assigned=false", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load unassigned members");

      const data = await response.json();
      setUnassignedMembers(data.data || []);
    } catch (error) {
      console.error("Error loading unassigned members:", error);
      toast({
        title: "Error",
        description: "Failed to load unassigned members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Assign member to homecell
  const assignMemberToHomecell = async () => {
    if (!memberToAssign || !selectedHomecell) return;

    try {
      const response = await fetch(
        `/api/homecells/${selectedHomecell.id}/members/${memberToAssign.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) throw new Error("Failed to assign member");

      toast({
        title: "Success",
        description: `${memberToAssign.full_name} assigned to ${selectedHomecell.name}`,
      });

      handleHomecellSelect(selectedHomecell);
      setShowAssignDialog(false);
      setMemberToAssign(null);
      loadUnassignedMembers();
    } catch (error) {
      console.error("Error assigning member:", error);
      toast({
        title: "Error",
        description: "Failed to assign member",
        variant: "destructive",
      });
    }
  };

  // Export homecell report
  const exportHomecellReport = async (format: "pdf" | "excel" = "pdf") => {
    if (!selectedHomecell) return;

    try {
      const response = await fetch(
        `/api/homecells/${selectedHomecell.id}/export?format=${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to export report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `homecell-${selectedHomecell.name}-${Date.now()}.${
        format === "pdf" ? "pdf" : "xlsx"
      }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Report exported successfully as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  // Get statistics for selected homecell
  const getHomecellStats = () => {
    if (!homecellMembers.length) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        male: 0,
        female: 0,
      };
    }

    return {
      total: homecellMembers.length,
      active: homecellMembers.filter(
        (m) => m.membership_status === "Active"
      ).length,
      inactive: homecellMembers.filter(
        (m) => m.membership_status === "Inactive"
      ).length,
      male: homecellMembers.filter((m) => m.gender === "Male").length,
      female: homecellMembers.filter((m) => m.gender === "Female").length,
    };
  };

  const stats = getHomecellStats();
  const filteredMembers = homecellMembers.filter((m) =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="hierarchy">Organization</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      {/* ============= HIERARCHY TAB ============= */}
      <TabsContent value="hierarchy" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Districts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Districts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {districts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No districts found</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {districts.map((district) => (
                    <button
                      key={district.id}
                      onClick={() => handleDistrictSelect(district.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedDistrict?.id === district.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-accent border-border"
                      }`}
                    >
                      <div className="font-medium text-sm">{district.name}</div>
                      {district.member_count !== undefined && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {district.member_count} members
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedDistrict ? (
                zones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No zones in this district
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {zones.map((zone) => (
                      <button
                        key={zone.id}
                        onClick={() => handleZoneSelect(zone.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedZone?.id === zone.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-accent border-border"
                        }`}
                      >
                        <div className="font-medium text-sm">{zone.name}</div>
                        {zone.leader && (
                          <div className="text-xs opacity-90 mt-1">
                            {zone.leader}
                          </div>
                        )}
                        {zone.member_count !== undefined && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {zone.member_count} members
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a district first
                </p>
              )}
            </CardContent>
          </Card>

          {/* Homecells */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Homecells</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedZone ? (
                homecells.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No homecells in this zone
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {homecells.map((hc) => (
                      <button
                        key={hc.id}
                        onClick={() => {
                          handleHomecellSelect(hc);
                          setShowDetailDialog(true);
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedHomecell?.id === hc.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-accent border-border"
                        }`}
                      >
                        <div className="font-medium text-sm">{hc.name}</div>
                        {hc.leader && (
                          <div className="text-xs opacity-90 mt-1">{hc.leader}</div>
                        )}
                        {hc.member_count !== undefined && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {hc.member_count} members
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a zone first
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Homecell Details Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedHomecell?.name}</DialogTitle>
            </DialogHeader>
            {selectedHomecell && (
              <div className="space-y-4">
                {/* Homecell Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Leader
                    </Label>
                    <p className="mt-1">
                      {selectedHomecell.leader || "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Leader Phone
                    </Label>
                    <p className="mt-1">
                      {selectedHomecell.leader_phone ? (
                        <a
                          href={`tel:${selectedHomecell.leader_phone}`}
                          className="text-primary hover:underline"
                        >
                          {selectedHomecell.leader_phone}
                        </a>
                      ) : (
                        "Not available"
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Meeting Day
                    </Label>
                    <p className="mt-1">{selectedHomecell.meeting_day || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Meeting Time
                    </Label>
                    <p className="mt-1">{selectedHomecell.meeting_time || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Location
                    </Label>
                    <p className="mt-1">
                      {selectedHomecell.meeting_location || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Members Stats */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Members</h3>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div className="p-2 bg-muted rounded">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.active}
                      </div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </div>
                    <div className="p-2 bg-red-50 rounded">
                      <div className="text-2xl font-bold text-red-600">
                        {stats.inactive}
                      </div>
                      <div className="text-xs text-muted-foreground">Inactive</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.male}
                      </div>
                      <div className="text-xs text-muted-foreground">Male</div>
                    </div>
                    <div className="p-2 bg-pink-50 rounded">
                      <div className="text-2xl font-bold text-pink-600">
                        {stats.female}
                      </div>
                      <div className="text-xs text-muted-foreground">Female</div>
                    </div>
                  </div>
                </div>

                {/* Members List */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Members List</h3>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No members found
                      </p>
                    ) : (
                      <Table className="text-xs">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Member ID</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>{member.full_name}</TableCell>
                              <TableCell>{member.member_id}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    member.membership_status === "Active"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {member.membership_status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>

                {/* Export Report */}
                <div className="border-t pt-4 flex gap-2">
                  <Button
                    onClick={() => exportHomecellReport("pdf")}
                    className="flex-1"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" /> Export as PDF
                  </Button>
                  <Button
                    onClick={() => exportHomecellReport("excel")}
                    className="flex-1"
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-2" /> Export as Excel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </TabsContent>

      {/* ============= ASSIGNMENTS TAB ============= */}
      <TabsContent value="assignments" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Member Assignment to Homecells</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedHomecell ? (
              <>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Assigning to:</strong> {selectedHomecell.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Zone: {selectedZone?.name} | District: {selectedDistrict?.name}
                  </p>
                </div>

                <Button
                  onClick={() => {
                    loadUnassignedMembers();
                    setShowAssignDialog(true);
                  }}
                  className="w-full"
                >
                  <Users className="w-4 h-4 mr-2" /> Assign Member
                </Button>

                {/* Assign Dialog */}
                <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Select Member to Assign</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search members..."
                          className="pl-10"
                        />
                      </div>
                      <div className="max-h-96 overflow-y-auto border rounded-lg">
                        {isLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : unassignedMembers.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No unassigned members available
                          </p>
                        ) : (
                          <Table className="text-xs">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Member ID</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {unassignedMembers.map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell>{member.full_name}</TableCell>
                                  <TableCell>{member.member_id}</TableCell>
                                  <TableCell className="text-xs">
                                    {member.phone}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setMemberToAssign(member);
                                        assignMemberToHomecell();
                                      }}
                                    >
                                      Assign
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Select a homecell to assign members
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ============= ANALYTICS TAB ============= */}
      <TabsContent value="analytics" className="space-y-4">
        {selectedHomecell ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Member Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Members</span>
                    <Badge>{stats.total}</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Active</span>
                    <Badge variant="outline" className="bg-green-50">
                      {stats.active} ({Math.round((stats.active / stats.total) * 100)}%)
                    </Badge>
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Inactive</span>
                    <Badge variant="outline" className="bg-red-50">
                      {stats.inactive} ({Math.round((stats.inactive / stats.total) * 100)}%)
                    </Badge>
                  </div>
                  <div className="w-full bg-red-100 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.inactive / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Gender Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Male</span>
                    <Badge variant="outline" className="bg-blue-50">
                      {stats.male} ({Math.round((stats.male / stats.total) * 100)}%)
                    </Badge>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.male / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Female</span>
                    <Badge variant="outline" className="bg-pink-50">
                      {stats.female} ({Math.round((stats.female / stats.total) * 100)}%)
                    </Badge>
                  </div>
                  <div className="w-full bg-pink-100 rounded-full h-2">
                    <div
                      className="bg-pink-500 h-2 rounded-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.female / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Select a homecell to view analytics
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
