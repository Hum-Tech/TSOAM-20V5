import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2, Download, Search, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface District {
  id: number;
  name: string;
  description?: string;
  leader_id?: string;
  leader?: { full_name: string };
  is_active: boolean;
}

interface Zone {
  id: number;
  district_id: number;
  name: string;
  description?: string;
  leader?: string;
  leader_phone?: string;
  is_active: boolean;
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
  _memberCount?: number;
}

export function HomeCellsManagement() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("districts");

  // District State
  const [districts, setDistricts] = useState<District[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [homecells, setHomecells] = useState<Homecell[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form States
  const [showAddDistrictDialog, setShowAddDistrictDialog] = useState(false);
  const [showAddZoneDialog, setShowAddZoneDialog] = useState(false);
  const [showAddHomecellDialog, setShowAddHomecellDialog] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedHomecell, setSelectedHomecell] = useState<Homecell | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Data
  const [districtForm, setDistrictForm] = useState({
    name: "",
    description: "",
    leader: "",
  });

  const [zoneForm, setZoneForm] = useState({
    name: "",
    description: "",
    leader: "",
    leader_phone: "",
  });

  const [homecellForm, setHomecellForm] = useState({
    name: "",
    description: "",
    leader: "",
    leader_phone: "",
    meeting_day: "",
    meeting_time: "",
    meeting_location: "",
  });

  // Load data on mount
  useEffect(() => {
    loadDistricts();
  }, []);

  // Load Districts
  const loadDistricts = async () => {
    try {
      const response = await fetch("/api/homecells/districts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDistricts(data.data || []);
    } catch (error) {
      console.error("Error loading districts:", error);
    }
  };

  // Load Zones
  const loadZones = async (districtId: number) => {
    try {
      const response = await fetch(`/api/homecells/districts/${districtId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setZones(data.data?.zones || []);
    } catch (error) {
      console.error("Error loading zones:", error);
    }
  };

  // Load Homecells
  const loadHomecells = async (zoneId?: number) => {
    try {
      const url = zoneId
        ? `/api/homecells/zones/${zoneId}/homecells`
        : "/api/homecells";
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setHomecells(Array.isArray(data.data) ? data.data : data.data?.homecells || []);
    } catch (error) {
      console.error("Error loading homecells:", error);
    }
  };

  // Save District
  const saveDistrict = async () => {
    if (!districtForm.name) {
      toast({
        title: "Error",
        description: "District name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/homecells/districts/${editingId}`
        : "/api/homecells/districts";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(districtForm),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `District ${editingId ? "updated" : "created"} successfully`,
        });
        loadDistricts();
        setShowAddDistrictDialog(false);
        setDistrictForm({ name: "", description: "", leader: "" });
        setEditingId(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save district",
        variant: "destructive",
      });
    }
  };

  // Save Zone
  const saveZone = async (districtId: number) => {
    if (!zoneForm.name) {
      toast({
        title: "Error",
        description: "Zone name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/homecells/zones/${editingId}`
        : "/api/homecells/zones";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...zoneForm, district_id: districtId }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `Zone ${editingId ? "updated" : "created"} successfully`,
        });
        loadZones(districtId);
        setShowAddZoneDialog(false);
        setZoneForm({ name: "", description: "", leader: "", leader_phone: "" });
        setEditingId(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save zone",
        variant: "destructive",
      });
    }
  };

  // Save Homecell
  const saveHomecell = async (zoneId: number, districtId: number) => {
    if (!homecellForm.name) {
      toast({
        title: "Error",
        description: "Homecell name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/homecells/${editingId}`
        : "/api/homecells";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...homecellForm,
          zone_id: zoneId,
          district_id: districtId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `Homecell ${editingId ? "updated" : "created"} successfully`,
        });
        loadHomecells(zoneId);
        setShowAddHomecellDialog(false);
        setHomecellForm({
          name: "",
          description: "",
          leader: "",
          leader_phone: "",
          meeting_day: "",
          meeting_time: "",
          meeting_location: "",
        });
        setEditingId(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save homecell",
        variant: "destructive",
      });
    }
  };

  // Delete Item
  const deleteItem = async (type: "district" | "zone" | "homecell", id: number) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const endpoint =
        type === "district"
          ? `/api/homecells/districts/${id}`
          : type === "zone"
            ? `/api/homecells/zones/${id}`
            : `/api/homecells/${id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `${type} deleted successfully`,
        });
        if (type === "district") loadDistricts();
        else if (type === "zone" && selectedDistrict) loadZones(selectedDistrict.id);
        else if (type === "homecell" && selectedZone) loadHomecells(selectedZone.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${type}`,
        variant: "destructive",
      });
    }
  };

  // Download Report
  const downloadHomecellReport = async (homecellId: number) => {
    try {
      const response = await fetch(
        `/api/homecells/${homecellId}?export=pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `homecell-${homecellId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  // Filtered data
  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHomecells = homecells.filter(
    (h) =>
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.leader?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="districts">Districts</TabsTrigger>
        <TabsTrigger value="zones">Zones</TabsTrigger>
        <TabsTrigger value="homecells">Home Cells</TabsTrigger>
      </TabsList>

      {/* ============= DISTRICTS TAB ============= */}
      <TabsContent value="districts" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Districts Management</CardTitle>
            <Dialog open={showAddDistrictDialog} onOpenChange={setShowAddDistrictDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingId(null)}>
                  <Plus className="w-4 h-4 mr-2" /> Add District
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit District" : "Add New District"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>District Name *</Label>
                    <Input
                      value={districtForm.name}
                      onChange={(e) =>
                        setDistrictForm({ ...districtForm, name: e.target.value })
                      }
                      placeholder="e.g., Nairobi Central"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={districtForm.description}
                      onChange={(e) =>
                        setDistrictForm({ ...districtForm, description: e.target.value })
                      }
                      placeholder="District description"
                    />
                  </div>
                  <div>
                    <Label>District Leader</Label>
                    <Input
                      value={districtForm.leader}
                      onChange={(e) =>
                        setDistrictForm({ ...districtForm, leader: e.target.value })
                      }
                      placeholder="Leader name"
                    />
                  </div>
                  <Button onClick={saveDistrict} className="w-full">
                    {editingId ? "Update" : "Create"} District
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Search districts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />

              {filteredDistricts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No districts found
                </p>
              ) : (
                <div className="grid gap-4">
                  {filteredDistricts.map((district) => (
                    <Card key={district.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{district.name}</h3>
                            {district.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {district.description}
                              </p>
                            )}
                            {district.leader?.full_name && (
                              <p className="text-sm mt-2">
                                <strong>Leader:</strong> {district.leader.full_name}
                              </p>
                            )}
                            <Badge variant={district.is_active ? "default" : "secondary"} className="mt-2">
                              {district.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDistrictForm({
                                  name: district.name,
                                  description: district.description || "",
                                  leader: district.leader?.full_name || "",
                                });
                                setEditingId(district.id);
                                setShowAddDistrictDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteItem("district", district.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDistrict(district);
                                loadZones(district.id);
                                setActiveTab("zones");
                              }}
                            >
                              View Zones
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ============= ZONES TAB ============= */}
      <TabsContent value="zones" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Zones {selectedDistrict && `in ${selectedDistrict.name}`}
            </CardTitle>
            {selectedDistrict && (
              <Dialog open={showAddZoneDialog} onOpenChange={setShowAddZoneDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingId(null)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Zone
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? "Edit Zone" : "Add New Zone"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Zone Name *</Label>
                      <Input
                        value={zoneForm.name}
                        onChange={(e) =>
                          setZoneForm({ ...zoneForm, name: e.target.value })
                        }
                        placeholder="e.g., Zone A1"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={zoneForm.description}
                        onChange={(e) =>
                          setZoneForm({ ...zoneForm, description: e.target.value })
                        }
                        placeholder="Zone description"
                      />
                    </div>
                    <div>
                      <Label>Zone Leader</Label>
                      <Input
                        value={zoneForm.leader}
                        onChange={(e) =>
                          setZoneForm({ ...zoneForm, leader: e.target.value })
                        }
                        placeholder="Leader name"
                      />
                    </div>
                    <div>
                      <Label>Leader Phone</Label>
                      <Input
                        value={zoneForm.leader_phone}
                        onChange={(e) =>
                          setZoneForm({ ...zoneForm, leader_phone: e.target.value })
                        }
                        placeholder="Leader phone number"
                      />
                    </div>
                    <Button
                      onClick={() => saveZone(selectedDistrict.id)}
                      className="w-full"
                    >
                      {editingId ? "Update" : "Create"} Zone
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {!selectedDistrict ? (
              <p className="text-center text-muted-foreground py-8">
                Select a district to view zones
              </p>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="Search zones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />

                {filteredZones.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No zones found
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {filteredZones.map((zone) => (
                      <Card key={zone.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold">{zone.name}</h3>
                              {zone.leader && (
                                <p className="text-sm mt-2">
                                  <strong>Leader:</strong> {zone.leader}
                                  {zone.leader_phone && ` (${zone.leader_phone})`}
                                </p>
                              )}
                              <Badge variant={zone.is_active ? "default" : "secondary"} className="mt-2">
                                {zone.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setZoneForm({
                                    name: zone.name,
                                    description: zone.description || "",
                                    leader: zone.leader || "",
                                    leader_phone: zone.leader_phone || "",
                                  });
                                  setEditingId(zone.id);
                                  setShowAddZoneDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteItem("zone", zone.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedZone(zone);
                                  loadHomecells(zone.id);
                                  setActiveTab("homecells");
                                }}
                              >
                                View Homecells
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ============= HOMECELLS TAB ============= */}
      <TabsContent value="homecells" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Home Cells {selectedZone && `in ${selectedZone.name}`}
            </CardTitle>
            {selectedZone && selectedDistrict && (
              <Dialog open={showAddHomecellDialog} onOpenChange={setShowAddHomecellDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingId(null)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Homecell
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? "Edit Homecell" : "Add New Homecell"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Homecell Name *</Label>
                      <Input
                        value={homecellForm.name}
                        onChange={(e) =>
                          setHomecellForm({ ...homecellForm, name: e.target.value })
                        }
                        placeholder="e.g., Zion Homecell"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={homecellForm.description}
                        onChange={(e) =>
                          setHomecellForm({ ...homecellForm, description: e.target.value })
                        }
                        placeholder="Homecell description"
                      />
                    </div>
                    <div>
                      <Label>Cell Leader</Label>
                      <Input
                        value={homecellForm.leader}
                        onChange={(e) =>
                          setHomecellForm({ ...homecellForm, leader: e.target.value })
                        }
                        placeholder="Leader name"
                      />
                    </div>
                    <div>
                      <Label>Leader Phone</Label>
                      <Input
                        value={homecellForm.leader_phone}
                        onChange={(e) =>
                          setHomecellForm({
                            ...homecellForm,
                            leader_phone: e.target.value,
                          })
                        }
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <Label>Meeting Day</Label>
                      <Select
                        value={homecellForm.meeting_day}
                        onValueChange={(value) =>
                          setHomecellForm({ ...homecellForm, meeting_day: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Meeting Time</Label>
                      <Input
                        type="time"
                        value={homecellForm.meeting_time}
                        onChange={(e) =>
                          setHomecellForm({
                            ...homecellForm,
                            meeting_time: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Meeting Location</Label>
                      <Input
                        value={homecellForm.meeting_location}
                        onChange={(e) =>
                          setHomecellForm({
                            ...homecellForm,
                            meeting_location: e.target.value,
                          })
                        }
                        placeholder="e.g., Main Hall"
                      />
                    </div>
                    <Button
                      onClick={() =>
                        saveHomecell(selectedZone.id, selectedDistrict.id)
                      }
                      className="col-span-2"
                    >
                      {editingId ? "Update" : "Create"} Homecell
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {!selectedZone ? (
              <p className="text-center text-muted-foreground py-8">
                Select a zone to view homecells
              </p>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="Search homecells by name or leader..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />

                {filteredHomecells.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No homecells found
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {filteredHomecells.map((homecell) => (
                      <Card key={homecell.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-semibold">{homecell.name}</h3>
                                {homecell.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {homecell.description}
                                  </p>
                                )}
                              </div>
                              <div>
                                {homecell.leader && (
                                  <p className="text-sm">
                                    <strong>Leader:</strong> {homecell.leader}
                                  </p>
                                )}
                                {homecell.leader_phone && (
                                  <p className="text-sm">
                                    <strong>Phone:</strong> {homecell.leader_phone}
                                  </p>
                                )}
                              </div>
                              <div>
                                {homecell.meeting_day && (
                                  <p className="text-sm">
                                    <strong>Meets:</strong> {homecell.meeting_day}
                                  </p>
                                )}
                                {homecell.meeting_time && (
                                  <p className="text-sm">
                                    <strong>Time:</strong> {homecell.meeting_time}
                                  </p>
                                )}
                              </div>
                              <div>
                                {homecell.meeting_location && (
                                  <p className="text-sm">
                                    <strong>Location:</strong> {homecell.meeting_location}
                                  </p>
                                )}
                                <Badge variant={homecell.is_active ? "default" : "secondary"} className="mt-2">
                                  {homecell.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setHomecellForm({
                                    name: homecell.name,
                                    description: homecell.description || "",
                                    leader: homecell.leader || "",
                                    leader_phone: homecell.leader_phone || "",
                                    meeting_day: homecell.meeting_day || "",
                                    meeting_time: homecell.meeting_time || "",
                                    meeting_location: homecell.meeting_location || "",
                                  });
                                  setEditingId(homecell.id);
                                  setShowAddHomecellDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadHomecellReport(homecell.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteItem("homecell", homecell.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
