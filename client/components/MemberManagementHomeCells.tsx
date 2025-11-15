import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Home,
  Search,
  Download,
  Eye,
  FileText,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  Zap,
} from "lucide-react";

interface HomeCell {
  id: number;
  name: string;
  district_id?: number;
  zone_id?: number;
  leader_id?: string;
  meeting_day?: string;
  meeting_time?: string;
  meeting_location?: string;
  is_active?: boolean;
  description?: string;
  member_count?: number;
}

interface Member {
  id: string;
  homeCell?: string;
  fullName: string;
  memberId: string;
  phone: string;
  email: string;
  membershipStatus: string;
}

interface HomeCellsViewProps {
  homeCells: HomeCell[];
  members: Member[];
  onViewMembers: (homeCellName: string) => void;
  onExport: (homeCellName: string, format: "pdf" | "excel") => Promise<void>;
  onAssignMember?: (member: Member) => void;
  onTransferMember?: (member: Member) => void;
}

export function MemberManagementHomeCells({
  homeCells,
  members,
  onViewMembers,
  onExport,
  onAssignMember,
  onTransferMember,
}: HomeCellsViewProps) {
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHomeCell, setSelectedHomeCell] = useState<HomeCell | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const unassignedMembers = members.filter((m) => !m.homeCell || m.homeCell === "");
  const assignedMembers = members.filter((m) => m.homeCell && m.homeCell !== "");

  const getCellMembers = (homeCellName: string) => {
    return members.filter((m) => m.homeCell === homeCellName);
  };

  const getActiveCellMembers = (homeCellName: string) => {
    return getCellMembers(homeCellName).filter(
      (m) => m.membershipStatus === "Active"
    );
  };

  const handleViewDetails = (cell: HomeCell) => {
    setSelectedHomeCell(cell);
    setIsDetailsOpen(true);
  };

  const handleExport = async (homeCellName: string, format: "pdf" | "excel") => {
    setIsExporting(true);
    try {
      await onExport(homeCellName, format);
      toast({
        title: "Success",
        description: `${format.toUpperCase()} exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to export ${format.toUpperCase()}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredHomeCells = homeCells.filter((cell) =>
    cell.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assignmentRate =
    members.length > 0
      ? Math.round((assignedMembers.length / members.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Home Cells Overview
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage member assignments across home cells and zones
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search home cells..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Home Cells
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {homeCells.length}
                </p>
              </div>
              <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-lg">
                <Home className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Assigned Members
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {assignedMembers.length}
                </p>
              </div>
              <div className="p-3 bg-green-200 dark:bg-green-800 rounded-lg">
                <Users className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Unassigned Members
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {unassignedMembers.length}
                </p>
              </div>
              <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-700 dark:text-orange-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Assignment Rate
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {assignmentRate}%
                </p>
              </div>
              <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-700 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Home Cells View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHomeCells.map((cell) => {
            const cellMembers = getCellMembers(cell.name);
            const activeCellMembers = getActiveCellMembers(cell.name);

            return (
              <Card
                key={cell.id}
                className="border-none shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                      {cell.name}
                    </CardTitle>
                    {cell.is_active && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Cell Details */}
                  {(cell.leader_id ||
                    cell.meeting_day ||
                    cell.meeting_location) && (
                    <div className="space-y-3 text-sm">
                      {cell.leader_id && (
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">Leader:</span>
                          <Badge variant="secondary" className="text-xs">
                            {cell.leader_id}
                          </Badge>
                        </div>
                      )}

                      {cell.meeting_day && (
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{cell.meeting_day}</span>
                          {cell.meeting_time && (
                            <>
                              <Clock className="h-4 w-4 text-slate-400 ml-2" />
                              <span>{cell.meeting_time}</span>
                            </>
                          )}
                        </div>
                      )}

                      {cell.meeting_location && (
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>{cell.meeting_location}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Member Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {cellMembers.length}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Total
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {activeCellMembers.length}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Active
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {cellMembers.length - activeCellMembers.length}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Inactive
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(cell)}
                      className="flex-1 text-xs h-9"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewMembers(cell.name)}
                      className="flex-1 text-xs h-9"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Members
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExport(cell.name, "excel")}
                      disabled={isExporting}
                      className="text-xs h-9"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-none shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Home Cell Name
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Leader
                  </TableHead>
                  <TableHead className="text-center text-slate-700 dark:text-slate-300">
                    Total Members
                  </TableHead>
                  <TableHead className="text-center text-slate-700 dark:text-slate-300">
                    Active
                  </TableHead>
                  <TableHead className="text-slate-700 dark:text-slate-300">
                    Meeting
                  </TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-slate-300">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHomeCells.map((cell) => {
                  const cellMembers = getCellMembers(cell.name);
                  const activeCellMembers = getActiveCellMembers(cell.name);

                  return (
                    <TableRow
                      key={cell.id}
                      className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {cell.name}
                        {cell.is_active && (
                          <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {cell.leader_id || "—"}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-900 dark:text-slate-100">
                        {cellMembers.length}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-green-600 dark:text-green-400">
                        {activeCellMembers.length}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {cell.meeting_day && cell.meeting_time
                          ? `${cell.meeting_day} at ${cell.meeting_time}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(cell)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExport(cell.name, "excel")}
                            disabled={isExporting}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Unassigned Members Alert */}
      {unassignedMembers.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <Zap className="h-5 w-5" />
              Action Required: {unassignedMembers.length} Unassigned Member
              {unassignedMembers.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                These members have not been assigned to any home cell yet. Assign
                them to ensure proper home cell organization.
              </p>

              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {unassignedMembers.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded border border-orange-200 dark:border-orange-800"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                          {member.fullName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {member.memberId} • {member.phone}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onAssignMember?.(member)}
                        className="ml-2 whitespace-nowrap h-8 text-xs"
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>

                {unassignedMembers.length > 5 && (
                  <div className="text-center py-4 text-sm text-orange-700 dark:text-orange-300">
                    ... and {unassignedMembers.length - 5} more
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Home Cell Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              {selectedHomeCell?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedHomeCell && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Status
                  </Label>
                  <Badge
                    className={
                      selectedHomeCell.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                    }
                  >
                    {selectedHomeCell.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Total Members
                  </Label>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {getCellMembers(selectedHomeCell.name).length}
                  </p>
                </div>

                {selectedHomeCell.leader_id && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Leader
                    </Label>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {selectedHomeCell.leader_id}
                    </p>
                  </div>
                )}

                {selectedHomeCell.meeting_day && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Meeting Schedule
                    </Label>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {selectedHomeCell.meeting_day}
                      {selectedHomeCell.meeting_time &&
                        ` at ${selectedHomeCell.meeting_time}`}
                    </p>
                  </div>
                )}
              </div>

              {selectedHomeCell.meeting_location && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Meeting Location
                  </Label>
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {selectedHomeCell.meeting_location}
                  </div>
                </div>
              )}

              {/* Members Table */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Members ({getCellMembers(selectedHomeCell.name).length})
                </h3>

                {getCellMembers(selectedHomeCell.name).length === 0 ? (
                  <div className="p-4 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded">
                    No members assigned yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCellMembers(selectedHomeCell.name).map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                            {member.fullName}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                            {member.memberId}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                member.membershipStatus === "Active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {member.membershipStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() =>
                selectedHomeCell &&
                handleExport(selectedHomeCell.name, "excel")
              }
              disabled={isExporting}
            >
              <FileText className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
