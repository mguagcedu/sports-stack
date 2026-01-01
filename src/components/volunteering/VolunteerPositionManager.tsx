import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Users } from 'lucide-react';

interface VolunteerPositionManagerProps {
  open: boolean;
  onClose: () => void;
}

const POSITION_TYPES = [
  { value: 'chains', label: 'Chain Crew' },
  { value: 'down_sign', label: 'Down Marker' },
  { value: 'video', label: 'Video/Film' },
  { value: 'announcer', label: 'Announcer' },
  { value: 'concessions', label: 'Concessions' },
  { value: 'ticketing', label: 'Ticket Sales' },
  { value: 'gates', label: 'Gate Attendant' },
  { value: 'parking', label: 'Parking' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'other', label: 'Other' },
];

export function VolunteerPositionManager({ open, onClose }: VolunteerPositionManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [formData, setFormData] = useState({
    position_name: '',
    position_type: 'concessions',
    description: '',
    required_count: '4',
    location: '',
    hours_credit: '2',
  });

  // Fetch events
  const { data: events } = useQuery({
    queryKey: ['events-for-volunteering'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, start_time')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch position templates
  const { data: templates } = useQuery({
    queryKey: ['volunteer-position-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('volunteer_position_templates')
        .select('*')
        .eq('is_active', true)
        .order('position_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing positions for selected event
  const { data: positions, isLoading } = useQuery({
    queryKey: ['volunteer-positions', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      const { data, error } = await supabase
        .from('volunteer_positions')
        .select('*')
        .eq('event_id', selectedEventId)
        .order('position_name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEventId,
  });

  // Add position mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const event = events?.find(e => e.id === selectedEventId);
      const { error } = await supabase
        .from('volunteer_positions')
        .insert({
          event_id: selectedEventId,
          position_name: formData.position_name,
          position_type: formData.position_type,
          description: formData.description || null,
          required_count: parseInt(formData.required_count) || 1,
          location: formData.location || null,
          hours_credit: parseFloat(formData.hours_credit) || 2,
          start_time: event?.start_time,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-positions', selectedEventId] });
      setIsAddOpen(false);
      setFormData({
        position_name: '',
        position_type: 'concessions',
        description: '',
        required_count: '4',
        location: '',
        hours_credit: '2',
      });
      toast({ title: 'Position added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding position', description: error.message, variant: 'destructive' });
    },
  });

  // Delete position mutation
  const deleteMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const { error } = await supabase
        .from('volunteer_positions')
        .delete()
        .eq('id', positionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-positions', selectedEventId] });
      toast({ title: 'Position deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting position', description: error.message, variant: 'destructive' });
    },
  });

  // Use template
  const useTemplate = (template: typeof templates extends (infer T)[] | undefined ? T : never) => {
    if (!template) return;
    setFormData({
      position_name: template.position_name,
      position_type: template.position_type,
      description: template.description || '',
      required_count: String(template.default_count || 1),
      location: '',
      hours_credit: String(template.default_hours || 2),
    });
    setIsAddOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Volunteer Positions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Event Selector */}
            <div className="space-y-2">
              <Label>Select Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event to manage positions" />
                </SelectTrigger>
                <SelectContent>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} - {new Date(event.start_time).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEventId && (
              <>
                {/* Quick Add from Templates */}
                <div className="space-y-2">
                  <Label>Quick Add from Template</Label>
                  <div className="flex flex-wrap gap-2">
                    {templates?.slice(0, 8).map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        onClick={() => useTemplate(template)}
                      >
                        {template.position_name}
                      </Button>
                    ))}
                    <Button size="sm" onClick={() => setIsAddOpen(true)}>
                      <Plus className="mr-1 h-3 w-3" />
                      Custom
                    </Button>
                  </div>
                </div>

                {/* Positions Table */}
                {isLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : positions?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No positions created for this event yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Position</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Filled</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions?.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell className="font-medium">{position.position_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {POSITION_TYPES.find(t => t.value === position.position_type)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{position.required_count}</TableCell>
                          <TableCell>
                            <Badge variant={position.filled_count >= position.required_count ? 'default' : 'outline'}>
                              {position.filled_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>{position.hours_credit}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(position.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Position Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Volunteer Position</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Position Name *</Label>
                <Input
                  placeholder="e.g., Concessions Worker"
                  value={formData.position_name}
                  onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Position Type</Label>
                <Select
                  value={formData.position_type}
                  onValueChange={(value) => setFormData({ ...formData, position_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Required Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.required_count}
                  onChange={(e) => setFormData({ ...formData, required_count: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hours Credit</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.hours_credit}
                  onChange={(e) => setFormData({ ...formData, hours_credit: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g., Concession Stand"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What volunteers will do..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => addMutation.mutate()} 
              disabled={!formData.position_name || addMutation.isPending}
            >
              {addMutation.isPending ? 'Adding...' : 'Add Position'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
