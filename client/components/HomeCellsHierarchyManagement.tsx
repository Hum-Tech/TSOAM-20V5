import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Edit3,
  Trash2,
  MoreVertical,
  MapPin,
  Layers,
  AlertCircle,
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
        `Delete district "${name}"? This will also delete all zones and home cells under it.`
      )
    ) {
      onDeleteDistrict?.(id);
      toast({
        title: "District deleted",
        description: `"${name}" and all related data have been deleted`,
      });
    }
  };

  const handleDeleteZone = (id: number, name: string) => {
    if (
      confirm(
        `Delete zone "${name}"? This will also delete all home cells under it.`
      )
    ) {
      onDeleteZone?.(id);
      toast({
        title: "Zone deleted",
        description: `"${name}" and all related data have been deleted`,
      });
    }
  };

  const handleDeleteHomeCell = (id: number, name: string) => {
    if (confirm(`Delete home cell "${name}"?`)) {
      onDeleteHomeCell?.(id);
      toast({
        title: "Home cell deleted",
        description: `"${name}" has been deleted`,
      });
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Home Cells Management
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Create and manage the hierarchy of districts, zones, and home cells
          </p>
        </div>

        <Button
          onClick={onAddDistrict}
          className="bg-red-900 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add District
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">
              Loading home cells...
            </p>
          </CardContent>
        </Card>
      ) : districts.length === 0 ? (
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-blue-400" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              No districts created yet
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Click "Add District" to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {districts.map((district) => {
            const stats = getDistrictStats(district);

            return (
              <div key={district.id} className="space-y-1">
                {/* DISTRICT */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden">
                  <div className="p-4 flex items-center justify-between gap-3 hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <div
                      className="flex items-center gap-3 flex-1"
                      onClick={() => toggleDistrict(district.id)}
                    >
                      <div className="p-1.5 bg-blue-200 dark:bg-blue-800 rounded group-hover:bg-blue-300 dark:group-hover:bg-blue-700 transition">
                        {expandedDistricts.has(district.id) ? (
                          <ChevronDown className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="font-bold text-blue-900 dark:text-blue-100">
                            {district.name}
                          </p>
                        </div>
                        {district.leader_id && (
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            👤 Leader: {district.leader_id}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <Badge className="bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100 text-xs mr-2">
                          {stats.zoneCount} zone{stats.zoneCount !== 1 ? "s" : ""}
                        </Badge>
                        <Badge className="bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100 text-xs">
                          {stats.homeCellCount} home cell
                          {stats.homeCellCount !== 1 ? "s" : ""}
                        </Badge>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onAddZone?.(district.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Zone
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditDistrict?.(district.id)}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit District
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                            onClick={() =>
                              handleDeleteDistrict(district.id, district.name)
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* ZONES */}
                  {expandedDistricts.has(district.id) && (
                    <div className="border-t border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/50 space-y-1 p-3">
                      {district.zones && district.zones.length > 0 ? (
                        district.zones.map((zone) => (
                          <div key={zone.id} className="space-y-1">
                            {/* ZONE */}
                            <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg border border-amber-200 dark:border-amber-800">
                              <div className="p-3 flex items-center justify-between gap-3 hover:shadow-sm transition-all duration-200 cursor-pointer group">
                                <div
                                  className="flex items-center gap-3 flex-1"
                                  onClick={() => toggleZone(zone.id)}
                                >
                                  <div className="p-1 bg-amber-200 dark:bg-amber-800 rounded group-hover:bg-amber-300 dark:group-hover:bg-amber-700 transition">
                                    {expandedZones.has(zone.id) ? (
                                      <ChevronDown className="h-3 w-3 text-amber-700 dark:text-amber-300" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-amber-700 dark:text-amber-300" />
                                    )}
                                  </div>

                                  <div className="flex-1">
                                    <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                                      {zone.name}
                                    </p>
                                    {zone.leader_id && (
                                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                        👤 {zone.leader_id}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge
                                    variant="outline"
                                    className="text-xs whitespace-nowrap hidden sm:inline-flex"
                                  >
                                    {zone.homecells?.length || 0} home cell
                                    {(zone.homecells?.length || 0) !== 1
                                      ? "s"
                                      : ""}
                                  </Badge>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => onAddHomeCell?.(zone.id)}
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Home Cell
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => onEditZone?.(zone.id)}
                                      >
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit Zone
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                        onClick={() =>
                                          handleDeleteZone(zone.id, zone.name)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              {/* HOMECELLS */}
                              {expandedZones.has(zone.id) && (
                                <div className="border-t border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/50 space-y-1 p-2">
                                  {zone.homecells && zone.homecells.length > 0 ? (
                                    zone.homecells.map((homeCell) => (
                                      <div
                                        key={homeCell.id}
                                        className="bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all duration-200"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-lg">🏠</span>
                                              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                                {homeCell.name}
                                              </p>
                                            </div>

                                            {homeCell.leader_id && (
                                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                Leader: {homeCell.leader_id}
                                              </p>
                                            )}

                                            {(homeCell.meeting_day ||
                                              homeCell.meeting_time ||
                                              homeCell.meeting_location) && (
                                              <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-0.5">
                                                {homeCell.meeting_day && (
                                                  <div>📅 {homeCell.meeting_day}</div>
                                                )}
                                                {homeCell.meeting_time && (
                                                  <div>⏰ {homeCell.meeting_time}</div>
                                                )}
                                                {homeCell.meeting_location && (
                                                  <div>
                                                    📍 {homeCell.meeting_location}
                                                  </div>
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
                                                <MoreVertical className="h-3 w-3" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                              align="end"
                                              className="w-48"
                                            >
                                              <DropdownMenuLabel>
                                                Actions
                                              </DropdownMenuLabel>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                onClick={() =>
                                                  onEditHomeCell?.(homeCell.id)
                                                }
                                              >
                                                <Edit3 className="h-4 w-4 mr-2" />
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
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
                                    <div className="text-center py-2 text-xs text-slate-500 dark:text-slate-400">
                                      No home cells yet
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-2 text-xs text-slate-500 dark:text-slate-400">
                          No zones yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
