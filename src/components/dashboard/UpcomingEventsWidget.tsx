import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Ticket, ExternalLink, ArrowRight } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { GoFanTicketButton } from '@/components/integrations';

interface UpcomingEventsWidgetProps {
  teamId?: string;
  organizationId?: string;
  limit?: number;
  showTickets?: boolean;
  compact?: boolean;
}

export function UpcomingEventsWidget({
  teamId,
  organizationId,
  limit = 5,
  showTickets = true,
  compact = false,
}: UpcomingEventsWidgetProps) {
  const navigate = useNavigate();

  const { data: events, isLoading } = useQuery({
    queryKey: ['upcoming-events-widget', teamId, organizationId, limit],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          *,
          organizations(name, gofan_enabled, gofan_school_id, gofan_school_url_override)
        `)
        .gte('start_time', new Date().toISOString())
        .eq('is_cancelled', false)
        .order('start_time')
        .limit(limit);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      if (teamId) {
        query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'game': return <Badge>Game</Badge>;
      case 'tournament': return <Badge variant="secondary">Tournament</Badge>;
      case 'practice': return <Badge variant="outline">Practice</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border animate-pulse">
                <div className="h-10 w-10 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/events')}>
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <CardDescription>Games, practices, and activities</CardDescription>
      </CardHeader>
      <CardContent>
        {events && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => {
              const eventDate = new Date(event.start_time);
              const org = event.organizations;
              const gofanEnabled = org?.gofan_enabled && showTickets;

              return (
                <div 
                  key={event.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors ${compact ? '' : 'cursor-pointer'}`}
                  onClick={() => !compact && navigate(`/events/${event.id}`)}
                >
                  <div className="flex flex-col items-center justify-center p-2 rounded bg-primary/10 text-center min-w-[50px]">
                    <span className="text-xs text-muted-foreground">
                      {format(eventDate, 'MMM')}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {format(eventDate, 'd')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium truncate">{event.name}</p>
                      {getTypeBadge(event.event_type)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getDateLabel(eventDate)} • {format(eventDate, 'h:mm a')}
                      </span>
                      {event.venue_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.venue_name}
                        </span>
                      )}
                    </div>
                  </div>
                  {gofanEnabled && event.event_type === 'game' && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <GoFanTicketButton
                        eventTicketUrl={event.gofan_event_url}
                        schoolGoFanUrl={org?.gofan_school_url_override}
                        schoolGoFanId={org?.gofan_school_id}
                        size="sm"
                        variant="outline"
                        showBadge={false}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming events</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => navigate('/events')}
            >
              Create Event
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
