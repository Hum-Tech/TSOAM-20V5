import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Download, Users } from "lucide-react";

interface HomeCell {
  id: number;
  name: string;
  leader_id?: string;
  meeting_day?: string;
  meeting_time?: string;
  meeting_location?: string;
  member_count?: number;
  is_active?: boolean;
}

interface Zone {
  id: number;
  name: string;
  leader_id?: string;
  homecells?: HomeCell[];
  is_active?: boolean;
}

interface District {
  id: number;
  name: string;
  leader_id?: string;
  zones?: Zone[];
  is_active?: boolean;
}

interface Props {
  districts: District[];
  isLoading?: boolean;
}

export function HomeCellsView({ districts, isLoading }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpanded(newExpanded);
  };

  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Home Cells Hierarchy</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          View districts, zones, and home cells organization
        </p>
      </div>

      <Input
        placeholder="Search districts, zones, or home cells..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">Loading...</p>
        </Card>
      ) : filteredDistricts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">No districts found</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDistricts.map((district) => (
            <div key={district.id} className="space-y-1">
              {/* DISTRICT */}
              <div
                className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer hover:shadow-md transition-shadow flex items-center gap-3"
                onClick={() => toggleExpand(`d-${district.id}`)}
              >
                <div>
                  {expanded.has(`d-${district.id}`) ? (
                    <ChevronDown className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-blue-900 dark:text-blue-100">
                    📍 {district.name}
                  </div>
                  {district.leader_id && (
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      Leader: {district.leader_id}
                    </div>
                  )}
                </div>
                <Badge variant="secondary">
                  {district.zones?.length || 0} zones
                </Badge>
              </div>

              {/* ZONES */}
              {expanded.has(`d-${district.id}`) && (
                <div className="ml-4 space-y-1">
                  {district.zones && district.zones.length > 0 ? (
                    district.zones.map((zone) => (
                      <div key={zone.id} className="space-y-1">
                        {/* ZONE */}
                        <div
                          className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center gap-3"
                          onClick={() => toggleExpand(`z-${zone.id}`)}
                        >
                          <div>
                            {expanded.has(`z-${zone.id}`) ? (
                              <ChevronDown className="w-4 h-4 text-amber-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-amber-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                              🏘️ {zone.name}
                            </div>
                            {zone.leader_id && (
                              <div className="text-xs text-amber-700 dark:text-amber-300">
                                Leader: {zone.leader_id}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {zone.homecells?.length || 0} cells
                          </Badge>
                        </div>

                        {/* HOME CELLS */}
                        {expanded.has(`z-${zone.id}`) && (
                          <div className="ml-4 space-y-1">
                            {zone.homecells && zone.homecells.length > 0 ? (
                              zone.homecells.map((homeCell) => (
                                <div
                                  key={homeCell.id}
                                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                                        🏠 {homeCell.name}
                                      </div>
                                      {homeCell.leader_id && (
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                          Leader: {homeCell.leader_id}
                                        </div>
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
                                            <div>📍 {homeCell.meeting_location}</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <Badge className="flex-shrink-0">
                                      {homeCell.member_count || 0} members
                                    </Badge>
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7 flex-1"
                                    >
                                      <Users className="w-3 h-3 mr-1" />
                                      View Members
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs h-7"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-slate-500 text-center py-2">
                                No home cells
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-2">
                      No zones
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
