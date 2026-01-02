import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Calendar, MapPin, Ticket, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ScheduleUploader } from "@/components/events/ScheduleUploader";
import { GoFanTicketButton } from "@/components/integrations";

interface EventWithTeams {
  id: string;
  organization_id: string;
  name: string;
  event_type: string;
  start_time: string;
  end_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  ticket_price: number;
  max_capacity: number | null;
  tickets_sold: number | null;
  is_cancelled: boolean | null;
  gofan_event_url: string | null;
  ticketing_provider: string | null;
  organizations?: { name: string };
  home_team_name?: string;
  away_team_name?: string;
}

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    organization_id: "",
    event_type: "game",
    start_time: "",
    end_time: "",
    venue_name: "",
    venue_address: "",
    home_team_id: "",
    away_team_id: "",
    ticket_price: 0,
    max_capacity: 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data: eventsData, error } = await supabase
        .from("events")
        .select(`
          *,
          organizations(name)
        `)
        .order("start_time", { ascending: true });
      if (error) throw error;

      // Fetch team names separately
      if (eventsData && eventsData.length > 0) {
        const teamIds = [
          ...eventsData.map(e => e.home_team_id).filter(Boolean),
          ...eventsData.map(e => e.away_team_id).filter(Boolean)
        ] as string[];

        if (teamIds.length > 0) {
          const { data: teams } = await supabase
            .from("teams")
            .select("id, name")
            .in("id", teamIds);

          const teamMap = new Map(teams?.map(t => [t.id, t.name]) || []);
          return eventsData.map(e => ({
            ...e,
            home_team_name: e.home_team_id ? teamMap.get(e.home_team_id) : undefined,
            away_team_name: e.away_team_id ? teamMap.get(e.away_team_id) : undefined
          })) as EventWithTeams[];
        }
      }
      return eventsData as EventWithTeams[];
    },
  });

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["teams-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (event: typeof newEvent) => {
      const { data, error } = await supabase
        .from("events")
        .insert({
          name: event.name,
          organization_id: event.organization_id,
          event_type: event.event_type,
          start_time: event.start_time,
          end_time: event.end_time || null,
          venue_name: event.venue_name || null,
          venue_address: event.venue_address || null,
          home_team_id: event.home_team_id || null,
          away_team_id: event.away_team_id || null,
          ticket_price: event.ticket_price || 0,
          max_capacity: event.max_capacity || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsCreateOpen(false);
      setNewEvent({
        name: "",
        organization_id: "",
        event_type: "game",
        start_time: "",
        end_time: "",
        venue_name: "",
        venue_address: "",
        home_team_id: "",
        away_team_id: "",
        ticket_price: 0,
        max_capacity: 0,
      });
      toast({ title: "Event created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating event", description: error.message, variant: "destructive" });
    },
  });

  const filteredEvents = events?.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || event.event_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "game": return <Badge>Game</Badge>;
      case "tournament": return <Badge variant="secondary">Tournament</Badge>;
      case "practice": return <Badge variant="outline">Practice</Badge>;
      case "meeting": return <Badge variant="outline">Meeting</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const upcomingEvents = events?.filter((e) => new Date(e.start_time) >= new Date() && !e.is_cancelled) || [];
  const todayEvents = events?.filter((e) => {
    const eventDate = new Date(e.start_time).toDateString();
    return eventDate === new Date().toDateString() && !e.is_cancelled;
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">Manage games, practices, and events</p>
          </div>
          <div className="flex gap-2">
            <ScheduleUploader organizationId={organizations?.[0]?.id} />
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label>Event Name</Label>
                    <Input
                      value={newEvent.name}
                      onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                      placeholder="e.g., Varsity Basketball vs. Rival High"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <Select
                        value={newEvent.organization_id}
                        onValueChange={(value) => setNewEvent({ ...newEvent, organization_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations?.map((org) => (
                            <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Event Type</Label>
                      <Select
                        value={newEvent.event_type}
                        onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="game">Game</SelectItem>
                          <SelectItem value="tournament">Tournament</SelectItem>
                          <SelectItem value="practice">Practice</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="datetime-local"
                        value={newEvent.start_time}
                        onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="datetime-local"
                        value={newEvent.end_time}
                        onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Venue Name</Label>
                    <Input
                      value={newEvent.venue_name}
                      onChange={(e) => setNewEvent({ ...newEvent, venue_name: e.target.value })}
                      placeholder="e.g., Main Gymnasium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Venue Address</Label>
                    <Input
                      value={newEvent.venue_address}
                      onChange={(e) => setNewEvent({ ...newEvent, venue_address: e.target.value })}
                      placeholder="123 School St, City, State"
                    />
                  </div>
                  {newEvent.event_type === "game" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Home Team</Label>
                        <Select
                          value={newEvent.home_team_id}
                          onValueChange={(value) => setNewEvent({ ...newEvent, home_team_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams?.map((team) => (
                              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Away Team</Label>
                        <Select
                          value={newEvent.away_team_id}
                          onValueChange={(value) => setNewEvent({ ...newEvent, away_team_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams?.map((team) => (
                              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ticket Price ($)</Label>
                      <Input
                        type="number"
                        value={newEvent.ticket_price}
                        onChange={(e) => setNewEvent({ ...newEvent, ticket_price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Capacity</Label>
                      <Input
                        type="number"
                        value={newEvent.max_capacity}
                        onChange={(e) => setNewEvent({ ...newEvent, max_capacity: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => createEventMutation.mutate(newEvent)}
                    disabled={!newEvent.name || !newEvent.organization_id || !newEvent.start_time || createEventMutation.isPending}
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayEvents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="game">Games</SelectItem>
              <SelectItem value="tournament">Tournaments</SelectItem>
              <SelectItem value="practice">Practices</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead className="text-center">Tickets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading events...</TableCell>
                </TableRow>
              ) : filteredEvents?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No events found. Create your first event to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents?.map((event) => (
                  <TableRow key={event.id} className={event.is_cancelled ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="font-medium">{event.name}</div>
                      <div className="text-xs text-muted-foreground">{event.organizations?.name}</div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(event.event_type)}
                      {event.is_cancelled && <Badge variant="destructive" className="ml-2">Cancelled</Badge>}
                    </TableCell>
                    <TableCell>
                      <div>{format(new Date(event.start_time), "MMM d, yyyy")}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.start_time), "h:mm a")}
                        {event.end_time && ` - ${format(new Date(event.end_time), "h:mm a")}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.venue_name ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {event.venue_name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.home_team_name || event.away_team_name ? (
                        <div className="text-sm">
                          {event.home_team_name || "TBD"} vs {event.away_team_name || "TBD"}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {event.gofan_event_url || event.ticketing_provider === 'gofan' ? (
                        <div className="space-y-1">
                          {event.ticket_price > 0 && (
                            <div className="font-medium">${event.ticket_price}</div>
                          )}
                          <GoFanTicketButton
                            eventTicketUrl={event.gofan_event_url}
                            enabled={!!event.gofan_event_url || event.ticketing_provider === 'gofan'}
                            size="sm"
                            showBadge={false}
                          />
                        </div>
                      ) : event.ticket_price > 0 ? (
                        <div>
                          <div className="font-medium">${event.ticket_price}</div>
                          <div className="text-xs text-muted-foreground">
                            {event.tickets_sold || 0}/{event.max_capacity || "∞"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Free</span>
                      )}
                    </TableCell>
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
