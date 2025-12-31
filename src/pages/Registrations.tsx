import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, Clock, Users, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Registrations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select(`
          *,
          teams(name, sports(name), seasons(name)),
          athlete:athlete_user_id(first_name, last_name, email),
          parent:parent_user_id(first_name, last_name, email)
        `)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("registrations")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      setSelectedRegistration(null);
      setReviewNotes("");
      toast({ title: "Registration updated" });
    },
    onError: (error) => {
      toast({ title: "Error updating registration", description: error.message, variant: "destructive" });
    },
  });

  const filteredRegistrations = registrations?.filter((reg) => {
    const athleteName = `${reg.athlete?.first_name || ""} ${reg.athlete?.last_name || ""}`.toLowerCase();
    const matchesSearch = athleteName.includes(searchTerm.toLowerCase()) ||
      reg.teams?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "waitlisted":
        return <Badge variant="secondary">Waitlisted</Badge>;
      case "withdrawn":
        return <Badge variant="outline">Withdrawn</Badge>;
      default:
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>;
    }
  };

  const stats = {
    total: registrations?.length || 0,
    pending: registrations?.filter((r) => r.status === "pending").length || 0,
    approved: registrations?.filter((r) => r.status === "approved").length || 0,
    rejected: registrations?.filter((r) => r.status === "rejected").length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registrations</h1>
          <p className="text-muted-foreground">Manage athlete registration requests</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by athlete or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="waitlisted">Waitlisted</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Athlete</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Parent/Guardian</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading registrations...</TableCell>
                </TableRow>
              ) : filteredRegistrations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No registrations found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegistrations?.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">
                      {reg.athlete?.first_name} {reg.athlete?.last_name}
                      <div className="text-xs text-muted-foreground">{reg.athlete?.email}</div>
                    </TableCell>
                    <TableCell>
                      {reg.teams?.name}
                      <div className="text-xs text-muted-foreground">
                        {reg.teams?.sports?.name} • {reg.teams?.seasons?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reg.parent ? (
                        <>
                          {reg.parent.first_name} {reg.parent.last_name}
                          <div className="text-xs text-muted-foreground">{reg.parent.email}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {reg.submitted_at ? format(new Date(reg.submitted_at), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(reg.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRegistration(reg)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Registration</DialogTitle>
            </DialogHeader>
            {selectedRegistration && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Athlete</Label>
                    <p className="font-medium">
                      {selectedRegistration.athlete?.first_name} {selectedRegistration.athlete?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedRegistration.athlete?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Team</Label>
                    <p className="font-medium">{selectedRegistration.teams?.name}</p>
                  </div>
                </div>

                {selectedRegistration.emergency_contact_name && (
                  <div>
                    <Label className="text-muted-foreground">Emergency Contact</Label>
                    <p className="font-medium">{selectedRegistration.emergency_contact_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedRegistration.emergency_contact_phone}</p>
                  </div>
                )}

                {selectedRegistration.medical_notes && (
                  <div>
                    <Label className="text-muted-foreground">Medical Notes</Label>
                    <p className="text-sm">{selectedRegistration.medical_notes}</p>
                  </div>
                )}

                <div>
                  <Label>Review Notes</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this decision..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({
                      id: selectedRegistration.id,
                      status: "rejected",
                      notes: reviewNotes,
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1"
                    variant="secondary"
                    onClick={() => updateStatusMutation.mutate({
                      id: selectedRegistration.id,
                      status: "waitlisted",
                      notes: reviewNotes,
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Waitlist
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => updateStatusMutation.mutate({
                      id: selectedRegistration.id,
                      status: "approved",
                      notes: reviewNotes,
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
