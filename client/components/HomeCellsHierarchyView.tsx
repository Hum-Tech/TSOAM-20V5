import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Users,
  Download,
  FileText,
  Search,
} from "lucide-react";

interface HomeCell {
  id: number;
  name: string;
  leader_id?: string;
  meeting_day?: string;
  meeting_time?: string;
  meeting_location?: string;
  is_active?: boolean;
  member_count?: number;
}

interface Zone {
  id: number;
  name: string;
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

interface HomeCellsHierarchyViewProps {
  districts: District[];
  onViewMembers?: (homeCellName: string) => void;
  onExport?: (homeCellName: string, format: "pdf" | "excel") => Promise<void>;
  isLoading?: boolean;
}

export function HomeCellsHierarchyView({
  districts,
  onViewMembers,
  onExport,
  isLoading,
}: HomeCellsHierarchyViewProps) {
  const [expandedDistricts, setExpandedDistricts] = useState<Set<number>>(
    new Set(districts.map((d) => d.id).slice(0, 1)) // Expand first district by default
  );
  const [expandedZones, setExpandedZones] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState<string | null>(null);

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

  const handleExport = async (homeCellName: string, format: "pdf" | "excel") => {
    setExporting(`${homeCellName}-${format}`);
    try {
      await onExport?.(homeCellName, format);
    } finally {
      setExporting(null);
    }
  };

  const filteredDistricts = districts.filter((district) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      district.name.toLowerCase().includes(search) ||
      district.zones?.some((zone) =>
        zone.name.toLowerCase().includes(search)
      ) ||
      district.zones?.some((zone) =>
        zone.homecells?.some((hc) =>
          hc.name.toLowerCase().includes(search)
        )
      )
    );
  });

  const getTotalMembers = (district: District) => {
    return district.zones?.reduce((total, zone) => {
      return (
        total +
        (zone.homecells?.reduce((zoneTotal, hc) => {
          return zoneTotal + (hc.member_count || 0);
        }, 0) || 0)
      );
    }, 0) || 0;
  };

  const getZoneMembers = (zone: Zone) => {
    return zone.homecells?.reduce((total, hc) => {
      return total + (hc.member_count || 0);
    }, 0) || 0;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search districts, zones, or home cells..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Hierarchy List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          Loading home cells...
        </div>
      ) : filteredDistricts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No districts or home cells found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDistricts.map((district) => (
            <div key={district.id} className="border rounded-lg overflow-hidden">
              {/* DISTRICT ROW */}
              <div
                className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => toggleDistrict(district.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {expandedDistricts.has(district.id) ? (
                      <ChevronDown className="h-5 w-5 text-blue-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-blue-600" />
                    )}
                    <div>
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
                  <Badge className="bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100">
                    {getTotalMembers(district)} members
                  </Badge>
                </div>
              </div>

              {/* ZONES (Shown when district expanded) */}
              {expandedDistricts.has(district.id) && (
                <div className="border-t bg-white dark:bg-slate-950 space-y-1 p-2">
                  {district.zones && district.zones.length > 0 ? (
                    district.zones.map((zone) => (
                      <div key={zone.id} className="ml-4 border rounded overflow-hidden">
                        {/* ZONE ROW */}
                        <div
                          className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 p-3 cursor-pointer hover:shadow-sm transition-shadow"
                          onClick={() => toggleZone(zone.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {expandedZones.has(zone.id) ? (
                                <ChevronDown className="h-4 w-4 text-amber-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-amber-600" />
                              )}
                              <div>
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
                            <Badge variant="outline" className="text-xs">
                              {getZoneMembers(zone)} members
                            </Badge>
                          </div>
                        </div>

                        {/* HOMECELLS (Shown when zone expanded) */}
                        {expandedZones.has(zone.id) && (
                          <div className="border-t bg-white dark:bg-slate-950 space-y-1 p-2">
                            {zone.homecells && zone.homecells.length > 0 ? (
                              zone.homecells.map((homeCell) => (
                                <div
                                  key={homeCell.id}
                                  className="ml-4 bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow"
                                >
                                  <div className="space-y-2">
                                    {/* Header Row */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                                          {homeCell.name}
                                        </div>
                                        {homeCell.leader_id && (
                                          <div className="text-xs text-slate-600 dark:text-slate-400">
                                            Leader: {homeCell.leader_id}
                                          </div>
                                        )}
                                      </div>
                                      <Badge variant="secondary">
                                        {homeCell.member_count || 0} members
                                      </Badge>
                                    </div>

                                    {/* Meeting Details */}
                                    {(homeCell.meeting_day ||
                                      homeCell.meeting_time ||
                                      homeCell.meeting_location) && (
                                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
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

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2 flex-wrap">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          onViewMembers?.(homeCell.name)
                                        }
                                        className="text-xs"
                                      >
                                        View Members
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          handleExport(homeCell.name, "excel")
                                        }
                                        disabled={
                                          exporting === `${homeCell.name}-excel`
                                        }
                                        className="text-xs"
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        {exporting === `${homeCell.name}-excel`
                                          ? "Exporting..."
                                          : "Excel"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          handleExport(homeCell.name, "pdf")
                                        }
                                        disabled={
                                          exporting === `${homeCell.name}-pdf`
                                        }
                                        className="text-xs"
                                      >
                                        <FileText className="h-3 w-3 mr-1" />
                                        {exporting === `${homeCell.name}-pdf`
                                          ? "Exporting..."
                                          : "PDF"}
                                      </Button>
                                    </div>
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
                    ))
                  ) : (
                    <div className="ml-4 p-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                      No zones in this district
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
