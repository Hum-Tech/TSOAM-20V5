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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Home,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
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
  const [unassignedFilter, setUnassignedFilter] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search home cells by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{homeCells.length}</div>
                <div className="text-sm text-muted-foreground">Total Home Cells</div>
              </div>
              <Home className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{assignedMembers.length}</div>
                <div className="text-sm text-muted-foreground">Assigned Members</div>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{unassignedMembers.length}</div>
                <div className="text-sm text-muted-foreground">Unassigned Members</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {(
                    (assignedMembers.length / members.length) *
                    100
                  ).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Assignment Rate</div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Completion</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Home Cells Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHomeCells.map((cell) => {
          const cellMembers = getCellMembers(cell.name);
          const activeCellMembers = getActiveCellMembers(cell.name);

          return (
            <Card
              key={cell.id}
              className="border-l-4 border-l-primary hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{cell.name}</span>
                  {cell.is_active && (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Cell Info */}
                <div className="space-y-2 text-sm">
                  {cell.description && (
                    <div className="text-muted-foreground">{cell.description}</div>
                  )}

                  {cell.leader_id && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Leader:</span>
                      <Badge variant="outline">{cell.leader_id}</Badge>
                    </div>
                  )}

                  {cell.meeting_day && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{cell.meeting_day}</span>
                      {cell.meeting_time && (
                        <>
                          <Clock className="h-4 w-4" />
                          <span>{cell.meeting_time}</span>
                        </>
                      )}
                    </div>
                  )}

                  {cell.meeting_location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{cell.meeting_location}</span>
                    </div>
                  )}
                </div>

                {/* Member Stats */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                  <div>
                    <div className="text-lg font-bold">{cellMembers.length}</div>
                    <div className="text-xs text-muted-foreground">Total Members</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {activeCellMembers.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {cellMembers.length - activeCellMembers.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Inactive</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(cell)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewMembers(cell.name)}
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    View Members
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleExport(cell.name, "excel")}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Unassigned Members Warning */}
      {unassignedMembers.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Unassigned Members ({unassignedMembers.length})
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The following members have not been assigned to any home cell:
              </p>

              <div className="max-h-80 overflow-y-auto">
                <div className="space-y-2">
                  {unassignedMembers.slice(0, 10).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {member.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.memberId} • {member.phone}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAssignMember?.(member)}
                        className="ml-2 whitespace-nowrap"
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>

                {unassignedMembers.length > 10 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    ... and {unassignedMembers.length - 10} more unassigned members
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
              <Home className="h-5 w-5" />
              {selectedHomeCell?.name} - Details
            </DialogTitle>
          </DialogHeader>

          {selectedHomeCell && (
            <div className="space-y-6">
              {/* Cell Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Status
                    </Label>
                    <p className="text-sm">
                      {selectedHomeCell.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Total Members
                    </Label>
                    <p className="text-sm font-medium">
                      {getCellMembers(selectedHomeCell.name).length}
                    </p>
                  </div>

                  {selectedHomeCell.leader_id && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        Leader
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedHomeCell.leader_id}
                      </p>
                    </div>
                  )}

                  {selectedHomeCell.meeting_day && (
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        Meeting Schedule
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedHomeCell.meeting_day}
                        {selectedHomeCell.meeting_time &&
                          ` at ${selectedHomeCell.meeting_time}`}
                      </p>
                    </div>
                  )}
                </div>

                {selectedHomeCell.description && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Description
                    </Label>
                    <p className="text-sm mt-1">{selectedHomeCell.description}</p>
                  </div>
                )}

                {selectedHomeCell.meeting_location && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">
                      Meeting Location
                    </Label>
                    <p className="text-sm mt-1">
                      {selectedHomeCell.meeting_location}
                    </p>
                  </div>
                )}
              </div>

              {/* Members List */}
              <div className="space-y-3">
                <h3 className="font-semibold">
                  Members ({getCellMembers(selectedHomeCell.name).length})
                </h3>

                {getCellMembers(selectedHomeCell.name).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No members assigned to this home cell yet
                  </p>
                ) : (
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Member ID</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCellMembers(selectedHomeCell.name).map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.fullName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {member.memberId}
                          </TableCell>
                          <TableCell className="text-xs">{member.phone}</TableCell>
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
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export Members"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
