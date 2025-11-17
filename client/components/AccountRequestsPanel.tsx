import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import { Check, X, Eye, Mail, Phone, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AccountRequest {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export function AccountRequestsPanel() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/account-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to load account requests");
      }

      const data = await response.json();
      setRequests(data.data || []);
    } catch (error) {
      console.error("Error loading account requests:", error);
      toast({
        title: "Error",
        description: "Failed to load account requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/account-requests/${selectedRequest.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to approve request");
      }

      toast({
        title: "Success",
        description: `Account request from ${selectedRequest.full_name} has been approved. Login credentials should be sent to ${selectedRequest.email}`,
      });

      loadRequests();
      setSelectedRequest(null);
      setAction(null);
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        title: "Error",
        description: "Failed to approve account request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/account-requests/${selectedRequest.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: "Request declined by administrator",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject request");
      }

      toast({
        title: "Success",
        description: `Account request from ${selectedRequest.full_name} has been rejected`,
      });

      loadRequests();
      setSelectedRequest(null);
      setAction(null);
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: "Failed to reject account request",
        variant: "destructive",
      });
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      user: "bg-blue-100 text-blue-800",
      finance_officer: "bg-purple-100 text-purple-800",
      hr_officer: "bg-green-100 text-green-800",
      pastor: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={roleColors[role] || "bg-gray-100 text-gray-800"}>
        {role.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Account Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <h4 className="font-semibold">{request.full_name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {request.email}
                      </div>
                      {request.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {request.phone}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(request.role)}
                      <span className="text-xs text-muted-foreground">
                        Requested: {new Date(request.requested_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request);
                        setAction("approve");
                      }}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request);
                        setAction("reject");
                      }}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved Requests History */}
      {approvedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Approved Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Approved Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.full_name}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>{getRoleBadge(request.role)}</TableCell>
                    <TableCell>
                      {request.reviewed_at
                        ? new Date(request.reviewed_at).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Rejected Requests History */}
      {rejectedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rejected Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Rejected Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejectedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.full_name}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>{getRoleBadge(request.role)}</TableCell>
                    <TableCell>{request.rejection_reason || "No reason provided"}</TableCell>
                    <TableCell>
                      {request.reviewed_at
                        ? new Date(request.reviewed_at).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {requests.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No account requests yet</p>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      {action === "approve" && selectedRequest && (
        <AlertDialog open={true} onOpenChange={() => setAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Account Request?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to approve the account request for:
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="font-semibold">{selectedRequest.full_name}</p>
                  <p className="text-sm">{selectedRequest.email}</p>
                  <p className="text-sm">Role: {selectedRequest.role}</p>
                </div>
                The user will receive login credentials at their email address.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel onClick={() => setAction(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve Account
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Rejection Dialog */}
      {action === "reject" && selectedRequest && (
        <AlertDialog open={true} onOpenChange={() => setAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Account Request?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to reject the account request for:
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="font-semibold">{selectedRequest.full_name}</p>
                  <p className="text-sm">{selectedRequest.email}</p>
                </div>
                The user will be notified of the rejection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel onClick={() => setAction(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject Request
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
