import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { QrCode, MapPin, CheckCircle, LogOut, Users, RefreshCw } from 'lucide-react';

interface VolunteerCheckInProps {
  open: boolean;
  onClose: () => void;
}

export function VolunteerCheckIn({ open, onClose }: VolunteerCheckInProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checkInCode, setCheckInCode] = useState('');
  const [checkOutCode, setCheckOutCode] = useState('');
  const [useGeoLocation, setUseGeoLocation] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [generatedCheckInCode, setGeneratedCheckInCode] = useState('');
  const [generatedCheckOutCode, setGeneratedCheckOutCode] = useState('');

  // Generate random codes for managers
  const generateCodes = () => {
    setGeneratedCheckInCode(Math.random().toString(36).substring(2, 8).toUpperCase());
    setGeneratedCheckOutCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  useEffect(() => {
    if (open) {
      generateCodes();
      // Get geolocation if enabled
      if (useGeoLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.warn('Geolocation error:', error);
            setCurrentLocation(null);
          }
        );
      }
    }
  }, [open, useGeoLocation]);

  // Fetch user's active signups that need check-in/out
  const { data: activeSignups } = useQuery({
    queryKey: ['active-volunteer-signups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('volunteer_signups')
        .select(`
          *,
          volunteer_positions(position_name, location, events(name))
        `)
        .eq('user_id', user.id)
        .in('status', ['signed_up', 'confirmed', 'checked_in']);
      if (error) throw error;
      return data;
    },
    enabled: open && !!user?.id,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (signupId: string) => {
      const { error } = await supabase
        .from('volunteer_signups')
        .update({
          status: 'checked_in',
          check_in_time: new Date().toISOString(),
          check_in_code: checkInCode,
          geo_check_in_lat: currentLocation?.lat,
          geo_check_in_lng: currentLocation?.lng,
        })
        .eq('id', signupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-volunteer-signups'] });
      queryClient.invalidateQueries({ queryKey: ['my-volunteer-signups'] });
      setCheckInCode('');
      toast({ title: 'Checked in successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Check-in failed', description: error.message, variant: 'destructive' });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (signupId: string) => {
      const hoursCredit = 2; // Default hours credit
      
      const { error } = await supabase
        .from('volunteer_signups')
        .update({
          status: 'completed',
          check_out_time: new Date().toISOString(),
          check_out_code: checkOutCode,
          geo_check_out_lat: currentLocation?.lat,
          geo_check_out_lng: currentLocation?.lng,
          hours_credited: hoursCredit,
        })
        .eq('id', signupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-volunteer-signups'] });
      queryClient.invalidateQueries({ queryKey: ['my-volunteer-signups'] });
      setCheckOutCode('');
      toast({ title: 'Checked out successfully! Hours credited.' });
    },
    onError: (error) => {
      toast({ title: 'Check-out failed', description: error.message, variant: 'destructive' });
    },
  });

  // Manual confirm mutation (for managers)
  const manualConfirmMutation = useMutation({
    mutationFn: async ({ signupId, action }: { signupId: string; action: 'check_in' | 'check_out' }) => {
      const updates = action === 'check_in' 
        ? {
            status: 'checked_in',
            check_in_time: new Date().toISOString(),
            manually_confirmed: true,
            confirmed_by_user_id: user?.id,
          }
        : {
            status: 'completed',
            check_out_time: new Date().toISOString(),
            manually_confirmed: true,
            confirmed_by_user_id: user?.id,
            hours_credited: 2, // Default hours
          };
      
      const { error } = await supabase
        .from('volunteer_signups')
        .update(updates)
        .eq('id', signupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-volunteer-signups'] });
      toast({ title: 'Manually confirmed' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const needsCheckIn = activeSignups?.filter(s => ['signed_up', 'confirmed'].includes(s.status)) || [];
  const needsCheckOut = activeSignups?.filter(s => s.status === 'checked_in') || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Volunteer Check-In / Check-Out
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="volunteer" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="volunteer">I'm a Volunteer</TabsTrigger>
            <TabsTrigger value="manager">I'm Managing</TabsTrigger>
          </TabsList>

          <TabsContent value="volunteer" className="space-y-4">
            {/* Geo location toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Share location for verification</span>
              </div>
              <Switch checked={useGeoLocation} onCheckedChange={setUseGeoLocation} />
            </div>

            {currentLocation && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                Location captured
              </Badge>
            )}

            {/* Check In Section */}
            {needsCheckIn.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Check In
                  </CardTitle>
                  <CardDescription>Enter the code provided by your volunteer coordinator</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Check-In Code</Label>
                    <Input
                      placeholder="Enter code..."
                      value={checkInCode}
                      onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
                      className="text-center text-lg font-mono tracking-wider"
                    />
                  </div>
                  {needsCheckIn.map((signup) => (
                    <div key={signup.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{signup.volunteer_positions?.position_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {signup.volunteer_positions?.events?.name}
                        </p>
                      </div>
                      <Button
                        onClick={() => checkInMutation.mutate(signup.id)}
                        disabled={!checkInCode || checkInMutation.isPending}
                      >
                        Check In
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Check Out Section */}
            {needsCheckOut.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LogOut className="h-5 w-5 text-orange-500" />
                    Check Out
                  </CardTitle>
                  <CardDescription>Enter the code to complete your shift</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Check-Out Code</Label>
                    <Input
                      placeholder="Enter code..."
                      value={checkOutCode}
                      onChange={(e) => setCheckOutCode(e.target.value.toUpperCase())}
                      className="text-center text-lg font-mono tracking-wider"
                    />
                  </div>
                  {needsCheckOut.map((signup) => (
                    <div key={signup.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{signup.volunteer_positions?.position_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Checked in at {new Date(signup.check_in_time!).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => checkOutMutation.mutate(signup.id)}
                        disabled={!checkOutCode || checkOutMutation.isPending}
                      >
                        Check Out
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {needsCheckIn.length === 0 && needsCheckOut.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No active volunteer shifts</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manager" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Codes</CardTitle>
                <CardDescription>Share these codes with volunteers at your station</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-end">
                  <Button variant="outline" size="sm" onClick={generateCodes}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate New Codes
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border-2 border-green-500/20 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Check-In Code</p>
                    <p className="text-3xl font-mono font-bold tracking-widest text-green-600">
                      {generatedCheckInCode}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/10 border-2 border-orange-500/20 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Check-Out Code</p>
                    <p className="text-3xl font-mono font-bold tracking-widest text-orange-600">
                      {generatedCheckOutCode}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground text-center">
                  Display these codes to volunteers. Check-in code at shift start, check-out code at shift end.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
