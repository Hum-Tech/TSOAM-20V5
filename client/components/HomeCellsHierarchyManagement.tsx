import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  MapPin,
} from "lucide-react";

interface HomeCell {
  id: number;
  name: string;
  leader_id?: string;
  meeting_day?: string;
  meeting_time?: string;
  meeting_location?: string;
  is_active?: boolean;
}

interface Zone {
  id: number;
  name: string;
  district_id: number;
  leader_id?: string;
  is_active?: boolean;
  homecells?: HomeCell[];
}

interface District {
  id: number;
  name: string;
  leader_id?: string;
  is_active?: boolean;
  zones?: Zone[];
}

interface Props {
  districts: District[];
  onAddDistrict?: () => void;
  onEditDistrict?: (id: number) => void;
  onDeleteDistrict?: (id: number) => void;
  onAddZone?: (districtId: number) => void;
  onEditZone?: (id: number) => void;
  onDeleteZone?: (id: number) => void;
  onAddHomeCell?: (zoneId: number) => void;
  onEditHomeCell?: (id: number) => void;
  onDeleteHomeCell?: (id: number) => void;
  isLoading?: boolean;
}

export function HomeCellsHierarchyManagement({
  districts,
  onAddDistrict,
  onEditDistrict,
  onDeleteDistrict,
  onAddZone,
  onEditZone,
  onDeleteZone,
  onAddHomeCell,
  onEditHomeCell,
  onDeleteHomeCell,
  isLoading,
}: Props) {
  const { toast } = useToast();
  const [expandedDistricts, setExpandedDistricts] = useState<Set<number>>(
    new Set(districts.map((d) => d.id).slice(0, 1))
  );
  const [expandedZones, setExpandedZones] = useState<Set<number>>(new Set());

  const toggleDistrict = (id: number) => {
    const newSet = new Set(expandedDistricts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedDistricts(newSet);
  };

  const toggleZone = (id: number) => {
    const newSet = new Set(expandedZones);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedZones(newSet);
  };

  const handleDeleteDistrict = (id: number, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete district "${name}"? This will also delete all zones and home cells under it.`
      )
    ) {
      onDeleteDistrict?.(id);
      toast({
        title: "District deleted",
        description: `"${name}" has been deleted successfully`,
      });
    }
  };

  const handleDeleteZone = (id: number, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete zone "${name}"? This will also delete all home cells under it.`
      )
    ) {
      onDeleteZone?.(id);
      toast({
        title: "Zone deleted",
        description: `"${name}" has been deleted successfully`,
      });
    }
  };

  const handleDeleteHomeCell = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete home cell "${name}"?`)) {
      onDeleteHomeCell?.(id);
      toast({
        title: "Home cell deleted",
        description: `"${name}" has been deleted successfully`,
      });
    }
  };

  const getZoneStats = (zone: Zone) => {
    const homeCellCount = zone.homecells?.length || 0;
    const memberCount = zone.homecells?.reduce(
      (total, hc) => total + (hc.member_count || 0),
      0
    ) || 0;
    return { homeCellCount, memberCount };
  };

  const getDistrictStats = (district: District) => {
    const zoneCount = district.zones?.length || 0;
    const homeCellCount = district.zones?.reduce(
      (total, zone) => total + (zone.homecells?.length || 0),
      0
    ) || 0;
    return { zoneCount, homeCellCount };
  };

  return (
    <div className="space-y-4">
      {/* Add District Button */}
      <div className="flex justify-end">
        <Button onClick={onAddDistrict} className="bg-red-900 hover:bg-red-800">
          <Plus className="h-4 w-4 mr-2" />
          Add District
        </Button>
      </div>

      {/* Hierarchy List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          Loading home cells...
        </div>
      ) : districts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No districts created yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {districts.map((district) => {
            const stats = getDistrictStats(district);
            return (
              <div key={district.id} className="border rounded-lg overflow-hidden">
                {/* DISTRICT ROW */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80"
                      onClick={() => toggleDistrict(district.id)}
                    >
                      {expandedDistricts.has(district.id) ? (
                        <ChevronDown className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-blue-900 dark:text-blue-100">
                          District: {district.name}
                        </div>
                        {district.leader_id && (
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                            Leader: {district.leader_id}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className="bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100 whitespace-nowrap text-xs">
                        {stats.zoneCount} zone{stats.zoneCount !== 1 ? "s" : ""}
                      </Badge>
                      <Badge className="bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100 whitespace-nowrap text-xs">
                        {stats.homeCellCount} home cell
                        {stats.homeCellCount !== 1 ? "s" : ""}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              onAddZone?.(district.id)
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Zone
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              onEditDistrict?.(district.id)
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              handleDeleteDistrict(
                                district.id,
                                district.name
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* ZONES */}
                {expandedDistricts.has(district.id) && (
                  <div className="border-t bg-white dark:bg-slate-950 space-y-1 p-2">
                    {district.zones && district.zones.length > 0 ? (
                      district.zones.map((zone) => {
                        const zoneStats = getZoneStats(zone);
                        return (
                          <div key={zone.id} className="ml-4 border rounded overflow-hidden">
                            {/* ZONE ROW */}
                            <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
                              <div className="p-3 flex items-center justify-between gap-3">
                                <div
                                  className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80"
                                  onClick={() => toggleZone(zone.id)}
                                >
                                  {expandedZones.has(zone.id) ? (
                                    <ChevronDown className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <div className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                                      Zone: {zone.name}
                                    </div>
                                    {zone.leader_id && (
                                      <div className="text-xs text-amber-700 dark:text-amber-300">
                                        Leader: {zone.leader_id}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                                    {zoneStats.homeCellCount} home cell
                                    {zoneStats.homeCellCount !== 1 ? "s" : ""}
                                  </Badge>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                      >
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onAddHomeCell?.(zone.id)
                                        }
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Home Cell
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onEditZone?.(zone.id)
                                        }
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() =>
                                          handleDeleteZone(
                                            zone.id,
                                            zone.name
                                          )
                                        }
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>

                            {/* HOMECELLS */}
                            {expandedZones.has(zone.id) && (
                              <div className="border-t bg-white dark:bg-slate-950 space-y-1 p-2">
                                {zone.homecells && zone.homecells.length > 0 ? (
                                  zone.homecells.map((homeCell) => (
                                    <div
                                      key={homeCell.id}
                                      className="ml-4 bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow"
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1">
                                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                            {homeCell.name}
                                          </div>
                                          {homeCell.leader_id && (
                                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                              Leader: {homeCell.leader_id}
                                            </div>
                                          )}
                                          {(homeCell.meeting_day ||
                                            homeCell.meeting_time ||
                                            homeCell.meeting_location) && (
                                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                                              {homeCell.meeting_day && (
                                                <div>📅 {homeCell.meeting_day}</div>
                                              )}
                                              {homeCell.meeting_time && (
                                                <div>⏰ {homeCell.meeting_time}</div>
                                              )}
                                              {homeCell.meeting_location && (
                                                <div>📍 {homeCell.meeting_location}</div>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0 flex-shrink-0"
                                            >
                                              <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() =>
                                                onEditHomeCell?.(homeCell.id)
                                              }
                                            >
                                              <Edit className="h-4 w-4 mr-2" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="text-red-600"
                                              onClick={() =>
                                                handleDeleteHomeCell(
                                                  homeCell.id,
                                                  homeCell.name
                                                )
                                              }
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="ml-4 p-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                                    No home cells in this zone
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="ml-4 p-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                        No zones in this district
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
