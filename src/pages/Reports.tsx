import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Download, Users, DollarSign, Calendar, ClipboardList } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { exportToCSV } from "@/lib/csvExport";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#fbbf24", "#ef4444"];

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const { toast } = useToast();

  const { data: registrations } = useQuery({
    queryKey: ["registrations-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("*, teams(name, sports(name))");
      if (error) throw error;
      return data;
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["payments-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .gte("created_at", subDays(new Date(), parseInt(dateRange)).toISOString());
      if (error) throw error;
      return data;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["teams-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*, team_members(count), sports(name), seasons(name)");
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("start_time", subDays(new Date(), parseInt(dateRange)).toISOString());
      if (error) throw error;
      return data;
    },
  });

  // Registration stats
  const registrationStats = {
    total: registrations?.length || 0,
    byStatus: [
      { name: "Pending", value: registrations?.filter((r) => r.status === "pending").length || 0 },
      { name: "Approved", value: registrations?.filter((r) => r.status === "approved").length || 0 },
      { name: "Rejected", value: registrations?.filter((r) => r.status === "rejected").length || 0 },
      { name: "Waitlisted", value: registrations?.filter((r) => r.status === "waitlisted").length || 0 },
    ].filter((s) => s.value > 0),
  };

  // Revenue by type
  const revenueByType = [
    { name: "Registration", value: payments?.filter((p) => p.payment_type === "registration" && p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0 },
    { name: "Tickets", value: payments?.filter((p) => p.payment_type === "ticket" && p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0 },
    { name: "Membership", value: payments?.filter((p) => p.payment_type === "membership" && p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0 },
    { name: "Donations", value: payments?.filter((p) => p.payment_type === "donation" && p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0 },
    { name: "Other", value: payments?.filter((p) => p.payment_type === "other" && p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0 },
  ].filter((r) => r.value > 0);

  // Team roster sizes
  const teamRosterData = teams?.slice(0, 10).map((team) => ({
    name: team.name.length > 15 ? team.name.substring(0, 15) + "..." : team.name,
    members: Array.isArray(team.team_members) ? team.team_members.length : 0,
    max: team.max_roster_size || 25,
  })) || [];

  // Events by type
  const eventsByType = [
    { name: "Games", value: events?.filter((e) => e.event_type === "game").length || 0 },
    { name: "Tournaments", value: events?.filter((e) => e.event_type === "tournament").length || 0 },
    { name: "Practices", value: events?.filter((e) => e.event_type === "practice").length || 0 },
    { name: "Meetings", value: events?.filter((e) => e.event_type === "meeting").length || 0 },
    { name: "Other", value: events?.filter((e) => e.event_type === "other").length || 0 },
  ].filter((e) => e.value > 0);

  const handleExportRegistrations = () => {
    if (!registrations?.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const exportData = registrations.map((r) => ({
      Team: r.teams?.name || "N/A",
      Sport: r.teams?.sports?.name || "N/A",
      Status: r.status,
      Submitted: format(new Date(r.submitted_at), "yyyy-MM-dd"),
    }));
    exportToCSV(exportData, `registrations-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast({ title: "Report exported" });
  };

  const handleExportRevenue = () => {
    if (!payments?.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const exportData = payments.map((p) => ({
      Date: format(new Date(p.created_at), "yyyy-MM-dd"),
      Type: p.payment_type,
      Amount: `$${Number(p.amount).toFixed(2)}`,
      Status: p.status,
    }));
    exportToCSV(exportData, `revenue-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast({ title: "Report exported" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Analytics and insights for your organization</p>
          </div>
          <div className="flex items-center gap-2">
            <Label>Date Range:</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Registrations
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registrations" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleExportRegistrations}>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Registration Summary</CardTitle>
                  <CardDescription>Total: {registrationStats.total} registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  {registrationStats.byStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={registrationStats.byStatus}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {registrationStats.byStatus.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No registration data available
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Registration Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <span>Approval Rate</span>
                      <span className="text-2xl font-bold">
                        {registrationStats.total > 0
                          ? Math.round((registrationStats.byStatus.find((s) => s.name === "Approved")?.value || 0) / registrationStats.total * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <span>Pending Review</span>
                      <span className="text-2xl font-bold">
                        {registrationStats.byStatus.find((s) => s.name === "Pending")?.value || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <span>Rejection Rate</span>
                      <span className="text-2xl font-bold">
                        {registrationStats.total > 0
                          ? Math.round((registrationStats.byStatus.find((s) => s.name === "Rejected")?.value || 0) / registrationStats.total * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleExportRevenue}>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Type</CardTitle>
                  <CardDescription>
                    Total: ${payments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2) || "0.00"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueByType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={revenueByType}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                        >
                          {revenueByType.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Roster Sizes</CardTitle>
                <CardDescription>Current roster vs maximum capacity</CardDescription>
              </CardHeader>
              <CardContent>
                {teamRosterData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={teamRosterData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="members" fill="hsl(var(--primary))" name="Current" />
                      <Bar dataKey="max" fill="hsl(var(--muted))" name="Max Capacity" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    No team data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Events by Type</CardTitle>
                <CardDescription>Last {dateRange} days</CardDescription>
              </CardHeader>
              <CardContent>
                {eventsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={eventsByType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No event data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
