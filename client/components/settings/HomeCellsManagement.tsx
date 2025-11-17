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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Download, Search, Users, Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface District {
  id: number;
  name: string;
  description?: string;
  leader_id?: string;
  leader?: { full_name: string };
  is_active: boolean;
  created_at?: string;
}

interface Zone {
  id: number;
  district_id: number;
  name: string;
  description?: string;
  leader?: string;
  leader_phone?: string;
  is_active: boolean;
  created_at?: string;
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
  created_at?: string;
  member_count?: number;
}

export function HomeCellsManagement() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("districts");

  // Loading States
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingHomecells, setIsLoadingHomecells] = useState(false);

  // District State
  const [districts, setDistricts] = useState<District[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [homecells, setHomecells] = useState<Homecell[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog States
  const [showAddDistrictDialog, setShowAddDistrictDialog] = useState(false);
  const [showAddZoneDialog, setShowAddZoneDialog] = useState(false);
  const [showAddHomecellDialog, setShowAddHomecellDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "district" | "zone" | "homecell";
    id: number;
    name: string;
  } | null>(null);

  // Selection States
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Data
  const [districtForm, setDistrictForm] = useState({
    name: "",
    description: "",
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
    setIsLoadingDistricts(true);
    try {
      const response = await fetch("/api/homecells/districts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error("Failed to load districts");
      }
      
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
      setIsLoadingDistricts(false);
    }
  };

  // Load Zones
  const loadZones = async (districtId: number) => {
    setIsLoadingZones(true);
    try {
      const response = await fetch(
        `/api/homecells/districts/${districtId}/zones`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to load zones");
      }
      
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
      setIsLoadingZones(false);
    }
  };

  // Load Homecells
  const loadHomecells = async (zoneId: number) => {
    setIsLoadingHomecells(true);
    try {
      const response = await fetch(
        `/api/homecells/zones/${zoneId}/homecells`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to load homecells");
      }
      
      const data = await response.json();
      setHomecells(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Error loading homecells:", error);
      toast({
        title: "Error",
        description: "Failed to load homecells",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHomecells(false);
    }
  };

  // Validate District Form
  const validateDistrictForm = (): boolean => {
    if (!districtForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "District name is required",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Validate Zone Form
  const validateZoneForm = (): boolean => {
    if (!zoneForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Zone name is required",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Validate Homecell Form
  const validateHomecellForm = (): boolean => {
    if (!homecellForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Homecell name is required",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Save District
  const saveDistrict = async () => {
    if (!validateDistrictForm()) return;

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

      if (!response.ok) {
        throw new Error("Failed to save district");
      }

      toast({
        title: "Success",
        description: `District ${editingId ? "updated" : "created"} successfully`,
      });

      loadDistricts();
      setShowAddDistrictDialog(false);
      setDistrictForm({ name: "", description: "" });
      setEditingId(null);
    } catch (error) {
      console.error("Error saving district:", error);
      toast({
        title: "Error",
        description: "Failed to save district",
        variant: "destructive",
      });
    }
  };

  // Save Zone
  const saveZone = async () => {
    if (!validateZoneForm()) return;
    if (!selectedDistrict) {
      toast({
        title: "Error",
        description: "Please select a district first",
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
        body: JSON.stringify({
          ...zoneForm,
          district_id: selectedDistrict.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save zone");
      }

      toast({
        title: "Success",
        description: `Zone ${editingId ? "updated" : "created"} successfully`,
      });

      loadZones(selectedDistrict.id);
      setShowAddZoneDialog(false);
      setZoneForm({ name: "", description: "", leader: "", leader_phone: "" });
      setEditingId(null);
    } catch (error) {
      console.error("Error saving zone:", error);
      toast({
        title: "Error",
        description: "Failed to save zone",
        variant: "destructive",
      });
    }
  };

  // Save Homecell
  const saveHomecell = async () => {
    if (!validateHomecellForm()) return;
    if (!selectedZone || !selectedDistrict) {
      toast({
        title: "Error",
        description: "Please select both district and zone first",
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
          zone_id: selectedZone.id,
          district_id: selectedDistrict.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save homecell");
      }

      toast({
        title: "Success",
        description: `Homecell ${editingId ? "updated" : "created"} successfully`,
      });

      loadHomecells(selectedZone.id);
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
    } catch (error) {
      console.error("Error saving homecell:", error);
      toast({
        title: "Error",
        description: "Failed to save homecell",
        variant: "destructive",
      });
    }
  };

  // Delete Item (with confirmation)
  const confirmDelete = (
    type: "district" | "zone" | "homecell",
    id: number,
    name: string
  ) => {
    setDeleteTarget({ type, id, name });
    setShowDeleteConfirm(true);
  };

  const deleteItem = async () => {
    if (!deleteTarget) return;

    try {
      const endpoint =
        deleteTarget.type === "district"
          ? `/api/homecells/districts/${deleteTarget.id}`
          : deleteTarget.type === "zone"
            ? `/api/homecells/zones/${deleteTarget.id}`
            : `/api/homecells/${deleteTarget.id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast({
        title: "Success",
        description: `${deleteTarget.type} deleted successfully`,
      });

      if (deleteTarget.type === "district") {
        loadDistricts();
        setSelectedDistrict(null);
        setZones([]);
      } else if (deleteTarget.type === "zone" && selectedDistrict) {
        loadZones(selectedDistrict.id);
        setSelectedZone(null);
        setHomecells([]);
      } else if (deleteTarget.type === "homecell" && selectedZone) {
        loadHomecells(selectedZone.id);
      }

      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: `Failed to delete ${deleteTarget.type}`,
        variant: "destructive",
      });
      setShowDeleteConfirm(false);
    }
  };

  // Download Report
  const downloadHomecellReport = async (
    homecellId: number,
    homecellName: string
  ) => {
    try {
      const response = await fetch(`/api/homecells/${homecellId}/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `homecell-${homecellName}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading report:", error);
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

  const resetForm = (type: "district" | "zone" | "homecell") => {
    setEditingId(null);
    if (type === "district") {
      setDistrictForm({ name: "", description: "" });
    } else if (type === "zone") {
      setZoneForm({ name: "", description: "", leader: "", leader_phone: "" });
    } else {
      setHomecellForm({
        name: "",
        description: "",
        leader: "",
        leader_phone: "",
        meeting_day: "",
        meeting_time: "",
        meeting_location: "",
      });
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="districts">Districts ({districts.length})</TabsTrigger>
        <TabsTrigger value="zones">Zones ({zones.length})</TabsTrigger>
        <TabsTrigger value="homecells">Home Cells ({homecells.length})</TabsTrigger>
      </TabsList>

      {/* ============= DISTRICTS TAB ============= */}
      <TabsContent value="districts" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Districts Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Manage all districts in your church organization
              </p>
            </div>
            <Dialog open={showAddDistrictDialog} onOpenChange={(open) => {
              setShowAddDistrictDialog(open);
              if (!open) resetForm("district");
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingId(null);
                  resetForm("district");
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Add District
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit District" : "Add New District"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? "Update the district information below"
                      : "Create a new district to organize your church"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="district-name">District Name *</Label>
                    <Input
                      id="district-name"
                      value={districtForm.name}
                      onChange={(e) =>
                        setDistrictForm({ ...districtForm, name: e.target.value })
                      }
                      placeholder="e.g., Nairobi Central, Westlands"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district-desc">Description</Label>
                    <Textarea
                      id="district-desc"
                      value={districtForm.description}
                      onChange={(e) =>
                        setDistrictForm({
                          ...districtForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe this district..."
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddDistrictDialog(false);
                        resetForm("district");
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button onClick={saveDistrict} className="flex-1">
                      {editingId ? "Update" : "Create"} District
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search districts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isLoadingDistricts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDistricts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {districts.length === 0
                    ? "No districts yet. Create one to get started."
                    : "No districts match your search"}
                </p>
              ) : (
                <div className="grid gap-4">
                  {filteredDistricts.map((district) => (
                    <Card key={district.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {district.name}
                            </h3>
                            {district.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {district.description}
                              </p>
                            )}
                            <div className="mt-4 flex gap-2">
                              <Badge variant={district.is_active ? "default" : "secondary"}>
                                {district.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {district.created_at && (
                                <Badge variant="outline" className="text-xs">
                                  Created:{" "}
                                  {new Date(district.created_at).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDistrictForm({
                                  name: district.name,
                                  description: district.description || "",
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
                              onClick={() =>
                                confirmDelete("district", district.id, district.name)
                              }
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
            <div>
              <CardTitle>
                Zones {selectedDistrict && `in ${selectedDistrict.name}`}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedDistrict
                  ? "Manage zones within this district"
                  : "Select a district from the Districts tab"}
              </p>
            </div>
            {selectedDistrict && (
              <Dialog open={showAddZoneDialog} onOpenChange={(open) => {
                setShowAddZoneDialog(open);
                if (!open) resetForm("zone");
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingId(null);
                    resetForm("zone");
                  }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Zone
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? "Edit Zone" : "Add New Zone"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingId
                        ? "Update the zone information"
                        : `Create a new zone in ${selectedDistrict.name}`}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="zone-name">Zone Name *</Label>
                      <Input
                        id="zone-name"
                        value={zoneForm.name}
                        onChange={(e) =>
                          setZoneForm({ ...zoneForm, name: e.target.value })
                        }
                        placeholder="e.g., Zone A1, Zone B2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zone-desc">Description</Label>
                      <Textarea
                        id="zone-desc"
                        value={zoneForm.description}
                        onChange={(e) =>
                          setZoneForm({ ...zoneForm, description: e.target.value })
                        }
                        placeholder="Describe this zone..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="zone-leader">Zone Leader</Label>
                      <Input
                        id="zone-leader"
                        value={zoneForm.leader}
                        onChange={(e) =>
                          setZoneForm({ ...zoneForm, leader: e.target.value })
                        }
                        placeholder="Leader name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zone-phone">Leader Phone</Label>
                      <Input
                        id="zone-phone"
                        value={zoneForm.leader_phone}
                        onChange={(e) =>
                          setZoneForm({ ...zoneForm, leader_phone: e.target.value })
                        }
                        placeholder="Leader phone number"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddZoneDialog(false);
                          resetForm("zone");
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveZone} className="flex-1">
                        {editingId ? "Update" : "Create"} Zone
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {!selectedDistrict ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Select a district to view and manage zones
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search zones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {isLoadingZones ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredZones.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {zones.length === 0
                      ? "No zones yet in this district"
                      : "No zones match your search"}
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {filteredZones.map((zone) => (
                      <Card key={zone.id} className="overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{zone.name}</h3>
                              {zone.leader && (
                                <p className="text-sm mt-2">
                                  <strong>Leader:</strong> {zone.leader}
                                  {zone.leader_phone && ` (${zone.leader_phone})`}
                                </p>
                              )}
                              <div className="mt-4 flex gap-2">
                                <Badge variant={zone.is_active ? "default" : "secondary"}>
                                  {zone.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
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
                                onClick={() =>
                                  confirmDelete("zone", zone.id, zone.name)
                                }
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
            <div>
              <CardTitle>
                Home Cells {selectedZone && `in ${selectedZone.name}`}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedZone
                  ? "Manage home cells within this zone"
                  : "Select a zone from the Zones tab"}
              </p>
            </div>
            {selectedZone && selectedDistrict && (
              <Dialog open={showAddHomecellDialog} onOpenChange={(open) => {
                setShowAddHomecellDialog(open);
                if (!open) resetForm("homecell");
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingId(null);
                    resetForm("homecell");
                  }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Homecell
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? "Edit Homecell" : "Add New Homecell"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingId
                        ? "Update the homecell information"
                        : `Create a new homecell in ${selectedZone.name}`}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="hc-name">Homecell Name *</Label>
                      <Input
                        id="hc-name"
                        value={homecellForm.name}
                        onChange={(e) =>
                          setHomecellForm({
                            ...homecellForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., Zion Homecell, Grace Fellowship"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="hc-desc">Description</Label>
                      <Textarea
                        id="hc-desc"
                        value={homecellForm.description}
                        onChange={(e) =>
                          setHomecellForm({
                            ...homecellForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe this homecell..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="hc-leader">Cell Leader</Label>
                      <Input
                        id="hc-leader"
                        value={homecellForm.leader}
                        onChange={(e) =>
                          setHomecellForm({
                            ...homecellForm,
                            leader: e.target.value,
                          })
                        }
                        placeholder="Leader name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hc-phone">Leader Phone</Label>
                      <Input
                        id="hc-phone"
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
                      <Label htmlFor="hc-day">Meeting Day</Label>
                      <Select
                        value={homecellForm.meeting_day}
                        onValueChange={(value) =>
                          setHomecellForm({
                            ...homecellForm,
                            meeting_day: value,
                          })
                        }
                      >
                        <SelectTrigger id="hc-day">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                          ].map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="hc-time">Meeting Time</Label>
                      <Input
                        id="hc-time"
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
                      <Label htmlFor="hc-location">Meeting Location</Label>
                      <Input
                        id="hc-location"
                        value={homecellForm.meeting_location}
                        onChange={(e) =>
                          setHomecellForm({
                            ...homecellForm,
                            meeting_location: e.target.value,
                          })
                        }
                        placeholder="e.g., Community Center, Church Hall"
                      />
                    </div>
                    <div className="col-span-2 flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddHomecellDialog(false);
                          resetForm("homecell");
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveHomecell} className="flex-1">
                        {editingId ? "Update" : "Create"} Homecell
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {!selectedZone ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Select a zone to view and manage homecells
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search homecells by name or leader..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {isLoadingHomecells ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredHomecells.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {homecells.length === 0
                      ? "No homecells yet in this zone"
                      : "No homecells match your search"}
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {filteredHomecells.map((homecell) => (
                      <Card key={homecell.id} className="overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div className="col-span-2">
                                <h3 className="font-semibold text-lg">
                                  {homecell.name}
                                </h3>
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
                                    <strong>Phone:</strong>{" "}
                                    <a
                                      href={`tel:${homecell.leader_phone}`}
                                      className="text-primary hover:underline"
                                    >
                                      {homecell.leader_phone}
                                    </a>
                                  </p>
                                )}
                              </div>
                              <div>
                                {homecell.member_count !== undefined && (
                                  <p className="text-sm">
                                    <strong>Members:</strong>{" "}
                                    <Badge variant="outline">
                                      {homecell.member_count}
                                    </Badge>
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
                              <div className="col-span-2">
                                {homecell.meeting_location && (
                                  <p className="text-sm">
                                    <strong>Location:</strong>{" "}
                                    {homecell.meeting_location}
                                  </p>
                                )}
                                <Badge
                                  variant={
                                    homecell.is_active ? "default" : "secondary"
                                  }
                                  className="mt-2"
                                >
                                  {homecell.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
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
                                    meeting_location:
                                      homecell.meeting_location || "",
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
                                onClick={() =>
                                  downloadHomecellReport(
                                    homecell.id,
                                    homecell.name
                                  )
                                }
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  confirmDelete(
                                    "homecell",
                                    homecell.id,
                                    homecell.name
                                  )
                                }
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
