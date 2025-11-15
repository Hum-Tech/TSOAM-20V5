import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  MapPin,
  Calendar,
  Clock,
  Layers,
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
    new Set(districts.map((d) => d.id).slice(0, 1))
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Home Cells Hierarchy
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          View the organization structure of districts, zones, and home cells
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search districts, zones, or home cells..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Hierarchy Tree */}
      {isLoading ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">
              Loading home cells...
            </p>
          </CardContent>
        </Card>
      ) : filteredDistricts.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400">
              No districts found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDistricts.map((district) => (
            <div key={district.id} className="space-y-1">
              {/* DISTRICT */}
              <div
                className="group bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 border border-blue-200 dark:border-blue-800"
                onClick={() => toggleDistrict(district.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-1.5 bg-blue-200 dark:bg-blue-800 rounded">
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
                          📋 Leader: {district.leader_id}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className="bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100 text-xs">
                      {getTotalMembers(district)} members
                    </Badge>
                  </div>
                </div>
              </div>

              {/* ZONES */}
              {expandedDistricts.has(district.id) && (
                <div className="ml-6 space-y-1 py-2">
                  {district.zones && district.zones.length > 0 ? (
                    district.zones.map((zone) => (
                      <div key={zone.id} className="space-y-1">
                        {/* ZONE */}
                        <div
                          className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 p-3 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 border border-amber-200 dark:border-amber-800"
                          onClick={() => toggleZone(zone.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-1 bg-amber-200 dark:bg-amber-800 rounded">
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
                                    📋 {zone.leader_id}
                                  </p>
                                )}
                              </div>
                            </div>

                            <Badge
                              variant="outline"
                              className="text-xs whitespace-nowrap"
                            >
                              {getZoneMembers(zone)} members
                            </Badge>
                          </div>
                        </div>

                        {/* HOMECELLS */}
                        {expandedZones.has(zone.id) && (
                          <div className="ml-6 space-y-1 py-2">
                            {zone.homecells && zone.homecells.length > 0 ? (
                              zone.homecells.map((homeCell) => (
                                <div
                                  key={homeCell.id}
                                  className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all duration-200"
                                >
                                  <div className="space-y-2">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                          🏠 {homeCell.name}
                                        </p>
                                        {homeCell.leader_id && (
                                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                            Leader: {homeCell.leader_id}
                                          </p>
                                        )}
                                      </div>

                                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                                        {homeCell.member_count || 0} members
                                      </Badge>
                                    </div>

                                    {/* Meeting Details */}
                                    {(homeCell.meeting_day ||
                                      homeCell.meeting_time ||
                                      homeCell.meeting_location) && (
                                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        {homeCell.meeting_day && (
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-slate-400" />
                                            {homeCell.meeting_day}
                                          </div>
                                        )}
                                        {homeCell.meeting_time && (
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-slate-400" />
                                            {homeCell.meeting_time}
                                          </div>
                                        )}
                                        {homeCell.meeting_location && (
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-3 w-3 text-slate-400" />
                                            {homeCell.meeting_location}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          onViewMembers?.(homeCell.name)
                                        }
                                        className="text-xs h-7 flex-1"
                                      >
                                        <Users className="h-3 w-3 mr-1" />
                                        Members
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          handleExport(homeCell.name, "excel")
                                        }
                                        disabled={
                                          exporting ===
                                          `${homeCell.name}-excel`
                                        }
                                        className="text-xs h-7 px-2"
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          handleExport(homeCell.name, "pdf")
                                        }
                                        disabled={
                                          exporting ===
                                          `${homeCell.name}-pdf`
                                        }
                                        className="text-xs h-7 px-2"
                                      >
                                        <FileText className="h-3 w-3" />
                                      </Button>
                                    </div>
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
                    ))
                  ) : (
                    <div className="text-center py-2 text-xs text-slate-500 dark:text-slate-400">
                      No zones yet
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
