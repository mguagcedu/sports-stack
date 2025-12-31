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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, DollarSign, TrendingUp, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import { exportToCSV } from "@/lib/csvExport";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface Payment {
  id: string;
  organization_id: string;
  user_id: string | null;
  amount: number;
  currency: string;
  payment_type: string;
  status: string;
  description: string | null;
  created_at: string;
  organizations?: { name: string };
  profile?: Profile;
}

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data: paymentsData, error } = await supabase
        .from("payments")
        .select(`
          *,
          organizations(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles separately
      if (paymentsData && paymentsData.length > 0) {
        const userIds = paymentsData.map(p => p.user_id).filter(Boolean) as string[];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email")
            .in("id", userIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
          return paymentsData.map(p => ({
            ...p,
            profile: p.user_id ? profileMap.get(p.user_id) : undefined
          })) as Payment[];
        }
      }
      return paymentsData as Payment[];
    },
  });

  const filteredPayments = payments?.filter((payment) => {
    const payerName = `${payment.profile?.first_name || ""} ${payment.profile?.last_name || ""}`.toLowerCase();
    const matchesSearch = payerName.includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesType = typeFilter === "all" || payment.payment_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Completed</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "registration": return <Badge variant="outline">Registration</Badge>;
      case "ticket": return <Badge variant="outline">Ticket</Badge>;
      case "membership": return <Badge variant="outline">Membership</Badge>;
      case "donation": return <Badge variant="outline">Donation</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const stats = {
    total: payments?.reduce((sum, p) => sum + (p.status === "completed" ? Number(p.amount) : 0), 0) || 0,
    pending: payments?.filter((p) => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    count: payments?.filter((p) => p.status === "completed").length || 0,
    thisMonth: payments?.filter((p) => {
      const paymentDate = new Date(p.created_at);
      const now = new Date();
      return p.status === "completed" &&
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear();
    }).reduce((sum, p) => sum + Number(p.amount), 0) || 0,
  };

  const handleExport = () => {
    if (!filteredPayments?.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const exportData = filteredPayments.map((p) => ({
      Date: format(new Date(p.created_at), "yyyy-MM-dd HH:mm"),
      Payer: `${p.profile?.first_name || ""} ${p.profile?.last_name || ""}`.trim() || "N/A",
      Email: p.profile?.email || "N/A",
      Organization: p.organizations?.name || "N/A",
      Type: p.payment_type,
      Description: p.description || "",
      Amount: `$${Number(p.amount).toFixed(2)}`,
      Currency: p.currency,
      Status: p.status,
    }));

    exportToCSV(exportData, `payments-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast({ title: "Export successful" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground">Track and manage payment transactions</p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{stats.count} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.thisMonth.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.pending.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.count > 0 ? (stats.total / stats.count).toFixed(2) : "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="registration">Registration</SelectItem>
              <SelectItem value="ticket">Ticket</SelectItem>
              <SelectItem value="membership">Membership</SelectItem>
              <SelectItem value="donation">Donation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading payments...</TableCell>
                </TableRow>
              ) : filteredPayments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>{format(new Date(payment.created_at), "MMM d, yyyy")}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(payment.created_at), "h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {payment.profile?.first_name} {payment.profile?.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{payment.profile?.email}</div>
                    </TableCell>
                    <TableCell>{payment.organizations?.name || "-"}</TableCell>
                    <TableCell>{getTypeBadge(payment.payment_type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {payment.description || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(payment.amount).toFixed(2)}
                      <div className="text-xs text-muted-foreground">{payment.currency}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
