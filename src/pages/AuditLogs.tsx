import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Download, Eye, Shield, Activity } from "lucide-react";
import { format } from "date-fns";
import { exportToCSV } from "@/lib/csvExport";
import { useToast } from "@/hooks/use-toast";

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const { toast } = useToast();

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-lookup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email");
      if (error) throw error;
      return data?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) as Record<string, any>;
    },
  });

  const uniqueActions = [...new Set(auditLogs?.map((log) => log.action) || [])];
  const uniqueEntities = [...new Set(auditLogs?.map((log) => log.entity_type) || [])];

  const filteredLogs = auditLogs?.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("create") || action.includes("insert")) {
      return <Badge className="bg-green-500/10 text-green-500">Create</Badge>;
    }
    if (action.includes("update") || action.includes("edit")) {
      return <Badge className="bg-blue-500/10 text-blue-500">Update</Badge>;
    }
    if (action.includes("delete") || action.includes("remove")) {
      return <Badge variant="destructive">Delete</Badge>;
    }
    if (action.includes("login") || action.includes("auth")) {
      return <Badge variant="secondary">Auth</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  const handleExport = () => {
    if (!filteredLogs?.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const exportData = filteredLogs.map((log) => ({
      Timestamp: format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      User: profiles?.[log.user_id]?.email || log.user_id || "System",
      Action: log.action,
      "Entity Type": log.entity_type,
      "Entity ID": log.entity_id || "-",
      "IP Address": log.ip_address || "-",
    }));

    exportToCSV(exportData, `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast({ title: "Export successful" });
  };

  const stats = {
    total: auditLogs?.length || 0,
    today: auditLogs?.filter((log) => {
      const logDate = new Date(log.created_at).toDateString();
      return logDate === new Date().toDateString();
    }).length || 0,
    users: new Set(auditLogs?.map((log) => log.user_id).filter(Boolean)).size,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">Track all system activity and changes</p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map((action) => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {uniqueEntities.map((entity) => (
                <SelectItem key={entity} value={entity}>{entity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading audit logs...</TableCell>
                </TableRow>
              ) : filteredLogs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs?.map((log) => {
                  const user = profiles?.[log.user_id];
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>{format(new Date(log.created_at), "MMM d, yyyy")}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "h:mm:ss a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user ? (
                          <>
                            <div className="font-medium">{user.first_name} {user.last_name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </>
                        ) : log.user_id ? (
                          <span className="text-xs text-muted-foreground">{log.user_id.substring(0, 8)}...</span>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.entity_type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entity_id ? log.entity_id.substring(0, 8) + "..." : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.ip_address || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Timestamp</label>
                    <p className="font-medium">
                      {format(new Date(selectedLog.created_at), "PPpp")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Action</label>
                    <p className="font-medium">{selectedLog.action}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Entity Type</label>
                    <p className="font-medium">{selectedLog.entity_type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Entity ID</label>
                    <p className="font-mono text-sm">{selectedLog.entity_id || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">User ID</label>
                    <p className="font-mono text-sm">{selectedLog.user_id || "System"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">IP Address</label>
                    <p className="font-mono text-sm">{selectedLog.ip_address || "-"}</p>
                  </div>
                </div>

                {selectedLog.old_data && (
                  <div>
                    <label className="text-sm text-muted-foreground">Previous Data</label>
                    <ScrollArea className="h-[150px] mt-1 border rounded-md p-2">
                      <pre className="text-xs">
                        {JSON.stringify(selectedLog.old_data, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {selectedLog.new_data && (
                  <div>
                    <label className="text-sm text-muted-foreground">New Data</label>
                    <ScrollArea className="h-[150px] mt-1 border rounded-md p-2">
                      <pre className="text-xs">
                        {JSON.stringify(selectedLog.new_data, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {selectedLog.compliance_tags?.length > 0 && (
                  <div>
                    <label className="text-sm text-muted-foreground">Compliance Tags</label>
                    <div className="flex gap-2 mt-1">
                      {selectedLog.compliance_tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
