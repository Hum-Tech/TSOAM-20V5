import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  ChevronDown,
  Users,
  MapPin,
  Home,
  Calendar,
  Clock,
  Phone,
  User,
  Search,
  Download,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  homeCellService,
  type District,
  type Zone,
  type HomeCell,
} from "@/services/HomeCellService";

interface ExpandedStates {
  [key: number]: boolean;
}

export function HomeCellsManagement() {
  const { toast } = useToast();

  // State for districts, zones, and home cells
  const [districts, setDistricts] = useState<District[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [homeCells, setHomeCells] = useState<HomeCell[]>([]);
  const [expandedDistricts, setExpandedDistricts] = useState<ExpandedStates>({});
  const [expandedZones, setExpandedZones] = useState<ExpandedStates>({});

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("structure");

  // Dialog states
  const [isAddDistrictOpen, setIsAddDistrictOpen] = useState(false);
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [isAddHomeCellOpen, setIsAddHomeCellOpen] = useState(false);
  const [isEditingDistrict, setIsEditingDistrict] = useState<District | null>(null);
  const [isEditingZone, setIsEditingZone] = useState<Zone | null>(null);
  const [isEditingHomeCell, setIsEditingHomeCell] = useState<HomeCell | null>(null);
  const [selectedDistrictForZone, setSelectedDistrictForZone] = useState<number | null>(null);
  const [selectedZoneForHomeCell, setSelectedZoneForHomeCell] = useState<number | null>(null);

  // Form states
  const [districtForm, setDistrictForm] = useState({
    name: "",
    description: "",
    leader_id: "",
  });

  const [zoneForm, setZoneForm] = useState({
    name: "",
    description: "",
    leader_id: "",
  });

  const [homeCellForm, setHomeCellForm] = useState({
    name: "",
    description: "",
    leader_id: "",
    meeting_day: "",
    meeting_time: "",
    meeting_location: "",
  });

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [districtData, zoneData, homeCellData] = await Promise.all([
        homeCellService.getAllDistricts(),
        homeCellService.getZonesByDistrict(0), // This would need adjustment in service
        homeCellService.getAllHomeCells(),
      ]);

      setDistricts(districtData || []);
      setZones(zoneData || []);
      setHomeCells(homeCellData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load HomeCells data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDistrictExpand = (districtId: number) => {
    setExpandedDistricts((prev) => ({
      ...prev,
      [districtId]: !prev[districtId],
    }));
  };

  const toggleZoneExpand = (zoneId: number) => {
    setExpandedZones((prev) => ({
      ...prev,
      [zoneId]: !prev[zoneId],
    }));
  };

  const handleAddDistrict = async () => {
    if (!districtForm.name.trim()) {
      toast({
        title: "Error",
        description: "District name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const newDistrict = await homeCellService.createDistrict({
        name: districtForm.name,
        description: districtForm.description,
        leader_id: districtForm.leader_id || undefined,
        is_active: true,
      });

      if (newDistrict) {
        setDistricts([...districts, newDistrict]);
        setDistrictForm({ name: "", description: "", leader_id: "" });
        setIsAddDistrictOpen(false);
        toast({
          title: "Success",
          description: `District "${newDistrict.name}" created successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create district",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddZone = async () => {
    if (!zoneForm.name.trim()) {
      toast({
        title: "Error",
        description: "Zone name is required",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDistrictForZone) {
      toast({
        title: "Error",
        description: "Please select a district",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const newZone = await homeCellService.createZone({
        name: zoneForm.name,
        description: zoneForm.description,
        district_id: selectedDistrictForZone,
        leader_id: zoneForm.leader_id || undefined,
        is_active: true,
      });

      if (newZone) {
        setZones([...zones, newZone]);
        setZoneForm({ name: "", description: "", leader_id: "" });
        setSelectedDistrictForZone(null);
        setIsAddZoneOpen(false);
        toast({
          title: "Success",
          description: `Zone "${newZone.name}" created successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create zone",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddHomeCell = async () => {
    if (!homeCellForm.name.trim()) {
      toast({
        title: "Error",
        description: "Home Cell name is required",
        variant: "destructive",
      });
      return;
    }

    if (!selectedZoneForHomeCell) {
      toast({
        title: "Error",
        description: "Please select a zone",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const selectedZone = zones.find((z) => z.id === selectedZoneForHomeCell);
      if (!selectedZone) {
        throw new Error("Zone not found");
      }

      const newHomeCell = await homeCellService.createHomeCell({
        name: homeCellForm.name,
        description: homeCellForm.description,
        zone_id: selectedZoneForHomeCell,
        district_id: selectedZone.district_id,
        leader_id: homeCellForm.leader_id || undefined,
        meeting_day: homeCellForm.meeting_day || undefined,
        meeting_time: homeCellForm.meeting_time || undefined,
        meeting_location: homeCellForm.meeting_location || undefined,
        is_active: true,
      });

      if (newHomeCell) {
        setHomeCells([...homeCells, newHomeCell]);
        setHomeCellForm({
          name: "",
          description: "",
          leader_id: "",
          meeting_day: "",
          meeting_time: "",
          meeting_location: "",
        });
        setSelectedZoneForHomeCell(null);
        setIsAddHomeCellOpen(false);
        toast({
          title: "Success",
          description: `Home Cell "${newHomeCell.name}" created successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create home cell",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDistrict = async (districtId: number) => {
    if (!confirm("Are you sure you want to delete this district?")) {
      return;
    }

    setIsSaving(true);
    try {
      const success = await homeCellService.deleteDistrict(districtId);
      if (success) {
        setDistricts(districts.filter((d) => d.id !== districtId));
        toast({
          title: "Success",
          description: "District deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete district",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZone = async (zoneId: number) => {
    if (!confirm("Are you sure you want to delete this zone?")) {
      return;
    }

    setIsSaving(true);
    try {
      const success = await homeCellService.deleteZone(zoneId);
      if (success) {
        setZones(zones.filter((z) => z.id !== zoneId));
        toast({
          title: "Success",
          description: "Zone deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete zone",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHomeCell = async (homeCellId: number) => {
    if (!confirm("Are you sure you want to delete this home cell?")) {
      return;
    }

    setIsSaving(true);
    try {
      const success = await homeCellService.deleteHomeCell(homeCellId);
      if (success) {
        setHomeCells(homeCells.filter((hc) => hc.id !== homeCellId));
        toast({
          title: "Success",
          description: "Home Cell deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete home cell",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getZonesForDistrict = (districtId: number) => {
    return zones.filter((z) => z.district_id === districtId);
  };

  const getHomeCellsForZone = (zoneId: number) => {
    return homeCells.filter((hc) => hc.zone_id === zoneId);
  };

  const getDistrictStats = (districtId: number) => {
    const districtZones = getZonesForDistrict(districtId);
    const homeCellCount = districtZones.reduce(
      (count, zone) => count + getHomeCellsForZone(zone.id).length,
      0
    );
    return {
      zoneCount: districtZones.length,
      homeCellCount,
    };
  };

  const getZoneStats = (zoneId: number) => {
    return {
      homeCellCount: getHomeCellsForZone(zoneId).length,
    };
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="structure">Hierarchy Structure</TabsTrigger>
        <TabsTrigger value="list">All Home Cells</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      {/* Hierarchy Structure Tab */}
      <TabsContent value="structure">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  District → Zone → Home Cell Hierarchy
                </CardTitle>
              </div>
              <Dialog open={isAddDistrictOpen} onOpenChange={setIsAddDistrictOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-red-900 hover:bg-red-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add District
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New District</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>District Name *</Label>
                      <Input
                        placeholder="e.g., Central District"
                        value={districtForm.name}
                        onChange={(e) =>
                          setDistrictForm({ ...districtForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        placeholder="Optional description"
                        value={districtForm.description}
                        onChange={(e) =>
                          setDistrictForm({
                            ...districtForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>District Leader (Optional)</Label>
                      <Input
                        placeholder="Leader ID or name"
                        value={districtForm.leader_id}
                        onChange={(e) =>
                          setDistrictForm({
                            ...districtForm,
                            leader_id: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDistrictOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddDistrict} disabled={isSaving}>
                      {isSaving ? "Creating..." : "Create District"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : districts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No districts created yet. Start by creating a district.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {districts.map((district) => {
                  const isExpanded = expandedDistricts[district.id];
                  const districtZones = getZonesForDistrict(district.id);
                  const stats = getDistrictStats(district.id);

                  return (
                    <div key={district.id} className="border rounded-lg">
                      {/* District Header */}
                      <div className="flex items-center gap-3 p-4 bg-gray-50">
                        <button
                          onClick={() => toggleDistrictExpand(district.id)}
                          className="hover:bg-gray-200 p-1 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>

                        <MapPin className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{district.name}</h3>
                          {district.description && (
                            <p className="text-sm text-muted-foreground">
                              {district.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge variant="outline">
                            {stats.zoneCount} zone{stats.zoneCount !== 1 ? "s" : ""}
                          </Badge>
                          <Badge variant="outline">
                            {stats.homeCellCount} home cell
                            {stats.homeCellCount !== 1 ? "s" : ""}
                          </Badge>
                          {district.is_active && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedDistrictForZone(district.id);
                                  setIsAddZoneOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Zone
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Zones List */}
                      {isExpanded && (
                        <div className="border-t p-4 space-y-3 bg-white">
                          {districtZones.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No zones in this district
                            </p>
                          ) : (
                            districtZones.map((zone) => {
                              const isZoneExpanded = expandedZones[zone.id];
                              const zoneHomeCells = getHomeCellsForZone(zone.id);

                              return (
                                <div
                                  key={zone.id}
                                  className="border rounded-lg ml-8 overflow-hidden"
                                >
                                  {/* Zone Header */}
                                  <div className="flex items-center gap-3 p-3 bg-blue-50">
                                    <button
                                      onClick={() => toggleZoneExpand(zone.id)}
                                      className="hover:bg-blue-100 p-1 rounded"
                                    >
                                      {isZoneExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </button>

                                    <Users className="h-4 w-4 text-green-600" />
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm">{zone.name}</h4>
                                      {zone.description && (
                                        <p className="text-xs text-muted-foreground">
                                          {zone.description}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <Badge variant="outline" className="text-xs">
                                        {zoneHomeCells.length} home cell
                                        {zoneHomeCells.length !== 1 ? "s" : ""}
                                      </Badge>
                                      {zone.is_active && (
                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                          Active
                                        </Badge>
                                      )}

                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSelectedZoneForHomeCell(zone.id);
                                              setIsAddHomeCellOpen(true);
                                            }}
                                          >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Home Cell
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => handleDeleteZone(zone.id)}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>

                                  {/* Home Cells List */}
                                  {isZoneExpanded && (
                                    <div className="border-t p-3 space-y-2 bg-white">
                                      {zoneHomeCells.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-3">
                                          No home cells in this zone
                                        </p>
                                      ) : (
                                        zoneHomeCells.map((homeCell) => (
                                          <div
                                            key={homeCell.id}
                                            className="flex items-center gap-3 p-2 bg-gray-50 rounded ml-4"
                                          >
                                            <Home className="h-3 w-3 text-orange-600" />
                                            <div className="flex-1 text-sm">
                                              <div className="font-medium">
                                                {homeCell.name}
                                              </div>
                                              {homeCell.meeting_day && (
                                                <div className="text-xs text-muted-foreground">
                                                  Meets: {homeCell.meeting_day}
                                                  {homeCell.meeting_time &&
                                                    ` at ${homeCell.meeting_time}`}
                                                </div>
                                              )}
                                            </div>

                                            {homeCell.is_active && (
                                              <Badge className="bg-green-100 text-green-800 text-xs">
                                                Active
                                              </Badge>
                                            )}

                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleDeleteHomeCell(homeCell.id)
                                              }
                                            >
                                              <Trash2 className="h-3 w-3 text-red-600" />
                                            </Button>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Zone Dialog */}
        <Dialog open={isAddZoneOpen} onOpenChange={setIsAddZoneOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Zone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedDistrictForZone && (
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-sm">
                    <strong>District:</strong>{" "}
                    {districts.find((d) => d.id === selectedDistrictForZone)?.name}
                  </p>
                </div>
              )}
              <div>
                <Label>Zone Name *</Label>
                <Input
                  placeholder="e.g., Siloam Zone"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Optional description"
                  value={zoneForm.description}
                  onChange={(e) =>
                    setZoneForm({ ...zoneForm, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Zone Leader (Optional)</Label>
                <Input
                  placeholder="Leader ID or name"
                  value={zoneForm.leader_id}
                  onChange={(e) =>
                    setZoneForm({ ...zoneForm, leader_id: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddZoneOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddZone} disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Zone"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Home Cell Dialog */}
        <Dialog open={isAddHomeCellOpen} onOpenChange={setIsAddHomeCellOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Home Cell</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedZoneForHomeCell && (
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-sm">
                    <strong>Zone:</strong>{" "}
                    {zones.find((z) => z.id === selectedZoneForHomeCell)?.name}
                  </p>
                </div>
              )}
              <div>
                <Label>Home Cell Name *</Label>
                <Input
                  placeholder="e.g., Zion Group A"
                  value={homeCellForm.name}
                  onChange={(e) =>
                    setHomeCellForm({ ...homeCellForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Optional description"
                  value={homeCellForm.description}
                  onChange={(e) =>
                    setHomeCellForm({
                      ...homeCellForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Meeting Day</Label>
                  <Select
                    value={homeCellForm.meeting_day}
                    onValueChange={(value) =>
                      setHomeCellForm({ ...homeCellForm, meeting_day: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Meeting Time</Label>
                  <Input
                    type="time"
                    value={homeCellForm.meeting_time}
                    onChange={(e) =>
                      setHomeCellForm({
                        ...homeCellForm,
                        meeting_time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Meeting Location</Label>
                <Input
                  placeholder="e.g., Community Hall"
                  value={homeCellForm.meeting_location}
                  onChange={(e) =>
                    setHomeCellForm({
                      ...homeCellForm,
                      meeting_location: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Home Cell Leader (Optional)</Label>
                <Input
                  placeholder="Leader ID or name"
                  value={homeCellForm.leader_id}
                  onChange={(e) =>
                    setHomeCellForm({ ...homeCellForm, leader_id: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddHomeCellOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddHomeCell} disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Home Cell"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>

      {/* All Home Cells Tab */}
      <TabsContent value="list">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              All Home Cells Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by home cell name or leader..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Home Cell Name</TableHead>
                  <TableHead>Zone / District</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Meeting</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {homeCells.map((homeCell) => {
                  const zone = zones.find((z) => z.id === homeCell.zone_id);
                  const district = districts.find(
                    (d) => d.id === homeCell.district_id
                  );

                  return (
                    <TableRow key={homeCell.id}>
                      <TableCell className="font-medium">
                        {homeCell.name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{zone?.name || "Unknown Zone"}</div>
                          <div className="text-xs text-muted-foreground">
                            {district?.name || "Unknown District"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {homeCell.leader_id ? (
                          <Badge variant="outline">{homeCell.leader_id}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No leader
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {homeCell.meeting_day && (
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {homeCell.meeting_day}
                            </div>
                            {homeCell.meeting_time && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {homeCell.meeting_time}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{homeCell.meeting_location || "-"}</TableCell>
                      <TableCell>
                        {homeCell.is_active ? (
                          <Badge className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteHomeCell(homeCell.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {homeCells.length === 0 && (
              <div className="text-center py-8">
                <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  No home cells created yet. Start by creating a district and zone.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Settings Tab */}
      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>HomeCells Management Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold mb-2">System Statistics</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {districts.length}
                  </div>
                  <div className="text-muted-foreground">Districts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {zones.length}
                  </div>
                  <div className="text-muted-foreground">Zones</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {homeCells.length}
                  </div>
                  <div className="text-muted-foreground">Home Cells</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {homeCells.filter((hc) => !hc.leader_id).length}
                  </div>
                  <div className="text-muted-foreground">Without Leaders</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Auto-Assign Members
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
