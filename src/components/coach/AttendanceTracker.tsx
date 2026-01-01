import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation, isWithinGeoFence, calculateDistance } from '@/hooks/useGeolocation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  Navigation,
  Users,
  Calendar
} from 'lucide-react';

interface AttendanceTrackerProps {
  teamId: string;
  teamName: string;
  schoolId?: string;
}

interface RosterMember {
  id: string;
  user_id: string;
  name: string;
  jersey_number: string | null;
  position: string | null;
}

interface AttendanceRecord {
  id: string;
  team_member_id: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_verified: boolean;
  check_out_verified: boolean;
  check_in_method: string | null;
  coach_notes: string | null;
}

type AttendanceStatus = 'pending' | 'present' | 'absent' | 'excused' | 'late';

export function AttendanceTracker({ teamId, teamName, schoolId }: AttendanceTrackerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventType, setEventType] = useState<'practice' | 'game'>('practice');
  const [isAwayEvent, setIsAwayEvent] = useState(false);
  
  const { latitude, longitude, loading: geoLoading, error: geoError, getCurrentPosition, isSupported } = useGeolocation();

  // Fetch school location for geo-fence
  const { data: schoolData } = useQuery({
    queryKey: ['school-location', schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('latitude, longitude, name, address')
        .eq('id', schoolId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch geo-fence settings
  const { data: geoFenceSettings } = useQuery({
    queryKey: ['geo-fence-settings', teamId, schoolId],
    queryFn: async () => {
      // Try team-specific settings first
      let { data } = await supabase
        .from('geo_fence_settings')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (!data && schoolId) {
        // Fall back to school settings
        const result = await supabase
          .from('geo_fence_settings')
          .select('*')
          .eq('school_id', schoolId)
          .eq('is_active', true)
          .maybeSingle();
        data = result.data;
      }
      
      // If no settings, use school location with defaults
      if (!data && schoolData?.latitude && schoolData?.longitude) {
        return {
          latitude: schoolData.latitude,
          longitude: schoolData.longitude,
          radius_meters: 200,
          minimum_time_minutes: 60,
          away_game_auto_complete_hours: 5,
          require_check_out: true,
        };
      }
      
      return data;
    },
    enabled: !!teamId,
  });

  // Fetch roster
  const { data: roster = [] } = useQuery({
    queryKey: ['team-roster-attendance', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('team_members')
        .select('id, user_id, jersey_number, position')
        .eq('team_id', teamId)
        .eq('role', 'athlete');
      
      if (error) throw error;
      
      const userIds = members?.map(m => m.user_id) || [];
      if (userIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      
      return members?.map(m => {
        const profile = profiles?.find(p => p.id === m.user_id);
        return {
          id: m.id,
          user_id: m.user_id,
          name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
          jersey_number: m.jersey_number,
          position: m.position,
        };
      }) as RosterMember[];
    },
  });

  // Fetch attendance records for selected date
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-records', teamId, selectedDate],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('team_id', teamId)
        .eq('event_date', selectedDate);
      
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });

  // Create/update attendance record mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ 
      teamMemberId, 
      status, 
      method = 'coach_manual',
      lat,
      lon,
    }: { 
      teamMemberId: string; 
      status: AttendanceStatus;
      method?: string;
      lat?: number;
      lon?: number;
    }) => {
      const existing = attendanceRecords.find(r => r.team_member_id === teamMemberId);
      
      if (existing) {
        const { error } = await supabase
          .from('attendance_records')
          .update({
            status,
            check_in_time: status === 'present' || status === 'late' ? new Date().toISOString() : null,
            check_in_method: method,
            check_in_verified: method === 'geo_fence',
            check_in_latitude: lat,
            check_in_longitude: lon,
            marked_by_user_id: user?.id,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendance_records')
          .insert({
            team_id: teamId,
            team_member_id: teamMemberId,
            event_date: selectedDate,
            event_type: eventType,
            is_away_event: isAwayEvent,
            status,
            check_in_time: status === 'present' || status === 'late' ? new Date().toISOString() : null,
            check_in_method: method,
            check_in_verified: method === 'geo_fence',
            check_in_latitude: lat,
            check_in_longitude: lon,
            marked_by_user_id: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records', teamId, selectedDate] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update attendance');
    },
  });

  // Mark all present mutation
  const markAllPresentMutation = useMutation({
    mutationFn: async () => {
      const unmarked = roster.filter(r => !attendanceRecords.find(a => a.team_member_id === r.id));
      const updates = roster.filter(r => {
        const record = attendanceRecords.find(a => a.team_member_id === r.id);
        return !record || record.status === 'pending';
      });
      
      for (const member of updates) {
        await updateAttendanceMutation.mutateAsync({
          teamMemberId: member.id,
          status: 'present',
        });
      }
    },
    onSuccess: () => {
      toast.success('Marked all players present');
    },
  });

  const getAttendanceStatus = (memberId: string): AttendanceRecord | null => {
    return attendanceRecords.find(r => r.team_member_id === memberId) || null;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Present</Badge>;
      case 'absent':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Late</Badge>;
      case 'excused':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Excused</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const present = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const excused = attendanceRecords.filter(r => r.status === 'excused').length;
    const pending = roster.length - attendanceRecords.length + attendanceRecords.filter(r => r.status === 'pending').length;
    return { present, absent, excused, pending, total: roster.length };
  }, [attendanceRecords, roster]);

  // Check if user is within geo-fence
  const isWithinFence = useMemo(() => {
    if (!latitude || !longitude || !geoFenceSettings?.latitude || !geoFenceSettings?.longitude) return null;
    return isWithinGeoFence(
      latitude,
      longitude,
      Number(geoFenceSettings.latitude),
      Number(geoFenceSettings.longitude),
      geoFenceSettings.radius_meters || 200
    );
  }, [latitude, longitude, geoFenceSettings]);

  const distanceToSchool = useMemo(() => {
    if (!latitude || !longitude || !geoFenceSettings?.latitude || !geoFenceSettings?.longitude) return null;
    return calculateDistance(
      latitude,
      longitude,
      Number(geoFenceSettings.latitude),
      Number(geoFenceSettings.longitude)
    );
  }, [latitude, longitude, geoFenceSettings]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium">Event Type</label>
          <Select value={eventType} onValueChange={(v) => setEventType(v as 'practice' | 'game')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="practice">Practice</SelectItem>
              <SelectItem value="game">Game</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="away-event"
            checked={isAwayEvent}
            onChange={(e) => setIsAwayEvent(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="away-event" className="text-sm">Away Event</label>
        </div>

        <Button 
          variant="outline" 
          onClick={() => getCurrentPosition()}
          disabled={geoLoading || !isSupported}
        >
          {geoLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
          {latitude ? 'Location Active' : 'Enable Location'}
        </Button>

        <Button 
          onClick={() => markAllPresentMutation.mutate()}
          disabled={markAllPresentMutation.isPending}
        >
          {markAllPresentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Mark All Present
        </Button>
      </div>

      {/* Geo-fence Status */}
      {isSupported && geoFenceSettings && (
        <Card className={isWithinFence === true ? 'border-green-500' : isWithinFence === false ? 'border-yellow-500' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <MapPin className={`h-5 w-5 ${isWithinFence ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <p className="font-medium">
                  {isWithinFence === true && 'Within school geo-fence'}
                  {isWithinFence === false && `Outside geo-fence (${Math.round(distanceToSchool || 0)}m away)`}
                  {isWithinFence === null && 'Location not detected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {schoolData?.name || 'School'} - {geoFenceSettings.radius_meters}m radius
                </p>
              </div>
              {geoError && <p className="text-sm text-destructive">{geoError}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.present}</p>
            <p className="text-sm text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.absent}</p>
            <p className="text-sm text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.excused}</p>
            <p className="text-sm text-muted-foreground">Excused</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendance - {format(new Date(selectedDate), 'MMMM d, yyyy')}
          </CardTitle>
          <CardDescription>
            {eventType === 'game' ? 'Game' : 'Practice'} {isAwayEvent ? '(Away)' : '(Home)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No players on roster
                    </TableCell>
                  </TableRow>
                ) : roster.map((member) => {
                  const record = getAttendanceStatus(member.id);
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          {member.name}
                        </div>
                      </TableCell>
                      <TableCell>{member.jersey_number || '-'}</TableCell>
                      <TableCell>{member.position || '-'}</TableCell>
                      <TableCell>{getStatusBadge(record?.status || null)}</TableCell>
                      <TableCell>
                        {record?.check_in_time && (
                          <div className="text-sm">
                            <span>{format(new Date(record.check_in_time), 'h:mm a')}</span>
                            {record.check_in_verified && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                <MapPin className="h-3 w-3 mr-1" />GPS
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={record?.status === 'present' ? 'default' : 'outline'}
                            onClick={() => updateAttendanceMutation.mutate({ 
                              teamMemberId: member.id, 
                              status: 'present',
                              lat: latitude || undefined,
                              lon: longitude || undefined,
                              method: isWithinFence ? 'geo_fence' : 'coach_manual',
                            })}
                            disabled={updateAttendanceMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === 'absent' ? 'destructive' : 'outline'}
                            onClick={() => updateAttendanceMutation.mutate({ 
                              teamMemberId: member.id, 
                              status: 'absent',
                            })}
                            disabled={updateAttendanceMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === 'late' ? 'secondary' : 'outline'}
                            onClick={() => updateAttendanceMutation.mutate({ 
                              teamMemberId: member.id, 
                              status: 'late',
                              lat: latitude || undefined,
                              lon: longitude || undefined,
                              method: isWithinFence ? 'geo_fence' : 'coach_manual',
                            })}
                            disabled={updateAttendanceMutation.isPending}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === 'excused' ? 'secondary' : 'outline'}
                            onClick={() => updateAttendanceMutation.mutate({ 
                              teamMemberId: member.id, 
                              status: 'excused',
                            })}
                            disabled={updateAttendanceMutation.isPending}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
